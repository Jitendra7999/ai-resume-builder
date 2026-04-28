'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, MapPin, Clock, ExternalLink, Filter, Search, X,
  Bookmark, ChevronDown, Building2, Wifi, Globe, Copy, Check, Zap
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

// Returns true if job is restricted to Western countries only
function isWesternOnly(location: string): boolean {
  const loc = location.toLowerCase();
  const westernOnly = ['usa only', 'us only', 'united states only', 'uk only', 'canada only', 'australia only', 'eu only', 'europe only'];
  if (westernOnly.some((w) => loc.includes(w))) return true;
  // Single-country restricted (not worldwide/remote/india)
  const restricted = ['united states', 'usa', 'u.s.a', 'canada', 'australia', 'united kingdom', 'germany', 'france', 'netherlands'];
  const isOpen = loc.includes('worldwide') || loc.includes('remote') || loc.includes('india') || loc.includes('global') || loc === '';
  if (!isOpen && restricted.some((r) => loc === r || loc === r + '.')) return true;
  return false;
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

// --- Job Detail Drawer ---
function JobDrawer({ job, onClose, savedIds, onToggleSave }: {
  job: Job;
  onClose: () => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
}) {
  const id = String(job.id);
  const isSaved = savedIds.has(id);
  const badges = getJobBadges(job);
  const location = job.candidate_required_location || job.location || (job.remote ? 'Remote' : 'Worldwide');
  const type = job.job_type || job.job_types?.[0] || '';
  const logo = job.company_logo_url || job.company_logo;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              <CompanyLogo logo={logo} name={job.company_name} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{job.title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{job.company_name}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>
                {type && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{type.replace('_', ' ')}</span>}
                {job.salary && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.salary}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pt-4 shrink-0">
            {badges.map((b) => (
              <span key={b.label} className={`px-2.5 py-1 text-xs font-medium rounded-full border ${b.color}`}>{b.label}</span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {job.description ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p className="text-sm text-zinc-400">No description available.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
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
      </div>
    </div>
  );
}

// --- Job Card ---
function JobCard({ job, source, savedIds, onToggleSave, onOpen, onAutoApply }: {
  job: Job;
  source: string;
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (job: Job) => void;
  onAutoApply: (job: Job) => void;
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

  return (
    <div className="group bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 cursor-pointer"
      onClick={() => onOpen(job)}>
      <div className="flex items-start gap-4">
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
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                  {tag}
                </span>
              ))}
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
          <button
            onClick={() => onAutoApply(job)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-violet-600 border-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Auto Apply
          </button>
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
  const [source, setSource] = useState<'remotive' | 'arbeitnow' | 'jobicy' | 'themuse' | 'remoteok'>('remotive');
  const [search, setSearch] = useState('');
  const [category] = useState('software-dev');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState<'all' | 'remote' | 'onsite'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'salary'>('newest');
  const [total, setTotal] = useState(0);
  const [expLevel, setExpLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleAutoApply = (job: Job) => {
    const params = new URLSearchParams({
      url: job.url,
      title: job.title,
      company: job.company_name,
      description: job.description?.replace(/<[^>]+>/g, ' ').slice(0, 800) || '',
    });
    router.push(`/apply?${params.toString()}`);
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

  const fetchJobs = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ source, page: String(pageNum) });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (jobType) params.set('job_type', jobType);
      if (workMode === 'remote') params.set('remote', 'true');
      if (workMode === 'onsite') params.set('onsite', 'true');

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      const fetched: Job[] = data.jobs || [];

      setJobs((prev) => append ? [...prev, ...fetched] : fetched);
      setTotal(data.total || 0);
      setHasMore(fetched.length === 20);
    } catch {
      if (!append) setJobs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [source, search, category, jobType, workMode]);

  // Debounce search
  useEffect(() => {
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
  };

  const hasActiveFilters = search || category || jobType || workMode !== 'all' || expLevel;

  // Sort + filter displayed jobs
  const displayedJobs = [...jobs]
    .filter((j) => showSavedOnly ? savedIds.has(String(j.id)) : true)
    // Filter out western-only jobs
    .filter((j) => !isWesternOnly(j.candidate_required_location || j.location || ''))
    .filter((j) => {
      if (!expLevel) return true;
      const minYrs = getMinYears(j.title, j.description);
      const required = parseInt(expLevel, 10);
      if (expLevel === '0') return minYrs === 0 || minYrs === -1;
      if (minYrs === -1) return false;
      return minYrs >= required && minYrs < required + (required >= 5 ? 99 : 2);
    })
    .sort((a, b) => {
      if (sortBy === 'salary') {
        const aHas = a.salary ? 1 : 0;
        const bHas = b.salary ? 1 : 0;
        return bHas - aHas;
      }
      return getDaysAgo(a.publication_date, a.created_at) - getDaysAgo(b.publication_date, b.created_at);
    });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Job Board</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {loading ? 'Loading...' : `${displayedJobs.length} jobs${total > displayedJobs.length ? ` of ${total}` : ''}`}
              </p>
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
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'salary')}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="salary">Salary Listed</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Source tabs */}
          <div className="flex flex-wrap gap-2 mt-4">
            {([
              { id: 'remotive', label: 'Remotive' },
              { id: 'arbeitnow', label: 'Arbeitnow' },
              { id: 'jobicy', label: 'Jobicy' },
              { id: 'themuse', label: 'The Muse' },
              { id: 'remoteok', label: 'RemoteOK' },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => { setSource(s.id); setJobType(''); setWorkMode('all'); }}
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
          <div className="flex gap-2 mt-3">
            {(['all', 'remote', 'onsite'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  workMode === mode
                    ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                {mode === 'all' ? '🌐 All' : mode === 'remote' ? '🏠 Remote' : '🏢 On-site'}
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
                placeholder="Search jobs, companies, skills..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
                    key={`${source}-${job.id}`}
                    job={job}
                    source={source}
                    savedIds={savedIds}
                    onToggleSave={toggleSave}
                    onOpen={setSelectedJob}
                    onAutoApply={handleAutoApply}
                  />
                ))}
              </div>

              {/* Load more */}
              {hasMore && !showSavedOnly && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Jobs'}
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
        />
      )}
    </div>
  );
}
