import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get user ID from header
    let userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'x-user-id header required' }, { status: 400 });

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      return NextResponse.json({ error: `User ${userId} not found. Create user first.` }, { status: 404 });
    }

    return NextResponse.json({
      profile: user.profile,
      skills: user.profile.skills.split(',').map(s => s.trim()).filter(Boolean),
      expYears: parseInt(user.profile.expYears, 10),
      resumes: user.resumes,
      preferences: user.preferences,
      analytics: user.applicationAnalytics,
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

    const { profile, skills, expYears, preferences } = await req.json();

    // Try to find by ObjectId first, then by username
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        username: userId,
        password: 'placeholder',
        profile: profile || {},
      });
    }

    user = await User.findByIdAndUpdate(
      userId,
      {
        profile: {
          ...profile,
          skills: Array.isArray(skills) ? skills.join(',') : skills,
          expYears: String(expYears),
        },
        ...(preferences && { preferences }),
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Profile updated',
      profile: user.profile,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
