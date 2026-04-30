'use client';

import { useState, useEffect } from 'react';
import { Briefcase, ChevronDown, Download, Edit2, X, CheckCircle, Clock, XCircle, Gift, AlertCircle, ExternalLink } from 'lucide-react';

type ApplicationStatus = 'applied' | 'interviewing' | 'rejected' | 'offered' | 'ghosted';

interface Application {
  _id?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  appliedAt: Date;
  status: ApplicationStatus;
  responseReceivedAt?: Date;
  interviewDate?: Date;
  interviewType?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  offerSalary?: string;
  notes?: string;
  source?: string;
  matchScore?: number;
  ats?: string;
  coverLetter?: string;
}

const statusColors = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  interviewing: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  offered: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  ghosted: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-300',
};

const statusIcons = {
  applied: <Clock className="w-4 h-4" />,
  interviewing: <Briefcase className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  offered: <Gift className="w-4 h-4" />,
  ghosted: <AlertCircle className="w-4 h-4" />,
};

function ApplicationEditModal({ app, onClose, onSave }: {
  app: Application;
  onClose: () => void;
  onSave: (updated: Application) => void;
}) {
  const [edited, setEdited] = useState(app);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{edited.jobTitle}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={edited.status}
              onChange={(e) => setEdited({ ...edited, status: e.target.value as ApplicationStatus })}
              className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="rejected">Rejected</option>
              <option value="offered">Offered</option>
              <option value="ghosted">Ghosted</option>
            </select>
          </div>

          {edited.status === 'interviewing' && (
            <div>
              <label className="text-sm font-medium">Interview Date</label>
              <input
                type="datetime-local"
                value={edited.interviewDate ? new Date(edited.interviewDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEdited({ ...edited, interviewDate: new Date(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
          )}

          {edited.status === 'interviewed' && (
            <div>
              <label className="text-sm font-medium">Interview Type</label>
              <select
                value={edited.interviewType || ''}
                onChange={(e) => setEdited({ ...edited, interviewType: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              >
                <option value="">Select type</option>
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
          )}

          {edited.status === 'rejected' && (
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <textarea
                value={edited.rejectionReason || ''}
                onChange={(e) => setEdited({ ...edited, rejectionReason: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                rows={3}
              />
            </div>
          )}

          {edited.status === 'offered' && (
            <div>
              <label className="text-sm font-medium">Offer Salary</label>
              <input
                type="text"
                placeholder="e.g., $120k - $150k"
                value={edited.offerSalary || ''}
                onChange={(e) => setEdited({ ...edited, offerSalary: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={edited.notes || ''}
              onChange={(e) => setEdited({ ...edited, notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
              rows={3}
              placeholder="Add any notes about this application..."
            />
          </div>

          <button
            onClick={() => {
              onSave(edited);
              onClose();
            }}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, onEdit }: { app: Application; onEdit: (app: Application) => void }) {
  const daysAgo = Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24));
  const responseTime = app.responseReceivedAt
    ? Math.floor((new Date(app.responseReceivedAt).getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{app.jobTitle}</h3>
            {app.matchScore !== undefined && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                {app.matchScore}% match
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{app.company}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <span>Applied {daysAgo} days ago</span>
            {responseTime !== null && <span>• Response in {responseTime} days</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusColors[app.status]}`}>
            {statusIcons[app.status]}
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
          </span>
          <button
            onClick={() => onEdit(app)}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-zinc-500" />
          </button>
          <a
            href={app.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-zinc-500" />
          </a>
        </div>
      </div>

      {app.notes && (
        <div className="mt-3 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded text-xs text-zinc-600 dark:text-zinc-400">
          <strong>Notes:</strong> {app.notes}
        </div>
      )}

      {app.status === 'offered' && app.offerSalary && (
        <div className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          💰 {app.offerSalary}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ApplicationStatus>('applied');
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [stats, setStats] = useState({ total: 0, responses: 0, responseRate: 0 });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const res = await fetch('/api/user/applied-jobs');
      const data = await res.json();
      setApplications(data.appliedJobs || []);
      setStats({
        total: data.totalApplications || 0,
        responses: data.totalResponses || 0,
        responseRate: data.responseRate || 0,
      });
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateApplication = async (updated: Application) => {
    try {
      await fetch('/api/user/applied-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: updated.jobUrl,
          status: updated.status,
          interviewDate: updated.interviewDate,
          rejectionReason: updated.rejectionReason,
          notes: updated.notes,
          responseReceivedAt: updated.status !== 'applied' ? new Date() : null,
        }),
      });
      await loadApplications();
    } catch (err) {
      console.error('Failed to update application:', err);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Job Title', 'Company', 'Applied Date', 'Status', 'Response Time (days)', 'Interview Date', 'Notes'],
      ...applications.map(app => [
        app.jobTitle,
        app.company,
        new Date(app.appliedAt).toLocaleDateString(),
        app.status,
        app.responseReceivedAt
          ? Math.floor((new Date(app.responseReceivedAt).getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 'N/A',
        app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : '',
        app.notes || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredApps = applications.filter(app => app.status === activeTab);

  const tabs: ApplicationStatus[] = ['applied', 'interviewing', 'offered', 'rejected', 'ghosted'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Briefcase className="w-8 h-8 text-emerald-600" />
                Applications
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {stats.total} applied • {stats.responses} responses • {stats.responseRate}% response rate
              </p>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Applied', count: applications.filter(a => a.status === 'applied').length, icon: '📨', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
              { label: 'Interviewing', count: applications.filter(a => a.status === 'interviewing').length, icon: '🎤', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
              { label: 'Offered', count: applications.filter(a => a.status === 'offered').length, icon: '🎉', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
              { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, icon: '❌', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.icon} {stat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {applications.filter(a => a.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading applications...</div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No applications in "{activeTab}" yet
            </div>
          ) : (
            filteredApps.map(app => (
              <ApplicationCard
                key={app.jobUrl}
                app={app}
                onEdit={setEditingApp}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingApp && (
        <ApplicationEditModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSave={updateApplication}
        />
      )}
    </div>
  );
}
