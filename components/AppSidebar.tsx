"use client";

import React from "react";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
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

const MicIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
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

const DocumentIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const JobsBoardIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const LanguageIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

export function AppSidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  return (
    <>
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-30 flex flex-col w-72 h-full bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out print:hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 h-[69px] shrink-0">
          <h2 className="font-semibold tracking-tight text-zinc-700 dark:text-zinc-300 pl-2">AI Tools</h2>
          <button 
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 pb-2 pt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tools</div>
          <Link href="/" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <MessageIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Chat Assistant</span>
          </Link>
          <Link href="/jd" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <DocumentIcon className="w-4 h-4 opacity-70" />
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
          <Link href="/interview" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <MicIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">AI Interview</span>
          </Link>
          <Link href="/topic-practice" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <TargetIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Topic Practice</span>
          </Link>
          <Link href="/interview-preparation" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <BookOpenIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Interview Prep</span>
          </Link>
          <Link href="/english-trainer" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <LanguageIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">English Trainer</span>
          </Link>

          <div className="px-3 pb-2 pt-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            Job Hunt v2
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full normal-case font-medium tracking-normal">New</span>
          </div>
          <Link href="/jobs" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <JobsBoardIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Job Board</span>
          </Link>
          <Link href="/apply" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <JobsBoardIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Auto Apply</span>
          </Link>
          <Link href="/tracker" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <TargetIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Job Tracker</span>
          </Link>
          <Link href="/email-hr" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <MessageIcon className="w-4 h-4 opacity-70" />
            <span className="truncate">Email HR</span>
          </Link>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 font-medium">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
