import React, { useState } from "react";
import { motion } from "framer-motion";
import { useChat } from "./useChat";

export default function ChatPage() {
  const { messages, sendMessage, loading } = useChat();
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar coulissant */}
      <aside
        className="
          fixed top-0 left-0 h-full
          w-64 bg-[#1f1f2e] text-white
          transform -translate-x-60
          hover:translate-x-0
          transition-transform duration-300
          z-20
        "
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-6">MGX Style</h2>
          <button className="w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">
            + New Chat
          </button>
          <button className="w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">
            Go to App World
          </button>

          <nav className="mt-8">
            <h3 className="uppercase text-xs mb-2 opacity-70">My Chats</h3>
            <ul className="space-y-1">
              <li className="py-2 px-3 hover:bg-[#2a2c40] rounded cursor-pointer">
                Recent
              </li>
              <li className="py-2 px-3 hover:bg-[#2a2c40] rounded cursor-pointer">
                Wakama Project Setup Guide
              </li>
              <li className="py-2 px-3 hover:bg-[#2a2c40] rounded cursor-pointer">
                Wakama Project Setup Guide
              </li>
            </ul>
          </nav>

          <div className="mt-auto pt-8">
            <button className="w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">
              Settings
            </button>
            <button className="w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">
              Feedback
            </button>
            <button className="w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">
              Help Center
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium">Marouane .J</p>
              <p className="text-xs opacity-70">Pro 20</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Zone de chat */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-[#1f2029] to-[#38394e]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl bg-[#27293d] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 z-10"
        >
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">idjor.ai</h1>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full transform hover:scale-105 transition">
                Général
              </button>
              <button className="px-4 py-2 bg-gradient-to-tr from-green-500 to-blue-500 text-white rounded-full transform hover:scale-105 transition">
                Agri
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-xs p-3 rounded-2xl ${
                  m.role === "bot"
                    ? "self-start bg-[#3a3c5c] text-white"
                    : "self-end bg-[#5c5e82] text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-[#3a3c5c] text-white p-3 rounded-2xl max-w-xs">
                …
              </div>
            )}
          </main>

          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris en français ou en Baoulé…"
              className="flex-1 p-3 rounded-full bg-[#2e3150] text-white focus:outline-none"
            />
            <button
              type="submit"
              className="p-3 bg-gradient-to-tr from-yellow-400 to-red-500 rounded-full shadow-lg transform hover:scale-110 transition disabled:opacity-50"
              disabled={loading || !input.trim()}
            >
              🎤
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
