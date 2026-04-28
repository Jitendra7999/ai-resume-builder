'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase, Send, User, Mail, Phone, FileText, Zap,
  CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, RefreshCw, Eye, EyeOff
} from 'lucide-react';

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin: string;
  resumePath: string;
  experience: string;
  education: string;
  skills: string;
};

type LogEntry = {
  type: 'status' | 'captcha' | 'error' | 'done' | 'cover_letter';
  message?: string;
  step?: number;
  time: string;
};

const DUMMY_PROFILE: Profile = {
  firstName: 'Arjun',
  lastName: 'Sharma',
  email: 'test@gmail.com',
  phone: '+91 9876543210',
  linkedin: 'https://linkedin.com/in/arjun-sharma-dev',
  resumePath: '',
  experience: 'Full Stack Developer at Techstuff Pvt Ltd (Jan 2023 - Present). Built and deployed full stack web applications using React, Node.js, Next.js, MongoDB, NestJS.',
  education: 'B.Tech in Computer Science from RGPV Bhopal University (2017-2021)',
  skills: 'React, Next.js, Node.js, NestJS, MongoDB, TypeScript, TailwindCSS, PostgreSQL, Docker',
};

const ATS_COLORS: Record<string, string> = {
  greenhouse: 'bg-green-100 text-green-700 border-green-200',
  lever: 'bg-blue-100 text-blue-700 border-blue-200',
  workable: 'bg-violet-100 text-violet-700 border-violet-200',
  ashby: 'bg-rose-100 text-rose-700 border-rose-200',
  bamboohr: 'bg-orange-100 text-orange-700 border-orange-200',
  recruitee: 'bg-sky-100 text-sky-700 border-sky-200',
  smartrecruiters: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  generic: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ApplyContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile>(DUMMY_PROFILE);
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [generatingResume, setGeneratingResume] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [applying, setApplying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [done, setDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [captchaAlert, setCaptchaAlert] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [detectedATS, setDetectedATS] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  // Load from URL params (coming from Job Board) + profile
  useEffect(() => {
    localStorage.removeItem('apply_profile');
    setProfile(DUMMY_PROFILE);
    const url = searchParams.get('url');
    const title = searchParams.get('title');
    const company = searchParams.get('company');
    const description = searchParams.get('description');
    if (url) setJobUrl(url);
    if (title) setJobTitle(title);
    if (company) setCompanyName(company);
    if (description) setJobDescription(description);
  }, []);

  const saveProfile = (updated: Profile) => {
    setProfile(updated);
    localStorage.setItem('apply_profile', JSON.stringify(updated));
  };

  const set = (key: keyof Profile, val: string) => saveProfile({ ...profile, [key]: val });

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Detect ATS from URL
  const getATS = (url: string) => {
    if (url.includes('greenhouse.io')) return 'greenhouse';
    if (url.includes('lever.co')) return 'lever';
    if (url.includes('workable.com')) return 'workable';
    if (url.includes('ashbyhq.com')) return 'ashby';
    if (url.includes('bamboohr.com')) return 'bamboohr';
    if (url.includes('recruitee.com')) return 'recruitee';
    if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
    return 'generic';
  };

  useEffect(() => {
    if (jobUrl) setDetectedATS(getATS(jobUrl));
  }, [jobUrl]);

  // Generate resume from job description
  const generateResume = async () => {
    if (!jobDescription) return;
    setGeneratingResume(true);
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd: jobDescription,
          personalDetails: `${profile.firstName} ${profile.lastName} | ${profile.email} | ${profile.phone} | ${profile.linkedin}`,
          experience: profile.experience,
          education: profile.education,
          projects: '',
        }),
      });

      // Stream the response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          // Parse Vercel AI SDK stream format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                result += text;
              } catch { /* skip */ }
            }
          }
        }
      }
      setResumeContent(result);
      setShowResume(true);
    } catch {
      setResumeContent('Failed to generate resume.');
    } finally {
      setGeneratingResume(false);
    }
  };

  // Auto apply with SSE
  const handleApply = async () => {
    if (!jobUrl || !profile.email || !profile.firstName) return;
    setApplying(true);
    setDone(false);
    setHasError(false);
    setCaptchaAlert(false);
    setLogs([]);
    setCoverLetter('');

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl, jobTitle, companyName, jobDescription, resumeContent, profile }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      let buffer = '';
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'status') {
              setLogs((prev) => [...prev, { type: 'status', message: event.message, step: event.step, time: now() }]);
            }
            if (event.type === 'captcha') {
              setCaptchaAlert(true);
              setLogs((prev) => [...prev, { type: 'captcha', message: event.message, time: now() }]);
            }
            if (event.type === 'cover_letter') {
              setCoverLetter(event.coverLetter);
            }
            if (event.type === 'done') {
              const atsVal = event.ats || detectedATS;
              setDetectedATS(atsVal);
              setDone(true);
              setApplying(false);
              setLogs((prev) => [...prev, { type: 'done', message: 'Application process completed.', time: now() }]);
              // Save to tracker
              const existing = JSON.parse(localStorage.getItem('applied_jobs') || '[]');
              const entry = {
                id: Date.now().toString(),
                jobTitle,
                companyName,
                jobUrl,
                ats: atsVal,
                appliedAt: new Date().toISOString(),
                status: 'Applied',
                notes: '',
              };
              localStorage.setItem('applied_jobs', JSON.stringify([entry, ...existing]));
            }
            if (event.type === 'error') {
              setHasError(true);
              setApplying(false);
              setLogs((prev) => [...prev, { type: 'error', message: event.message, time: now() }]);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setHasError(true);
      setApplying(false);
      setLogs((prev) => [...prev, { type: 'error', message: String(err), time: now() }]);
    }
  };

  const atsColor = detectedATS ? ATS_COLORS[detectedATS] : '';

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Auto Apply</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Generate resume → AI cover letter → auto-fill form</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Opens a real Chrome window on your machine. Works locally only. No login needed for Greenhouse, Lever, Workable, Ashby.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="space-y-4">

            {/* Profile */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button onClick={() => setShowProfile(!showProfile)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Your Profile</span>
                  <span className="text-xs text-zinc-400">(dummy data pre-filled)</span>
                </div>
                {showProfile ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {showProfile && (
                <div className="px-5 pb-5 space-y-3 border-t border-zinc-100 dark:border-zinc-700 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(['firstName', 'lastName'] as const).map((f) => (
                      <div key={f}>
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block capitalize">{f === 'firstName' ? 'First Name' : 'Last Name'}</label>
                        <input value={profile[f]} onChange={(e) => set(f, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    ))}
                  </div>
                  {([
                    { key: 'email', label: 'Email', icon: Mail, type: 'email' },
                    { key: 'phone', label: 'Phone', icon: Phone, type: 'text' },
                    { key: 'linkedin', label: 'LinkedIn URL', icon: FileText, type: 'text' },
                    { key: 'resumePath', label: 'Resume PDF Path (local)', icon: FileText, type: 'text' },
                  ] as const).map(({ key, label, icon: Icon, type }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block">
                        <Icon className="w-3 h-3" />{label}
                      </label>
                      <input type={type} value={profile[key]} onChange={(e) => set(key, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Experience</label>
                    <textarea value={profile.experience} onChange={(e) => set('experience', e.target.value)}
                      rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Skills</label>
                    <input value={profile.skills} onChange={(e) => set('skills', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-zinc-400" />
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Job Details</span>
                </div>
                {detectedATS && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${atsColor}`}>
                    {detectedATS.charAt(0).toUpperCase() + detectedATS.slice(1)} detected
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Job URL <span className="text-red-500">*</span></label>
                <input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://boards.greenhouse.io/company/jobs/123"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Job Title</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Frontend Developer"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Company</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Job Description <span className="text-zinc-400">(for better resume + cover letter)</span></label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  rows={3} placeholder="Paste the full job description here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              {/* Generate Resume button */}
              <button onClick={generateResume} disabled={!jobDescription || generatingResume}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors">
                {generatingResume
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Resume...</>
                  : <><RefreshCw className="w-4 h-4" /> Generate Resume from Job Post</>}
              </button>

              {/* Resume preview toggle */}
              {resumeContent && (
                <button onClick={() => setShowResume(!showResume)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  {showResume ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showResume ? 'Hide Resume' : 'Show Generated Resume'}
                </button>
              )}

              {showResume && resumeContent && (
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono">{resumeContent}</pre>
                </div>
              )}

              {/* Apply button */}
              <button onClick={handleApply}
                disabled={applying || !jobUrl || !profile.email || !profile.firstName}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {applying
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                  : <><Send className="w-4 h-4" /> Auto Apply Now</>}
              </button>
            </div>
          </div>

          {/* RIGHT — Live log + results */}
          <div className="space-y-4">

            {/* CAPTCHA alert */}
            {captchaAlert && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-red-700 dark:text-red-400">CAPTCHA Detected!</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Look at the Chrome window and solve the CAPTCHA manually. The script will continue automatically.</p>
                </div>
              </div>
            )}

            {/* Live log */}
            {logs.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
                  {applying && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Live Progress</span>
                </div>
                <div ref={logRef} className="p-4 space-y-2 max-h-52 overflow-y-auto font-mono">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-zinc-400 flex-shrink-0">{log.time}</span>
                      <span className={
                        log.type === 'captcha' ? 'text-red-500 font-semibold' :
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'done' ? 'text-emerald-500 font-semibold' :
                        'text-zinc-600 dark:text-zinc-300'
                      }>
                        {log.type === 'captcha' ? '🚨 ' : log.type === 'done' ? '✅ ' : log.type === 'error' ? '❌ ' : '→ '}
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {applying && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Running...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Done state */}
            {done && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Form Filled Successfully</span>
                  {detectedATS && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${atsColor}`}>
                      {detectedATS}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Review the browser and click Submit to complete your application.</p>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Apply Failed</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{logs.find(l => l.type === 'error')?.message}</p>
                </div>
              </div>
            )}

            {/* Cover letter preview */}
            {coverLetter && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">AI Generated Cover Letter</p>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {coverLetter}
                </div>
              </div>
            )}

            {/* Instructions when idle */}
            {logs.length === 0 && !applying && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-4">Steps</h3>
                <div className="space-y-4">
                  {[
                    { n: '1', icon: '📋', title: 'Paste Job Description', desc: 'Add the full JD for better resume & cover letter tailoring' },
                    { n: '2', icon: '📄', title: 'Generate Resume', desc: 'AI creates an ATS-optimized resume matching the job post' },
                    { n: '3', icon: '🔗', title: 'Paste Job URL', desc: 'From Greenhouse, Lever, Workable, Ashby, or any company site' },
                    { n: '4', icon: '🚀', title: 'Click Auto Apply', desc: 'Browser opens, form fills automatically with your data' },
                    { n: '5', icon: '🔒', title: 'Handle CAPTCHA', desc: 'If detected, solve it in the browser — UI will alert you here' },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {s.n}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.icon} {s.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-zinc-400">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  );
}
