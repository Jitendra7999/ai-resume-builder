import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User, { IAppliedJob } from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    let userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'x-user-id header required' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // Filter by status
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      return NextResponse.json({
        appliedJobs: [],
        totalApplications: 0,
        totalResponses: 0,
        responseRate: 0,
        byStatus: { applied: 0, interviewing: 0, rejected: 0, offered: 0, ghosted: 0 },
      });
    }

    let jobs = user.appliedJobs;
    if (status) jobs = jobs.filter(j => j.status === status);

    // Recalculate response rate and best times
    const totalApps = jobs.length;
    const totalResponses = jobs.filter(j => j.responseReceivedAt).length;
    const responseRate = totalApps > 0 ? Math.round((totalResponses / totalApps) * 100) : 0;

    return NextResponse.json({
      appliedJobs: jobs.slice(0, limit),
      totalApplications: totalApps,
      totalResponses,
      responseRate,
      byStatus: {
        applied: jobs.filter(j => j.status === 'applied').length,
        interviewing: jobs.filter(j => j.status === 'interviewing').length,
        rejected: jobs.filter(j => j.status === 'rejected').length,
        offered: jobs.filter(j => j.status === 'offered').length,
        ghosted: jobs.filter(j => j.status === 'ghosted').length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    let userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'x-user-id header required' }, { status: 400 });

    const appliedJob: IAppliedJob = await req.json();

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already applied to this URL
    const existing = user.appliedJobs.find(j => j.jobUrl === appliedJob.jobUrl);
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });
    }

    user.appliedJobs.push(appliedJob);
    user.applicationAnalytics.totalApplications = user.appliedJobs.length;
    await user.save();

    return NextResponse.json({ message: 'Job application recorded', job: appliedJob });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    let userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'x-user-id header required' }, { status: 400 });

    const { jobUrl, status, interviewDate, rejectionReason, notes, responseReceivedAt } = await req.json();

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const job = user.appliedJobs.find(j => j.jobUrl === jobUrl);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Update job fields
    if (status) job.status = status;
    if (interviewDate) job.interviewDate = new Date(interviewDate);
    if (rejectionReason) job.rejectionReason = rejectionReason;
    if (notes) job.notes = notes;
    if (responseReceivedAt) job.responseReceivedAt = new Date(responseReceivedAt);

    await user.save();

    return NextResponse.json({ message: 'Job updated', job });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    let userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'x-user-id header required' }, { status: 400 });

    const { jobUrl } = await req.json();

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.appliedJobs = user.appliedJobs.filter(j => j.jobUrl !== jobUrl);
    await user.save();

    return NextResponse.json({ message: 'Job removed' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
