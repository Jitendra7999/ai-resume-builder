import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

async function getSession() {
  return getServerSession({
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async jwt({ token, user }: any) {
        if (user) token.id = user.id;
        return token;
      },
      async session({ session, token }: any) {
        if (token) session.user.id = token.id;
        return session;
      },
    },
    providers: [],
  } as any);
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-user-id');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = await User.findById(token).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { action } = body;

  if (action === 'updateProfile') {
    await User.findByIdAndUpdate(userId, { profile: body.profile });
    return NextResponse.json({ success: true });
  }

  if (action === 'updateGmail') {
    await User.findByIdAndUpdate(userId, { gmailCredentials: body.gmailCredentials });
    return NextResponse.json({ success: true });
  }

  if (action === 'changePassword') {
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const isValid = await bcrypt.compare(body.currentPassword, user.password);
    if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    const hashed = await bcrypt.hash(body.newPassword, 12);
    await User.findByIdAndUpdate(userId, { password: hashed });
    return NextResponse.json({ success: true });
  }

  if (action === 'addResume') {
    const resume = { id: Date.now().toString(), ...body.resume, createdAt: new Date() };
    await User.findByIdAndUpdate(userId, { $push: { resumes: resume } });
    return NextResponse.json({ success: true, resume });
  }

  if (action === 'deleteResume') {
    await User.findByIdAndUpdate(userId, { $pull: { resumes: { id: body.resumeId } } });
    return NextResponse.json({ success: true });
  }

  if (action === 'updateResume') {
    await User.findOneAndUpdate(
      { _id: userId, 'resumes.id': body.resume.id },
      { $set: { 'resumes.$': { ...body.resume, createdAt: new Date() } } }
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
