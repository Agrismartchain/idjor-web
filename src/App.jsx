import React from 'react';
import { motion } from 'framer-motion';

// shadcn/ui components (if using)
// import { Button } from '@/components/ui/button';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f2029] to-[#38394e] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-[#27293d] rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
      >
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">idjor.ai</h1>
          <div className="flex gap-2">
            {/* Buttons or toggles */}
            <button className="px-4 py-2 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full transform hover:scale-105 transition">
              Général
            </button>
            <button className="px-4 py-2 bg-gradient-to-tr from-green-500 to-blue-500 text-white rounded-full transform hover:scale-105 transition">
              Agri
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Chat messages container */}
          <div className="flex flex-col gap-3">
            {/* Example messages */}
            <div className="self-start bg-[#3a3c5c] text-white p-3 rounded-2xl max-w-xs">
              Bonjour, comment puis-je vous aider aujourd'hui?
            </div>
            <div className="self-end bg-[#5c5e82] text-white p-3 rounded-2xl max-w-xs">
              Je voudrais en savoir plus sur l'état de mes cultures.
            </div>
          </div>
        </main>

        <footer className="mt-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Écris en français ou en Baoulé…"
            className="flex-1 p-3 rounded-full bg-[#2e3150] text-white focus:outline-none"
          />
          <button className="p-3 bg-gradient-to-tr from-yellow-400 to-red-500 rounded-full shadow-lg transform hover:scale-110 transition">
            {/* Microphone Icon (lucide-react) */}
            🎤
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
