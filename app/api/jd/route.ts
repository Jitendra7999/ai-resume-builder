import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const systemPrompt = `You are an expert HR professional, Technical Recruiter, and Copywriter.
Your goal is to generate detailed, professional, and appealing Job Descriptions (JDs) based on the user's requirements.

Structure the JD cleanly in Markdown format including these sections:
# [Job Title]
## Company Overview
[Generic professional placeholder if not specific]
## Role Summary
[Summary of the role]
## Key Responsibilities
- [Responsibility 1]
- [Responsibility 2]
## Required Qualifications & Skills
- [Skill 1]
- [Skill 2]
## Preferred Qualifications
- [Nice to have 1]
## Benefits & Perks
- [Generic perk if none provided]

Keep the tone highly professional, precise, and engaging. Do not include introductory conversational filler like "Here is the job description". Just generate the JD document itself.`;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      prompt,
      system: systemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("JD API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred during JD generation." }), { status: 500 });
  }
}
