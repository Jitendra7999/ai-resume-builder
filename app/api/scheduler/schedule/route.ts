import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User, { IScheduledJob } from '@/lib/models/User';

type ScheduleJob = {
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.headers.get('x-user-id') || 'test-user';
    const { jobs, preferredTimes, maxPerHour, startDate } = await req.json();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Use preferred times from request or user preferences
    const applyTimes = preferredTimes || user.preferences.preferredApplyTimes || [9, 14, 17];
    const maxApplicationsPerHour = maxPerHour || user.preferences.maxApplicationsPerHour || 10;
    const baseDate = startDate ? new Date(startDate) : new Date();

    const scheduledJobs: IScheduledJob[] = [];
    let currentHourIndex = 0;
    let jobsInCurrentHour = 0;
    let currentDate = new Date(baseDate);

    for (const job of jobs as ScheduleJob[]) {
      // Check if already scheduled or applied
      const alreadyScheduled = user.scheduledJobs.find(j => j.jobUrl === job.jobUrl);
      const alreadyApplied = user.appliedJobs.find(j => j.jobUrl === job.jobUrl);
      if (alreadyScheduled || alreadyApplied) continue;

      // Move to next hour if current hour is full
      if (jobsInCurrentHour >= maxApplicationsPerHour) {
        currentHourIndex = (currentHourIndex + 1) % applyTimes.length;
        jobsInCurrentHour = 0;
        if (currentHourIndex === 0) {
          // Moved to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Create scheduled job
      const scheduleTime = new Date(currentDate);
      scheduleTime.setHours(applyTimes[currentHourIndex], 0, 0, 0);

      scheduledJobs.push({
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        company: job.company,
        jobUrl: job.jobUrl,
        scheduledApplyTime: scheduleTime,
        status: 'pending',
      });

      jobsInCurrentHour++;
    }

    // Add to user's scheduled jobs
    user.scheduledJobs.push(...scheduledJobs);
    await user.save();

    return NextResponse.json({
      message: `Scheduled ${scheduledJobs.length} applications`,
      scheduledJobs: scheduledJobs.slice(0, 10), // Return first 10 for preview
      totalScheduled: scheduledJobs.length,
      firstApply: scheduledJobs[0]?.scheduledApplyTime,
      lastApply: scheduledJobs[scheduledJobs.length - 1]?.scheduledApplyTime,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.headers.get('x-user-id') || 'test-user';

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const pending = user.scheduledJobs.filter(j => j.status === 'pending');
    const applied = user.scheduledJobs.filter(j => j.status === 'applied');
    const failed = user.scheduledJobs.filter(j => j.status === 'failed');

    return NextResponse.json({
      pending: pending.length,
      applied: applied.length,
      failed: failed.length,
      nextApply: pending.length > 0 ? pending[0].scheduledApplyTime : null,
      scheduledJobs: pending.slice(0, 20), // Next 20 to apply
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Mark a scheduled job as applied
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const userId = req.headers.get('x-user-id') || 'test-user';
    const { jobId, status, actualAppliedAt, reason } = await req.json();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const job = user.scheduledJobs.find(j => j.jobId === jobId);
    if (!job) return NextResponse.json({ error: 'Scheduled job not found' }, { status: 404 });

    job.status = status;
    if (actualAppliedAt) job.actualAppliedAt = new Date(actualAppliedAt);
    if (reason) job.reason = reason;

    await user.save();

    return NextResponse.json({ message: 'Scheduled job updated', job });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
