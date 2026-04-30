'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, MapPin, Clock, ExternalLink, Filter, Search, X,
  Bookmark, ChevronDown, Building2, Wifi, Globe, Copy, Check, Zap,
  CheckSquare, Download, Loader, ChevronRight
} from 'lucide-react';

type Job = {
  id: string | number;
  title: string;
  company_name: string;
  company_logo?: string;
  company_logo_url?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  job_types?: string[];
  publication_date?: string;
  created_at?: number;
  candidate_required_location?: string;
  location?: string;
  salary?: string;
  url: string;
  remote?: boolean;
  description?: string;
};

type QueuedJob = {
  job: Job;
  status: 'pending' | 'in-progress' | 'success' | 'failed' | 'captcha' | 'skipped';
  logs: string[];
  ats?: string;
  coverLetter?: string;
};

type SkillGapAnalysis = {
  matched_skills: string[];
  missing_skills: string[];
  estimated_learning_time: string;
  priority_skills: string[];
};

const REMOTIVE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'software-dev', label: 'Software Development' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'product', label: 'Product' },
  { value: 'data', label: 'Data' },
  { value: 'devops', label: 'DevOps / Sysadmin' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'qa', label: 'QA' },
  { value: 'writing', label: 'Writing' },
  { value: 'all-others', label: 'Other' },
];

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'contract', label: 'Contract' },
];

