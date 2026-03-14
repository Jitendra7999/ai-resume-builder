"use client";

import React, { useState } from "react";
import { useCompletion } from "ai/react";
import { useSidebar } from "@/components/SidebarContext";

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

// Simple markdown renderer for ATS Report
const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-4">{line.replace('# ', '')}</h1>;
        } else if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-3">{line.replace('## ', '')}</h2>;
        } else if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="text-zinc-400 mt-1.5 text-[10px]">●</span>
              <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {renderBoldText(line.substring(2))}
              </p>
            </div>
          );
        } else if (line.trim() === '') {
          return <div key={i} className="h-2"></div>;
        } else {
          return <p key={i} className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{renderBoldText(line)}</p>;
        }
      })}
    </div>
  );
};

// Helper to make **text** bold
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};


export default function ATSMatcherApp() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  
  // Form State
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [copied, setCopied] = useState(false);

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/ats",
  });

  const checkATS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription || !resumeFile) return;

    const reader = new FileReader();
    reader.readAsDataURL(resumeFile);
    reader.onload = () => {
      const base64 = reader.result as string;
      complete("Analyze", { body: { jd: jobDescription, resumeBase64: base64 } });
    };
  };

  const copyToClipboard = () => {
    if (!completion) return;
    navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const demoJD = "Seeking a Senior Frontend React Developer with 5+ years of experience in React, Next.js, and TypeScript. Must have strong fundamentals in web performance and UI/UX best practices.";
  
  // A tiny valid PDF base64 string to simulate "Demo Resume"
  const demoPdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLY30jE2UjIyMTUwM9QxNLY2UdHJKU/PT05WMlDIySzwzCzSSKyozUwvycxTyCjLTFVLy8oFCAwA/4xKjCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNTEKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1LjI3NiA4NDEuODkdfS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L0NvbnRlbnRzIDIgMCBSL1BhcmVudCA2IDAgUj4+CmVuZG9iagoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCgo2IDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1s0IDAgUl0vQ291bnQgMT4+CmVuZG9iagoKNyAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNiAwIFI+PgplbmRvYmoKCjggMCBvYmoKPDwvUHJvZHVjZXIoanNQREYgMi41LjEpL0NyZWF0aW9uRGF0ZShEMjAyMzA3MDUxMjQ0MjArMDAnMDAnKT4+CmVuZG9iagoKeHJlZgowIDkKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAxMzQgMDAwMDAgbiAKMDAwMDAwMDE1MiAwMDAwMCBuIAowMDAwMDAwMjM5IDAwMDAwIG4gCjAwMDAwMDAzMzggMDAwMDAgbiAKMDAwMDAwMDQyNiAwMDAwMCBuIAowMDAwMDAwNDgzIDAwMDAwIG4gCjAwMDAwMDA1MzIgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDkvUm9vdCA3IDAgUi9JbmZvIDggMCBSPj4Kc3RhcnR4cmVmCjYzNAolJUVPRg==";
  
  const loadDemo = () => {
    setJobDescription(demoJD);
    const byteCharacters = atob(demoPdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'application/pdf'});
    const file = new File([blob], "demo_frontend_resume.pdf", { type: 'application/pdf' });
    setResumeFile(file);
  };

  return (
    <>
      {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0 h-[69px]">
          <button 
            className="p-2 -ml-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-lg md:hidden transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <TargetIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
            <h1 className="font-semibold text-lg tracking-tight">ATS Matcher</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
            
            {/* Form Column */}
            <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Review Match</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Paste Job Description and your Resume to get ATS score & feedback.</p>
              </div>

              <form onSubmit={checkATS} className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col min-h-[150px]">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                    placeholder="Paste the target Job Description here..."
                    className="flex-1 w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 resize-none"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-[150px]">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                    Your Resume (PDF) <span className="text-red-500">*</span>
                  </label>
                  <label 
                    className={`flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-3 py-6 transition-all ${
                      resumeFile 
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10" 
                        : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer"
                    }`}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                        }
                      }}
                    />
                    {resumeFile ? (
                      <div className="flex flex-col items-center text-indigo-600 dark:text-indigo-400">
                        <DocumentIcon className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium text-center line-clamp-1 max-w-[200px]">{resumeFile.name}</span>
                        <span className="text-xs mt-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">Change File</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500 dark:text-zinc-400">
                        <svg className="w-8 h-8 mb-2 opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        <span className="text-sm font-medium">Click to upload PDF</span>
                        <span className="text-xs mt-1">Max 10MB</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading || !jobDescription || !resumeFile}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <TargetIcon className="w-4 h-4" />
                        Check ATS Match
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Document Preview Column */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <DocumentIcon className="w-4 h-4 text-zinc-400" />
                  ATS Report
                </div>
                {completion && (
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm transition-colors"
                  >
                    {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-[#1C1C1E]">
                {completion ? (
                  <div className="max-w-2xl mx-auto">
                    <MarkdownRenderer content={completion} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                      <TargetIcon className="w-8 h-8 opacity-50 text-indigo-500/50" />
                    </div>
                    <p className="text-sm">Your ATS match score and analysis will appear here.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
    </>
  );
}
