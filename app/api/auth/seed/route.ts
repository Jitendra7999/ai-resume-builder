import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

// POST /api/auth/seed — creates users manually (admin use only)
export async function POST(req: NextRequest) {
  const { adminKey, users } = await req.json();

  if (adminKey !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const results = [];

  for (const u of users) {
    const exists = await User.findOne({ username: u.username });
    if (exists) {
      results.push({ username: u.username, status: 'already exists' });
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 12);
    await User.create({
      username: u.username,
      password: hashed,
      profile: { name: u.name || u.username, email: u.email || '' },
    });
    results.push({ username: u.username, status: 'created' });
  }

  return NextResponse.json({ results });
}
