import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'remotive';
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const jobType = searchParams.get('job_type') || '';
  const remote = searchParams.get('remote') || '';

  try {
    if (source === 'remotive') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (jobType) params.set('job_type', jobType);
      params.set('limit', '20');

      const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
      const data = await res.json();
      return NextResponse.json({ jobs: data.jobs || [], total: data['job-count'] || 0 });
    }

    if (source === 'arbeitnow') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (remote) params.set('remote', 'true');

      const res = await fetch(`https://arbeitnow.com/api/job-board-api?${params}`);
      const data = await res.json();
      return NextResponse.json({ jobs: data.data || [], total: data.data?.length || 0 });
    }

    return NextResponse.json({ jobs: [], total: 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
