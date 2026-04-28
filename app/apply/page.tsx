'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Send, User, Mail, Phone, Linkedin, FileText, Zap, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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

type ApplyResult = {
  success: boolean;
  ats?: string;
  coverLetter?: string;
  message?: string;
  error?: string;
};

const ATS_BADGE: Record<string, { label: string; color: string }> = {
  greenhouse:     { label: 'Greenhouse',      color: 'bg-green-100 text-green-700 border-green-200' },
  lever:          { label: 'Lever',           color: 'bg-blue-100 text-blue-700 border-blue-200' },
  workable:       { label: 'Workable',        color: 'bg-violet-100 text-violet-700 border-violet-200' },
  ashby:          { label: 'Ashby',           color: 'bg-rose-100 text-rose-700 border-rose-200' },
  bamboohr:       { label: 'BambooHR',        color: 'bg-orange-100 text-orange-700 border-orange-200' },
  recruitee:      { label: 'Recruitee',       color: 'bg-sky-100 text-sky-700 border-sky-200' },
  smartrecruiters:{ label: 'SmartRecruiters', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  generic:        { label: 'Generic Form',    color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
};

const DEFAULT_PROFILE: Profile = {
  firstName: '', lastName: '', email: '', phone: '',
  linkedin: '', resumePath: '', experience: '', education: '', skills: '',
};

export default function ApplyPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [showProfile, setShowProfile] = useState(true);

  // Persist profile in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('apply_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const saveProfile = (updated: Profile) => {
    setProfile(updated);
    localStorage.setItem('apply_profile', JSON.stringify(updated));
  };

  const set = (key: keyof Profile, val: string) => saveProfile({ ...profile, [key]: val });

  const handleApply = async () => {
    if (!jobUrl || !profile.email || !profile.firstName) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl, jobTitle, companyName, jobDescription, profile }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Failed to connect to server.' });
    } finally {
      setLoading(false);
    }
  };

  const atsInfo = result?.ats ? ATS_BADGE[result.ats] : null;

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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Fills job forms automatically using Puppeteer</p>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <span className="mt-0.5">⚠️</span>
          <span>Opens a real browser window on your machine. Works only when running locally — not on Vercel. Solve any CAPTCHA manually if it appears.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Profile + Job */}
          <div className="space-y-4">

            {/* Profile Section */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Your Profile</span>
                  {profile.email && <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Saved</span>}
                </div>
                {showProfile ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {showProfile && (
                <div className="px-5 pb-5 space-y-3 border-t border-zinc-100 dark:border-zinc-700 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">First Name</label>
                      <input value={profile.firstName} onChange={(e) => set('firstName', e.target.value)}
                        placeholder="John"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Last Name</label>
                      <input value={profile.lastName} onChange={(e) => set('lastName', e.target.value)}
                        placeholder="Doe"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" />Email</label>
                    <input type="email" value={profile.email} onChange={(e) => set('email', e.target.value)}
                      placeholder="john@email.com"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" />Phone</label>
                    <input value={profile.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="+91 9999999999"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block flex items-center gap-1"><Linkedin className="w-3 h-3" />LinkedIn URL</label>
                    <input value={profile.linkedin} onChange={(e) => set('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/yourname"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" />Resume PDF Path (local)</label>
                    <input value={profile.resumePath} onChange={(e) => set('resumePath', e.target.value)}
                      placeholder="/Users/you/resume.pdf"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Experience (brief)</label>
                    <textarea value={profile.experience} onChange={(e) => set('experience', e.target.value)}
                      rows={2} placeholder="Full Stack Dev at XYZ (2021-present)..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Skills</label>
                    <input value={profile.skills} onChange={(e) => set('skills', e.target.value)}
                      placeholder="React, Node.js, TypeScript, MongoDB..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-zinc-400" />
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Job Details</span>
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
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Job Description (paste for better cover letter)</label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  rows={3} placeholder="Paste the job description here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              <button
                onClick={handleApply}
                disabled={loading || !jobUrl || !profile.email || !profile.firstName}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying... (browser opening)</>
                  : <><Send className="w-4 h-4" /> Auto Apply</>}
              </button>
            </div>
          </div>

          {/* Right — Result */}
          <div className="space-y-4">
            {/* How it works */}
            {!result && !loading && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-3">How it works</h3>
                <div className="space-y-3">
                  {[
                    { icon: '🔍', title: 'Detects ATS', desc: 'Identifies if the job uses Greenhouse, Lever, Workable, etc.' },
                    { icon: '✍️', title: 'Generates Cover Letter', desc: 'AI writes a tailored cover letter using your profile + job details' },
                    { icon: '🖥️', title: 'Opens Browser', desc: 'Real Chrome window opens and fills the form automatically' },
                    { icon: '⏸️', title: 'You Review', desc: '30 seconds to check, solve CAPTCHA if needed, then submit' },
                  ].map((step) => (
                    <div key={step.title} className="flex items-start gap-3">
                      <span className="text-lg">{step.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{step.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Supported ATS Platforms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(ATS_BADGE).map(([, v]) => (
                      <span key={v.label} className={`px-2 py-0.5 text-xs rounded-full border ${v.color}`}>{v.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Opening browser...</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Generating cover letter & filling form</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">⚠️ Check your screen — browser window should open shortly</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`bg-white dark:bg-zinc-800 rounded-xl border p-5 space-y-4 ${
                result.success ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {result.success
                    ? <CheckCircle className="w-6 h-6 text-emerald-500" />
                    : <XCircle className="w-6 h-6 text-red-500" />}
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {result.success ? 'Form Filled!' : 'Failed'}
                    </p>
                    {atsInfo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${atsInfo.color}`}>
                        {atsInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {result.message || result.error}
                </p>

                {result.coverLetter && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">AI Generated Cover Letter</p>
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap border border-zinc-100 dark:border-zinc-700 max-h-64 overflow-y-auto">
                      {result.coverLetter}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
