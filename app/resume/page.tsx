"use client";

import React, { useState, useRef } from "react";
import { useCompletion } from "ai/react";
import Link from "next/link";

// --- Icons ---
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

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
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

const CopyIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

// Simple markdown renderer for ATS Report
const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-zinc-900 mt-6 mb-2 border-b-2 border-zinc-200 pb-1">{line.replace('# ', '')}</h1>;
        } else if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-zinc-900 mt-4 mb-2 uppercase tracking-wide text-blue-800">{line.replace('## ', '')}</h2>;
        } else if (line.startsWith('### ')) {
          return <h3 key={i} className="text-md font-bold text-zinc-800 mt-3 mb-1">{renderInlineStyles(line.replace('### ', ''))}</h3>;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1">
              <span className="text-zinc-600 mt-1.5 text-[10px]">●</span>
              <p className="text-[14px] leading-relaxed text-zinc-800">
                {renderInlineStyles(line.substring(2))}
              </p>
            </div>
          );
        } else if (line.trim() === '') {
          return <div key={i} className="h-1"></div>;
        } else {
          return <p key={i} className="text-[14px] leading-relaxed text-zinc-800">{renderInlineStyles(line)}</p>;
        }
      })}
    </div>
  );
};

// Helper to make **text** bold and parse [links](url)
const renderInlineStyles = (text: string) => {
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
    }
    
    // Process links in the remaining non-bold text
    const linkParts = part.split(/(\[.*?\]\(.*?\))/g);
    return linkParts.map((linkPart, j) => {
      const match = linkPart.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a 
            key={`${i}-${j}`} 
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-600 hover:text-orange-800 underline decoration-orange-300 underline-offset-2"
          >
            {match[1]}
          </a>
        );
      }
      return linkPart;
    });
  });
};


