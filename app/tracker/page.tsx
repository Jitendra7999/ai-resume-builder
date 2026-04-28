'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Trash2, ExternalLink, RefreshCw, ChevronDown } from 'lucide-react';

type ApplicationStatus = 'Applied' | 'In Review' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';

type Application = {
  id: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  ats: string;
  appliedAt: string;
  status: ApplicationStatus;
  notes: string;
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  'Applied':    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'In Review':  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'Interview':  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  'Offer':      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  'Rejected':   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  'Withdrawn':  'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:border-zinc-600',
};

const ALL_STATUSES: ApplicationStatus[] = ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const STATS = [
  { label: 'Total Applied', key: 'total', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Interviews', key: 'Interview', color: 'text-violet-600 dark:text-violet-400' },
  { label: 'Offers', key: 'Offer', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Rejected', key: 'Rejected', color: 'text-red-500 dark:text-red-400' },
];

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'All'>('All');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('applied_jobs');
    if (saved) setApplications(JSON.parse(saved));
  }, []);

  const save = (updated: Application[]) => {
    setApplications(updated);
    localStorage.setItem('applied_jobs', JSON.stringify(updated));
  };

  const updateStatus = (id: string, status: ApplicationStatus) => {
    save(applications.map((a) => a.id === id ? { ...a, status } : a));
  };

  const deleteApp = (id: string) => {
    save(applications.filter((a) => a.id !== id));
  };

  const saveNote = (id: string) => {
    save(applications.map((a) => a.id === id ? { ...a, notes: noteText } : a));
    setEditingNote(null);
  };

  const filtered = filterStatus === 'All' ? applications : applications.filter((a) => a.status === filterStatus);

  const stats = {
    total: applications.length,
    Interview: applications.filter((a) => a.status === 'Interview').length,
    Offer: applications.filter((a) => a.status === 'Offer').length,
    Rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Application Tracker</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{applications.length} jobs tracked</p>
            </div>
          </div>
          {applications.length > 0 && (
            <button onClick={() => { if (confirm('Clear all applications?')) save([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {/* Stats */}
        {applications.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {STATS.map((s) => (
              <div key={s.key} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-100 dark:border-zinc-700 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{stats[s.key as keyof typeof stats]}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {applications.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(['All', ...ALL_STATUSES] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  filterStatus === s
                    ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                }`}>
                {s} {s !== 'All' && applications.filter(a => a.status === s).length > 0 && `(${applications.filter(a => a.status === s).length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {applications.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 dark:text-zinc-600">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No applications tracked yet</p>
            <p className="text-sm mt-1">Use <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">Auto Apply</span> to apply — jobs are saved here automatically</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
            <p className="text-sm">No applications with status "{filterStatus}"</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-3">
            {filtered.map((app) => (
              <div key={app.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Company initial */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {app.companyName?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{app.jobTitle || 'Unknown Role'}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{app.companyName || 'Unknown Company'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Status dropdown */}
                        <div className="relative">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                            className={`appearance-none pl-2.5 pr-7 py-1 text-xs font-medium rounded-full border cursor-pointer focus:outline-none ${STATUS_STYLES[app.status]}`}
                          >
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                        </div>
                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => deleteApp(app.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <span>📅 {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {app.ats && app.ats !== 'generic' && (
                        <span className="capitalize">🔧 {app.ats}</span>
                      )}
                    </div>

                    {/* Notes */}
                    {editingNote === app.id ? (
                      <div className="mt-2 flex gap-2">
                        <input autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveNote(app.id); if (e.key === 'Escape') setEditingNote(null); }}
                          placeholder="Add a note..."
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={() => saveNote(app.id)} className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                        <button onClick={() => setEditingNote(null)} className="px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 text-zinc-500 rounded-lg hover:bg-zinc-50">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNote(app.id); setNoteText(app.notes || ''); }}
                        className="mt-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                        {app.notes ? `📝 ${app.notes}` : '+ Add note'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
