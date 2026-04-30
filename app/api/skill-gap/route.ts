import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const skillGapSchema = z.object({
  matched_skills: z.array(z.string()).describe('Skills the user has that match the job requirements'),
  missing_skills: z.array(z.string()).describe('Important skills required by the job that the user lacks'),
  estimated_learning_time: z.string().describe('Estimated time to learn the missing skills (e.g., "2-3 months", "1 week")'),
  priority_skills: z.array(z.string()).max(3).describe('Top 3 most important missing skills to focus on'),
});

export async function POST(req: Request) {
  const { jobTitle, company, description, userSkills, expYears } = await req.json();

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: skillGapSchema,
    system: 'You are a career coach analyzing skill gaps. Analyze the job requirements against the user\'s skills and provide a realistic assessment.',
    prompt: `Analyze the skill gap between the user and this job:

Job: ${jobTitle} at ${company}
Job Description: ${description ? description.replace(/<[^>]+>/g, ' ').slice(0, 1000) : 'Not provided'}
User Skills: ${userSkills && userSkills.length > 0 ? userSkills.join(', ') : 'Not specified'}
User Experience: ${expYears} years

Provide:
1. matched_skills: List of user skills that align with job requirements
2. missing_skills: Important required skills the user doesn't have (max 5)
3. estimated_learning_time: How long to learn the missing skills
4. priority_skills: Top 3 most important missing skills to focus on`,
  });

  return Response.json(object);
}
