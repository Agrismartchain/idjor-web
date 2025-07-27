import React, { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
import { useChat } from "./useChat";

export default function ChatPage() {
  // Charger les projets
  const [projects, setProjects] = useState(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("chat_projects");
      if (raw) {
        try { return JSON.parse(raw); } catch {};
      }
    }
    return [];
  });
  // Charger les sessions
  const [sessions, setSessions] = useState(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("chat_sessions");
      if (raw) {
        try { return JSON.parse(raw); } catch {};
      }
    }
    return [];
  });
  // Session et projet actifs
  const [activeProject, setActiveProject] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Persist
  useEffect(() => localStorage.setItem("chat_projects", JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem("chat_sessions", JSON.stringify(sessions)), [sessions]);

  // Hook chat
  const { messages, sendMessage, loading } = useChat(activeId);
  const messagesEndRef = useRef(null);

  // Filtrer
  const filteredProjects = projects;
  const filteredSessions = sessions
    .filter(s => !activeProject || s.projectId === activeProject)
    .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Nouvelles entités
  const handleNewProject = () => {
    const id = uuid();
    const p = { id, name: "Nouveau projet" };
    setProjects(prev => [...prev, p]);
    setActiveProject(id);
  };
  const handleNewChat = () => {
    const id = uuid();
    const session = { id, title: "Nouvelle conversation", projectId: activeProject };
    setSessions(prev => [...prev, session]);
    setActiveId(id);
  };

  // Sélections
  const handleSelectProject = id => setActiveProject(id);
  const handleSelectSession = id => setActiveId(id);

  // Menu de contexte
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Actions session
  const renameSession = id => {
    const name = prompt("Renommer la conversation:");
    if (name) setSessions(prev => prev.map(s => s.id===id?{...s,title:name}:s));
  };
  const deleteSession = id => {
    setSessions(prev => prev.filter(s => s.id!==id));
    if (activeId===id) setActiveId(null);
  };

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const [input, setInput] = useState("");
  const handleSubmit = e => { e.preventDefault(); if (!input||loading) return; sendMessage(input); setInput(""); };

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-[#1f1f2e] text-white transform -translate-x-60 hover:translate-x-0 transition-transform duration-300 z-20">
        <div className="p-4 flex flex-col h-full">
          <button onClick={handleNewProject} className="mb-4 w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">+ Nouveau projet</button>

          <nav className="flex-shrink-0 mb-4">
            <h3 className="uppercase text-xs mb-2 opacity-70">Projets</h3>
            <ul className="space-y-1">
              {filteredProjects.map(p => (
                <li key={p.id} onClick={()=>handleSelectProject(p.id)} className={`py-2 px-3 rounded cursor-pointer ${activeProject===p.id?'bg-[#2a2c40]':'hover:bg-[#2a2c40]'}`}>{p.name}</li>
              ))}
            </ul>
          </nav>

          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Rechercher des chats" className="mb-4 w-full p-2 rounded bg-[#2e3150] text-white" />

          <button onClick={handleNewChat} className="mb-4 w-full text-left py-2 px-3 hover:bg-[#2a2c40] rounded">+ Nouveau Chat</button>

          <nav className="flex-1 overflow-y-auto">
            <h3 className="uppercase text-xs mb-2 opacity-70">Chats</h3>
            <ul className="space-y-1">
              {filteredSessions.map(s => (
                <li key={s.id} className="relative group">
                  <div onClick={()=>handleSelectSession(s.id)} className={`py-2 px-3 rounded cursor-pointer ${activeId===s.id?'bg-[#2a2c40]':'hover:bg-[#2a2c40]'}`}>{s.title}</div>
                  <button onClick={()=>setMenuOpen(menuOpen===s.id?null:s.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100">⋮</button>
                  {menuOpen===s.id && (
                    <ul ref={menuRef} className="absolute right-2 top-6 bg-[#27293d] rounded shadow-lg w-40">
                      <li onClick={()=>renameSession(s.id)} className="px-4 py-2 hover:bg-[#38394e]">Renommer</li>
                      <li onClick={()=>deleteSession(s.id)} className="px-4 py-2 hover:bg-[#38394e]">Supprimer</li>
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto pt-8">
            <p className="text-sm">Marouane .J</p>
            <p className="text-xs opacity-70">Pro 20</p>
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-[#1f2029] to-[#38394e]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-2xl bg-[#27293d] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 z-10">
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">idjor.ai</h1>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full transform hover:scale-105 transition">Général</button>
              <button className="px-4 py-2 bg-gradient-to-tr from-green-500 to-blue-500 text-white rounded-full transform hover:scale-105 transition">Agri</button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {messages.map((m,i)=>(<div key={i} className={`max-w-xs p-3 rounded-2xl ${m.role==='bot'?'self-start bg-[#3a3c5c] text-white':'self-end bg-[#5c5e82] text-white'}`}>{m.content}</div>))}
            {loading&&<div className="self-start bg-[#3a3c5c] text-white p-3 rounded-2xl max-w-xs">…</div>}
            <div ref={messagesEndRef}/>
          </main>
          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Écris en français ou en Baoulé…" className="flex-1 p-3 rounded-full bg-[#2e3150] text-white focus:outline-none"/>
            <button type="submit" className="p-3 bg-gradient-to-tr from-yellow-400 to-red-500 rounded-full shadow-lg transform hover:scale-110 transition disabled:opacity-50" disabled={loading||!input.trim()}>🎤</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
