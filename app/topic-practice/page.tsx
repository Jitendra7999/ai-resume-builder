"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, BookOpen, Layers, Target, Play, Loader2, CheckCircle2, Award, ChevronRight, XCircle, Menu, Brain, Hash, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';
import { useSidebar } from '@/components/SidebarContext';

interface InterviewItem {
  question: string;
  answer: string;
  analysis: string;
}

interface Report {
  score: number;
  knowledgeLevel: string;
  strengths: string[];
  weaknesses: string[];
  suggestedTopics: string[];
  confidenceRating: string;
}

interface PracticeState {
  round: string;
  topic: string;
  level: string;
  history: InterviewItem[];
}

export default function TopicPractice() {
  const [topic, setTopic] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState(5);

  const [practiceState, setPracticeState] = useState<PracticeState>({
    round: 'Setup',
    topic: '',
    level: 'Intermediate',
    history: []
  });

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
         if (isRecording) {
            try { recognition.start(); } catch(e){}
         }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }

    // Cleanup when component unmounts
    return () => {
       if (recognitionRef.current) recognitionRef.current.stop();
       if (synthRef.current) synthRef.current.cancel();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [practiceState.history]);

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synthRef.current.getVoices();
      // Try finding a nice premium-sounding voice
      const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('Google') || v.name.includes('Siri')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel();
  };

  const getNextQuestion = async (updatedState: PracticeState) => {
    setIsProcessing(true);
    try {
      const conversationHistory = updatedState.history.flatMap(item => {
        const msgs = [{ role: 'ai', content: item.question }];
        if (item.answer) {
          msgs.push({ role: 'user', content: item.answer });
        }
        return msgs;
      });

      const response = await fetch('/api/topic-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: updatedState.topic,
          experienceLevel: updatedState.level,
          totalQuestions,
          conversationHistory
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();

      setPracticeState(prev => {
        const historyCopy = [...prev.history];
        
        // Add analysis to the last answered question
        if (data.analysis && historyCopy.length > 0) {
          const lastIndex = historyCopy.length - 1;
          historyCopy[lastIndex] = {
            ...historyCopy[lastIndex],
            analysis: data.analysis
          };
        }

        const newState = { ...prev, history: historyCopy };

        if (data.isCompleted) {
          newState.round = 'Completed';
          setReport(data.report);
          speak("Interview session completed. Generating your feedback report now.");
        } else if (data.nextQuestion) {
          newState.history.push({
            question: data.nextQuestion,
            answer: '',
            analysis: ''
          });
          speak(data.nextQuestion);
        }

        return newState;
      });
    } catch (error) {
      console.error(error);
      alert('Error fetching the next question from AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startPractice = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic to practice.");
      return;
    }
    const initialState: PracticeState = {
      round: 'topic-practice',
      topic,
      level: experienceLevel,
      history: []
    };
    setPracticeState(initialState);
    await getNextQuestion(initialState);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);

      if (transcript.trim() !== '') {
        stopSpeaking();
        
        // Save the user's transcript as an answer and trigger the next step
        setPracticeState(prev => {
          const newHistory = [...prev.history];
          const lastIndex = newHistory.length - 1;
          if (lastIndex >= 0) {
            newHistory[lastIndex] = { ...newHistory[lastIndex], answer: transcript };
          }
          const updatedState = { ...prev, history: newHistory };
          
          Object.assign(window, { __pendingState: updatedState }); // Temporary async workaround
          return updatedState;
        });

        // Small timeout to allow state to settle
        setTimeout(() => {
            const pendingState = (window as any).__pendingState;
            if(pendingState) {
                getNextQuestion(pendingState);
                delete (window as any).__pendingState;
            }
        }, 50);
        
        setTranscript('');
      } else {
         // Empty transcript, nothing to send
         alert("Could not catch what you said. Please try again.");
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
          // If already started or another error
          console.error(e);
        }
      } else {
        alert("Your browser does not support Speech Recognition. Try using Google Chrome.");
      }
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
          <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="font-semibold text-lg tracking-tight">Practice Interview</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
        <div className="max-w-5xl mx-auto p-6 lg:p-12 mb-10">
          <header className="mb-10 text-center">
            <div className="inline-block p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4 shadow-sm border border-indigo-200 dark:border-indigo-800">
              <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
              Topic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Practice</span>
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Master any subject with a specialized AI interviewer. Select a topic and experience level to begin answering voice questions dynamically adapted to you.
            </p>
          </header>

          {practiceState.round === 'Setup' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 dark:shadow-none p-8 border border-zinc-200 dark:border-zinc-800/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                <Target className="w-6 h-6 mr-3 text-indigo-500" />
                Configure Practice Session
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Topic Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                      placeholder="e.g. JavaScript, System Design, GraphQL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Experience Level</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Layers className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                       </div>
                       <select
                         value={experienceLevel}
                         onChange={(e) => setExperienceLevel(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none appearance-none"
                       >
                         <option value="Beginner">Beginner</option>
                         <option value="Intermediate">Intermediate</option>
                         <option value="Advanced">Advanced</option>
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
                         className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none appearance-none"
                       >
                         <option value={5}>5 Questions</option>
                         <option value={10}>10 Questions</option>
                         <option value={15}>15 Questions</option>
                       </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startPractice}
                  disabled={isProcessing}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center group"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2 fill-current group-hover:translate-x-1 transition-transform" />
                      Start Practice
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {practiceState.round === 'topic-practice' && (
            <div className="flex flex-col h-[750px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-indigo-900/10 border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
              
              {/* Top Banner indicating progress */}
              <div className="px-6 py-4 bg-zinc-900 dark:bg-zinc-950 text-white flex justify-between items-center z-10 border-b border-zinc-800">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-60"></div>
                  </div>
                  <span className="font-semibold text-sm tracking-wider uppercase text-zinc-300">
                    {practiceState.topic} • {practiceState.level}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm font-medium px-4 py-1.5 bg-zinc-800 dark:bg-zinc-800/50 rounded-full border border-zinc-700">
                   <Target className="w-4 h-4 text-indigo-400" />
                   <span>Question {practiceState.history.length} of {totalQuestions}</span>
                </div>
              </div>

              {/* Chat View Layout */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-800/20 scroll-smooth">
                {practiceState.history.map((item, idx) => (
                  <div key={idx} className="space-y-6">
                    {/* AI Question */}
                    <div className="flex w-full justify-start">
                      <div className="max-w-[85%] rounded-2xl p-5 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-tl-sm animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center space-x-2 mb-2 text-indigo-600 dark:text-indigo-400">
                          <Brain className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-wider">AI Interviewer</span>
                        </div>
                        <p className="leading-relaxed text-[16px] text-zinc-800 dark:text-zinc-200">{item.question}</p>
                      </div>
                    </div>

                    {/* User Answer */}
                    {item.answer && (
                      <div className="flex w-full justify-end">
                        <div className="max-w-[85%] rounded-2xl p-5 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-sm animate-in fade-in slide-in-from-right-4 duration-300">
                           <p className="leading-relaxed text-[15px]">{item.answer}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Analysis of the user's answer */}
                    {item.analysis && (
                      <div className="flex w-full justify-center my-4 animate-in fade-in duration-700">
                        <div className="max-w-[90%] rounded-xl px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 shadow-inner flex flex-col items-center text-center">
                           <div className="flex items-center space-x-2 mb-2 text-blue-600 dark:text-blue-400">
                             <Award className="w-4 h-4" />
                             <span className="text-xs font-bold uppercase tracking-wider">Feedback on Response</span>
                           </div>
                           <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed italic">
                             "{item.analysis}"
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Live Transcript View */}
                {isRecording && transcript && (
                  <div className="flex w-full justify-end">
                    <div className="max-w-[85%] rounded-2xl p-5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-tr-sm italic text-sm opacity-90">
                      {transcript} <span className="animate-pulse font-bold ml-1">...</span>
                    </div>
                  </div>
                )}

                {/* AI Loading State */}
                {isProcessing && (
                  <div className="flex w-full justify-start mt-6">
                    <div className="max-w-[80%] rounded-2xl p-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm shadow-sm flex items-center space-x-3">
                      <div className="relative">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <div className="absolute inset-0 w-6 h-6 border-2 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
                      </div>
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium text-sm animate-pulse">
                        Evaluating & generating next question...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={endOfChatRef} className="h-8" />
              </div>

              {/* Bot Control Panel */}
              <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-center relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl ${isRecording
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/40 border-4 border-rose-300 dark:border-rose-900'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/40 border-4 border-indigo-300 dark:border-indigo-900'
                    } group disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
                >
                  {isRecording && <div className="absolute inset-[-12px] rounded-full border-[6px] border-rose-400 animate-ping opacity-30"></div>}
                  {isRecording ? (
                    <MicOff className="w-10 h-10 text-white relative z-10" />
                  ) : (
                    <Mic className="w-10 h-10 text-white relative z-10" />
                  )}
                </button>
                <div className="mt-5 text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                  {isProcessing ? (
                     "Processing round input..."
                  ) : isRecording ? (
                     <span className="text-rose-500 dark:text-rose-400 flex items-center justify-center">
                       <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-2"></span>
                       Listening... Tap to submit answer
                     </span>
                  ) : (
                     <span className="text-indigo-600 dark:text-indigo-400">Tap microphone to answer</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {practiceState.round === 'Completed' && report && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl shadow-zinc-200/20 dark:shadow-none p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/30">
                  <Award className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">Practice Complete!</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto">
                  Excellent work practicing the <span className="font-semibold text-zinc-700 dark:text-zinc-300">{topic}</span> topic. Here is a detailed breakdown of your performance.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-zinc-800/80 dark:to-zinc-900 rounded-3xl p-6 border border-indigo-100 dark:border-zinc-700 text-center flex flex-col justify-center">
                  <BarChart3 className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                  <span className="text-indigo-900/60 dark:text-indigo-400 font-semibold mb-1 uppercase tracking-wide text-xs">Final Score</span>
                  <div className="text-5xl font-black text-indigo-600 dark:text-indigo-300">
                    {report.score}<span className="text-2xl text-indigo-300 dark:text-indigo-600">/10</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-b from-purple-50 to-white dark:from-zinc-800/80 dark:to-zinc-900 rounded-3xl p-6 border border-purple-100 dark:border-zinc-700 text-center flex flex-col justify-center">
                  <Brain className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                  <span className="text-purple-900/60 dark:text-purple-400 font-semibold mb-1 uppercase tracking-wide text-xs">Knowledge Level</span>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-300 leading-tight">
                    {report.knowledgeLevel}
                  </div>
                </div>
                
                <div className="bg-gradient-to-b from-pink-50 to-white dark:from-zinc-800/80 dark:to-zinc-900 rounded-3xl p-6 border border-pink-100 dark:border-zinc-700 text-center flex flex-col justify-center">
                  <ShieldCheck className="w-8 h-8 text-pink-500 mx-auto mb-3" />
                  <span className="text-pink-900/60 dark:text-pink-400 font-semibold mb-1 uppercase tracking-wide text-xs">Confidence Rating</span>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-300 leading-tight">
                    {report.confidenceRating}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-green-50/50 dark:bg-green-900/10 rounded-3xl p-6 border border-green-100 dark:border-green-900/30">
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-300 flex items-center mb-5">
                    <span className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 flex items-center justify-center mr-3">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    Key Strengths
                  </h3>
                  <ul className="space-y-4">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start text-green-800/80 dark:text-green-200/80">
                        <ChevronRight className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50/50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-300 flex items-center mb-5">
                    <span className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 flex items-center justify-center mr-3">
                      <XCircle className="w-5 h-5" />
                    </span>
                    Areas to Review
                  </h3>
                  <ul className="space-y-4">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start text-red-800/80 dark:text-red-200/80">
                        <ChevronRight className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested Topics Full width */}
              <div className="bg-blue-50/50 dark:bg-zinc-800/50 rounded-3xl p-6 border border-blue-100 dark:border-zinc-700">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 flex items-center mb-5">
                    <span className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center mr-3">
                      <TrendingUp className="w-5 h-5" />
                    </span>
                    Suggested Topics to Master Next
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {report.suggestedTopics.map((topic, i) => (
                      <div key={i} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm">
                        {topic}
                      </div>
                    ))}
                  </div>
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-2xl shadow-zinc-900/20 active:scale-[0.98] group"
                >
                  <span className="flex items-center justify-center">
                    <Target className="w-5 h-5 mr-2 group-hover:rotate-45 transition-transform" />
                    Start Another Topic
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
