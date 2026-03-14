"use client";

import React, { useState } from 'react';
import { BookOpen, Layers, Hash, Play, Loader2, ChevronRight, ChevronLeft, CheckCircle2, Copy, FileCode2, Menu, ChevronDown, ListEnd } from 'lucide-react';
import { useSidebar } from '@/components/SidebarContext';

interface QuestionDetails {
  question: string;
  explanation: string;
  answer: string;
  example: string;
  followUps: string[];
}

interface PrepData {
  topic: string;
  level: string;
  questions: QuestionDetails[];
}

export default function InterviewPreparation() {
  const [topic, setTopic] = useState('JavaScript');
  const [experienceLevel, setExperienceLevel] = useState('Beginner (0–1 years)');
  const [totalQuestions, setTotalQuestions] = useState(5);

  const [isProcessing, setIsProcessing] = useState(false);
  const [prepData, setPrepData] = useState<PrepData | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<'answer' | 'example' | 'followUps' | null>('answer');
  const [copiedSection, setCopiedSection] = useState<'example' | null>(null);

  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  const generateContent = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic to prepare for.");
      return;
    }

    setIsProcessing(true);
    setPrepData(null);
    setCurrentQuestionIndex(0);
    setExpandedSection('answer');

    try {
      const response = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          experienceLevel,
          totalQuestions
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setPrepData(data);
    } catch (error) {
      console.error(error);
      alert('Error fetching interview prep materials.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection('example');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const nextQuestion = () => {
    if (prepData && currentQuestionIndex < prepData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setExpandedSection('answer');
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setExpandedSection('answer');
    }
  };

  const currentQ = prepData?.questions[currentQuestionIndex];

  const formatText = (text: string) => {
    if (!text) return '';
    return text.split(/\\n|\n/).join('\n').replace(/\\t/g, '  ');
  };

  const formatCodeDisplay = (code: string) => {
    if (!code) return '';
    let cleanCode = code
      .replace(/^```[a-z]*(\\n|\n)?/i, '<br>')
      .replace(/(\\n|\n)?```$/i, '<br>')
      .trim();
    return cleanCode.split(/\\n|\n/).join('<br>').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  };

  return (
    <>
      <header className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0 h-[69px] md:hidden">
        <button
          className="p-2 -ml-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-lg transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="font-semibold text-lg tracking-tight">Interview Prep</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
        <div className="max-w-5xl mx-auto p-6 lg:p-12 mb-10">

          <header className="mb-10 text-center">
            <div className="inline-block p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4 shadow-sm border border-emerald-200 dark:border-emerald-800">
              <BookOpen className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
              Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Preparation</span>
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Generate structured, high-quality interview content tailored to your exact tech stack and experience level.
            </p>
          </header>

          {!prepData && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl shadow-emerald-500/5 dark:shadow-none p-8 md:p-10 border border-zinc-200 dark:border-zinc-800/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                Configure Study Session
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Topic Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileCode2 className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
                      placeholder="e.g. JavaScript, React, System Design, GraphQL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Experience Level</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Layers className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none appearance-none"
                      >
                        <option value="Beginner (0–1 years)">Beginner (0–1 years)</option>
                        <option value="Intermediate (2–3 years)">Intermediate (2–3 years)</option>
                        <option value="Advanced (4+ years)">Advanced (4+ years)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Questions Count</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <select
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(Number(e.target.value))}
                        className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none appearance-none"
                      >
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={20}>20 Questions</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateContent}
                  disabled={isProcessing}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center group"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2 fill-current group-hover:translate-x-1 transition-transform" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {prepData && currentQ && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 shadow-sm">
                    {prepData.topic}
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm text-sm font-semibold">
                    {prepData.level}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 text-sm shadow-sm border border-zinc-200 dark:border-zinc-800">
                  Question <span className="text-zinc-900 dark:text-zinc-100">{currentQuestionIndex + 1}</span> of {prepData.questions.length}
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden">

                {/* Main Question & Explanation */}
                <div className="p-8 md:p-10 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6 leading-tight">
                    {currentQ.question}
                  </h2>
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 mb-2">Explanation</h3>
                    <p 
                      className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: formatText(currentQ.explanation) }}
                    />
                  </div>
                </div>

                {/* Answer Section */}
                <div className="px-8 md:px-10 py-6 border-b border-zinc-100 dark:border-zinc-800/80">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'answer' ? null : 'answer')}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                      Ideal Answer
                    </h3>
                    <ChevronDown className={`w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-transform ${expandedSection === 'answer' ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedSection === 'answer' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p 
                        className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: formatText(currentQ.answer) }}
                      />
                    </div>
                  )}
                </div>

                {/* Example / Code Section */}
                {currentQ.example && (
                  <div className="px-8 md:px-10 py-6 border-b border-zinc-100 dark:border-zinc-800/80">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'example' ? null : 'example')}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
                        <FileCode2 className="w-5 h-5 text-blue-500 mr-2" />
                        Example
                      </h3>
                      <ChevronDown className={`w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-transform ${expandedSection === 'example' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'example' && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 relative group rounded-xl shadow-inner border border-zinc-800 overflow-hidden bg-[#0d1117]">
                        <div className="flex bg-zinc-900/80 px-4 py-2.5 text-xs font-mono text-zinc-400 border-b border-zinc-800 items-center justify-between">
                          <span>Code Snippet</span>
                        </div>
                        <div className="absolute right-2 top-1.5 z-10">
                          <button
                            onClick={() => handleCopyCode(formatCodeDisplay(currentQ.example))}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Copy code"
                          >
                            {copiedSection === 'example' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <pre className="p-5 overflow-auto m-0">
                          <code 
                            className="block text-[14px] text-zinc-300 font-mono leading-[1.6]" 
                            style={{ tabSize: 2 }}
                            dangerouslySetInnerHTML={{ __html: formatCodeDisplay(currentQ.example) }}
                          />
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-ups Section */}
                {currentQ.followUps && currentQ.followUps.length > 0 && (
                  <div className="px-8 md:px-10 py-6">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'followUps' ? null : 'followUps')}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
                        <ListEnd className="w-5 h-5 text-purple-500 mr-2" />
                        Follow-up Questions
                      </h3>
                      <ChevronDown className={`w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-transform ${expandedSection === 'followUps' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'followUps' && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ul className="space-y-3">
                          {currentQ.followUps.map((fu, idx) => (
                            <li key={idx} className="flex items-start text-zinc-600 dark:text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2 mr-3" />
                              <span className="leading-relaxed">{fu}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 rounded-xl font-semibold flex items-center transition-all 
                    disabled:opacity-40 disabled:cursor-not-allowed
                    bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Previous
                </button>

                {currentQuestionIndex === prepData.questions.length - 1 ? (
                  <button
                    onClick={() => {
                      setPrepData(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-xl font-semibold flex items-center transition-all bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/20 active:scale-[0.98]"
                  >
                    Finish Session
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-3 rounded-xl font-semibold flex items-center transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
                  >
                    Next Question
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentQuestionIndex + 1) / prepData.questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
