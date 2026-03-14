"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Briefcase, Link as LinkIcon, Building2, Play, Loader2, CheckCircle2, Award, ChevronRight, XCircle, Menu } from 'lucide-react';
import { useSidebar } from '@/components/SidebarContext';

type Role = 'ai' | 'user';
type Round = 'Screening' | 'Technical' | 'Coding' | 'Completed' | 'Setup';

interface Message {
  role: Role;
  content: string;
}

interface Report {
  score: number;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: string;
}

export default function AIInterviewAssistant() {
  const [jobDescription, setJobDescription] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [position, setPosition] = useState('');

  const [currentRound, setCurrentRound] = useState<Round>('Setup');
  const [history, setHistory] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscriptChunk = '';
      
      recognition.onresult = (event: any) => {
        let interimTranscriptChunk = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptChunk += event.results[i][0].transcript;
          } else {
            interimTranscriptChunk += event.results[i][0].transcript;
          }
        }
        
        setTranscript(finalTranscriptChunk + interimTranscriptChunk);
      };

      recognition.onend = () => {
         // Optionally handle when the speech engine auto-disconnects due to silence
         if (isRecording) {
            recognition.start(); // auto-restart if they are still supposed to be recording
         }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    // Setup Speech Synthesis
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    // scroll to bottom
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);

      // Select a nice premium voice if available
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('Google') || v.name.includes('Siri')) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const getNextQuestion = async (updatedHistory: Message[]) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          companyUrl,
          position,
          history: updatedHistory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch next question');
      }

      const data = await response.json();

      if (data.isCompleted) {
        setCurrentRound('Completed');
        setReport(data.report);
        const finalMessage = "The interview has concluded. I am now generating your report.";
        speak(finalMessage);
        setHistory(prev => [...prev, { role: 'ai', content: finalMessage }]);
      } else {
        setCurrentRound(data.currentRound);
        if (data.nextQuestion) {
          setHistory(prev => [...prev, { role: 'ai', content: data.nextQuestion }]);
          speak(data.nextQuestion);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to AI. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startInterview = async () => {
    if (!jobDescription || !position) {
      alert("Please provide the Job Description and Position.");
      return;
    }
    setCurrentRound('Screening');
    await getNextQuestion([]);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);

      if (transcript.trim() !== '') {
        const newMessage: Message = { role: 'user', content: transcript };
        const updatedHistory = [...history, newMessage];
        setHistory(updatedHistory);
        setTranscript('');

        // Stop any ongoing speech from AI and ask the next question
        stopSpeaking();
        getNextQuestion(updatedHistory);
      }
    } else {
      // Start recording
      stopSpeaking(); // Stop AI if it's currently speaking
      setTranscript('');
      
      if (recognitionRef.current) {
        // We re-initialize the event listeners locally here to refresh closing scope for finalTranscriptChunk per recording session
        let finalTranscriptChunk = '';
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscriptChunk = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscriptChunk += event.results[i][0].transcript;
            } else {
              interimTranscriptChunk += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscriptChunk + interimTranscriptChunk);
        };
        
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Your browser does not support Speech Recognition.");
      }
    }
  };

  return (
    <>
      {/* Universal Header (Mobile Toggle) */}
      <header className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0 h-[69px] md:hidden">
        <button
          className="p-2 -ml-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-lg transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-orange-600 dark:text-orange-500" />
          <h1 className="font-semibold text-lg tracking-tight">AI Interview Assistant</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
        <div className="max-w-4xl mx-auto p-6 lg:p-12 mb-10">
          {/* Header Section */}
          <header className="mb-10 text-center">
            <div className="inline-block p-4 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4 shadow-sm">
              <Award className="w-10 h-10 text-orange-600 dark:text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
              AI Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Assistant</span>
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Practice for your dream job with our intelligent, voice-enabled AI interviewer.
            </p>
          </header>

          {currentRound === 'Setup' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/10 dark:shadow-none p-8 border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-zinc-200 flex items-center">
                <Briefcase className="w-6 h-6 mr-3 text-orange-500 dark:text-orange-400" />
                Configure Interview
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Position / Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Company Website URL (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="https://company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
                    rows={6}
                    placeholder="Paste the full job description here..."
                  />
                </div>

                <button
                  onClick={startInterview}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Start Interview
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {(currentRound !== 'Setup' && currentRound !== 'Completed') && (
            <div className="flex flex-col h-[700px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-zinc-900 dark:bg-zinc-950 text-white flex justify-between items-center rounded-t-3xl border-b border-zinc-800 dark:border-zinc-700">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="font-semibold text-sm tracking-wider uppercase text-zinc-300 dark:text-zinc-400">
                    {currentRound} Round
                  </span>
                </div>
                <div className="text-xs font-medium px-3 py-1 bg-zinc-800 dark:bg-zinc-700 rounded-full text-zinc-300 dark:text-zinc-400">
                  {position}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-800/50 scroll-smooth">
                {history.map((msg, idx) => (
                  <div key={idx} className={`flex w-full ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${msg.role === 'ai'
                      ? 'bg-white text-black dark:text-black border border-zinc-200 dark:border-zinc-800 rounded-tl-sm'
                      : 'bg-orange-600 text-white rounded-tr-sm shadow-orange-500/20 shadow-lg'
                      }`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center space-x-2 mb-2 text-orange-600 dark:text-orange-500">
                          <Building2 className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">AI Interviewer</span>
                        </div>
                      )}
                      <p className="leading-relaxed text-[15px]">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {/* Transcript Preview */}
                {isRecording && transcript && (
                  <div className="flex w-full justify-end">
                    <div className="max-w-[80%] rounded-2xl p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 border border-orange-200 dark:border-orange-800 rounded-tr-sm italic text-sm opacity-80">
                      {transcript} <span className="animate-pulse">...</span>
                    </div>
                  </div>
                )}

                {/* Loader */}
                {isProcessing && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[80%] rounded-2xl p-5 bg-white border border-zinc-200 dark:border-zinc-800 rounded-tl-sm shadow-sm flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-600 dark:text-orange-500" />
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={endOfChatRef} />
              </div>

              {/* Footer Control */}
              <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl ${isRecording
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                    : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
                    } group disabled:opacity-50 disabled:hover:scale-100`}
                >
                  {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-40"></div>}
                  {isRecording ? (
                    <MicOff className="w-8 h-8 text-white relative z-10" />
                  ) : (
                    <Mic className="w-8 h-8 text-white relative z-10" />
                  )}
                </button>
                <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {isRecording ? "Listening... Click to send answer" : "Click to Start Answering"}
                </p>
              </div>
            </div>
          )}

          {currentRound === 'Completed' && report && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/10 dark:shadow-none p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in duration-500">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-6 shadow-xl shadow-green-500/30">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">Interview Completed!</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Here is a comprehensive breakdown of your performance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="col-span-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
                  <span className="text-zinc-500 dark:text-zinc-400 font-semibold mb-2 uppercase tracking-wide text-sm">Overall Score</span>
                  <div className="text-5xl font-black text-zinc-900 dark:text-zinc-100">
                    {report.score}<span className="text-2xl text-zinc-400 dark:text-zinc-500">/100</span>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 flex flex-col justify-center">
                  <span className="text-orange-600 dark:text-orange-500 font-semibold mb-2 uppercase tracking-wide text-sm">Recommendation</span>
                  <p className="text-xl font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                    {report.hiringRecommendation}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center mb-4">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    Key Strengths
                  </h3>
                  <ul className="space-y-3">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start text-zinc-700 dark:text-zinc-300">
                        <ChevronRight className="w-5 h-5 text-green-500 mr-1 flex-shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center mb-4">
                    <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                      <XCircle className="w-4 h-4" />
                    </span>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start text-zinc-700 dark:text-zinc-300">
                        <ChevronRight className="w-5 h-5 text-red-500 mr-1 flex-shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-12 text-center">
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-900/20 active:scale-[0.98]">
                  Start Another Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
