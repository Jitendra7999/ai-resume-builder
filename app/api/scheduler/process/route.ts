import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User, { IAppliedJob } from '@/lib/models/User';

/**
 * Process scheduled jobs - finds jobs that should be applied NOW
 * Call this endpoint every minute via external cron (EasyCron, GitHub Actions, etc)
 * URL: /api/scheduler/process?token=YOUR_CRON_SECRET
 */
export async function GET(req: NextRequest) {
  try {
    // Validate cron token for security
    const token = req.nextUrl.searchParams.get('token');
    if (token !== process.env.CRON_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find all users
    const users = await User.find({});
    const results: any[] = [];

    for (const user of users) {
      // Find jobs due for application (scheduledApplyTime <= NOW)
      const now = new Date();
      const dueJobs = user.scheduledJobs.filter(
        j => j.status === 'pending' && new Date(j.scheduledApplyTime) <= now
      );

      if (dueJobs.length === 0) continue;

      for (const scheduledJob of dueJobs.slice(0, 10)) { // Process max 10 per user per cycle
        try {
          // Call bulk-apply API to actually apply
          const applyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'}/api/bulk-apply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': String(user._id),
            },
            body: JSON.stringify({
              jobs: [{
                id: scheduledJob.jobId,
                url: scheduledJob.jobUrl,
                title: scheduledJob.jobTitle,
                company: scheduledJob.company,
                description: '', // Fetch from job board API if needed
              }],
              profile: user.profile,
              resumeContent: user.resumes[0]?.content || '',
              autoSubmit: true,
              alreadyAppliedUrls: user.appliedJobs.map(j => j.jobUrl),
            }),
          });

          if (applyRes.ok) {
            // Mark as applied
            scheduledJob.status = 'applied';
            scheduledJob.actualAppliedAt = new Date();

            // Also log in appliedJobs
            const appliedJob: IAppliedJob = {
              jobId: scheduledJob.jobId,
              jobTitle: scheduledJob.jobTitle,
              company: scheduledJob.company,
              jobUrl: scheduledJob.jobUrl,
              appliedAt: new Date(),
              status: 'applied',
              source: 'scheduled',
            };
            user.appliedJobs.push(appliedJob);

            results.push({ jobId: scheduledJob.jobId, status: 'applied', reason: 'Success' });
          } else {
            scheduledJob.status = 'failed';
            scheduledJob.reason = `Apply API returned ${applyRes.status}`;
            results.push({ jobId: scheduledJob.jobId, status: 'failed', reason: scheduledJob.reason });
          }
        } catch (err) {
          scheduledJob.status = 'failed';
          scheduledJob.reason = String(err);
          results.push({ jobId: scheduledJob.jobId, status: 'failed', reason: String(err) });
        }
      }

      await user.save();
    }

    return NextResponse.json({
      message: 'Scheduler processed',
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
