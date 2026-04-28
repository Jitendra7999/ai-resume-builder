import { NextRequest, NextResponse } from 'next/server';

type NormalizedJob = {
  id: string | number;
  title: string;
  company_name: string;
  company_logo?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  location?: string;
  salary?: string;
  url: string;
  remote?: boolean;
  description?: string;
};

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
    // --- REMOTIVE ---
    if (source === 'remotive') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (jobType) params.set('job_type', jobType);
      params.set('limit', '20');

      const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://remotive.com/',
          'Origin': 'https://remotive.com',
        },
      });
      const data = await res.json();
      let jobs: NormalizedJob[] = data.jobs || [];

      if (onsite) {
        jobs = jobs.filter((j) =>
          (j.candidate_required_location || '').toLowerCase().includes('india')
        );
      }

      return NextResponse.json({ jobs, total: data['job-count'] || 0 });
    }

    // --- ARBEITNOW ---
    if (source === 'arbeitnow') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (remote) params.set('remote', 'true');
      params.set('page', String(page));

      const res = await fetch(`https://arbeitnow.com/api/job-board-api?${params}`);
      const data = await res.json();
      let jobs = data.data || [];

      if (onsite) {
        jobs = jobs.filter((j: { remote?: boolean; location?: string }) =>
          j.remote === false && (j.location || '').toLowerCase().includes('india')
        );
      }

      return NextResponse.json({ jobs, total: jobs.length });
    }

    // --- JOBICY ---
    if (source === 'jobicy') {
      const params = new URLSearchParams();
      params.set('count', '20');
      params.set('page', String(page));
      if (search) params.set('search', search);
      if (onsite) params.set('geo', 'india');
      else if (remote) params.set('geo', 'worldwide');

      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`);
      const data = await res.json();

      const jobs: NormalizedJob[] = (data.jobs || []).map((j: {
        id: string | number;
        jobTitle: string;
        companyName: string;
        companyLogo?: string;
        jobIndustry?: string[];
        jobType?: string;
        pubDate?: string;
        jobGeo?: string;
        annualSalaryMin?: number;
        annualSalaryMax?: number;
        url: string;
        jobDescription?: string;
      }) => ({
        id: j.id,
        title: j.jobTitle,
        company_name: j.companyName,
        company_logo: j.companyLogo,
        tags: j.jobIndustry || [],
        job_type: j.jobType,
        publication_date: j.pubDate,
        candidate_required_location: j.jobGeo,
        salary: j.annualSalaryMin
          ? `$${j.annualSalaryMin / 1000}k–$${j.annualSalaryMax ? j.annualSalaryMax / 1000 : '?'}k`
          : undefined,
        url: j.url,
        remote: true,
        description: j.jobDescription,
      }));

      return NextResponse.json({ jobs, total: data.totalCount || jobs.length });
    }

    // --- THE MUSE ---
    if (source === 'themuse') {
      const params = new URLSearchParams();
      params.set('page', String(page - 1));
      if (search) params.set('category', search);
      if (jobType === 'full_time') params.set('level', 'Mid Level');

      const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`);
      const data = await res.json();

      const jobs: NormalizedJob[] = (data.results || []).map((j: {
        id: string | number;
        name: string;
        company: { name: string };
        locations?: { name: string }[];
        levels?: { name: string }[];
        categories?: { name: string }[];
        refs: { landing_page: string };
        publication_date?: string;
        contents?: string;
      }) => {
        const locationName = j.locations?.[0]?.name || 'Worldwide';
        const isRemote = locationName.toLowerCase().includes('remote') || locationName.toLowerCase().includes('flexible');
        const isIndia = locationName.toLowerCase().includes('india');

        return {
          id: j.id,
          title: j.name,
          company_name: j.company?.name,
          tags: j.categories?.map((c) => c.name) || [],
          job_type: j.levels?.[0]?.name,
          publication_date: j.publication_date,
          candidate_required_location: locationName,
          url: j.refs?.landing_page,
          remote: isRemote,
          location: locationName,
          description: j.contents,
        };
      }).filter((j: NormalizedJob) => {
        if (onsite) return (j.location || '').toLowerCase().includes('india');
        return true;
      });

      return NextResponse.json({ jobs, total: data.total || jobs.length });
    }

    // --- REMOTEOK ---
    if (source === 'remoteok') {
      const res = await fetch('https://remoteok.com/api', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobBoard/1.0)' },
      });
      const data = await res.json();
      const raw = (Array.isArray(data) ? data.slice(1) : []) as Array<{
        id: string | number;
        position?: string;
        company?: string;
        logo?: string;
        tags?: string[];
        date?: string;
        url?: string;
        location?: string;
        salary_min?: string;
        salary_max?: string;
        description?: string;
      }>;

      let jobs: NormalizedJob[] = raw.map((j) => ({
        id: j.id,
        title: j.position || '',
        company_name: j.company || '',
        company_logo: j.logo,
        tags: j.tags || [],
        publication_date: j.date,
        candidate_required_location: j.location || 'Worldwide',
        salary: j.salary_min
          ? `$${Math.round(Number(j.salary_min) / 1000)}k–$${Math.round(Number(j.salary_max) / 1000)}k`
          : undefined,
        url: j.url || '',
        remote: true,
        description: j.description,
      }));

      if (search) {
        const q = search.toLowerCase();
        jobs = jobs.filter((j) =>
          j.title.toLowerCase().includes(q) ||
          j.company_name.toLowerCase().includes(q) ||
          (j.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      }

      if (onsite) {
        jobs = jobs.filter((j) =>
          (j.candidate_required_location || '').toLowerCase().includes('india')
        );
      }

      const start = (page - 1) * 20;
      const paginated = jobs.slice(start, start + 20);

      return NextResponse.json({ jobs: paginated, total: jobs.length });
    }

    return NextResponse.json({ jobs: [], total: 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
