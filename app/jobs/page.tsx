'use client';

import { useState, useEffect, useCallback } from 'react';

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
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

function timeAgo(dateStr?: string, timestamp?: number): string {
  const date = dateStr ? new Date(dateStr) : timestamp ? new Date(timestamp * 1000) : null;
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function BriefcaseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function MapPinIcon({ className = 'w-3 h-3' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon({ className = 'w-3 h-3' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function FilterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function JobCard({ job, source }: { job: Job; source: string }) {
  const logo = job.company_logo_url || job.company_logo;
  const location = job.candidate_required_location || job.location || (job.remote ? 'Remote' : 'Worldwide');
  const type = job.job_type || job.job_types?.[0] || '';
  const postedAt = timeAgo(job.publication_date, job.created_at);
  const tags = job.tags?.slice(0, 4) || [];

  return (
    <div className="group bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt={job.company_name} className="w-10 h-10 object-contain" />
          ) : (
            <BriefcaseIcon className="w-5 h-5 text-zinc-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{job.company_name}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <MapPinIcon /> {location}
            </span>
            {type && (
              <span className="flex items-center gap-1">
                <ClockIcon /> {type.replace('_', ' ')}
              </span>
            )}
            {postedAt && <span>{postedAt}</span>}
            {job.salary && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{job.salary}</span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'remotive' | 'arbeitnow'>('remotive');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [jobType, setJobType] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ source });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (jobType) params.set('job_type', jobType);
      if (remoteOnly) params.set('remote', 'true');

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [source, search, category, jobType, remoteOnly]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setJobType('');
    setRemoteOnly(false);
  };

  const hasActiveFilters = search || category || jobType || remoteOnly;

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Job Board</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {loading ? 'Loading...' : total > 0 ? `${total} jobs found` : 'Discover remote opportunities'}
              </p>
            </div>
          </div>

          {/* Source tabs */}
          <div className="flex gap-2 mt-4">
            {(['remotive', 'arbeitnow'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSource(s); setCategory(''); setJobType(''); setRemoteOnly(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  source === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                {s === 'remotive' ? 'Remotive' : 'Arbeitnow'}
              </button>
            ))}
          </div>

          {/* Search + filter bar */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <SearchIcon />
              </span>
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
              <FilterIcon />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <XIcon /> Clear
              </button>
            )}
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
              {source === 'remotive' && (
                <>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {REMOTIVE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </>
              )}
              {source === 'arbeitnow' && (
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Remote only
                </label>
              )}
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
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
              <BriefcaseIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No jobs found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {jobs.map((job) => (
                <JobCard key={`${source}-${job.id}`} job={job} source={source} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
