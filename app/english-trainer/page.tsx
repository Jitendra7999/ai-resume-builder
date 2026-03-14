"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageCircle, BookOpen, Volume2, Sparkles, AlertCircle, RefreshCw, Languages, Loader2, Menu } from 'lucide-react';
import { useSidebar } from '@/components/SidebarContext';

type VocabWord = {
  word: string;
  meaning: string;
  hindiMeaning: string;
  pronunciation: string;
  example: string;
};

type TurnResponsePayload = {
  reply: string;
  correction: string | null;
  explanation: string | null;
  betterVersion: string | null;
  vocabulary: VocabWord[];
  newQuestion: string;
};

interface Message {
  role: "user" | "assistant";
  content: string;
  analysis?: TurnResponsePayload;
}

export default function EnglishTrainer() {
  const [history, setHistory] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your AI English Trainer. Let's practice your communication skills. Could you please introduce yourself and tell me what you like to do?",
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const endOfChatRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  useEffect(() => {
    // Scroll to latest message
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

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
         if (isRecording) {
            try { recognition.start(); } catch(e){}
         }
      };

      recognitionRef.current = recognition;
    }

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
       if (recognitionRef.current) recognitionRef.current.stop();
       if (synthRef.current) synthRef.current.cancel();
    }
  }, []);

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-US') || v.name.includes('Google') || v.name.includes('Siri')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.9; // Speak slightly slower for English learners
      utterance.pitch = 1.0;
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel();
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const newUserMsg: Message = { role: 'user', content: text };
    const updatedHistory = [...history, newUserMsg];
    setHistory(updatedHistory);
    setInput('');
    setTranscript('');
    stopSpeaking();
    setIsProcessing(true);

    try {
      const simplifiedHistory = updatedHistory.map(h => ({ role: h.role, content: h.content }));
      
      const response = await fetch('/api/english-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: simplifiedHistory
        })
      });

      if (!response.ok) throw new Error('Failed to connect to trainer');
      
      const data: TurnResponsePayload = await response.json();
      
      const assistantMessage = `${data.reply}\n\n${data.newQuestion}`;
      
      setHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: assistantMessage,
          analysis: data 
        }
      ]);
      
      speak(assistantMessage);

    } catch (error) {
      console.error(error);
      alert('Error fetching feedback from AI Trainer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);

      if (transcript.trim() !== '') {
        handleSend(transcript);
      }
    } else {
      stopSpeaking();
      setTranscript('');
      
      if (recognitionRef.current) {
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

        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Your browser does not support Speech Recognition. Try using Google Chrome.");
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSend(input);
    }
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
          <Languages className="w-5 h-5 text-indigo-500" />
          <h1 className="font-semibold text-lg tracking-tight">English Trainer</h1>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-69px)] md:h-screen bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
         
         <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-4 md:p-8 scroll-smooth pb-32">
            
            <header className="mb-10 text-center mt-6 animate-in slide-in-from-top-6 duration-700 fade-in">
              <div className="inline-block p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 mb-4 shadow-sm border border-indigo-200 dark:border-indigo-800/80">
                <Languages className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                AI English <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Trainer</span>
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                Improve your speaking, fix grammar mistakes, and learn new vocabulary with a friendly AI coach.
              </p>
            </header>

            <div className="space-y-6">
              {history.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Chat Bubble */}
                    <div className={`rounded-3xl p-5 shadow-md ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/20' 
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex justify-between items-center mb-3 text-indigo-500">
                          <div className="flex items-center gap-2">
                             <MessageCircle className="w-4 h-4" />
                             <span className="text-xs font-bold uppercase tracking-wider">Coach</span>
                          </div>
                          {idx !== 0 && (
                            <button onClick={() => speak(msg.content)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-indigo-500">
                               <Volume2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap text-[15.5px]">{msg.content}</p>
                    </div>

                    {/* AI Feedback Analysis Cards (Only for assistant messages that have an analysis payload) */}
                    {msg.analysis && (
                      <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        
                        {/* Grammar Correction Card */}
                        {(msg.analysis.correction || msg.analysis.betterVersion) && (
                          <div className="bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-5 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-orange-900 dark:text-orange-300 mb-3 border-b border-orange-200 dark:border-orange-900/50 pb-2">
                              <AlertCircle className="w-4 h-4" />
                              Sentence Correction
                            </h3>
                            
                            {msg.analysis.correction && (
                              <div className="mb-4">
                                <span className="text-xs font-bold uppercase text-orange-600/70 dark:text-orange-400/70 block mb-1">Mistake Fixed</span>
                                <p className="text-orange-900 dark:text-orange-200 font-medium">✨ {msg.analysis.correction}</p>
                                <p className="text-sm text-orange-800/80 dark:text-orange-300/80 mt-1 italic">{msg.analysis.explanation}</p>
                              </div>
                            )}

                            {msg.analysis.betterVersion && (
                              <div>
                                <span className="text-xs font-bold uppercase text-orange-600/70 dark:text-orange-400/70 block mb-1">Make it Sound Native</span>
                                <p className="text-orange-900 dark:text-orange-200 font-medium flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  {msg.analysis.betterVersion}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vocabulary Card */}
                        {msg.analysis.vocabulary && msg.analysis.vocabulary.length > 0 && (
                          <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 shadow-sm md:col-span-2 lg:col-span-1">
                            <h3 className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 mb-3 border-b border-emerald-200 dark:border-emerald-900/50 pb-2">
                              <BookOpen className="w-4 h-4" />
                              Daily Vocabulary
                            </h3>
                            <div className="space-y-4">
                              {msg.analysis.vocabulary.map((v, i) => (
                                <div key={i} className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                                   <div className="flex items-baseline gap-2 mb-1">
                                     <span className="font-bold text-emerald-800 dark:text-emerald-400 text-lg">{v.word}</span>
                                     <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono">/{v.pronunciation}/</span>
                                   </div>
                                   <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                                     <strong>En:</strong> {v.meaning} <br/>
                                     <strong>Hi:</strong> <span className="text-emerald-700 dark:text-emerald-400">{v.hindiMeaning}</span>
                                   </p>
                                   <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">" {v.example} "</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Live Transcript View */}
              {(isRecording && transcript) && (
                <div className="flex w-full justify-end animate-in fade-in duration-300">
                  <div className="max-w-[85%] rounded-2xl p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-tr-sm italic text-[15px] opacity-80">
                    {transcript} <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}

              {/* Loader */}
              {isProcessing && (
                <div className="flex w-full justify-start animate-in fade-in duration-300">
                  <div className="max-w-[80%] rounded-2xl p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Coach is reviewing your sentence...</span>
                  </div>
                </div>
              )}

              <div ref={endOfChatRef} className="h-4" />
            </div>
         </div>
         
         {/* Input Box Footer */}
         <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-4 py-4 md:px-8 w-full shrink-0 sticky bottom-0">
           <div className="max-w-5xl mx-auto flex gap-3 relative">
             
             {/* Text Input */}
             <form onSubmit={handleFormSubmit} className="flex-1 flex gap-3">
               <input
                 type="text"
                 value={isRecording ? transcript : input}
                 onChange={(e) => setInput(e.target.value)}
                 disabled={isRecording || isProcessing}
                 className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all dark:text-zinc-100 placeholder:text-zinc-400 disabled:opacity-60"
                 placeholder={isRecording ? "Listening to you speak..." : "Type your message in English..."}
               />
               <button 
                 type="submit"
                 disabled={(!input.trim() && !transcript.trim()) || isProcessing}
                 className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-full h-14 w-14 flex items-center justify-center transition-all shadow-md active:scale-95 flex-shrink-0"
               >
                 <Send className="w-5 h-5" />
               </button>
             </form>
             
             {/* Mic Button */}
             <button
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`relative rounded-full h-14 w-14 flex items-center justify-center transition-all shadow-md active:scale-95 flex-shrink-0 z-10 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40' 
                    : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                }`}
                title="Speak your answer"
             >
                {isRecording && <div className="absolute inset-[-4px] rounded-full border-[3px] border-red-400 animate-ping opacity-50"></div>}
                {isRecording ? <MicOff className="w-5 h-5 relative" /> : <Mic className="w-5 h-5 relative" />}
             </button>
           </div>
           
           <div className="text-center mt-3 text-xs text-zinc-400 dark:text-zinc-500">
             Try answering the Coach's question out loud using the microphone button for the best practice.
           </div>
         </div>
      </div>
    </>
  );
}