const EXP_LEVELS = [
  { value: '', label: 'All Experience' },
  { value: '0', label: 'Fresher / Intern' },
  { value: '1', label: '1+ year' },
  { value: '2', label: '2+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '8', label: '8+ years' },
];

// Extract actual experience requirement from description/title
function extractExpYears(title: string, description?: string): string {
  const text = `${title} ${description || ''}`;
  const stripped = text.replace(/<[^>]+>/g, ' ');

  // Match patterns like "3+ years", "2-5 years", "minimum 3 years", "at least 5 years", "3 years of experience"
  const patterns = [
    /(\d+)\s*[-–to]+\s*(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
    /(\d+)\s*\+\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:minimum|min\.?|at\s+least|minimum\s+of)\s+(\d+)\s*\+?\s*years?/i,
    /(\d+)\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
    /experience\s*(?:of\s*)?(\d+)\s*\+?\s*years?/i,
  ];

  for (const pattern of patterns) {
    const match = stripped.match(pattern);
    if (match) {
      if (match[2]) return `${match[1]}–${match[2]} yrs exp`;
      return `${match[1]}+ yrs exp`;
    }
  }

  // Intern fallback
  if (/intern|internship/i.test(stripped)) return 'Internship';
  return '';
}

// Min years for filtering
function getMinYears(title: string, description?: string): number {
  const text = `${title} ${description || ''}`.replace(/<[^>]+>/g, ' ');
  const match = text.match(/(?:minimum|min\.?|at\s+least)?\s*(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i);
  if (match) return parseInt(match[1], 10);
  if (/intern|internship/i.test(text)) return 0;
  return -1;
}

function getDaysAgo(dateStr?: string, timestamp?: number): number {
  const date = dateStr ? new Date(dateStr) : timestamp ? new Date(timestamp * 1000) : null;
  if (!date) return 999;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function timeAgo(dateStr?: string, timestamp?: number): string {
  const date = dateStr ? new Date(dateStr) : timestamp ? new Date(timestamp * 1000) : null;
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function getJobBadges(job: Job): { label: string; color: string }[] {
  const badges: { label: string; color: string }[] = [];
  const days = getDaysAgo(job.publication_date, job.created_at);

  if (days === 0) badges.push({ label: '✨ New Today', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' });
  else if (days <= 3) badges.push({ label: '🔥 Apply Soon', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' });

  if (job.salary) badges.push({ label: '💰 Salary Listed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' });

  const expReq = extractExpYears(job.title, job.description);
  if (expReq) badges.push({ label: `📅 ${expReq}`, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800' });

  const locationStr = (job.candidate_required_location || job.location || '').toLowerCase();
  const isRemote = job.remote === true || locationStr.includes('worldwide') || locationStr.includes('remote') || locationStr === '';
  const isIndia = locationStr.includes('india');

  if (isIndia) badges.push({ label: '🇮🇳 India', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' });
  else if (isRemote) badges.push({ label: '🏠 Remote', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' });
  else badges.push({ label: '🏢 On-site', color: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600' });

  return badges;
}

// Compute match score: skill match (50%) + exp fit (30%) + remote preference (20%)
function computeMatchScore(job: Job, mySkills: string[], userExpYears: number, workMode: string): number {
  if (!mySkills.length) return 0;
  const jobText = `${job.title} ${(job.tags || []).join(' ')} ${job.description || ''}`.toLowerCase();
  const matched = mySkills.filter(s => jobText.includes(s.toLowerCase()));
  const skillScore = matched.length / mySkills.length;

  const required = getMinYears(job.title, job.description);
  const expScore = required === -1 ? 0.7 : userExpYears >= required ? 1.0 : userExpYears + 2 >= required ? 0.5 : 0.1;

  const loc = (job.candidate_required_location || '').toLowerCase();
  const isRemote = job.remote || loc.includes('remote') || loc.includes('worldwide');
  const remoteScore = workMode === 'all' ? 0.7 : (workMode === 'remote' && isRemote) || (workMode === 'onsite' && !isRemote) ? 1.0 : (workMode === 'india' && (loc.includes('india') || isRemote)) ? 1.0 : 0.3;

  return Math.round((skillScore * 0.5 + expScore * 0.3 + remoteScore * 0.2) * 100);
}

// Get difficulty badge
function getDifficultyBadge(job: Job, userExpYears: number) {
  const required = getMinYears(job.title, job.description);
  if (required === -1 || !userExpYears) return null;
  if (userExpYears >= required) return { label: '🟢 Good Fit', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' };
  if (userExpYears + 2 >= required) return { label: '🟡 Stretch', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' };
  return { label: '🔴 Too Advanced', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' };
}

// Company logo with initial fallback
const LOGO_COLORS = ['bg-violet-500','bg-emerald-500','bg-blue-500','bg-rose-500','bg-amber-500','bg-indigo-500','bg-teal-500','bg-pink-500'];
function CompanyLogo({ logo, name }: { logo?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const color = LOGO_COLORS[name.charCodeAt(0) % LOGO_COLORS.length];
  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-10 h-10 object-contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white font-bold text-sm`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// --- Cover Letter Modal ---
function CoverLetterModal({ job, onClose, userSkills, expYears }: {
  job: Job;
  onClose: () => void;
  userSkills: string[];
  expYears: number;
}) {
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateLetter = async () => {
      try {
        const res = await fetch('/api/cover-letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: job.title,
            company: job.company_name,
            description: job.description,
            skills: userSkills,
            expYears,
          }),
        });

        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:"')) {
              const content = line.slice(3, -1);
              fullText += content;
              setLetter(fullText);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Cover letter generation failed:', err);
        setLoading(false);
      }
    };

    generateLetter();
  }, [job, userSkills, expYears]);

  const copyLetter = () => {
    navigator.clipboard.writeText(letter);
    alert('Cover letter copied to clipboard!');
  };

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.company_name}-${job.title}-cover-letter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">AI-Generated Cover Letter</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{job.title} at {job.company_name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex-shrink-0">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="ml-2 text-sm text-zinc-500">Generating cover letter...</span>
          </div>
        ) : (
          <>
            <textarea
              readOnly
              value={letter}
              className="w-full h-48 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={copyLetter}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button
                onClick={downloadLetter}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Skill Gap Modal ---
function SkillGapModal({ job, onClose, userSkills, expYears }: {
  job: Job;
  onClose: () => void;
  userSkills: string[];
  expYears: number;
}) {
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/skill-gap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: job.title,
            company: job.company_name,
            description: job.description,
            userSkills,
            expYears,
          }),
        });
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        console.error('Skill gap analysis failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [job, userSkills, expYears]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Skill Gap Analysis</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {analysis.matched_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">✅ Your Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.matched_skills.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysis.missing_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">📚 Missing Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysis.priority_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">⭐ Priority Skills</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {analysis.priority_skills.map((s) => (
                    <li key={s} className="text-sm text-zinc-700 dark:text-zinc-300">{s}</li>
                  ))}
                </ol>
              </div>
            )}
            {analysis.estimated_learning_time && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <span className="font-semibold">Learning time:</span> {analysis.estimated_learning_time}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Could not load analysis</p>
        )}
      </div>
    </div>
  );
}

// --- Job Detail Drawer ---
function JobDrawer({ job, onClose, savedIds, onToggleSave, userSkills, userExpYears }: {
  job: Job;
  onClose: () => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  userSkills: string[];
  userExpYears: number;
}) {
  const id = String(job.id);
  const isSaved = savedIds.has(id);
  const badges = getJobBadges(job);
  const location = job.candidate_required_location || job.location || (job.remote ? 'Remote' : 'Worldwide');
  const type = job.job_type || job.job_types?.[0] || '';
  const logo = job.company_logo_url || job.company_logo;
  const expReq = extractExpYears(job.title, job.description);
  const diffBadge = getDifficultyBadge(job, userExpYears);
  const [drawerTab, setDrawerTab] = useState<'description' | 'skillgap'>('description');
  const [showSkillGap, setShowSkillGap] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              <CompanyLogo logo={logo} name={job.company_name} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{job.title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{job.company_name}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>
                {type && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{type.replace('_', ' ')}</span>}
                {expReq && <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">📚 {expReq}</span>}
                {job.salary && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.salary}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges & difficulty */}
        <div className="px-6 pt-4 shrink-0 flex flex-wrap gap-2">
          {diffBadge && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${diffBadge.color}`}>
              {diffBadge.label}
            </span>
          )}
          {badges.map((b) => (
            <span key={b.label} className={`px-2.5 py-1 text-xs font-medium rounded-full border ${b.color}`}>{b.label}</span>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <button
            onClick={() => setDrawerTab('description')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              drawerTab === 'description'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Job Description
          </button>
          <button
            onClick={() => setDrawerTab('skillgap')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              drawerTab === 'skillgap'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Skill Gap
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {drawerTab === 'description' ? (
            <>
              {job.description ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <p className="text-sm text-zinc-400">No description available.</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Click "Analyze" to get an AI-powered skill gap analysis comparing your skills to this role.
              </p>
              <button
                onClick={() => setShowSkillGap(true)}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Analyze Skill Gap
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 p-6 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex gap-3">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => onToggleSave(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
                  : 'border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
          <button
            onClick={() => setShowCoverLetter(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm font-medium rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/30 transition-colors"
          >
            ✍️ Generate Cover Letter
          </button>
        </div>

        {showSkillGap && (
          <SkillGapModal
            job={job}
            onClose={() => setShowSkillGap(false)}
            userSkills={userSkills}
            expYears={userExpYears}
          />
        )}

        {showCoverLetter && (
          <CoverLetterModal
            job={job}
            onClose={() => setShowCoverLetter(false)}
            userSkills={userSkills}
            expYears={userExpYears}
          />
        )}
      </div>
    </div>
  );
}

// --- Bulk Apply Panel ---
function BulkApplyPanel({ queue, running, onStart, onClose }: {
  queue: QueuedJob[];
  running: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  const successCount = queue.filter(q => q.status === 'success').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;
  const captchaCount = queue.filter(q => q.status === 'captcha').length;
  const currentJob = queue.find(q => q.status === 'in-progress');
  const pendingCount = queue.filter(q => q.status === 'pending').length;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-zinc-900 shadow-2xl z-40 flex flex-col border-l border-zinc-200 dark:border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
        <h3 className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
          <Zap className="w-5 h-5 text-emerald-600" /> Apply Queue
        </h3>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {queue.length === 0 ? 'No jobs queued' : `${successCount + failedCount + captchaCount}/${queue.length} done`}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600">✅ {successCount}</span>
            <span className="text-red-600">❌ {failedCount}</span>
            {captchaCount > 0 && <span className="text-amber-600">⚠️ {captchaCount}</span>}
          </div>
        </div>
        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-300"
            style={{ width: `${queue.length === 0 ? 0 : ((successCount + failedCount + captchaCount) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {queue.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Select jobs to add to queue</p>
        ) : (
          <>
            {currentJob && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3 mb-2">
                <div className="flex items-start gap-2 mb-1">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 truncate">{currentJob.job.title}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">{currentJob.job.company_name}</p>
                  </div>
                </div>
                {currentJob.logs.length > 0 && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1 mt-2 max-h-16 overflow-y-auto">
                    {currentJob.logs[currentJob.logs.length - 1]}
                  </div>
                )}
              </div>
            )}
            {queue.filter(q => q.status !== 'in-progress').slice(0, 5).map((item) => (
              <div key={`${item.job.id}`} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold flex-shrink-0 mt-0.5">
                    {item.status === 'success' ? '✅' : item.status === 'failed' ? '❌' : item.status === 'captcha' ? '⚠️' : item.status === 'skipped' ? '⏭️' : '⏳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.job.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{item.job.company_name}</p>
                  </div>
                </div>
              </div>
            ))}
            {queue.length > 6 && (
              <p className="text-xs text-zinc-400 text-center py-2">+{queue.length - 6} more...</p>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
        <button
          onClick={onStart}
          disabled={running || queue.length === 0}
          className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              Start Apply
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// --- Job Card ---
function JobCard({ job, source, savedIds, onToggleSave, onOpen, onAutoApply, matchingSkills, matchScore, selectMode, isSelected, onToggleSelect }: {
  job: Job;
  source: string;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (job: Job) => void;
  onAutoApply?: (job: Job) => void;
  matchingSkills: string[];
  matchScore: number;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const id = String(job.id);
  const isSaved = savedIds.has(id);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(job.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const logo = job.company_logo_url || job.company_logo;
  const location = job.candidate_required_location || job.location || (job.remote ? 'Remote' : 'Worldwide');
  const type = job.job_type || job.job_types?.[0] || '';
  const postedAt = timeAgo(job.publication_date, job.created_at);
  const tags = job.tags?.slice(0, 3) || [];
  const badges = getJobBadges(job);

  // Extract experience level from job
  const expReq = extractExpYears(job.title, job.description);

  return (
    <div className={`group bg-white dark:bg-zinc-800 rounded-xl border transition-all duration-200 relative ${
      selectMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600'
    } ${isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-md' : 'border-zinc-200 dark:border-zinc-700'} p-5`}
      onClick={() => selectMode ? onToggleSelect(id) : onOpen(job)}>

      {/* Checkbox overlay in select mode */}
      {selectMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(id)}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-2 border-emerald-500 cursor-pointer accent-emerald-500"
          />
        </div>
      )}
      <div className={`flex items-start gap-4 ${selectMode ? 'pl-6' : ''}`}>
        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <CompanyLogo logo={logo} name={job.company_name} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{job.company_name}</p>
            </div>
            {/* Salary badge */}
            {job.salary && (
              <span className="flex-shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                {job.salary}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>
            {type && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{type.replace('_', ' ')}</span>}
            {postedAt && <span>{postedAt}</span>}
            {expReq && <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">📚 {expReq}</span>}
          </div>

          {/* Smart badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badges.map((b) => (
                <span key={b.label} className={`px-2 py-0.5 text-xs font-medium rounded-full border ${b.color}`}>{b.label}</span>
              ))}
            </div>
          )}

          {/* Skill tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className={`px-2 py-0.5 text-xs rounded-full ${
                  matchingSkills.includes(tag.toLowerCase())
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {matchingSkills.includes(tag.toLowerCase()) ? '✓ ' : ''}{tag}
                </span>
              ))}
            </div>
          )}
          {matchScore > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    matchScore >= 70 ? 'bg-emerald-500' : matchScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ${
                matchScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : matchScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {matchScore}%
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleSave(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isSaved
                ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400'
                : 'text-zinc-500 border-zinc-200 dark:border-zinc-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-900/20'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              copied
                ? 'text-white bg-emerald-500 border-emerald-500'
                : 'text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-400 hover:bg-violet-100'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Go to Job
          </a>
          {onAutoApply && (
            <button
              onClick={() => onAutoApply(job)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-violet-600 border-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Auto Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState<'all' | 'linkedin' | 'remotive' | 'arbeitnow' | 'jobicy' | 'themuse' | 'remoteok' | 'jsearch' | 'for-you'>('all');
  const [search, setSearch] = useState('');
  const [category] = useState('software-dev');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState<'all' | 'remote' | 'onsite' | 'india'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'salary' | 'match'>('newest');
  const [total, setTotal] = useState(0);
  const [expLevel, setExpLevel] = useState<'' | 'fresher' | '1-2' | '3-5' | '5+' | '10+'>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [mySkillsInput, setMySkillsInput] = useState('');
  const [userExpYears, setUserExpYears] = useState(0);
  const [queue, setQueue] = useState<QueuedJob[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [dailyApplied, setDailyApplied] = useState(0);
  const router = useRouter();

  // Load my skills, experience, and daily count from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('my_skills');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMySkills(parsed);
      setMySkillsInput(parsed.join(', '));
    }
    const expYears = parseInt(localStorage.getItem('user_exp_years') || '0', 10);
    setUserExpYears(expYears);

    // Load today's applied count
    const applied = JSON.parse(localStorage.getItem('applied_jobs') || '[]');
    const today = new Date().toDateString();
    const todayCount = applied.filter((a: any) => new Date(a.appliedAt || 0).toDateString() === today).length;
    setDailyApplied(todayCount);
  }, []);

  const saveMySkills = (val: string) => {
    setMySkillsInput(val);
    const parsed = val.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    setMySkills(parsed);
    localStorage.setItem('my_skills', JSON.stringify(parsed));
  };

  const getMatchingSkills = (job: Job): string[] => {
    if (!mySkills.length) return [];
    const jobText = `${job.title} ${(job.tags || []).join(' ')} ${job.description || ''}`.toLowerCase();
    return mySkills.filter((skill) => jobText.includes(skill));
  };

  const handleAutoApply = (job: Job) => {
    const params = new URLSearchParams({
      url: job.url,
      title: job.title,
      company: job.company_name,
      description: job.description?.replace(/<[^>]+>/g, ' ').slice(0, 800) || '',
    });
    router.push(`/apply?${params.toString()}`);
  };

  const toggleJobSelection = (id: string) => {
    setSelectedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelectedToQueue = () => {
    const appliedUrls = new Set(JSON.parse(localStorage.getItem('applied_jobs') || '[]').map((a: any) => a.url));
    const toAdd = displayedJobs.filter(j => selectedJobIds.has(String(j.id)) && !appliedUrls.has(j.url));
    setQueue(prev => [...prev, ...toAdd.map(j => ({ job: j, status: 'pending' as const, logs: [] }))]);
    setSelectedJobIds(new Set());
    setSelectMode(false);
    setShowQueue(true);
  };

  const addTopMatchesToQueue = (n: number) => {
    const appliedUrls = new Set(JSON.parse(localStorage.getItem('applied_jobs') || '[]').map((a: any) => a.url));
    const topJobs = [...displayedJobs]
      .filter(j => !appliedUrls.has(j.url) && !queue.some(q => q.job.url === j.url))
      .sort((a, b) => computeMatchScore(b, mySkills, userExpYears, workMode) - computeMatchScore(a, mySkills, userExpYears, workMode))
      .slice(0, n);
    setQueue(prev => [...prev, ...topJobs.map(j => ({ job: j, status: 'pending' as const, logs: [] }))]);
    setShowQueue(true);
  };

  const startBulkApply = async () => {
    setBulkRunning(true);
    const pending = queue.filter(q => q.status === 'pending');
    const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const resumeContent = localStorage.getItem('user_resume') || '';
    const appliedUrls = new Set(JSON.parse(localStorage.getItem('applied_jobs') || '[]').map((a: any) => a.url || ''));

    try {
      const res = await fetch('/api/bulk-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: pending.map(q => ({
            id: String(q.job.id),
            url: q.job.url,
            title: q.job.title,
            company: q.job.company_name,
            description: q.job.description || '',
          })),
          profile: userProfile,
          resumeContent,
          autoSubmit: true,
          alreadyAppliedUrls: Array.from(appliedUrls),
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          if (!block.startsWith('data:')) continue;
          try {
            const event = JSON.parse(block.slice(5).trim());

            if (event.type === 'job_start') {
              setQueue(prev =>
                prev.map(q => q.job.id === event.jobId ? { ...q, status: 'in-progress' as const } : q)
              );
            } else if (event.type === 'job_log') {
              setQueue(prev =>
                prev.map(q => q.job.id === event.jobId ? { ...q, logs: [...q.logs, event.message] } : q)
              );
            } else if (event.type === 'job_done') {
              setQueue(prev =>
                prev.map(q => q.job.id === event.jobId ? { ...q, status: event.status, ats: event.ats, coverLetter: event.coverLetter } : q)
              );

              if (event.status === 'success') {
                setDailyApplied(n => n + 1);
                const applied = JSON.parse(localStorage.getItem('applied_jobs') || '[]');
                const job = queue.find(q => q.job.id === event.jobId)?.job;
                if (job) {
                  applied.push({
                    id: event.jobId,
                    url: job.url,
                    jobTitle: job.title,
                    companyName: job.company_name,
                    status: 'Applied',
                    appliedAt: new Date().toISOString(),
                  });
                  localStorage.setItem('applied_jobs', JSON.stringify(applied));
                }
              }
            } else if (event.type === 'batch_done') {
              setBulkRunning(false);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      console.error('Bulk apply failed:', err);
      setBulkRunning(false);
    }
  };

  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved jobs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('saved_jobs');
    if (stored) setSavedIds(new Set(JSON.parse(stored)));
  }, []);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('saved_jobs', JSON.stringify([...next]));
      return next;
    });
  };

  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  const fetchJobs = useCallback(async (pageNum = 1, append = false) => {
    const isJSearch = source === 'jsearch';
    const isForYou = source === 'for-you';
    const effectiveSearch = isJSearch ? (search || 'software developer frontend fullstack') : search;

    // Check cache for JSearch
    if (isJSearch && !append) {
      const cacheKey = `jsearch_cache_${effectiveSearch}_${workMode}_${pageNum}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { jobs: cachedJobs, total: cachedTotal, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setJobs(cachedJobs);
          setTotal(cachedTotal);
          setHasMore(cachedJobs.length === 20);
          return;
        }
      }
    }

    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      let res;
      if (isForYou) {
        // Fetch recommendations
        const params = new URLSearchParams({
          skills: mySkills.join(','),
          experience: String(userExpYears),
        });
        res = await fetch(`/api/recommendations?${params}`);
      } else {
        const params = new URLSearchParams({ source, page: String(pageNum) });
        if (effectiveSearch) params.set('search', effectiveSearch);
        if (category) params.set('category', category);
        if (jobType) params.set('job_type', jobType);
        if (workMode === 'remote') params.set('remote', 'true');
        if (workMode === 'onsite') params.set('onsite', 'true');
        res = await fetch(`/api/jobs?${params}`);
      }

      const data = await res.json();
      const fetched: Job[] = (isForYou ? data.recommendations : data.jobs) || [];

      // Cache JSearch results
      if (isJSearch && !append) {
        const cacheKey = `jsearch_cache_${effectiveSearch}_${workMode}_${pageNum}`;
        localStorage.setItem(cacheKey, JSON.stringify({ jobs: fetched, total: data.total || 0, timestamp: Date.now() }));
      }

      setJobs((prev) => append ? [...prev, ...fetched] : fetched);
      setTotal(data.total || 0);
      setHasMore(fetched.length === 20);
    } catch {
      if (!append) setJobs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [source, search, category, jobType, workMode, mySkills, userExpYears]);

  // Debounce search — skip auto-fetch for JSearch (manual only)
  useEffect(() => {
    if (source === 'jsearch') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchJobs(1, false);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Immediate fetch on other filter changes
  useEffect(() => {
    setPage(1);
    fetchJobs(1, false);
  }, [source, category, jobType, workMode]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchJobs(next, true);
  };

  const clearFilters = () => {
    setSearch('');
    setJobType('');
    setWorkMode('all');
    setSortBy('newest');
    setExpLevel('');
    setPage(1);
    setShowFilters(false);
  };

  const hasActiveFilters = search || category || jobType || workMode !== 'all' || expLevel;

  // Filter jobs by location (Remote / On-site / India) & experience level
  const displayedJobs = [...jobs]
    .filter(job => showSavedOnly ? savedIds.has(String(job.id)) : true)
    .filter((job) => {
      // Location filter
      const location = (job.candidate_required_location || job.location || '').toLowerCase();

      let locationMatch = true;
      if (workMode === 'remote') locationMatch = job.remote === true || location.includes('remote') || location.includes('worldwide');
      else if (workMode === 'onsite') locationMatch = job.remote === false && !location.includes('remote');
      else if (workMode === 'india') {
        // India jobs: remote jobs that work globally + India-specific + companies known to hire India
        locationMatch = location.includes('india') ||
                       location.includes('worldwide') ||
                       location.includes('remote') ||
                       location.includes('global') ||
                       location.includes('anywhere');
      }

      // Experience filter using numeric comparison
      let expMatch = true;
      if (expLevel) {
        const minYrs = getMinYears(job.title, job.description);
        const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

        if (expLevel === 'fresher') {
          expMatch = (minYrs === 0 || minYrs === -1) && (text.includes('fresher') || text.includes('intern') || text.includes('entry'));
        } else if (expLevel === '1-2') {
          expMatch = minYrs >= 0 && minYrs <= 2;
        } else if (expLevel === '3-5') {
          expMatch = minYrs >= 3 && minYrs <= 5;
        } else if (expLevel === '5+') {
          expMatch = minYrs >= 5;
        } else if (expLevel === '10+') {
          expMatch = minYrs >= 10;
        }
      }

      return locationMatch && expMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'salary') {
        const aSalary = parseInt(a.salary?.replace(/\D/g, '') || '0', 10);
        const bSalary = parseInt(b.salary?.replace(/\D/g, '') || '0', 10);
        return bSalary - aSalary;
      } else if (sortBy === 'match') {
        const scoreA = computeMatchScore(a, mySkills, userExpYears, workMode);
        const scoreB = computeMatchScore(b, mySkills, userExpYears, workMode);
        return scoreB - scoreA;
      }
      // newest (default)
      return (b.created_at || 0) - (a.created_at || 0);
    });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Smart Recommendations Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200 dark:border-emerald-800 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 text-sm flex-wrap">
          <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 dark:text-emerald-300">
            <span className="font-semibold">Filters:</span>
            <span className="ml-2">
              {workMode === 'all' && '🌐 All locations'}
              {workMode === 'remote' && '🏠 Remote'}
              {workMode === 'onsite' && '🏢 On-site'}
              {workMode === 'india' && '🇮🇳 India'}
            </span>
            {expLevel && (
              <span className="ml-2">
                {expLevel === 'fresher' && '👶 Fresher'}
                {expLevel === '1-2' && '📈 1-2 Years'}
                {expLevel === '3-5' && '💼 3-5 Years'}
                {expLevel === '5+' && '🎯 5+ Years'}
                {expLevel === '10+' && '🌟 10+ Years'}
              </span>
            )}
            {displayedJobs.length > 0 && <span className="ml-2 font-semibold text-emerald-800 dark:text-emerald-200">({displayedJobs.length} jobs)</span>}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Job Board</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {loading ? 'Loading...' : `${displayedJobs.length} jobs${total > displayedJobs.length ? ` of ${total}` : ''}`}
              </p>
              {/* Daily progress bar */}
              {dailyApplied > 0 && (
                <div className="flex items-center gap-3 mt-2.5">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Daily Goal:</span>
                  <div className="w-40 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${dailyApplied >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                      style={{ width: `${Math.min(100, (dailyApplied / 100) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{dailyApplied}/100</span>
                  {dailyApplied >= 100 && <span className="text-xs text-emerald-600 dark:text-emerald-400">🎉 Goal reached!</span>}
                </div>
              )}
            </div>
            {/* My Skills input */}
            <div className="flex-1 max-w-sm">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">My Skills <span className="text-zinc-400">(comma separated — shows match %)</span></label>
              <input
                value={mySkillsInput}
                onChange={(e) => saveMySkills(e.target.value)}
                placeholder="React, Node.js, TypeScript..."
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Saved jobs toggle */}
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  showSavedOnly
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={showSavedOnly ? 'currentColor' : 'none'} />
                Saved {savedIds.size > 0 && `(${savedIds.size})`}
              </button>

              {/* Select mode toggle */}
              <button
                onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedJobIds(new Set()); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  selectMode
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {selectMode ? 'Selecting...' : 'Select'}
              </button>

              {/* Apply Queue button */}
              <button
                onClick={() => setShowQueue(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" /> Queue
                {queue.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {queue.filter(q => q.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Auto-Select 100 */}
              {mySkills.length > 0 && (
                <button
                  onClick={() => addTopMatchesToQueue(100)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                >
                  ⭐ Auto-Select 100
                </button>
              )}

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'salary' | 'match')}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="salary">Salary Listed</option>
                  {mySkills.length > 0 && <option value="match">Best Match</option>}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Source tabs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {([
              ...(mySkills.length > 0 ? [{ id: 'for-you', label: '⭐ For You' }] : []),
              { id: 'all', label: '🌐 All Jobs' },
              { id: 'linkedin', label: '💼 LinkedIn' },
              { id: 'jobicy', label: 'Jobicy' },
              { id: 'arbeitnow', label: 'Arbeitnow' },
              { id: 'themuse', label: 'The Muse' },
              { id: 'remoteok', label: 'RemoteOK' },
              { id: 'remotive', label: 'Remotive' },
              { id: 'jsearch', label: '⚡ JSearch' },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => { setSource(s.id as any); setJobType(''); setWorkMode(s.id === 'jsearch' ? 'onsite' : 'all'); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  source === s.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Work mode pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 self-center">Location:</span>
            {(['all', 'remote', 'onsite', 'india'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  workMode === mode
                    ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                {mode === 'all' ? '🌐 All' : mode === 'remote' ? '🏠 Remote' : mode === 'onsite' ? '🏢 On-site' : '🇮🇳 India'}
              </button>
            ))}
          </div>

          {/* Experience level pills */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 self-center">Experience:</span>
            {(['fresher', '1-2', '3-5', '5+', '10+'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setExpLevel(expLevel === level ? '' : level)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  expLevel === level
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                {level === 'fresher' ? '👶 Fresher' : level === '1-2' ? '📈 1-2 Yrs' : level === '3-5' ? '💼 3-5 Yrs' : level === '5+' ? '🎯 5+ Yrs' : '🌟 10+ Yrs'}
              </button>
            ))}
          </div>

          {/* Search + filter bar */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><Search className="w-4 h-4" /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && source === 'jsearch') { setPage(1); fetchJobs(1, false); } }}
                placeholder={source === 'jsearch' ? 'Search LinkedIn, Indeed, Google Jobs...' : 'Search jobs, companies, skills...'}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {source === 'jsearch' && (
              <button
                onClick={() => { setPage(1); fetchJobs(1, false); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Search className="w-4 h-4" /> Search
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
              {source === 'remotive' && (
                <select value={jobType} onChange={(e) => setJobType(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              )}
              {/* Experience level — works on all sources */}
              <select value={expLevel} onChange={(e) => setExpLevel(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {EXP_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-600 rounded w-1/3" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-600 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{showSavedOnly ? 'No saved jobs yet.' : 'No jobs found. Try adjusting filters.'}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {displayedJobs.map((job) => (
                  <JobCard
                    key={`${source}-${job.id ?? job.url}`}
                    job={job}
                    source={source}
                    savedIds={savedIds}
                    onToggleSave={toggleSave}
                    onOpen={setSelectedJob}
                    onAutoApply={source !== 'remotive' ? handleAutoApply : undefined}
                    matchingSkills={getMatchingSkills(job)}
                    matchScore={computeMatchScore(job, mySkills, userExpYears, workMode)}
                    selectMode={selectMode}
                    isSelected={selectedJobIds.has(String(job.id))}
                    onToggleSelect={toggleJobSelection}
                  />
                ))}
              </div>

              {/* Load more & Pagination Info */}
              {(hasMore || total >= 20) && !showSavedOnly && (
                <div className="flex flex-col items-center gap-4 mt-8">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Showing {displayedJobs.length} of {total} jobs
                    {total > 0 && (
                      <span className="ml-2 text-xs bg-zinc-100 dark:bg-zinc-700 px-3 py-1 rounded-full">
                        Page {page}
                      </span>
                    )}
                  </div>
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 text-sm font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        <>
                          ↓ Load More Jobs
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Page Navigation */}
              {!showSavedOnly && total >= 20 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => page > 1 && (setPage(page - 1), fetchJobs(page - 1, false))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPage(pageNum);
                            fetchJobs(pageNum, false);
                          }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            page === pageNum
                              ? 'bg-emerald-600 text-white'
                              : 'border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => !hasMore || (setPage(page + 1), fetchJobs(page + 1, false))}
                    disabled={!hasMore}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Job detail drawer */}
      {selectedJob && (
        <JobDrawer
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          savedIds={savedIds}
          onToggleSave={toggleSave}
          userSkills={mySkills}
          userExpYears={userExpYears}
        />
      )}

      {/* Floating action bar when jobs selected */}
      {selectMode && selectedJobIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 dark:bg-black text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="font-semibold text-sm">{selectedJobIds.size} selected</span>
          <button
            onClick={addSelectedToQueue}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" /> Add to Queue
          </button>
          <button
            onClick={() => { setSelectMode(false); setSelectedJobIds(new Set()); }}
            className="text-zinc-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bulk apply panel */}
      {showQueue && (
        <BulkApplyPanel
          queue={queue}
          running={bulkRunning}
          onStart={startBulkApply}
          onClose={() => setShowQueue(false)}
        />
      )}
    </div>
  );
}
