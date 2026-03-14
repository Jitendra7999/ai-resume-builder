import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { jobDescription, companyUrl, position, history } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are a professional AI Interviewer conducting a multi-round job interview.
The candidate applied for the position of "${position}" at a company (URL: ${companyUrl || 'not provided'}).
Here is the job description:
${jobDescription || 'not provided'}

The interview consists of 3 rounds:
1. Screening Round: Ask 3 basic questions about experience and background.
2. Technical Round: Ask 5 technical questions based on the tech stack in the job description.
3. Coding Round: Ask 2 coding or problem-solving questions.

Rules:
- Ask exactly ONE question at a time.
- Analyze the chat history to determine the current round, the number of questions asked so far, and the candidate's last answer.
- Evaluate their answers implicitly but do not break character. Do not give feedback on their answers during the interview, simply ask the next question in a conversational manner.
- After all rounds are completed, mark the interview as completed and generate a final report based on their answers.
- Keep your questions concise like a real human interviewer.
- If the candidate's previous answer was too short or vague, you can ask a follow-up, but it still counts towards the round's question limit.

Output JSON according to the schema. Make sure you transition rounds automatically after the required number of questions.`;

    // History needs to be formatted for the AI
    const messageContext = history.map((msg: any) => `${msg.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`).join('\n');

    const promptMessage = `Chat History:\n${messageContext}\n\nBased on this history, what should the interviewer do next? Ask the next question, or if we have finished all 3 rounds (3 screening + 5 technical + 2 coding = 10 total questions), provide the final report.`;

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: promptMessage,
      schema: z.object({
        isCompleted: z.boolean().describe("Set to true ONLY if all 3 rounds are completely finished (approx 10 questions)"),
        currentRound: z.enum(['Screening', 'Technical', 'Coding', 'Completed']).describe("The current round of the interview, or Completed if done"),
        nextQuestion: z.string().optional().describe("The next question to ask. Required if isCompleted is false. MUST BE SPOKEN TEXT ONLY (no markdown)."),
        report: z.object({
          score: z.number().describe("Score out of 100 based on candidate's performance"),
          strengths: z.array(z.string()).describe("Candidate's top strengths shown in the interview"),
          weaknesses: z.array(z.string()).describe("Areas of improvement for the candidate"),
          hiringRecommendation: z.string().describe("Final recommendation (e.g., 'Strong Hire', 'Hire', 'No Hire') with a brief reason")
        }).optional().describe("The final report. Required ONLY if isCompleted is true")
      }),
    });

    return new Response(JSON.stringify(result.object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Interview API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred while processing the interview step." }), { status: 500 });
  }
}
