# 🎵 Crowd Symphony

Control music with hand gestures! Be the conductor and control the volume for your entire audience in real-time.

## ✨ Features

- **Conductor Mode**: Use your laptop camera to detect hand gestures
- **Audience Mode**: Join via QR code and let the conductor control your volume
- **Real-time Sync**: WebSocket-powered instant volume changes
- **Left/Right Sections**: Divide your audience into sections
- **Beautiful UI**: Gradient animations and smooth transitions

## 🚀 How It Works

### For Conductors:
1. Open the app and click "Be the Conductor"
2. Allow camera access
3. Share the QR code with your audience
4. Move your hands up = volume increases
5. Move your hands down = volume decreases

### For Audience:
1. Scan the QR code from the conductor
2. Choose your section (left or right)
3. Press play
4. Your volume is now controlled by the conductor!

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Real-time**: Socket.IO (WebSocket)
- **Gesture Detection**: Camera + Motion Analysis
- **QR Codes**: qrcode.react

## 📦 Installation

```bash
npm install
```

## 🎮 Running

```bash
npm run dev
```

Open http://localhost:3000

## 🎯 How Gesture Detection Works

The conductor page uses your laptop camera to detect hand position:
- Analyzes brightness in top vs bottom of frame
- More brightness in top = hand is up = higher volume
- Smooth transitions for natural control
- Real-time broadcast to all connected audience members

## 🌐 Architecture

- **Next.js App**: Runs on port 3000
- **WebSocket Server**: Runs on port 3001
- **Sessions**: Each conductor gets a unique session ID
- **Real-time**: Volume changes broadcast instantly to all audience members

## 📱 Mobile Friendly

The audience page is fully responsive and works great on phones!

## 🎨 Customization

- Change the music source in `app/audience/page.tsx`
- Adjust gesture sensitivity in `app/conductor/page.tsx`
- Modify colors in Tailwind config

## 🔥 Future Ideas

- Multiple music tracks
- Tempo control with gestures
- Sound effects
- Recording sessions
- Leaderboards
- Team mode

---

Built with ❤️ for interactive music experiences
