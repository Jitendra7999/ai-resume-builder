import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

/**
 * Job Recommendations API
 * Uses Gemini AI to rank real jobs by relevance to user profile
 */

const rankingSchema = z.object({
  ranked: z.array(
    z.object({
      index: z.number().describe('Original position (0-based) in the jobs array'),
      score: z.number().min(0).max(100).describe('Relevance score 0-100'),
      reason: z.string().describe('Brief explanation why this job is recommended'),
    })
  ).describe('Jobs ranked by relevance to user skills and experience'),
});

async function fetchRemotiveJobs(skills: string[]): Promise<any[]> {
  try {
    const query = skills.slice(0, 2).join(' ');
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=10`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).slice(0, 10);
  } catch {
    return [];
  }
}

async function fetchJobicyJobs(skills: string[]): Promise<any[]> {
  try {
    const query = skills[0] || 'developer';
    const res = await fetch(
      `https://jobicy.com/api?count=10&tag=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).slice(0, 10);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skills = (searchParams.get('skills') || '').split(',').filter(Boolean);
  const experience = parseInt(searchParams.get('experience') || '0', 10);

  try {
    // Fetch real jobs from 2 sources
    const [remotiveJobs, jobicyJobs] = await Promise.all([
      fetchRemotiveJobs(skills),
      fetchJobicyJobs(skills),
    ]);

    const allJobs = [...remotiveJobs, ...jobicyJobs].slice(0, 20);

    if (allJobs.length === 0) {
      return NextResponse.json({
        recommendations: [],
        total: 0,
      });
    }

    // Use Gemini to rank jobs
    const jobDescriptions = allJobs.map((j, idx) =>
      `[${idx}] ${j.title} at ${j.company_name || j.company} - ${j.job_description || j.description || 'No description'}`.slice(0, 200)
    ).join('\n\n');

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: rankingSchema,
      prompt: `Rank these ${allJobs.length} jobs by relevance to a candidate with:
Skills: ${skills.length > 0 ? skills.join(', ') : 'Not specified'}
Experience: ${experience} years

Jobs to rank:
${jobDescriptions}

Return the top 10 ranked by relevance score (0-100). Higher score = better match.`,
    });

    // Apply rankings and return top 10
    const ranked = object.ranked.slice(0, 10).map(ranking => {
      const job = allJobs[ranking.index];
      return {
        ...job,
        matchScore: ranking.score,
        reason: ranking.reason,
      };
    });

    return NextResponse.json({
      recommendations: ranked,
      total: ranked.length,
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    // Fallback: return first few jobs unsorted
    return NextResponse.json({
      recommendations: [],
      total: 0,
      error: 'Could not generate recommendations',
    });
  }
}
