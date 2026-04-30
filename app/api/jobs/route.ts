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

function deriveRemote(location?: string): boolean {
  const loc = (location || '').toLowerCase();
  return loc.includes('remote') || loc.includes('worldwide') || loc.includes('global') || loc === '';
}

function normalizeLocation(loc?: string): string {
  if (!loc) return 'Worldwide';
  const l = loc.trim();
  if (!l || l === 'Global' || l === 'Worldwide' || l === 'Anywhere') return 'Worldwide';
  return l;
}

function clean(jobs: NormalizedJob[]) {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    // Remove jobs missing required fields
    if (!j.title?.trim() || !j.company_name?.trim() || !j.url?.trim()) return false;
    // Remove duplicate URLs
    const key = j.url.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    // Remove obviously junk titles
    const title = j.title.toLowerCase();
    const junk = ['test job', 'example job', '[removed]', 'n/a'];
    if (junk.some(k => title.includes(k))) return false;
    return true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'jobicy';
  const rawSearch = searchParams.get('search') || '';
  const search = rawSearch || 'software developer frontend fullstack';
  const category = searchParams.get('category') || '';
  const jobType = searchParams.get('job_type') || '';
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
      const jobs: NormalizedJob[] = (data.jobs || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        company_name: j.company_name,
        company_logo: j.company_logo_url,
        tags: j.tags || [],
        job_type: j.job_type,
        publication_date: j.publication_date,
        candidate_required_location: normalizeLocation(j.candidate_required_location),
        salary: j.salary || '',
        url: j.url,
        remote: j.remote ?? deriveRemote(j.candidate_required_location),
        description: j.description,
      }));
      return NextResponse.json({ jobs: clean(jobs), total: data['job-count'] || 0 });
    }

    // --- ARBEITNOW ---
    if (source === 'arbeitnow') {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));

      const res = await fetch(`https://arbeitnow.com/api/job-board-api?${params}`);
      const data = await res.json();
      const jobs: NormalizedJob[] = (data.data || []).map((j: any) => ({
        id: j.slug || j.id,
        title: j.title,
        company_name: j.company_name,
        tags: j.tags || [],
        job_type: j.job_types?.[0] || j.job_type || '',
        publication_date: j.published_at || j.created_at,
        candidate_required_location: normalizeLocation(j.location || (j.remote ? 'Remote' : '')),
        salary: '',
        url: j.url,
        remote: j.remote ?? deriveRemote(j.location),
        description: j.description,
      }));

      return NextResponse.json({ jobs: clean(jobs), total: jobs.length });
    }

    // --- JOBICY ---
    if (source === 'jobicy') {
      const params = new URLSearchParams();
      params.set('count', '20');
      params.set('page', String(page));
      if (search) params.set('search', search);
      params.set('industry', 'engineering');

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
        candidate_required_location: normalizeLocation(j.jobGeo),
        salary: j.annualSalaryMin
          ? `$${j.annualSalaryMin / 1000}k–$${j.annualSalaryMax ? j.annualSalaryMax / 1000 : '?'}k`
          : undefined,
        url: j.url,
        remote: deriveRemote(j.jobGeo),
        description: j.jobDescription,
      }));

      return NextResponse.json({ jobs: clean(jobs), total: data.totalCount || jobs.length });
    }

    // --- THE MUSE ---
    if (source === 'themuse') {
      const params = new URLSearchParams();
      params.set('page', String(page - 1));
      if (search) params.set('name', search);
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
        const locationName = normalizeLocation(j.locations?.[0]?.name);

        return {
          id: j.id,
          title: j.name,
          company_name: j.company?.name,
          tags: j.categories?.map((c) => c.name) || [],
          job_type: j.levels?.[0]?.name,
          publication_date: j.publication_date,
          candidate_required_location: locationName,
          url: j.refs?.landing_page,
          remote: deriveRemote(locationName),
          location: locationName,
          description: j.contents,
        };
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
        candidate_required_location: normalizeLocation(j.location),
        salary: j.salary_min
          ? `$${Math.round(Number(j.salary_min) / 1000)}k–$${Math.round(Number(j.salary_max) / 1000)}k`
          : undefined,
        url: j.url || '',
        remote: deriveRemote(j.location),
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
          candidate_required_location: normalizeLocation(j.job_is_remote ? 'Worldwide' : `${j.job_city || ''} ${j.job_country || ''}`.trim()),
          salary: j.job_min_salary ? `${j.job_salary_currency || '$'}${Math.round(j.job_min_salary / 1000)}k–${Math.round((j.job_max_salary || j.job_min_salary) / 1000)}k` : undefined,
          url: j.job_apply_link,
          remote: j.job_is_remote ?? deriveRemote(j.job_is_remote ? 'Worldwide' : `${j.job_city || ''} ${j.job_country || ''}`.trim()),
          description: j.job_description,
        }));

      const cleanedJobs = clean(jobs);
      return NextResponse.json({ jobs: cleanedJobs, total: data.num_pages ? data.num_pages * 10 : cleanedJobs.length * 5 });
    }

    // --- LINKEDIN (Adzuna → JSearch → RemoteOK fallback) ---
    if (source === 'linkedin') {
      let jobs: NormalizedJob[] = [];

      // Try Adzuna first
      if (!jobs.length) {
        try {
          const adzunaKey = process.env.ADZUNA_API_KEY;
          if (adzunaKey) {
            const adzunaParams = new URLSearchParams();
            adzunaParams.set('app_id', adzunaKey.split(':')[0] || '');
            adzunaParams.set('app_key', adzunaKey.split(':')[1] || '');
            adzunaParams.set('what', search || 'software developer');
            adzunaParams.set('results_per_page', '20');
            adzunaParams.set('page', String(page - 1));

            const res = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${adzunaParams}`).catch(() => null);
            if (res?.ok) {
              const data = await res.json();
              jobs = (data.results || []).map((j: {
                id: number;
                title: string;
                company: { display_name: string };
                company_logo?: string;
                contract_type?: string;
                created?: string;
                location?: { area?: string[] };
                salary_min?: number;
                salary_max?: number;
                salary_currency_code?: string;
                redirect_url: string;
                description?: string;
              }) => {
                const location = j.location?.area?.[0];
                return {
                  id: j.id,
                  title: j.title,
                  company_name: j.company?.display_name || '',
                  company_logo: j.company_logo,
                  job_type: j.contract_type,
                  publication_date: j.created,
                  candidate_required_location: normalizeLocation(location),
                  salary: j.salary_min ? `${j.salary_currency_code || '£'}${Math.round(j.salary_min / 1000)}k–${Math.round((j.salary_max || j.salary_min) / 1000)}k` : undefined,
                  url: j.redirect_url,
                  remote: (j.contract_type || '').toLowerCase().includes('remote') || deriveRemote(location),
                  description: j.description,
                };
              });
            }
          }
        } catch {
          // Fallback to JSearch
        }
      }

      // Try JSearch if Adzuna didn't return results
      if (!jobs.length) {
        try {
          const jsearchKey = process.env.RAPIDAPI_KEY;
          if (jsearchKey) {
            const params = new URLSearchParams();
            params.set('query', search || 'software developer');
            params.set('page', String(page));
            params.set('num_pages', '1');
            params.set('date_posted', 'all');

            const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
              headers: {
                'x-rapidapi-key': jsearchKey,
                'x-rapidapi-host': 'jsearch.p.rapidapi.com',
              },
            }).catch(() => null);

            if (res?.ok) {
              const data = await res.json();
              jobs = (data.data || [])
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
                  candidate_required_location: normalizeLocation(j.job_is_remote ? 'Worldwide' : `${j.job_city || ''} ${j.job_country || ''}`.trim()),
                  salary: j.job_min_salary ? `${j.job_salary_currency || '$'}${Math.round(j.job_min_salary / 1000)}k–${Math.round((j.job_max_salary || j.job_min_salary) / 1000)}k` : undefined,
                  url: j.job_apply_link,
                  remote: j.job_is_remote ?? deriveRemote(j.job_is_remote ? 'Worldwide' : `${j.job_city || ''} ${j.job_country || ''}`.trim()),
                  description: j.job_description,
                }));
            }
          }
        } catch {
          // Fallback to RemoteOK
        }
      }

      // Fallback to RemoteOK
      if (!jobs.length) {
        try {
          const res = await fetch('https://remoteok.com/api', {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobBoard/1.0)' },
          }).catch(() => null);

          if (res?.ok) {
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

            jobs = raw.map((j) => ({
              id: j.id,
              title: j.position || '',
              company_name: j.company || '',
              company_logo: j.logo,
              tags: j.tags || [],
              publication_date: j.date,
              candidate_required_location: normalizeLocation(j.location),
              salary: j.salary_min
                ? `$${Math.round(Number(j.salary_min) / 1000)}k–$${Math.round(Number(j.salary_max) / 1000)}k`
                : undefined,
              url: j.url || '',
              remote: deriveRemote(j.location),
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
          }
        } catch {
          // No fallback, return empty
        }
      }

      return NextResponse.json({ jobs: clean(jobs), total: jobs.length });
    }

    // --- ALL SOURCES ---
    if (source === 'all') {
      const base = new URL(req.url);
      const fetchSource = async (src: string) => {
        const p = new URLSearchParams({ source: src, page: String(page) });
        if (search) p.set('search', search);
        const res = await fetch(`${base.origin}/api/jobs?${p}`).catch(() => null);
        if (!res) return [];
        const data = await res.json().catch(() => ({ jobs: [] }));
        return (data.jobs || []) as NormalizedJob[];
      };

      const sources = ['remotive', 'jobicy', 'arbeitnow', 'remoteok', 'themuse'];
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
