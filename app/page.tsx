"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Users, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="inline-block mb-4"
          >
            <Music className="w-20 h-20 text-yellow-400" />
          </motion.div>
          <h1 className="text-6xl font-bold text-white mb-4">
            Crowd Symphony
          </h1>
          <p className="text-xl text-gray-300">
            Control the music with your hands. Conduct the crowd.
          </p>
        </motion.div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Conductor */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/conductor">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-2xl hover:scale-105 transition cursor-pointer group h-full">
                <div className="flex items-center justify-center mb-6">
                  <Wand2 className="w-16 h-16 text-white group-hover:animate-bounce" />
                </div>
                <h2 className="text-3xl font-bold text-white text-center mb-4">
                  Be the Conductor
                </h2>
                <p className="text-gray-100 text-center">
                  Use your laptop camera and hand gestures to control the music volume for everyone in real-time.
                </p>
                <div className="mt-6 text-center">
                  <span className="inline-block px-6 py-3 bg-white/20 rounded-full text-white font-semibold">
                    Start Conducting →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Audience */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/audience">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-8 rounded-2xl hover:scale-105 transition cursor-pointer group h-full">
                <div className="flex items-center justify-center mb-6">
                  <Users className="w-16 h-16 text-white group-hover:animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-white text-center mb-4">
                  Join as Audience
                </h2>
                <p className="text-gray-100 text-center">
                  Scan the QR code, choose your section (left/right), and let the conductor control the music on your phone.
                </p>
                <div className="mt-6 text-center">
                  <span className="inline-block px-6 py-3 bg-white/20 rounded-full text-white font-semibold">
                    Join Now →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-white">
              <div className="text-3xl font-bold text-yellow-400">🎵</div>
              <div className="text-sm mt-2">Real-time Sync</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold text-yellow-400">👋</div>
              <div className="text-sm mt-2">Gesture Control</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold text-yellow-400">🎭</div>
              <div className="text-sm mt-2">Left & Right Sections</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
