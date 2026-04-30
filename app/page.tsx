'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, FileText, Users, Target, TrendingUp, Linkedin,
  CheckCircle, ArrowRight, Star, Zap, Clock, AlertCircle, BarChart3, Calendar
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ appliedJobs: 0, savedJobs: 0, resumes: 0, responseRate: 0, responses: 0 });
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load from DB API
      const appRes = await fetch('/api/user/applied-jobs');
      if (appRes.ok) {
        const appData = await appRes.json();
        setStats({
          appliedJobs: appData.totalApplications || 0,
          responses: appData.totalResponses || 0,
          responseRate: appData.responseRate || 0,
          savedJobs: 0,
          resumes: 0,
        });
      }

      // Load best times
      const timesRes = await fetch('/api/scheduler/best-times');
      if (timesRes.ok) {
        const timesData = await timesRes.json();
        setBestTimes(timesData.bestHours || []);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Fallback to localStorage
      const savedJobs = localStorage.getItem('saved_jobs');
      const appliedJobs = JSON.parse(localStorage.getItem('applied_jobs') || '[]');
      setStats(prev => ({
        ...prev,
        appliedJobs: appliedJobs.length,
        savedJobs: savedJobs ? JSON.parse(savedJobs).length : 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Briefcase,
      title: 'Find Jobs',
      desc: 'Search 100k+ jobs matched to your skills',
      action: () => router.push('/jobs'),
      color: 'emerald',
    },
    {
      icon: FileText,
      title: 'Build Resume',
      desc: 'Create ATS-optimized resumes in minutes',
      action: () => router.push('/resume'),
      color: 'blue',
    },
    {
      icon: Target,
      title: 'Apply Smart',
      desc: 'Auto-fill applications with AI assistance',
      action: () => router.push('/apply'),
      color: 'violet',
    },
    {
      icon: TrendingUp,
      title: 'Ace Interview',
      desc: 'Practice with AI interviewer & feedback',
      action: () => router.push('/interview-preparation'),
      color: 'orange',
    },
  ];

  const recentActivity = [
    { icon: Star, text: 'Saved 5 jobs matching your skills', time: '2h ago' },
    { icon: Zap, text: 'Applied to Senior Developer role', time: '1d ago' },
    { icon: CheckCircle, text: 'Resume ATS score: 87%', time: '2d ago' },
  ];

  const handleLinkedinConnect = () => {
    // Mock LinkedIn OAuth - in production this would use LinkedIn OAuth2
    setLinkedinConnected(true);
    localStorage.setItem('linkedin_connected', 'true');
    alert('LinkedIn profile connected! You can now auto-fill your resume from LinkedIn.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Resume Master Pro
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">AI-powered career acceleration platform</p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg font-medium text-sm transition-colors"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/applications')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Applications</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{loading ? '-' : stats.appliedJobs}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/applications')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Responses</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{loading ? '-' : stats.responses}</p>
              </div>
              <Zap className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/applications')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Response Rate</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{loading ? '-' : stats.responseRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-violet-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/jobs')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Saved Jobs</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.savedJobs}</p>
              </div>
              <Briefcase className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Best Apply Times Card */}
        {bestTimes.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">🎯 Best Times to Apply</h3>
                <div className="grid grid-cols-3 gap-3">
                  {bestTimes.map((time, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-800/50 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{time.hour}:00</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{time.responseRate}% response</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{time.applicationsCount} apps</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/jobs')}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Schedule Smart Applications →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn Connect Banner */}
        {!linkedinConnected && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Linkedin className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Connect LinkedIn Profile</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Auto-fill your resume and get personalized job matches</p>
              </div>
            </div>
            <button
              onClick={handleLinkedinConnect}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Connect Now
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.title}
                  onClick={feature.action}
                  className="group bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all hover:shadow-lg"
                >
                  <div className={`w-10 h-10 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-left text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left mb-3">{feature.desc}</p>
                  <div className="flex items-center text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Get Started <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Recent Activity</h2>
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-200 dark:divide-zinc-700 overflow-hidden shadow-sm">
            {recentActivity.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{activity.text}</p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tips Section */}
        <section className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-8 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Pro Tips for Success</h3>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>✓ Optimize your resume for ATS (Applicant Tracking Systems)</li>
                <li>✓ Tailor each resume to the job description</li>
                <li>✓ Practice interview questions related to the role</li>
                <li>✓ Use keywords from job postings in your profile</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
