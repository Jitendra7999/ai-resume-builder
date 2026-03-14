import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 60; // Allow more time for large generations

export async function POST(req: Request) {
  try {
    const { topic, experienceLevel, totalQuestions } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are a senior technical interviewer and an expert in software engineering.
Your task is to generate high-quality interview preparation content.

Topic: ${topic}
Experience Level: ${experienceLevel}
Number of Questions: ${totalQuestions}

Generate ${totalQuestions} unique interview questions about "${topic}" suitable for a candidate with ${experienceLevel} experience.

For each question, provide:
- The question itself
- A clear, concise explanation of the concept
- An ideal, well-structured answer
- A relevant and practical example (preferably a code snippet if applicable)
- 1 or 2 potential follow-up questions the interviewer might ask

Output structure must exactly match the JSON schema. Ensure code examples are formatted correctly.`;

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Generate the interview prep materials for ${topic} at ${experienceLevel} level. Provide precisely ${totalQuestions} questions.`,
      schema: z.object({
        topic: z.string().describe("The topic of these questions"),
        level: z.string().describe("The target experience level"),
        questions: z.array(z.object({
          question: z.string().describe("The interview question"),
          explanation: z.string().describe("Explanation of the core concept behind the question"),
          answer: z.string().describe("The ideal answer a candidate should give"),
          example: z.string().describe("A practical example, usually a code snippet or simple scenario"),
          followUps: z.array(z.string()).describe("Related follow-up questions")
        })).length(totalQuestions).describe(`Exactly ${totalQuestions} questions.`)
      }),
    });

    return new Response(JSON.stringify(result.object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Interview Prep API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred while generating preparation content." }), { status: 500 });
  }
}
