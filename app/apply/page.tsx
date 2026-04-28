'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Zap, User, Mail, Phone, Linkedin, FileText, Briefcase,
  CheckCircle, XCircle, Loader2, AlertTriangle, Clock, ExternalLink, Trash2
} from 'lucide-react';

type LogEntry = {
  type: 'status' | 'captcha' | 'error' | 'done' | 'cover_letter';
  message?: string;
  time: string;
};

type HistoryEntry = {
  id: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  ats: string;
  appliedAt: string;
  status: 'success' | 'failed' | 'captcha';
  coverLetter?: string;
};

const ATS_COLORS: Record<string, string> = {
  greenhouse: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  lever: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  workable: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  ashby: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
  bamboohr: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  generic: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:border-zinc-600',
};

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ApplyContent() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const searchParams = useSearchParams();

  // Job details from URL params
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Profile from MongoDB
  const [profile, setProfile] = useState<any>(null);
  const [resumeContent, setResumeContent] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Apply state
  const [applying, setApplying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [captchaAlert, setCaptchaAlert] = useState(false);
  const [done, setDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [detectedATS, setDetectedATS] = useState('');

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const logRef = useRef<HTMLDivElement>(null);

  // Load URL params
  useEffect(() => {
    const url = searchParams.get('url') || '';
    const title = searchParams.get('title') || '';
    const company = searchParams.get('company') || '';
    const desc = searchParams.get('description') || '';
    if (url) setJobUrl(url);
    if (title) setJobTitle(title);
    if (company) setCompanyName(company);
    if (desc) setJobDescription(desc);

    // Detect ATS from URL
    if (url) setDetectedATS(detectATS(url));
  }, []);

  // Load profile from MongoDB + match resume by job title
  useEffect(() => {
    if (!userId) return;
    fetch('/api/profile', { headers: { 'x-user-id': userId } })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user.profile);
          const resumes = data.user.resumes || [];
          if (resumes.length > 0) {
            const title = searchParams.get('title') || '';
            // Try to match resume by jobTitle keyword
            const matched = resumes.find((r: any) =>
              title && r.jobTitle && title.toLowerCase().includes(r.jobTitle.toLowerCase().split(' ')[0])
            );
            setResumeContent((matched || resumes[0]).content || '');
          }
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [userId]);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('apply_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (entry: HistoryEntry) => {
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('apply_history', JSON.stringify(updated));
  };

  const detectATS = (url: string) => {
    if (url.includes('greenhouse.io')) return 'greenhouse';
    if (url.includes('lever.co')) return 'lever';
    if (url.includes('workable.com')) return 'workable';
    if (url.includes('ashbyhq.com')) return 'ashby';
    if (url.includes('bamboohr.com')) return 'bamboohr';
    return 'generic';
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleApply = async () => {
    if (!jobUrl || !profile?.email) return;
    setApplying(true);
    setDone(false);
    setHasError(false);
    setCaptchaAlert(false);
    setLogs([]);
    setCoverLetter('');

    const profilePayload = {
      firstName: profile.name?.split(' ')[0] || 'Applicant',
      lastName: profile.name?.split(' ').slice(1).join(' ') || '',
      email: profile.email,
      phone: profile.phone,
      linkedin: profile.linkedin,
      resumePath: '',
      experience: profile.experience,
      education: profile.education,
      skills: profile.skills,
      role: profile.role,
      expYears: profile.expYears,
    };

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl, jobTitle, companyName, jobDescription,
          resumeContent, profile: profilePayload,
        }),
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
            if (event.type === 'status') setLogs((p) => [...p, { type: 'status', message: event.message, time: now() }]);
            if (event.type === 'captcha') { setCaptchaAlert(true); setLogs((p) => [...p, { type: 'captcha', message: event.message, time: now() }]); }
            if (event.type === 'cover_letter') setCoverLetter(event.coverLetter);
            if (event.type === 'done') {
              const ats = event.ats || detectedATS;
              setDetectedATS(ats);
              setDone(true);
              setApplying(false);
              setLogs((p) => [...p, { type: 'done', message: '✅ Application process completed.', time: now() }]);
              saveHistory({ id: Date.now().toString(), jobTitle, companyName, jobUrl, ats, appliedAt: new Date().toISOString(), status: 'success', coverLetter: event.coverLetter });
              // Save to tracker
              const existing = JSON.parse(localStorage.getItem('applied_jobs') || '[]');
              localStorage.setItem('applied_jobs', JSON.stringify([{ id: Date.now().toString(), jobTitle, companyName, jobUrl, ats, appliedAt: new Date().toISOString(), status: 'Applied', notes: '' }, ...existing]));
            }
            if (event.type === 'error') {
              setHasError(true);
              setApplying(false);
              setLogs((p) => [...p, { type: 'error', message: event.message, time: now() }]);
              saveHistory({ id: Date.now().toString(), jobTitle, companyName, jobUrl, ats: detectedATS, appliedAt: new Date().toISOString(), status: 'failed' });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setHasError(true);
      setApplying(false);
      setLogs((p) => [...p, { type: 'error', message: String(err), time: now() }]);
    }
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('apply_history', JSON.stringify(updated));
  };

  const atsColor = detectedATS ? (ATS_COLORS[detectedATS] || ATS_COLORS.generic) : '';

  if (loadingProfile) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Auto Apply</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Review details → click Auto Apply → form fills automatically</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-0">

        {/* LEFT — Preview + Apply */}
        <div className="w-[420px] flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col overflow-y-auto bg-white dark:bg-zinc-800">

          {/* CAPTCHA alert */}
          {captchaAlert && (
            <div className="mx-4 mt-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">CAPTCHA Detected!</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Solve it in the Chrome window. Script will continue automatically.</p>
              </div>
            </div>
          )}

          <div className="p-4 space-y-4 flex-1">
            {/* Job Details */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Job Details</p>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Job URL *</label>
                <input value={jobUrl} onChange={(e) => { setJobUrl(e.target.value); setDetectedATS(detectATS(e.target.value)); }}
                  placeholder="https://boards.greenhouse.io/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                {detectedATS && (
                  <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full border capitalize font-medium ${atsColor}`}>
                    {detectedATS} detected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Job Title</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Frontend Developer"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Company</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
            </div>

            {/* Profile Preview */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Will be filled with</p>
              {[
                { icon: User, label: profile?.name || '—' },
                { icon: Mail, label: profile?.email || '—' },
                { icon: Phone, label: profile?.phone || '—' },
                { icon: Linkedin, label: profile?.linkedin || '—' },
                { icon: Briefcase, label: `${profile?.role || '—'} · ${profile?.expYears || '?'} yr` },
                { icon: FileText, label: profile?.skills?.slice(0, 60) + '...' || '—' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <Icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 truncate text-xs">{label}</span>
                </div>
              ))}
              {!profile?.email && (
                <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Complete your profile first at <a href="/profile" className="underline">Profile page</a></p>
              )}
            </div>

            {/* Resume selector */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Resume</p>
              <textarea value={resumeContent} onChange={(e) => setResumeContent(e.target.value)}
                rows={3} placeholder="Resume content (loaded from your profile resumes)..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
            </div>

            {/* Live log */}
            {logs.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
                  {applying && <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />}
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Live Progress</span>
                </div>
                <div ref={logRef} className="p-3 space-y-1.5 max-h-40 overflow-y-auto font-mono">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-zinc-400 flex-shrink-0">{log.time}</span>
                      <span className={
                        log.type === 'captcha' ? 'text-red-500 font-semibold' :
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'done' ? 'text-emerald-500' :
                        'text-zinc-600 dark:text-zinc-300'
                      }>{log.message}</span>
                    </div>
                  ))}
                  {applying && <div className="flex items-center gap-1 text-xs text-zinc-400"><Loader2 className="w-3 h-3 animate-spin" /> Running...</div>}
                </div>
              </div>
            )}

            {/* Cover letter */}
            {coverLetter && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">AI Cover Letter Used</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{coverLetter}</p>
              </div>
            )}
          </div>

          {/* Apply button pinned at bottom */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-700">
            {done && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Form filled! Review browser and submit.</p>
              </div>
            )}
            {hasError && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">Apply failed. Check the log above.</p>
              </div>
            )}
            <button
              onClick={handleApply}
              disabled={applying || !jobUrl || !profile?.email}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {applying
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                : <><Zap className="w-4 h-4" /> Auto Apply Now</>}
            </button>
          </div>
        </div>

        {/* RIGHT — History */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Application History</h2>
              {history.length > 0 && (
                <button onClick={() => { setHistory([]); localStorage.removeItem('apply_history'); }}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors">Clear all</button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 text-zinc-400 dark:text-zinc-600">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No applications yet</p>
                <p className="text-xs mt-1">Auto applied jobs will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className={`bg-white dark:bg-zinc-800 rounded-xl border p-4 ${
                    h.status === 'success' ? 'border-emerald-200 dark:border-emerald-800' :
                    h.status === 'failed' ? 'border-red-200 dark:border-red-800' :
                    'border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          h.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          h.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          {h.status === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                           h.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> :
                           <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{h.jobTitle || 'Unknown Role'}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{h.companyName || 'Unknown Company'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-zinc-400"><Clock className="w-3 h-3" />{new Date(h.appliedAt).toLocaleString('en-IN')}</span>
                            {h.ats && h.ats !== 'generic' && (
                              <span className={`px-1.5 py-0.5 text-xs rounded-full border capitalize ${ATS_COLORS[h.ats] || ATS_COLORS.generic}`}>{h.ats}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={h.jobUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => deleteHistory(h.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>}>
      <ApplyContent />
    </Suspense>
  );
}