export default function ResumeBuilderApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Form State
  const [jd, setJd] = useState("");
  const [personalDetails, setPersonalDetails] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [projects, setProjects] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/resume",
  });

  const generateResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd) return;

    complete("Generate", { body: { jd, personalDetails, experience, education, projects } });
  };

  const copyToClipboard = () => {
    if (!completion) return;
    navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const copyForWordDoc = async () => {
    if (!contentRef.current) return;
    try {
      // Create a blob with the HTML content for rich text pasting into Word/Docs
      const htmlContent = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.5;">${contentRef.current.innerHTML}</div>`;
      
      const blobHtml = new Blob([htmlContent], { type: "text/html" });
      const blobText = new Blob([completion], { type: "text/plain" });
      
      const data = [new ClipboardItem({
          "text/plain": blobText,
          "text/html": blobHtml,
      })];
      
      await navigator.clipboard.write(data);
      setCopiedDoc(true);
      setTimeout(() => setCopiedDoc(false), 2000);
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
      // Fallback
      copyToClipboard();
    }
  };

  const loadDemo = () => {
    setJd("Frontend Developer needed (React, Next.js, Typescript). Focus on strong UI/UX, responsive layouts, and performance optimization.");
    setPersonalDetails("John Doe | j.doe@email.com | (555) 123-4567 | github.com/johndoe");
    setExperience("Web Developer at TechCorp (2021-2023): Built components, improved speed.\nJunior Dev at WebDev Inc (2019-2021): maintained website bugs.");
    setEducation("B.S. Computer Science, State University, 2019");
    setProjects("Portfolio Site: A personal portfolio made with Nextjs and Tailwind.\nE-commerce MVP: Built a small shopping site with React, integrated stripe.");
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
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
          <Link href="/resume" className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors font-medium">
            <FileTextIcon className="w-4 h-4" />
            <span className="truncate">Resume Builder</span>
          </Link>

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Templates</div>
          <div 
            onClick={loadDemo}
            className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-zinc-700 dark:text-zinc-300 font-medium"
          >
            <span className="truncate">Load Demo Details</span>
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
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-zinc-900 print:bg-white print:h-auto print:block">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0 h-[69px] print:hidden">
          <button 
            className="p-2 -ml-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-lg md:hidden transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-orange-600 dark:text-orange-500" />
            <h1 className="font-semibold text-lg tracking-tight">Smart Resume Builder</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950/50 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-full min-h-[600px] print:block print:min-h-0 print:w-full">
            
            {/* Form Column */}
            <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm overflow-y-auto max-h-[calc(100vh-120px)] hide-scrollbar print:hidden">
              <div className="mb-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Profile Details</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Fill out short descriptions; AI will expand them to match the JD!</p>
              </div>

              <form onSubmit={generateResume} className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Target Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    required
                    placeholder="Paste the target Job Description to align keywords..."
                    rows={3}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-400 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Personal Info & Links
                  </label>
                  <input 
                    value={personalDetails}
                    onChange={(e) => setPersonalDetails(e.target.value)}
                    placeholder="E.g. Jane Doe | email@mail.com | LinkedIn"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Work Experience (Short descriptions fine)
                  </label>
                  <textarea 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="E.g. Developer at Google (2020-2022). Fixed bugs and made site faster."
                    rows={3}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-400 resize-y"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Education & Certifications
                  </label>
                  <textarea 
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="E.g. B.S. CS, University Name. AWS Certified."
                    rows={2}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-400 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Projects (Include URLs if any) <span className="text-orange-500 text-xs mt-0.5">✨ AI Expanded</span>
                  </label>
                  <textarea 
                    value={projects}
                    onChange={(e) => setProjects(e.target.value)}
                    placeholder="E.g. Chatbot App (https://demo.com): Used React/Node."
                    rows={3}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-400 resize-y"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading || !jd}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Writing Resume...
                      </>
                    ) : (
                      <>
                        <FileTextIcon className="w-4 h-4" />
                        Generate Targeted Resume
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Document Preview Column */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px] print:border-none print:shadow-none print:bg-transparent print:overflow-visible print:block">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 print:hidden">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <FileTextIcon className="w-4 h-4 text-zinc-400" />
                  Your ATS Resume
                </div>
                
                {completion && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm transition-colors"
                      title="Copy raw text"
                    >
                      {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Text"}</span>
                    </button>

                    <button 
                      onClick={copyForWordDoc}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg shadow-sm transition-colors"
                      title="Copies rich text that preserves formatting when pasted into Microsoft Word or Google Docs"
                    >
                      {copiedDoc ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedDoc ? "Copied format!" : "Copy for Word / Docs"}</span>
                    </button>

                    <button 
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 bg-orange-600 border border-orange-700 rounded-lg shadow-sm transition-colors"
                      title="Download as PDF"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notice the bg-white constraint here to make the resume preview resemble a physical paper */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-100 dark:bg-zinc-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
                {completion ? (
                  <div 
                    ref={contentRef} 
                    className="bg-white text-black min-w-full lg:min-w-[650px] max-w-[800px] p-8 sm:p-12 shadow-md border border-zinc-200 print:max-w-none print:shadow-none print:border-none print:p-0 outline-none hover:shadow-lg focus:ring-2 focus:ring-orange-500/50 transition-shadow"
                    style={{ minHeight: '1000px' }} // Standard page height simulation
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    title="Click anywhere to edit the resume text"
                  >
                    <MarkdownRenderer content={completion} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 space-y-4 m-auto">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <FileTextIcon className="w-8 h-8 opacity-50 text-orange-500/50" />
                    </div>
                    <p className="text-sm">Your ATS-optimized resume will generate here.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        
        {/* Global style overrides */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Print optimizations */
          @page {
            margin: 0; /* Removes browser header/footer (date, url, title) */
          }
          @media print {
            body {
              margin: 1.5cm; /* Restores a professional margin for the resume content */
            }
          }
        `}} />
      </main>
    </div>
  );
}
