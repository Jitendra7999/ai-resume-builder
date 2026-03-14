import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    const { prompt, jd, resumeBase64 } = await req.json();

    const systemPrompt = `You are an expert Applicant Tracking System (ATS), Technical Recruiter, and Career Coach.
Your goal is to evaluate a candidate's Resume against a provided Job Description (JD) and provide a detailed ATS match report.

Structure your response cleanly in Markdown format including these sections:
# ATS Match Score
[Overall Score out of 100, e.g., 85/100]

## Executive Summary
[A brief summary of the candidate's fit for the role]

## Matched Keywords & Skills
- [Keyword/Skill 1]
- [Keyword/Skill 2]

## Missing Keywords & Skills
- [Missing Keyword/Skill 1]
- [Missing Keyword/Skill 2]

## Recommendations for Improvement
- [Actionable recommendation 1]
- [Actionable recommendation 2]

Keep the tone highly professional, precise, and encouraging. Do not include introductory conversational filler. Just generate the markdown report.`;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Extract the base64 string without the data URI prefix if present
    const base64Data = resumeBase64.includes(',') ? resumeBase64.split(',')[1] : resumeBase64;

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Please evaluate the following resume against the provided Job Description.\n\nJob Description:\n${jd}` },
            { type: 'file', data: base64Data, mimeType: 'application/pdf' }
          ]
        }
      ]
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("ATS API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred during ATS evaluation." }), { status: 500 });
  }
}
