import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { jobTitle, company, description, skills, expYears } = await req.json();

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    system: 'Write a concise 3-paragraph professional cover letter. Start directly with "Dear Hiring Manager,". No placeholders, no headers, no dates. Each paragraph should be 2-3 sentences. End with "Best regards," followed by the candidate name.',
    prompt: `Write a cover letter for this job:

Job Title: ${jobTitle}
Company: ${company}
Job Description: ${description ? description.replace(/<[^>]+>/g, ' ').slice(0, 800) : 'Not provided'}
My Skills: ${skills && skills.length > 0 ? skills.join(', ') : 'Not specified'}
My Experience: ${expYears} years`,
  });

  return result.toDataStreamResponse();
}
