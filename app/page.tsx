"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import Link from "next/link";


// --- Icons (Lucide-like SVG components) ---
const SendIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const BotIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const MessageIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
  </svg>
);

const TargetIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/>
    <path d="M14 2v6h6"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
    <line x1="10" x2="8" y1="9" y2="9"/>
  </svg>
);

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// --- Mock Data ---
const customInitialMessages: any[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi there! I'm your AI customer support assistant. How can I help you regarding our website or FAQs today?",
    createdAt: new Date(),
  },
];

export default function ChatApp() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, stop } = useChat({
    api: "/api/chat",
    initialMessages: customInitialMessages,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-30 flex flex-col w-72 h-full bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <button 
            className="flex items-center gap-2 px-3 py-2 w-full text-sm font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors shadow-sm"
            onClick={() => {
              setMessages(customInitialMessages);
              stop(); // stop any ongoing generation when resetting
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
          >
            <PlusIcon className="w-4 h-4" />
            New Chat
          </button>
          <button 
            className="md:hidden p-2 ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 pb-2 pt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tools</div>
          <Link href="/" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors font-medium">
            <MessageIcon className="w-4 h-4" />
            <span className="truncate">Chat Assistant</span>
          </Link>
          <Link href="/jd" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <svg className="w-4 h-4 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
            <span className="truncate">JD Generator</span>
          </Link>
          <Link href="/ats" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <TargetIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">ATS Matcher</span>
          </Link>
          <Link href="/resume" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <FileTextIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Resume Builder</span>
          </Link>

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent</div>
          {/* History Item Placeholder */}
          <div className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <MessageIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">UI Design Best Practices</span>
          </div>
          <div className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <MessageIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">React State Management</span>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-zinc-900">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
          <button 
            className="p-2 -ml-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-lg md:hidden transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-lg tracking-tight">AI Assistant</h1>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 mb-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message: any) => (
              <div 
                key={message.id} 
                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div 
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full shadow-sm ${
                    message.role === "user" 
                      ? "bg-blue-600 text-white" 
                      : "bg-emerald-600 dark:bg-emerald-500 text-white"
                  }`}
                >
                  {message.role === "user" ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
                </div>
                
                <div 
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div 
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === "user" 
                        ? "bg-blue-600 text-white rounded-tr-sm" 
                        : "bg-zinc-100 dark:bg-zinc-800 h-[fit-content] text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-700 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {message.content}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 mx-1 font-medium">
                    {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm">
                  <BotIcon className="w-5 h-5" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-300 dark:border-zinc-700 p-2 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Customer Support AI..."
              className="w-full max-h-36 min-h-[44px] bg-transparent resize-none outline-none px-3 py-2.5 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="mb-1 p-2.5 rounded-xl bg-blue-600 text-white disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 shadow-sm hover:bg-blue-700 transition-all flex-shrink-0 active:scale-95"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
            AI Assistant can make mistakes. Consider verifying important information.
          </p>
        </div>
      </main>
    </div>
  );
}
