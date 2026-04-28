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

function clean(jobs: NormalizedJob[]) {
  return jobs.filter((j) => {
    if (!j.title?.trim() || !j.company_name?.trim() || !j.url?.trim()) return false;
    // Keep only India, Worldwide, Remote, Global jobs
    const loc = (j.candidate_required_location || j.location || '').toLowerCase().trim();
    if (!loc) return true; // empty = worldwide
    const allowed = ['india', 'worldwide', 'remote', 'global', 'anywhere', 'international', 'work from home', 'wfh'];
    return allowed.some((a) => loc.includes(a));
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'jobicy';
  const rawSearch = searchParams.get('search') || '';
  // Covers: software dev, frontend dev, fullstack, backend, web dev, engineer
  const search = rawSearch || 'software developer frontend fullstack';
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
        },
      });
      const data = await res.json();
      let jobs: NormalizedJob[] = data.jobs || [];
      if (onsite) jobs = jobs.filter((j) => (j.candidate_required_location || '').toLowerCase().includes('india'));
      return NextResponse.json({ jobs: clean(jobs), total: data['job-count'] || 0 });
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

      return NextResponse.json({ jobs: clean(jobs), total: jobs.length });
    }

    // --- JOBICY ---
    if (source === 'jobicy') {
      const params = new URLSearchParams();
      params.set('count', '20');
      params.set('page', String(page));
      if (search) params.set('search', search);
      params.set('industry', 'engineering'); // lock to tech/engineering jobs
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

      return NextResponse.json({ jobs: clean(jobs), total: data.totalCount || jobs.length });
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

      return NextResponse.json({ jobs: clean(jobs), total: data.total || jobs.length });
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

    // --- JSEARCH ---
    if (source === 'jsearch') {
      const key = process.env.RAPIDAPI_KEY;
      if (!key) return NextResponse.json({ jobs: [], total: 0, error: 'Missing RAPIDAPI_KEY' });

      const params = new URLSearchParams();
      params.set('query', search || 'software developer');
      params.set('page', String(page));
      params.set('num_pages', '1');
      params.set('date_posted', 'all');
      if (onsite) params.set('query', `${search || 'software developer'} in India`);

      const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        },
      });
      const data = await res.json();

      const jobs: NormalizedJob[] = (data.data || [])
        .filter((j: { job_title?: string; employer_name?: string; job_apply_link?: string }) =>
          j.job_title && j.employer_name && j.job_apply_link
        )
        .map((j: {
          job_id: string;
          job_title: string;
          employer_name: string;
          employer_logo?: string;
          job_employment_type?: string;
          job_posted_at_datetime_utc?: string;
          job_city?: string;
          job_country?: string;
          job_is_remote?: boolean;
          job_min_salary?: number;
          job_max_salary?: number;
          job_salary_currency?: string;
          job_apply_link: string;
          job_description?: string;
          job_required_skills?: string[];
        }) => ({
          id: j.job_id,
          title: j.job_title,
          company_name: j.employer_name,
          company_logo: j.employer_logo,
          tags: j.job_required_skills?.slice(0, 5) || [],
          job_type: j.job_employment_type,
          publication_date: j.job_posted_at_datetime_utc,
          candidate_required_location: j.job_is_remote ? 'Worldwide' : `${j.job_city || ''} ${j.job_country || ''}`.trim(),
          salary: j.job_min_salary ? `${j.job_salary_currency || '$'}${Math.round(j.job_min_salary / 1000)}k–${Math.round((j.job_max_salary || j.job_min_salary) / 1000)}k` : undefined,
          url: j.job_apply_link,
          remote: j.job_is_remote,
          description: j.job_description,
        }));

      return NextResponse.json({ jobs: clean(jobs), total: data.data?.length || 0 });
    }

    // --- ALL SOURCES ---
    if (source === 'all') {
      const base = new URL(req.url);
      const fetchSource = async (src: string) => {
        const p = new URLSearchParams({ source: src, page: String(page) });
        if (search) p.set('search', search);
        if (onsite) p.set('onsite', 'true');
        if (remote) p.set('remote', 'true');
        const res = await fetch(`${base.origin}/api/jobs?${p}`).catch(() => null);
        if (!res) return [];
        const data = await res.json().catch(() => ({ jobs: [] }));
        return (data.jobs || []) as NormalizedJob[];
      };

      const sources = ['jobicy', 'arbeitnow', 'remoteok', 'themuse'];
      if (process.env.RAPIDAPI_KEY) sources.push('jsearch');

      const results = await Promise.allSettled(sources.map(fetchSource));

      const seen = new Set<string>();
      const combined: NormalizedJob[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const job of r.value) {
            const key = job.url || String(job.id);
            if (!seen.has(key)) { seen.add(key); combined.push(job); }
          }
        }
      }

      combined.sort((a, b) => {
        const da = a.publication_date ? new Date(a.publication_date).getTime() : 0;
        const db = b.publication_date ? new Date(b.publication_date).getTime() : 0;
        return db - da;
      });

      return NextResponse.json({ jobs: combined, total: combined.length });
    }

    return NextResponse.json({ jobs: [], total: 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
