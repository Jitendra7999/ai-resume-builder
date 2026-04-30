import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    let userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'x-user-id header required' }, { status: 400 });

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    // Return defaults if user doesn't exist or has no data
    if (!user || user.appliedJobs.length === 0) {
      return NextResponse.json({
        bestHours: [
          { hour: 9, applicationsCount: 0, responseRate: 70 },
          { hour: 14, applicationsCount: 0, responseRate: 65 },
          { hour: 17, applicationsCount: 0, responseRate: 60 }
        ],
        bestDays: [{ dayOfWeek: 1, dayName: 'Monday', applicationsCount: 0, responseRate: 75 }],
        totalApplications: 0,
        totalResponses: 0,
        recommendation: 'No application history yet. Apply to 10+ jobs to get personalized recommendations.',
      });
    }

    // Analyze applied jobs by time
    const hourStats = new Map<number, { count: number; responses: number }>();
    const dayStats = new Map<number, { count: number; responses: number }>();

    for (const job of user.appliedJobs) {
      const hour = new Date(job.appliedAt).getHours();
      const day = new Date(job.appliedAt).getDay();

      // By hour
      if (!hourStats.has(hour)) hourStats.set(hour, { count: 0, responses: 0 });
      const hstat = hourStats.get(hour)!;
      hstat.count++;
      if (job.responseReceivedAt) hstat.responses++;

      // By day
      if (!dayStats.has(day)) dayStats.set(day, { count: 0, responses: 0 });
      const dstat = dayStats.get(day)!;
      dstat.count++;
      if (job.responseReceivedAt) dstat.responses++;
    }

    // Calculate response rates
    const bestHours = Array.from(hourStats.entries())
      .map(([hour, stats]) => ({
        hour,
        applicationsCount: stats.count,
        responseRate: Math.round((stats.responses / stats.count) * 100),
      }))
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 3); // Top 3

    const bestDays = Array.from(dayStats.entries())
      .map(([day, stats]) => ({
        dayOfWeek: day,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        applicationsCount: stats.count,
        responseRate: Math.round((stats.responses / stats.count) * 100),
      }))
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 2); // Top 2

    // If no data, return defaults
    if (bestHours.length === 0) {
      bestHours.push(
        { hour: 9, applicationsCount: 0, responseRate: 70 },
        { hour: 14, applicationsCount: 0, responseRate: 65 },
        { hour: 17, applicationsCount: 0, responseRate: 60 }
      );
    }

    return NextResponse.json({
      bestHours,
      bestDays: bestDays.length > 0 ? bestDays : [{ dayOfWeek: 1, dayName: 'Monday', applicationsCount: 0, responseRate: 75 }],
      totalApplications: user.appliedJobs.length,
      totalResponses: user.appliedJobs.filter(j => j.responseReceivedAt).length,
      recommendation: bestHours.length > 0
        ? `Best time to apply: ${bestHours[0].hour}:00 - ${bestHours[0].responseRate}% response rate`
        : 'Need more application history to analyze',
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
