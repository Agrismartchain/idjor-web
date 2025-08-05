import React, { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
import { useChat } from "./useChat";
import { FaGoogleDrive, FaDropbox } from "react-icons/fa";
import { FiPaperclip, FiPlus, FiSearch } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import { TbRobot } from "react-icons/tb";
import { FiMenu } from "react-icons/fi";  // menu toggle icon
import { queryAgents } from '../lib/multiChat';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // toggle sidebar

  // Projets
  const [projects, setProjects] = useState(() => {
    const raw = localStorage.getItem("chat_projects");
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [activeProject, setActiveProject] = useState(null);

  // Sessions: toujours au moins une session
  const [sessions, setSessions] = useState(() => {
    const raw = localStorage.getItem("chat_sessions");
    let arr = [];
    try { arr = raw ? JSON.parse(raw) : []; } catch {}
    if (arr.length === 0) {
      const id = uuid();
      arr = [{ id, title: "Nouvelle conversation", projectId: null }];
      localStorage.setItem("chat_sessions", JSON.stringify(arr));
    }
    return arr;
  });
  const [activeId, setActiveId] = useState(() => sessions[0].id);

  // Recherche
  const [searchTerm, setSearchTerm] = useState("");

  // Persistance
  useEffect(() => localStorage.setItem("chat_projects", JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem("chat_sessions", JSON.stringify(sessions)), [sessions]);

  // Chat hook (fonctionnel)
  const { messages, sendMessage, loading } = useChat(activeId);
  const messagesEndRef = useRef(null);

  // Filtrer sessions
  const filteredSessions = sessions
    .filter(s => !activeProject || s.projectId === activeProject)
    .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Actions projets
  const handleNewProject = () => {
    const id = uuid();
    const p = { id, name: "Nouveau projet" };
    setProjects(prev => [...prev, p]);
    setActiveProject(id);
  };
  const handleSelectProject = id => setActiveProject(id);

  // Actions sessions
  const handleNewChat = () => {
    const id = uuid();
    const sess = { id, title: "Nouvelle conversation", projectId: activeProject };
    setSessions(prev => [...prev, sess]);
    setActiveId(id);
  };
  const handleSelectSession = id => setActiveId(id);

  // Menu contextuel
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const onClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Actions session
  const renameSession = id => {
    const name = prompt("Renommer la conversation:");
    if (name) setSessions(prev => prev.map(s => s.id === id ? { ...s, title: name } : s));
  };
  const deleteSession = id => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) setActiveId(sessions[0]?.id || null);
  };

  // Auto-scroll
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // Attachment menu
  const [appMenu, setAppMenu] = useState(false);

  // Input state
  const [input, setInput] = useState("");
  const handleSubmit = e => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Toggle sidebar button */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-4 left-4 z-50 p-2 text-white">
        <FiMenu size={24} />
      </button>
      {/* Global Title */}
      <img
  src="/logo.png"
  alt="iDJOR AI logo"
  className={`absolute top-4 z-30 transition-all duration-300 ${sidebarOpen ? 'left-72 w-16' : 'left-20 w-[5.5rem]'}`}
  style={{ height: 'auto' }}
/>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0f0f17] text-white transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        {sidebarOpen ? (
          <div className="p-4 flex flex-col h-full">
            <button onClick={handleNewProject} className="mb-4 w-full py-2 px-3 bg-[#27293f] rounded hover:bg-[#383950]">+ Nouveau projet</button>
            <h3 className="uppercase text-xs mb-2 opacity-70">Projets</h3>
            <ul className="space-y-1 mb-4 flex-1 overflow-y-auto">
              {projects.map(p => (
                <li key={p.id} onClick={() => handleSelectProject(p.id)} className={`py-2 px-3 rounded cursor-pointer ${activeProject === p.id ? 'bg-[#383950]' : 'hover:bg-[#27293f]'}`}>{p.name}</li>
              ))}
            </ul>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher des chats" className="mb-4 w-full p-2 rounded bg-[#27293f] text-white" />
            <button onClick={handleNewChat} className="mb-4 w-full py-2 px-3 bg-[#27293f] rounded hover:bg-[#383950]">+ Nouveau chat</button>
            <h3 className="uppercase text-xs mb-2 opacity-70">Chats</h3>
            <ul className="space-y-1 flex-1 overflow-y-auto">
              {filteredSessions.map(s => (
                <li key={s.id} className="relative group">
                  <div onClick={() => handleSelectSession(s.id)} className={`py-2 px-3 rounded cursor-pointer ${activeId === s.id ? 'bg-[#383950]' : 'hover:bg-[#27293f]'}`}>{s.title}</div>
                  <button onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100">⋮</button>
                  {menuOpen === s.id && (
                    <ul ref={menuRef} className="absolute right-2 top-6 bg-[#1f1f29] rounded shadow-lg w-40 z-10">
                      <li onClick={() => renameSession(s.id)} className="px-4 py-2 hover:bg-[#27293f]">Renommer</li>
                      <li onClick={() => deleteSession(s.id)} className="px-4 py-2 hover:bg-[#27293f]">Supprimer</li>
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="pt-4 text-sm opacity-70">Marouane .J - Pro 20</div>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-12 space-y-4">
            {/* Placeholder logo above menu button */}
            <div className="w-8 h-8 border-2 border-white rounded-full mb-2"></div>
            {/* Nouveau chat */}
            <button onClick={() => { handleNewChat(); setSidebarOpen(true); }} className="p-2">
              <FiPlus size={24} />
            </button>
            {/* Recherche chats */}
            <button onClick={() => setSidebarOpen(true)} className="p-2">
              <FiSearch size={24} />
            </button>
            {/* Agent IA */}
            <button onClick={() => setSidebarOpen(true)} className="p-2">
              <TbRobot size={24} />
            </button>
          </div>
        )}
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex justify-center p-4 bg-gradient-to-br from-[#1f1f29] to-[#2f2f4b]">
        <div className="w-full max-w-2xl flex flex-col h-full mx-auto">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 flex flex-col">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-xs p-3 rounded-2xl ${
                  m.role === 'bot'
                    ? 'self-start bg-[#333452] text-white'
                    : 'self-end bg-[#44446a] text-white'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-[#333452] text-white p-3 rounded-2xl max-w-xs">…</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box with attachment and send */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-gradient-to-tr from-[#8E2DE2] to-[#00C9FF] rounded-2xl shadow-2xl p-4 text-white mt-4"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAppMenu(!appMenu)}
                className="p-2 bg-[#27293f] rounded-full hover:bg-[#383950]"
              >
                <FiPaperclip />
              </button>
              {appMenu && (
                <div className="absolute bottom-16 left-8 bg-[#1f1f29] rounded shadow-lg p-2 flex flex-col gap-2 z-20">
                  <button className="flex items-center gap-2 p-2 hover:bg-[#27293f]">
                    <FaGoogleDrive /> Google Drive
                  </button>
                  <button className="flex items-center gap-2 p-2 hover:bg-[#27293f]">
                    <FaDropbox /> Dropbox
                  </button>
                </div>
              )}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écris en français ou en Baoulé…"
                className="flex-1 p-3 rounded-full bg-[#27293f] text-white focus:outline-none"
              />
              <button
                type="submit"
                className="p-3 bg-gradient-to-tr from-[#8E2DE2] to-[#00C9FF] rounded-full hover:scale-110 transition disabled:opacity-50"
              >
                <IoSend className="text-xl text-white" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
