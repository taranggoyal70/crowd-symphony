"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Volume2, Users, QrCode, Zap, TrendingUp, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";

export default function ConductorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [leftVolume, setLeftVolume] = useState(50);
  const [rightVolume, setRightVolume] = useState(50);
  const [connectedUsers, setConnectedUsers] = useState({ left: 0, right: 0 });
  const [sessionId, setSessionId] = useState('');
  const [handsDetected, setHandsDetected] = useState({ left: false, right: false });
  const [audienceUrl, setAudienceUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handsRef = useRef<any>(null);

  // Generate session ID on client-side only
  useEffect(() => {
    setSessionId(Math.random().toString(36).substr(2, 9));
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    if (!sessionId) return;
    const socketUrl = "http://10.0.0.191:3001";
    socketRef.current = io(socketUrl, {
      query: { role: "conductor", sessionId }
    });

    socketRef.current.on("connect", () => {
      console.log("Conductor connected");
    });

    socketRef.current.on("userCount", (data: { left: number; right: number }) => {
      setConnectedUsers(data);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [sessionId]);

  // Broadcast volume changes
  useEffect(() => {
    if (socketRef.current && isActive) {
      console.log("Emitting volume change:", { leftVolume, rightVolume });
      socketRef.current.emit("volumeChange", { 
        leftVolume, 
        rightVolume, 
        sessionId 
      });
    }
  }, [leftVolume, rightVolume, sessionId, isActive]);

  // Load MediaPipe Hands
  useEffect(() => {
    const loadMediaPipe = async () => {
      if (typeof window === 'undefined') return;

      try {
        const { Hands } = await import('@mediapipe/hands');

        handsRef.current = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsRef.current.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsRef.current.onResults(onHandsResults);
      } catch (error) {
        console.error('MediaPipe loading error:', error);
      }
    };

    loadMediaPipe();
  }, []);

  const onHandsResults = (results: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw center divider - clean white line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels - clean white text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('L', canvas.width * 0.25 - 15, 70);
    ctx.fillText('R', canvas.width * 0.75 - 15, 70);

    let leftHandY: number | null = null;
    let rightHandY: number | null = null;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
        const handedness = results.multiHandedness[index].label;
        const isLeftSide = handedness === "Right";
        const color = '#00ff00'; // Bright green for all hands

        drawConnectors(ctx, landmarks, canvas.width, canvas.height, color);
        drawLandmarks(ctx, landmarks, canvas.width, canvas.height, color);

        const wrist = landmarks[0];
        const middleTip = landmarks[12];
        const avgY = (wrist.y + middleTip.y) / 2;
        const handVolume = Math.round((1 - avgY) * 100);

        if (isLeftSide) {
          leftHandY = handVolume;
        } else {
          rightHandY = handVolume;
        }
      });

      setHandsDetected({
        left: leftHandY !== null,
        right: rightHandY !== null
      });

      if (leftHandY !== null) {
        const handValue = leftHandY;
        setLeftVolume(prev => {
          const diff = handValue - prev;
          return Math.round(prev + diff * 0.3);
        });
      }

      if (rightHandY !== null) {
        const handValue = rightHandY;
        setRightVolume(prev => {
          const diff = handValue - prev;
          return Math.round(prev + diff * 0.3);
        });
      }
    } else {
      setHandsDetected({ left: false, right: false });
    }
  };

  const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, color: string) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });
  };

  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, color: string) => {
    landmarks.forEach((landmark: any) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 1280, 
          height: 720,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
        
        if (socketRef.current) {
          socketRef.current.emit('conductorStart');
        }
        
        if (handsRef.current) {
          const { Camera: MediaPipeCamera } = await import('@mediapipe/camera_utils');
          
          const camera = new MediaPipeCamera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720
          });
          
          camera.start();
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Please allow camera access to use conductor mode");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setHandsDetected({ left: false, right: false });
    
    if (socketRef.current) {
      socketRef.current.emit('conductorStop');
    }
  };

  useEffect(() => {
    const localIP = '10.0.0.191';
    const url = `http://${localIP}:3000/audience?session=${sessionId}`;
    setAudienceUrl(url);
  }, [sessionId]);

  const totalUsers = connectedUsers.left + connectedUsers.right;

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 max-w-[1920px] mx-auto">
        {/* Top Bar */}
        <div className="mb-6 bg-zinc-900 rounded-lg p-5 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-white tracking-tight">
                CROWD SYMPHONY
              </div>
              <div className="h-6 w-px bg-zinc-700" />
              <div className="text-sm text-zinc-500 font-mono">
                {sessionId || 'Loading...'}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 rounded-md">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-zinc-600'}`} />
                <span className="text-sm text-white font-medium">
                  {isActive ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>

              <div className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 rounded-md">
                <Users className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-white font-medium">{totalUsers}</span>
              </div>

              <button
                onClick={() => setShowQR(!showQR)}
                className="px-5 py-2 bg-white text-black font-semibold rounded-md hover:bg-zinc-200 transition flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>QR</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-semibold text-white">CAMERA</h2>
                </div>
                {!isActive ? (
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>START</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition"
                  >
                    STOP
                  </button>
                )}
              </div>

              <div className="relative aspect-video bg-black rounded-md overflow-hidden border border-zinc-800">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover opacity-0"
                  playsInline
                  muted
                />
                <canvas 
                  ref={canvasRef} 
                  width={1280}
                  height={720}
                  className="w-full h-full object-cover"
                />

                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-500 text-sm">Camera off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hand Status */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={`px-4 py-2.5 rounded-md border ${handsDetected.left ? 'bg-green-950 border-green-800' : 'bg-zinc-800 border-zinc-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">LEFT</span>
                    <div className={`w-2 h-2 rounded-full ${handsDetected.left ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  </div>
                </div>
                <div className={`px-4 py-2.5 rounded-md border ${handsDetected.right ? 'bg-green-950 border-green-800' : 'bg-zinc-800 border-zinc-700'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">RIGHT</span>
                    <div className={`w-2 h-2 rounded-full ${handsDetected.right ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Controls */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-white">LEFT</h3>
                  </div>
                  <span className="text-xs text-zinc-500">{connectedUsers.left} users</span>
                </div>
                <div className="text-center mb-4">
                  <div className="text-6xl font-bold text-white tabular-nums">
                    {leftVolume}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">%</div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    style={{ width: `${leftVolume}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>

              {/* Right */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-white">RIGHT</h3>
                  </div>
                  <span className="text-xs text-zinc-500">{connectedUsers.right} users</span>
                </div>
                <div className="text-center mb-4">
                  <div className="text-6xl font-bold text-white tabular-nums">
                    {rightVolume}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">%</div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    style={{ width: `${rightVolume}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">STATS</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  <p className="text-sm text-white font-medium">
                    {isActive ? "Conducting" : "Standby"}
                  </p>
                </div>
                <div className="h-px bg-zinc-800" />
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Hands</p>
                  <p className="text-sm text-white font-medium">
                    {handsDetected.left && handsDetected.right ? "Both" : 
                     handsDetected.left ? "Left" : 
                     handsDetected.right ? "Right" : "None"}
                  </p>
                </div>
                <div className="h-px bg-zinc-800" />
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Average</p>
                  <p className="text-sm text-white font-medium">
                    {Math.round((leftVolume + rightVolume) / 2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Guide */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">GUIDE</h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <p>• Raise left hand to control left section</p>
                <p>• Raise right hand to control right section</p>
                <p>• Use both hands for full control</p>
                <p>• 70%+ triggers bass boost effects</p>
              </div>
            </div>

            {/* Connection */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center space-x-2 mb-3">
                <Wifi className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">CONNECTION</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Left</span>
                  <span className="text-white font-medium">{connectedUsers.left}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Right</span>
                  <span className="text-white font-medium">{connectedUsers.right}</span>
                </div>
                <div className="h-px bg-zinc-800 my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total</span>
                  <span className="text-white font-bold">{totalUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 rounded-lg p-8 max-w-md w-full border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Join Session</h2>
              
              <div className="bg-white p-6 rounded-lg mb-6">
                <QRCodeSVG value={audienceUrl} size={280} className="w-full h-auto" />
              </div>

              <div className="bg-zinc-800 p-4 rounded-md mb-4">
                <p className="text-xs text-zinc-500 mb-2">URL:</p>
                <p className="text-sm text-white break-all font-mono">{audienceUrl}</p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(audienceUrl);
                  alert('Copied!');
                }}
                className="w-full py-3 bg-white text-black font-semibold rounded-md hover:bg-zinc-200 transition"
              >
                Copy URL
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
