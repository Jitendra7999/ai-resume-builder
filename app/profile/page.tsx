'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  User, Mail, Phone, Briefcase, BookOpen, Wrench, Lock,
  Plus, Trash2, Save, Loader2, CheckCircle, Eye, EyeOff, FileText, LogOut
} from 'lucide-react';
import { ResumePreview } from '@/components/ResumePreview';

type Profile = {
  name: string; email: string; phone: string; linkedin: string;
  role: string; expYears: string; skills: string; experience: string; education: string;
};

type Resume = {
  id: string; name: string; jobTitle: string; content: string; createdAt?: string;
};

type GmailCreds = { gmailUser: string; gmailAppPassword: string };

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'resumes', label: 'Resumes', icon: FileText },
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'account', label: 'Account', icon: Lock },
];

function SaveBtn({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    name: '', email: '', phone: '', linkedin: '',
    role: 'Frontend Developer', expYears: '1',
    skills: '', experience: '', education: '',
  });

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [newResume, setNewResume] = useState<Omit<Resume, 'id'>>({ name: '', jobTitle: '', content: '' });
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [showResumeForm, setShowResumeForm] = useState(false);

  const [gmail, setGmail] = useState<GmailCreds>({ gmailUser: '', gmailAppPassword: '' });
  const [showPass, setShowPass] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [passError, setPassError] = useState('');

  // Fetch user data
  useEffect(() => {
    if (!userId) return;
    setFetchLoading(true);
    fetch('/api/profile', { headers: { 'x-user-id': userId } })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user.profile || profile);
          setResumes(data.user.resumes || []);
          setGmail(data.user.gmailCredentials || gmail);
        }
      })
      .finally(() => setFetchLoading(false));
  }, [userId]);

  const api = async (body: object) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api({ action: 'updateProfile', profile });
    setLoading(false); showSaved();
  };

  const saveGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api({ action: 'updateGmail', gmailCredentials: gmail });
    setLoading(false); showSaved();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (passwords.newPass !== passwords.confirm) return setPassError('New passwords do not match');
    if (passwords.newPass.length < 6) return setPassError('Password must be at least 6 characters');
    setLoading(true);
    const data = await api({ action: 'changePassword', currentPassword: passwords.current, newPassword: passwords.newPass });
    setLoading(false);
    if (data.error) setPassError(data.error);
    else { showSaved(); setPasswords({ current: '', newPass: '', confirm: '' }); }
  };

  const addResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = await api({ action: 'addResume', resume: newResume });
    if (data.resume) setResumes((prev) => [...prev, data.resume]);
    setNewResume({ name: '', jobTitle: '', content: '' });
    setShowResumeForm(false);
    setLoading(false);
  };

  const saveEditResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResume) return;
    setLoading(true);
    await api({ action: 'updateResume', resume: editingResume });
    setResumes((prev) => prev.map((r) => r.id === editingResume.id ? editingResume : r));
    setEditingResume(null);
    setLoading(false); showSaved();
  };

  const deleteResume = async (id: string) => {
    await api({ action: 'deleteResume', resumeId: id });
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {profile.name?.charAt(0).toUpperCase() || (session?.user as any)?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="font-bold text-zinc-900 dark:text-zinc-100">{profile.name || (session?.user as any)?.username}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{profile.role} · {profile.expYears} yr exp</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 max-w-4xl mx-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={saveProfile} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-5">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block"><User className="w-3 h-3" />Full Name</label>
                  <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Arjun Sharma"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block"><Mail className="w-3 h-3" />Email</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="arjun@gmail.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block"><Phone className="w-3 h-3" />Phone</label>
                  <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 9999999999"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">LinkedIn URL</label>
                  <input value={profile.linkedin} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block"><Briefcase className="w-3 h-3" />Current Role</label>
                  <input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    placeholder="Frontend Developer"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Experience (years)</label>
                  <input value={profile.expYears} onChange={(e) => setProfile({ ...profile, expYears: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block"><Wrench className="w-3 h-3" />Skills (comma separated)</label>
                <input value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  placeholder="React, Node.js, TypeScript, MongoDB..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Work Experience</label>
                <textarea value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  rows={3} placeholder="Frontend Developer at XYZ (Jan 2023 - Present)..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1 block"><BookOpen className="w-3 h-3" />Education</label>
                <textarea value={profile.education} onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  rows={2} placeholder="B.Tech Computer Science, RGPV (2017-2021)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="flex justify-end">
                <SaveBtn loading={loading} saved={saved} />
              </div>
            </form>
          )}

          {/* RESUMES TAB */}
          {activeTab === 'resumes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Saved Resumes</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Store different resumes for different job types</p>
                </div>
                <button onClick={() => { setShowResumeForm(true); setEditingResume(null); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4" /> Add Resume
                </button>
              </div>

              {/* Add/Edit form */}
              {(showResumeForm || editingResume) && (
                <form onSubmit={editingResume ? saveEditResume : addResume}
                  className="bg-white dark:bg-zinc-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-5 space-y-3">
                  <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {editingResume ? 'Edit Resume' : 'New Resume'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Resume Name</label>
                      <input
                        value={editingResume ? editingResume.name : newResume.name}
                        onChange={(e) => editingResume
                          ? setEditingResume({ ...editingResume, name: e.target.value })
                          : setNewResume({ ...newResume, name: e.target.value })}
                        placeholder="Frontend React Resume"
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Target Job Title</label>
                      <input
                        value={editingResume ? editingResume.jobTitle : newResume.jobTitle}
                        onChange={(e) => editingResume
                          ? setEditingResume({ ...editingResume, jobTitle: e.target.value })
                          : setNewResume({ ...newResume, jobTitle: e.target.value })}
                        placeholder="React Developer"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Resume Content</label>
                    <textarea
                      value={editingResume ? editingResume.content : newResume.content}
                      onChange={(e) => editingResume
                        ? setEditingResume({ ...editingResume, content: e.target.value })
                        : setNewResume({ ...newResume, content: e.target.value })}
                      rows={6} placeholder="Paste your resume text here..."
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-xs" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setShowResumeForm(false); setEditingResume(null); }}
                      className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 text-zinc-500 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                      Cancel
                    </button>
                    <SaveBtn loading={loading} saved={saved} />
                  </div>
                </form>
              )}

              {/* Resume list */}
              {resumes.length === 0 && !showResumeForm ? (
                <div className="text-center py-12 text-zinc-400 dark:text-zinc-600">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No resumes saved yet</p>
                  <p className="text-xs mt-1">Add different resumes for different job types</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {resumes.map((r) => (
                    <div key={r.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{r.name}</h3>
                          {r.jobTitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">🎯 {r.jobTitle}</p>}
                          {r.createdAt && <p className="text-xs text-zinc-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setPreviewResume(r)}
                            className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 text-zinc-500 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                        <button onClick={() => { setEditingResume(r); setShowResumeForm(false); }}
                            className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 text-zinc-500 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => deleteResume(r.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <pre className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2 max-h-20 overflow-hidden font-mono whitespace-pre-wrap line-clamp-3">
                        {r.content?.slice(0, 200)}...
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GMAIL TAB */}
          {activeTab === 'gmail' && (
            <form onSubmit={saveGmail} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Gmail Credentials</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Used to send emails from the Email HR feature</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                Use a <strong>Gmail App Password</strong> — not your regular password. Generate one at <strong>myaccount.google.com/apppasswords</strong> → Select "Mail"
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Gmail Address</label>
                <input type="email" value={gmail.gmailUser} onChange={(e) => setGmail({ ...gmail, gmailUser: e.target.value })}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">App Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={gmail.gmailAppPassword}
                    onChange={(e) => setGmail({ ...gmail, gmailAppPassword: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full px-3 pr-10 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <SaveBtn loading={loading} saved={saved} />
              </div>
            </form>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Account Info</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Username: <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{(session?.user as any)?.username}</span></p>
              </div>

              <form onSubmit={changePassword} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Change Password</h2>
                {['current', 'newPass', 'confirm'].map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block capitalize">
                      {field === 'current' ? 'Current Password' : field === 'newPass' ? 'New Password' : 'Confirm New Password'}
                    </label>
                    <input type="password"
                      value={passwords[field as keyof typeof passwords]}
                      onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                ))}
                {passError && <p className="text-xs text-red-500">{passError}</p>}
                {saved && <p className="text-xs text-emerald-500">Password changed successfully!</p>}
                <div className="flex justify-end">
                  <SaveBtn loading={loading} saved={false} />
                </div>
              </form>

              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-red-200 dark:border-red-800 p-6">
                <h2 className="font-semibold text-red-600 dark:text-red-400 mb-1">Sign Out</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Sign out of your account on this device</p>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    {previewResume && (
      <ResumePreview
        content={previewResume.content}
        name={previewResume.name}
        onClose={() => setPreviewResume(null)}
      />
    )}
    </div>
  );
}
