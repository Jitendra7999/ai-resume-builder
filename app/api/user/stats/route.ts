import { NextRequest, NextResponse } from 'next/server';

/**
 * User Statistics API
 * Returns user activity and application statistics
 */

export async function GET(req: NextRequest) {
  // Mock user stats - in production would query MongoDB
  const stats = {
    appliedJobs: 12,
    savedJobs: 34,
    resumes: 3,
    interviews: 5,
    interviewsPassed: 2,
    applicationRate: 0.75,
    averageResponseTime: '3 days',
    topSkills: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL'],
    resumeAtsScore: 87,
    profileCompleteness: 92,
    recentActivity: [
      { type: 'applied', title: 'Senior Developer at Google', date: '2 hours ago' },
      { type: 'saved', title: 'Full Stack Engineer at Meta', date: '1 day ago' },
      { type: 'interview', title: 'Frontend Coding Interview', date: '2 days ago' }
    ]
  };

  return NextResponse.json(stats);
}
