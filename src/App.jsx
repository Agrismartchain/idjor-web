// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
// + on n’importe plus useChat ici
// import { useChat } from "./useChat";
import { FaGoogleDrive, FaDropbox } from "react-icons/fa";
import { FiPaperclip, FiPlus, FiSearch } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import { TbRobot } from "react-icons/tb";
import { FiMenu } from "react-icons/fi";

+ import { queryAgents } from "./multiChat";

export default function ChatPage() {
  // … tes hooks de state habituels …

-  // Chat hook (fonctionnel)
-  const { messages, sendMessage, loading } = useChat(activeId);
+  // On garde messages/loading, mais on n'utilise plus useChat
+  const [messages, setMessages] = useState([]);
+  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // … le reste de tes hooks & actions …

  // Remplace handleSubmit par :
  const handleSubmit = async e => {
    e.preventDefault();
    if (!input.trim() || loading) return;

+   // 1) On passe en loading
    setLoading(true);

+   // 2) On ajoute le message utilisateur
    setMessages(prev => [
      ...prev,
+     { role: "user",   content: input.trim() }
    ]);

+   try {
+     // 3) Appel multi-agents
+     const results = await queryAgents(activeId, input.trim());
+     // results est typiquement { ExpertAgri: "...", DataAnalyst: "..." }
+
+     // 4) On construit une réponse fusionnée (ou on les affiche séparément)
+     const combined = Object.entries(results)
+       .map(([agent, text]) => `**${agent}**:\n${text}`)
+       .join("\n\n");
+
+     // 5) On ajoute la réponse fusionnée comme un seul bloc assistant
+     setMessages(prev => [
+       ...prev,
+       { role: "assistant", content: combined }
+     ]);
+   } catch(err) {
+     console.error("Erreur multi-agent:", err);
+     // optionnel : remonter une notification d'erreur à l'utilisateur
+   } finally {
+     setLoading(false);
+     setInput("");
+   }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* … ta sidebar … */}
      <div className="flex-1 flex justify-center p-4 bg-gradient-to-br from-[#1f1f29] to-[#2f2f4b]">
        <div className="w-full max-w-2xl flex flex-col h-full mx-auto">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 flex flex-col">
            {messages.map((m,i)=>(
              <div key={i} className={`max-w-xs p-3 rounded-2xl ${
                m.role==="assistant"
                  ? "self-start bg-[#333452] text-white"
                  : "self-end   bg-[#44446a] text-white"
              }`}>
                {/* Si tu veux du markdown pour les titres d’agents, tu peux utiliser react-markdown */}
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-[#333452] text-white p-3 rounded-2xl max-w-xs">
                … 
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input + bouton d’envoi */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-gradient-to-tr from-[#8E2DE2] to-[#00C9FF] rounded-2xl shadow-2xl p-4 text-white mt-4"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button type="button" onClick={()=>setAppMenu(!appMenu)} className="p-2 bg-[#27293f] rounded-full hover:bg-[#383950]">
                <FiPaperclip/>
              </button>
              {/* … ton menu d’attachments … */}
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                placeholder="Écris en français ou en Baoulé…"
                className="flex-1 p-3 rounded-full bg-[#27293f] text-white focus:outline-none"
              />
              <button type="submit" className="p-3 bg-gradient-to-tr from-[#8E2DE2] to-[#00C9FF] rounded-full hover:scale-110 transition disabled:opacity-50">
                <IoSend className="text-xl text-white"/>
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
