"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Music, Volume2, Users, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { io, Socket } from "socket.io-client";

function AudienceContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  
  const [section, setSection] = useState<"left" | "right" | null>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [bassBoost, setBassBoost] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);
  const [shakeEffect, setShakeEffect] = useState(false);

  // Music tracks - add your own!
  const tracks = [
    {
      name: "Epic Dubstep Mix",
      url: "/music/dubstep.mp3"
    },
    {
      name: "Epic Orchestra",
      url: "/music/orchestra.mp3"
    },
    {
      name: "Electronic Beat",
      url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
    },
    {
      name: "Dubstep Drop",
      url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4deafc42d2.mp3"
    },
    {
      name: "Bass House",
      url: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe5c21c.mp3"
    }
  ];
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bassNodeRef = useRef<BiquadFilterNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const waveAnimationRef = useRef<number | null>(null);

  // Initialize Socket.IO
  useEffect(() => {
    if (!sessionId || !section) return;

    // Use local IP for mobile connection
    const socketUrl = "http://192.168.1.89:3001";
    socketRef.current = io(socketUrl, {
      query: { role: "audience", sessionId, section }
    });

    socketRef.current.on("connect", () => {
      console.log("Audience connected");
    });

    socketRef.current.on("volumeChange", (data: { leftVolume: number; rightVolume: number }) => {
      console.log("Volume change received:", data);
      const newVolume = section === "left" ? data.leftVolume : data.rightVolume;
      console.log("Setting volume to:", newVolume);
      setVolume(newVolume);
      
      if (gainNodeRef.current) {
        // Smooth volume transition
        gainNodeRef.current.gain.setTargetAtTime(
          newVolume / 100,
          audioContextRef.current?.currentTime || 0,
          0.1
        );
      }

      // Bass boost and effects when volume is high
      if (newVolume > 70) {
        setBassBoost(true);
        
        // Bass boost audio
        if (bassNodeRef.current) {
          bassNodeRef.current.gain.setTargetAtTime(
            15,
            audioContextRef.current?.currentTime || 0,
            0.05
          );
        }

        // SPECIAL EFFECTS! 🔥
        
        // Screen flash effect
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 200);
        
        // Screen shake on very high volume
        if (newVolume > 85) {
          setShakeEffect(true);
          setTimeout(() => setShakeEffect(false), 300);
        }
        
        // Phone vibration (if supported)
        if (navigator.vibrate && newVolume > 80) {
          navigator.vibrate([50, 30, 50]); // Pattern: vibrate-pause-vibrate
        }
        
      } else {
        setBassBoost(false);
        if (bassNodeRef.current) {
          bassNodeRef.current.gain.setTargetAtTime(
            0,
            audioContextRef.current?.currentTime || 0,
            0.05
          );
        }
      }
    });

    socketRef.current.on("userCount", (count: number) => {
      setConnectedUsers(count);
    });

    // Listen for conductor stop
    socketRef.current.on("conductorStopped", () => {
      console.log("Conductor stopped - pausing music");
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    // Listen for conductor start (optional - could auto-play)
    socketRef.current.on("conductorStarted", () => {
      console.log("Conductor started");
      // Don't auto-play, let user control
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [sessionId, section, isPlaying]);

  const initAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;

    // Create Web Audio API context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Create audio nodes
    const source = audioContext.createMediaElementSource(audioRef.current);
    sourceNodeRef.current = source;

    // Gain node for volume control
    const gainNode = audioContext.createGain();
    gainNodeRef.current = gainNode;
    gainNode.gain.value = volume / 100;

    // Bass boost filter
    const bassNode = audioContext.createBiquadFilter();
    bassNodeRef.current = bassNode;
    bassNode.type = "lowshelf";
    bassNode.frequency.value = 200;
    bassNode.gain.value = 0;

    // 🌊 STEREO PANNER for 8D effect
    const pannerNode = audioContext.createStereoPanner();
    pannerNodeRef.current = pannerNode;
    // Left side = -1, Right side = +1
    pannerNode.pan.value = section === "left" ? -0.8 : 0.8;

    // Connect: source -> bass -> gain -> panner -> destination
    source.connect(bassNode);
    bassNode.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(audioContext.destination);

    // 🌊 Start wave animation for 8D effect
    startWaveEffect();
  };

  // 🌊 8D Wave Effect - Sound travels between left and right
  const startWaveEffect = () => {
    if (!pannerNodeRef.current || !audioContextRef.current) return;

    let time = 0;
    const animate = () => {
      if (!pannerNodeRef.current || !audioContextRef.current || !isPlaying) return;

      time += 0.02;

      // Create wave pattern based on volume
      const waveIntensity = volume / 100;
      
      // Base position: left = -0.8, right = +0.8
      const basePosition = section === "left" ? -0.8 : 0.8;
      
      // Wave oscillation - creates the traveling effect
      // Higher volume = more dramatic wave
      const waveOffset = Math.sin(time) * 0.4 * waveIntensity;
      
      // Apply smooth panning
      const targetPan = basePosition + waveOffset;
      pannerNodeRef.current.pan.setTargetAtTime(
        targetPan,
        audioContextRef.current.currentTime,
        0.1
      );

      waveAnimationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Stop wave effect when paused
  useEffect(() => {
    if (!isPlaying && waveAnimationRef.current) {
      cancelAnimationFrame(waveAnimationRef.current);
      waveAnimationRef.current = null;
    } else if (isPlaying && pannerNodeRef.current) {
      startWaveEffect();
    }
  }, [isPlaying]);

  const selectSection = (selectedSection: "left" | "right") => {
    setSection(selectedSection);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      initAudioContext();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Invalid Session</h1>
          <p className="text-gray-300">Please scan the QR code from the conductor</p>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Zap className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-5xl font-bold text-white mb-4 uppercase tracking-wider">
              Choose Your Side
            </h1>
            <p className="text-gray-400 text-lg">Join the bass revolution</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Section */}
            <motion.button
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectSection("left")}
              className="relative bg-gradient-to-br from-green-600 to-emerald-600 p-16 rounded-2xl group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-green-400/20"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <ArrowLeft className="w-20 h-20 text-white mx-auto mb-4 group-hover:animate-pulse relative z-10" />
              <h2 className="text-4xl font-bold text-white mb-2 uppercase relative z-10">Left</h2>
              <p className="text-gray-100 text-lg relative z-10">Bass Side</p>
            </motion.button>

            {/* Right Section */}
            <motion.button
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectSection("right")}
              className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-16 rounded-2xl group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-purple-400/20"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <ArrowRight className="w-20 h-20 text-white mx-auto mb-4 group-hover:animate-pulse relative z-10" />
              <h2 className="text-4xl font-bold text-white mb-2 uppercase relative z-10">Right</h2>
              <p className="text-gray-100 text-lg relative z-10">Drop Side</p>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  const sectionColor = section === "left" ? "from-green-500 to-emerald-500" : "from-purple-500 to-pink-500";
  const sectionGlow = section === "left" ? "shadow-green-500/50" : "shadow-purple-500/50";

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden ${shakeEffect ? 'animate-shake' : ''}`}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(bassBoost ? 50 : 20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              bassBoost 
                ? `w-4 h-4 ${section === "left" ? "bg-green-400" : "bg-purple-400"}` 
                : `w-2 h-2 ${section === "left" ? "bg-green-500" : "bg-purple-500"}`
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: bassBoost ? [0, 3, 0] : [0, 2, 0],
              y: bassBoost ? [0, -100] : [0, 0],
            }}
            transition={{
              duration: bassBoost ? 1 : 2,
              repeat: Infinity,
              delay: i * (bassBoost ? 0.02 : 0.1),
            }}
          />
        ))}
      </div>

      {/* Bass Drop Effect */}
      {bassBoost && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${sectionColor} opacity-20`} />
        </motion.div>
      )}

      {/* Flash Effect */}
      {flashEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-white" />
        </motion.div>
      )}

      {/* Strobe Effect at Max Volume */}
      {volume > 90 && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-40"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${sectionColor}`} />
        </motion.div>
      )}

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              rotate: isPlaying ? 360 : 0,
              scale: bassBoost ? [1, 1.3, 1] : 1
            }}
            transition={{ 
              rotate: { duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" },
              scale: { duration: 0.2 }
            }}
            className="inline-block mb-4"
          >
            {bassBoost ? (
              <Zap className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
            ) : (
              <Music className={`w-20 h-20 ${section === "left" ? "text-green-400" : "text-purple-400"}`} />
            )}
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 uppercase tracking-wider">
            {section === "left" ? "Left" : "Right"} Side
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span>{connectedUsers} in the crowd</span>
          </div>
        </div>

        {/* Main Player */}
        <div className={`bg-gradient-to-br ${sectionColor} p-1 rounded-3xl shadow-2xl ${sectionGlow} shadow-2xl`}>
          <div className="bg-black rounded-3xl p-8">
            {/* Magic Wand Visualization */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                {/* Magic Wand */}
                <motion.div
                  animate={{ 
                    rotate: bassBoost ? [0, -15, 15, -10, 10, 0] : [0, -5, 5, 0],
                    scale: bassBoost ? [1, 1.2, 1] : 1
                  }}
                  transition={{ 
                    duration: bassBoost ? 0.5 : 2, 
                    repeat: Infinity 
                  }}
                  className="relative"
                >
                  {/* Wand Stick */}
                  <div className={`w-4 h-48 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full mx-auto relative shadow-lg`}>
                    {/* Wand Handle Grip */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-6 h-16 border-2 border-amber-900 rounded-full opacity-50" />
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-amber-900 rounded-full" />
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-amber-900 rounded-full" />
                  </div>
                  
                  {/* Magic Star at Top */}
                  <motion.div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    animate={{ 
                      rotate: 360,
                      scale: bassBoost ? [1, 1.5, 1] : [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: bassBoost ? 0.3 : 1, repeat: Infinity }
                    }}
                  >
                    <div className={`relative w-16 h-16`}>
                      {/* Star Shape */}
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                          <linearGradient id={`starGradient-${section}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={section === "left" ? "#10b981" : "#a855f7"} />
                            <stop offset="100%" stopColor={section === "left" ? "#34d399" : "#ec4899"} />
                          </linearGradient>
                        </defs>
                        <path
                          d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z"
                          fill={`url(#starGradient-${section})`}
                          stroke={section === "left" ? "#10b981" : "#a855f7"}
                          strokeWidth="2"
                          className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                        />
                      </svg>
                      
                      {/* Glow Effect */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${sectionColor} blur-xl opacity-60`}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>

                  {/* Magic Sparkles - Volume Intensity */}
                  {[...Array(Math.floor(volume / 10))].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 ${section === "left" ? "bg-green-400" : "bg-purple-400"} rounded-full`}
                      style={{
                        left: `${50 + (Math.random() - 0.5) * 100}%`,
                        top: `${Math.random() * 60}%`,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60],
                        y: [0, -50],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}

                  {/* Bass Boost Magic Burst */}
                  {bassBoost && (
                    <>
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={`burst-${i}`}
                          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                          style={{
                            left: '50%',
                            top: '0%',
                          }}
                          animate={{
                            opacity: [1, 0],
                            scale: [0, 2],
                            x: [0, (Math.cos(i * 18 * Math.PI / 180) * 80)],
                            y: [0, (Math.sin(i * 18 * Math.PI / 180) * 80)],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: (i * 0.05),
                          }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>

                {/* Magic Aura */}
                <motion.div
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${sectionColor} blur-2xl opacity-30`}
                  animate={{ 
                    scale: bassBoost ? [1, 2, 1] : [1, 1.3, 1],
                    opacity: bassBoost ? [0.3, 0.6, 0.3] : [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </div>

            {/* Track Selector */}
            <div className="mb-6">
              <p className="text-white text-sm font-semibold mb-3 text-center">Choose Your Track</p>
              <div className="grid grid-cols-2 gap-2">
                {tracks.map((track, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (isPlaying) {
                        setIsPlaying(false);
                        if (audioRef.current) {
                          audioRef.current.pause();
                        }
                      }
                      setSelectedTrack(index);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      selectedTrack === index
                        ? `bg-gradient-to-r ${sectionColor} text-white`
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {track.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Play Button */}
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-6 rounded-2xl font-bold text-white text-2xl uppercase tracking-wider transition shadow-lg ${
                isPlaying
                  ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  : `bg-gradient-to-r ${sectionColor} hover:opacity-90`
              }`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Drop It"}
            </motion.button>

            {/* Status */}
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-bold ${bassBoost ? "text-yellow-400 animate-pulse" : "text-white"}`}>
                    {bassBoost ? "🔥 BASS DROP!" : isPlaying ? "🎵 Playing" : "⏸ Paused"}
                  </span>
                </div>
              </div>

              {/* 8D Wave Effect Indicator */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-xl border border-cyan-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ 
                          x: [-10, 10, -10],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </motion.div>
                      <span className="text-cyan-300 text-sm font-semibold">8D Wave Active</span>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-4 bg-cyan-400 rounded-full"
                          animate={{ 
                            scaleY: [0.3, 1, 0.3],
                            opacity: [0.3, 1, 0.3]
                          }}
                          transition={{ 
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-cyan-400/70 text-xs mt-2">
                    Sound traveling in stereo space 🌊
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Element - Dubstep/Electronic Music */}
        <audio
          ref={audioRef}
          loop
          crossOrigin="anonymous"
          src={tracks[selectedTrack].url}
        />
      </div>
    </div>
  );
}

export default function AudiencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    }>
      <AudienceContent />
    </Suspense>
  );
}
