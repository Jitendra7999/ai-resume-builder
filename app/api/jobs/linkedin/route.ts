import { NextRequest, NextResponse } from 'next/server';

/**
 * Real LinkedIn Jobs Fetcher
 * Fetches actual live jobs from LinkedIn using public API
 */

type LinkedInJob = {
  id: string | number;
  title: string;
  company_name: string;
  location?: string;
  description?: string;
  salary?: string;
  url: string;
  company_logo?: string;
  publication_date?: string;
  remote?: boolean;
  candidate_required_location?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || 'software developer';
  const location = searchParams.get('location') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    // Fetch from LinkedIn public guest API
    const params = new URLSearchParams();
    params.set('keywords', search);
    if (location) params.set('location', location);
    params.set('start', String((page - 1) * 20));
    params.set('count', '20');

    const linkedinUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;

    const response = await fetch(linkedinUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/vnd.linkedin.normalized+json+2.1',
        'Content-Type': 'application/json',
      },
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.elements) {
        const jobs = parseRealLinkedInJobs(data.elements);
        if (jobs.length > 0) {
          return NextResponse.json({
            jobs: jobs,
            total: data.paging?.total || jobs.length * 5,
            page: page,
            source: 'linkedin_live'
          });
        }
      }
    }

    // Fallback: Fetch from alternative job APIs
    return await fetchFromAlternativeAPIs(search, location, page);

  } catch (error) {
    console.error('LinkedIn jobs fetch error:', error);
    // Fallback to alternative APIs
    return await fetchFromAlternativeAPIs(search, location, page);
  }
}

async function fetchFromAlternativeAPIs(search: string, location: string, page: number) {
  try {
    // Try multiple job APIs as fallback
    const apis = [
      fetchFromJSearch(search, page),
      fetchFromJobicy(search, page),
      fetchFromRemoteOk(search, page)
    ];

    const results = await Promise.allSettled(apis);
    const allJobs: LinkedInJob[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allJobs.push(...result.value);
      }
    }

    return NextResponse.json({
      jobs: allJobs.slice(0, 20),
      total: allJobs.length || 100,
      page: page,
      source: 'multiple_apis'
    });

  } catch (error) {
    console.error('Alternative APIs error:', error);
    return NextResponse.json({ jobs: [], total: 0, error: 'Unable to fetch jobs' }, { status: 500 });
  }
}

async function fetchFromJSearch(search: string, page: number): Promise<LinkedInJob[]> {
  try {
    const params = new URLSearchParams();
    params.set('query', search);
    params.set('page', String(page));
    params.set('num_pages', '1');

    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.data || []).map((job: any) => ({
      id: job.job_id,
      title: job.job_title,
      company_name: job.employer_name,
      location: job.job_city || 'Remote',
      candidate_required_location: job.job_is_remote ? 'Remote' : job.job_city || 'Worldwide',
      salary: job.job_min_salary ? `$${Math.round(job.job_min_salary / 1000)}k–${Math.round((job.job_max_salary || job.job_min_salary) / 1000)}k` : '',
      url: job.job_apply_link,
      remote: job.job_is_remote,
      description: job.job_description,
      publication_date: job.job_posted_at_datetime_utc
    }));
  } catch (error) {
    return [];
  }
}

async function fetchFromJobicy(search: string, page: number): Promise<LinkedInJob[]> {
  try {
    const params = new URLSearchParams();
    params.set('count', '20');
    params.set('page', String(page));
    params.set('search', search);
    params.set('industry', 'engineering');

    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    return (data.jobs || []).map((job: any) => ({
      id: job.id,
      title: job.jobTitle,
      company_name: job.companyName,
      location: job.jobGeo || 'Remote',
      candidate_required_location: job.jobGeo || 'Worldwide',
      salary: job.annualSalaryMin ? `$${Math.round(job.annualSalaryMin / 1000)}k–$${Math.round((job.annualSalaryMax || job.annualSalaryMin) / 1000)}k` : '',
      url: job.url,
      remote: true,
      description: job.jobDescription,
      publication_date: job.pubDate
    }));
  } catch (error) {
    return [];
  }
}

async function fetchFromRemoteOk(search: string, page: number): Promise<LinkedInJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const start = (page - 1) * 20;

    return (Array.isArray(data) ? data.slice(1).slice(start, start + 20) : []).map((job: any) => ({
      id: job.id,
      title: job.position,
      company_name: job.company,
      location: job.location || 'Remote',
      candidate_required_location: job.location || 'Worldwide',
      salary: job.salary_min ? `$${Math.round(Number(job.salary_min) / 1000)}k–$${Math.round(Number(job.salary_max) / 1000)}k` : '',
      url: job.url,
      remote: true,
      description: job.description,
      publication_date: job.date
    }));
  } catch (error) {
    return [];
  }
}

function parseRealLinkedInJobs(elements: any[]): LinkedInJob[] {
  return elements.map((job: any) => ({
    id: job.dashJobId,
    title: job.title?.text || '',
    company_name: job.company?.name || '',
    location: job.location?.basicLocation || 'Remote',
    candidate_required_location: job.location?.basicLocation || 'Remote',
    salary: job.salary ? `$${job.salary.salaryMin}–$${job.salary.salaryMax}` : '',
    url: `https://www.linkedin.com/jobs/view/${job.dashJobId}/`,
    remote: job.workplaceType === 'REMOTE',
    description: job.description?.text || '',
    publication_date: new Date(job.listedAt).toISOString(),
    company_logo: job.company?.logo?.image?.url
  }));
}
