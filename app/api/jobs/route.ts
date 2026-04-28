import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'remotive';
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const jobType = searchParams.get('job_type') || '';
  const remote = searchParams.get('remote') || '';
  const onsite = searchParams.get('onsite') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    if (source === 'remotive') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (jobType) params.set('job_type', jobType);
      params.set('limit', '20');

      const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
      const data = await res.json();
      let jobs = data.jobs || [];

      // Client-side onsite filter: remotive is all remote, so onsite returns nothing
      if (onsite) jobs = [];

      return NextResponse.json({ jobs, total: data['job-count'] || 0 });
    }

    if (source === 'arbeitnow') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (remote) params.set('remote', 'true');
      params.set('page', String(page));

      const res = await fetch(`https://arbeitnow.com/api/job-board-api?${params}`);
      const data = await res.json();
      let jobs = data.data || [];

      // Filter onsite: remote === false
      if (onsite) jobs = jobs.filter((j: { remote?: boolean }) => j.remote === false);

      return NextResponse.json({ jobs, total: jobs.length });
    }

    return NextResponse.json({ jobs: [], total: 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
