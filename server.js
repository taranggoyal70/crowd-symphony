const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  // Socket.IO server on port 3001
  const io = new Server(3001, {
    cors: {
      origin: "*", // Allow all origins for local network access
      methods: ["GET", "POST"]
    }
  });

  const sessions = new Map(); // sessionId -> { conductor, left: [], right: [] }

  io.on('connection', (socket) => {
    const { role, sessionId, section } = socket.handshake.query;
    
    console.log(`${role} connected to session ${sessionId}`);

    // Initialize session if it doesn't exist
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { conductor: null, left: [], right: [] });
    }

    const session = sessions.get(sessionId);

    if (role === 'conductor') {
      session.conductor = socket.id;
      
      // Handle volume changes from conductor
      socket.on('volumeChange', (data) => {
        console.log('Volume change from conductor:', data);
        console.log('Broadcasting to:', session.left.length, 'left,', session.right.length, 'right');
        
        // Broadcast to left section
        session.left.forEach(audienceId => {
          io.to(audienceId).emit('volumeChange', { 
            leftVolume: data.leftVolume, 
            rightVolume: data.rightVolume 
          });
        });
        
        // Broadcast to right section
        session.right.forEach(audienceId => {
          io.to(audienceId).emit('volumeChange', { 
            leftVolume: data.leftVolume, 
            rightVolume: data.rightVolume 
          });
        });
      });

      // Handle conductor stop
      socket.on('conductorStop', () => {
        console.log('Conductor stopped camera');
        // Tell all audience to stop playing
        [...session.left, ...session.right].forEach(audienceId => {
          io.to(audienceId).emit('conductorStopped');
        });
      });

      // Handle conductor start
      socket.on('conductorStart', () => {
        console.log('Conductor started camera');
        // Tell all audience conductor is active
        [...session.left, ...session.right].forEach(audienceId => {
          io.to(audienceId).emit('conductorStarted');
        });
      });
    } else if (role === 'audience') {
      if (section === 'left') {
        session.left.push(socket.id);
      } else if (section === 'right') {
        session.right.push(socket.id);
      }
      socket.join(`session-${sessionId}-${section}`);
    }

    // Broadcast user count
    const userCount = { left: session.left.length, right: session.right.length };
    if (session.conductor) {
      io.to(session.conductor).emit('userCount', userCount);
    }
    [...session.left, ...session.right].forEach(audienceId => {
      io.to(audienceId).emit('userCount', userCount.left + userCount.right);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`${role} disconnected`);
      
      if (role === 'conductor' && session.conductor === socket.id) {
        session.conductor = null;
      } else if (role === 'audience') {
        session.left = session.left.filter(id => id !== socket.id);
        session.right = session.right.filter(id => id !== socket.id);
      }

      // Update user count
      const newUserCount = { left: session.left.length, right: session.right.length };
      if (session.conductor) {
        io.to(session.conductor).emit('userCount', newUserCount);
      }
      [...session.left, ...session.right].forEach(audienceId => {
        io.to(audienceId).emit('userCount', newUserCount.left + newUserCount.right);
      });

      // Clean up empty sessions
      if (!session.conductor && session.left.length === 0 && session.right.length === 0) {
        sessions.delete(sessionId);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server on port 3001`);
    });
});
