'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Upload, Send, Trash2, CheckCircle, XCircle, Clock, Loader2, ChevronDown, RefreshCw, AlertTriangle } from 'lucide-react';

type HRContact = {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  jobDescription: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sentAt?: string;
  error?: string;
};

type Profile = {
  senderName: string;
  senderEmail: string;
  experience: string;
  skills: string;
  role: string;
  expYears: string;
};

const DEFAULT_PROFILE: Profile = {
  senderName: 'Arjun Sharma',
  senderEmail: 'test@gmail.com',
  role: 'Frontend Developer',
  expYears: '1',
  experience: 'Frontend Developer at Techstuff Pvt Ltd (Jan 2023 - Present)',
  skills: 'React, Next.js, TypeScript, TailwindCSS, JavaScript',
};

const STATUS_STYLE = {
  pending: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-400',
  sent:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  failed:  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  skipped: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
};

const DAILY_LIMIT = 30;

export default function EmailHRPage() {
  const [contacts, setContacts] = useState<HRContact[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [resumeContent, setResumeContent] = useState('');
  const [sending, setSending] = useState(false);
  const [currentlySending, setCurrentlySending] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | HRContact['status']>('all');
  const [sentToday, setSentToday] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('hr_contacts');
    if (saved) setContacts(JSON.parse(saved));
    const savedProfile = localStorage.getItem('email_hr_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    const savedResume = localStorage.getItem('email_hr_resume');
    if (savedResume) setResumeContent(savedResume);

    // Count today's sent
    const today = new Date().toDateString();
    const savedContacts: HRContact[] = saved ? JSON.parse(saved) : [];
    setSentToday(savedContacts.filter((c) => c.status === 'sent' && c.sentAt && new Date(c.sentAt).toDateString() === today).length);
  }, []);

  const save = (updated: HRContact[]) => {
    setContacts(updated);
    localStorage.setItem('hr_contacts', JSON.stringify(updated));
  };

  const saveProfile = (p: Profile) => {
    setProfile(p);
    localStorage.setItem('email_hr_profile', JSON.stringify(p));
  };

  const saveResume = (r: string) => {
    setResumeContent(r);
    localStorage.setItem('email_hr_resume', r);
  };

  // Parse CSV — supports: name, email, company, jobTitle, jobDescription
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    return lines.slice(1).map((line, i) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
      return {
        id: `hr-${Date.now()}-${i}`,
        name: row['name'] || row['hr name'] || row['hrname'] || '',
        email: row['email'] || row['hr email'] || '',
        company: row['company'] || row['company name'] || '',
        jobTitle: row['jobtitle'] || row['job title'] || row['role'] || '',
        jobDescription: row['jobdescription'] || row['job description'] || row['description'] || '',
        status: 'pending' as const,
      };
    }).filter((c) => c.email.includes('@'));
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const parsed = parseCSV(text);
      const merged = [...contacts, ...parsed.filter((p) => !contacts.find((c) => c.email === p.email))];
      save(merged);
    };
    reader.readAsText(file);
  };

  const handlePasteCSV = () => {
    if (!csvText.trim()) return;
    const parsed = parseCSV(csvText);
    const merged = [...contacts, ...parsed.filter((p) => !contacts.find((c) => c.email === p.email))];
    save(merged);
    setCsvText('');
  };

  const addManual = () => {
    const newContact: HRContact = {
      id: `hr-${Date.now()}`,
      name: '', email: '', company: '', jobTitle: '', jobDescription: '', status: 'pending',
    };
    save([...contacts, newContact]);
  };

  const updateContact = (id: string, fields: Partial<HRContact>) => {
    save(contacts.map((c) => c.id === id ? { ...c, ...fields } : c));
  };

  const deleteContact = (id: string) => save(contacts.filter((c) => c.id !== id));

  const todayCount = () => {
    const today = new Date().toDateString();
    return contacts.filter((c) => c.status === 'sent' && c.sentAt && new Date(c.sentAt).toDateString() === today).length;
  };

  const sendBatch = async () => {
    const today = new Date().toDateString();
    const alreadySentToday = contacts.filter((c) => c.status === 'sent' && c.sentAt && new Date(c.sentAt).toDateString() === today).length;
    const remaining = DAILY_LIMIT - alreadySentToday;
    if (remaining <= 0) return;

    const toSend = contacts.filter((c) => c.status === 'pending').slice(0, remaining);
    if (toSend.length === 0) return;

    setSending(true);
    stopRef.current = false;
    let updated = [...contacts];

    for (const contact of toSend) {
      if (stopRef.current) break;
      setCurrentlySending(contact.email);

      try {
        const res = await fetch('/api/email-hr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.email,
            hrName: contact.name,
            company: contact.company,
            jobTitle: contact.jobTitle,
            jobDescription: contact.jobDescription,
            senderName: profile.senderName,
            senderEmail: profile.senderEmail,
            experience: profile.experience,
            skills: profile.skills,
            role: profile.role,
            expYears: profile.expYears,
            resumeContent,
          }),
        });
        const data = await res.json();
        updated = updated.map((c) => c.id === contact.id
          ? { ...c, status: data.success ? 'sent' : 'failed', sentAt: data.success ? new Date().toISOString() : undefined, error: data.error }
          : c);
        save(updated);
        setSentToday(todayCount());
        // Small delay between emails to avoid spam detection
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        updated = updated.map((c) => c.id === contact.id ? { ...c, status: 'failed', error: String(err) } : c);
        save(updated);
      }
    }

    setSending(false);
    setCurrentlySending('');
  };

  const filtered = filterStatus === 'all' ? contacts : contacts.filter((c) => c.status === filterStatus);
  const pendingCount = contacts.filter((c) => c.status === 'pending').length;
  const sentCount = contacts.filter((c) => c.status === 'sent').length;
  const failedCount = contacts.filter((c) => c.status === 'failed').length;
  const todaySent = todayCount();
  const canSendToday = DAILY_LIMIT - todaySent;

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Email HR</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{contacts.length} contacts · Send up to {DAILY_LIMIT}/day</p>
              </div>
            </div>

            {/* Daily progress */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Today's quota</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{todaySent} / {DAILY_LIMIT} sent</p>
              </div>
              <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(todaySent / DAILY_LIMIT) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Gmail warning */}
          {(!process.env.GMAIL_USER) && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Add <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">GMAIL_USER</code> and <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">GMAIL_APP_PASSWORD</code> to your <code className="font-mono">.env.local</code> to enable sending.</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 mt-3">
            {[
              { label: 'Total', val: contacts.length, color: 'text-zinc-600 dark:text-zinc-300' },
              { label: 'Pending', val: pendingCount, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Sent', val: sentCount, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Failed', val: failedCount, color: 'text-red-500 dark:text-red-400' },
              { label: 'Can send today', val: Math.max(0, canSendToday), color: 'text-violet-600 dark:text-violet-400' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* LEFT — controls */}
        <div className="w-72 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col overflow-y-auto p-4 gap-4">

          {/* Import CSV */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Import Contacts</p>
            <p className="text-xs text-zinc-400 mb-2">CSV columns: <code className="font-mono bg-zinc-100 dark:bg-zinc-700 px-1 rounded">name, email, company, jobTitle, jobDescription</code></p>
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300">
              <Upload className="w-4 h-4" /> Upload CSV File
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
            <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
              placeholder="Or paste CSV here..."
              rows={3}
              className="w-full mt-2 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <button onClick={handlePasteCSV} disabled={!csvText.trim()}
              className="w-full mt-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              Import from text
            </button>
            <button onClick={addManual}
              className="w-full mt-1 px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 text-zinc-500 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
              + Add manually
            </button>
          </div>

          {/* Resume */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Resume Content</p>
            <textarea value={resumeContent} onChange={(e) => saveResume(e.target.value)}
              placeholder="Paste your resume text here (will be attached to every email)..."
              rows={5}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Sender profile */}
          <div>
            <button onClick={() => setShowProfile(!showProfile)}
              className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Sender Profile
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </button>
            {showProfile && (
              <div className="space-y-2">
                {([
                  { key: 'senderName', label: 'Your Name' },
                  { key: 'senderEmail', label: 'Your Email' },
                  { key: 'role', label: 'Your Role (e.g. Frontend Developer)' },
                  { key: 'expYears', label: 'Experience (years)' },
                  { key: 'skills', label: 'Skills' },
                ] as const).map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-zinc-400 mb-0.5 block">{label}</label>
                    <input value={profile[key]} onChange={(e) => saveProfile({ ...profile, [key]: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-zinc-400 mb-0.5 block">Experience</label>
                  <textarea value={profile.experience} onChange={(e) => saveProfile({ ...profile, experience: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="space-y-2 mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-700">
            {canSendToday > 0 && pendingCount > 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Will send <strong>{Math.min(canSendToday, pendingCount)}</strong> emails now
              </p>
            )}
            {canSendToday <= 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">Daily limit reached. Come back tomorrow!</p>
            )}
            <button onClick={sendBatch}
              disabled={sending || pendingCount === 0 || canSendToday <= 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                : <><Send className="w-4 h-4" /> Send Today's Batch</>}
            </button>
            {sending && (
              <button onClick={() => { stopRef.current = true; }}
                className="w-full px-4 py-2 text-xs text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Stop Sending
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — contacts list */}
        <div className="flex-1 overflow-y-auto">
          {/* Filter tabs */}
          <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 flex items-center gap-2 z-10">
            {(['all', 'pending', 'sent', 'failed', 'skipped'] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize ${
                  filterStatus === s
                    ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                }`}>
                {s} {s !== 'all' && contacts.filter(c => c.status === s).length > 0 && `(${contacts.filter(c => c.status === s).length})`}
              </button>
            ))}
            <button onClick={() => save([])}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 dark:text-zinc-600">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No contacts yet</p>
              <p className="text-sm mt-1">Upload a CSV or add contacts manually</p>
              <p className="text-xs mt-2 text-zinc-400">Format: name, email, company, jobTitle, jobDescription</p>
            </div>
          ) : (
            <div className="p-4 space-y-2 max-w-4xl mx-auto">
              {filtered.map((contact) => (
                <div key={contact.id} className={`bg-white dark:bg-zinc-800 rounded-xl border p-4 transition-all ${
                  currentlySending === contact.email ? 'border-blue-400 shadow-md' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(contact.name || contact.email).charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                      <input value={contact.name} onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                        placeholder="HR Name"
                        className="px-2 py-1 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <input value={contact.email} onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                        placeholder="hr@company.com"
                        className="px-2 py-1 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <input value={contact.company} onChange={(e) => updateContact(contact.id, { company: e.target.value })}
                        placeholder="Company"
                        className="px-2 py-1 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <input value={contact.jobTitle} onChange={(e) => updateContact(contact.id, { jobTitle: e.target.value })}
                        placeholder="Job Title"
                        className="px-2 py-1 text-sm rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${STATUS_STYLE[contact.status]}`}>
                        {contact.status === 'sent' ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />{contact.status}</span>
                          : contact.status === 'failed' ? <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />{contact.status}</span>
                          : contact.status === 'pending' ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{contact.status}</span>
                          : contact.status}
                      </span>
                      {currentlySending === contact.email && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                        </span>
                      )}
                      <div className="flex gap-1">
                        {contact.status === 'failed' && (
                          <button onClick={() => updateContact(contact.id, { status: 'pending', error: undefined })}
                            className="p-1 text-zinc-400 hover:text-blue-500 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteContact(contact.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {contact.error && (
                    <p className="mt-2 text-xs text-red-500 dark:text-red-400 pl-11">{contact.error}</p>
                  )}
                  {contact.sentAt && (
                    <p className="mt-1 text-xs text-zinc-400 pl-11">Sent {new Date(contact.sentAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
