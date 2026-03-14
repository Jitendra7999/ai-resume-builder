import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { topic, experienceLevel, totalQuestions, conversationHistory } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are a professional AI Interviewer conducting a practice interview on the topic of "${topic}".
The candidate's experience level is: "${experienceLevel}".
The total number of questions to ask in this session is: ${totalQuestions}.

Rules:
- Ask exactly ONE topic-related question at a time.
- Adjust the difficulty of your questions to match the "${experienceLevel}" level.
- Ask a mix of conceptual and practical questions.
- If the candidate's previous answer was weak, you can ask a follow-up question.
- For every answer the candidate provides, you must provide a brief "analysis" of how well they answered it (e.g., "Good explanation, but you missed X"). Do not speak this analysis out loud, just provide it in the structured output.
- Track the number of questions asked based on the history. Once you have asked and evaluated ${totalQuestions} questions (or their corresponding follow-ups), mark the interview as completed and generate the final report.
- When generating the final report, do not provide a next question.

Output JSON according to the schema.`;

    const messageContext = conversationHistory.map((msg: any) => `${msg.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`).join('\n');

    const promptMessage = `Chat History:\n${messageContext}\n\nBased on this history, what should the interviewer do next? If there is a previous answer from the candidate, evaluate it and provide an 'analysis'. Then, if we haven't reached the limit of ${totalQuestions} questions, provide the 'nextQuestion'. If we have finished all ${totalQuestions} questions, provide the 'report'.`;

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: promptMessage,
      schema: z.object({
        isCompleted: z.boolean().describe("Set to true ONLY if all required questions have been asked and evaluated."),
        analysis: z.string().optional().describe("A short evaluation of the candidate's last answer. Keep it constructive and brief. Required if there is a previous answer to evaluate in the history."),
        nextQuestion: z.string().optional().describe("The next question to ask. Required if isCompleted is false. MUST BE SPOKEN TEXT ONLY (no text formatting like markdown or bullet points)."),
        report: z.object({
          score: z.number().describe("Overall Score out of 10"),
          knowledgeLevel: z.string().describe("Assessed knowledge level based on answers (e.g., 'Strong Intermediate')"),
          strengths: z.array(z.string()).describe("Candidate's strengths shown in the interview"),
          weaknesses: z.array(z.string()).describe("Areas of improvement or weak areas"),
          suggestedTopics: z.array(z.string()).describe("Suggested topics or concepts to improve upon"),
          confidenceRating: z.string().describe("Assessment of the candidate's confidence based on their responses (e.g., 'High', 'Moderate', 'Low')")
        }).optional().describe("The final report. Required ONLY if isCompleted is true")
      }),
    });

    return new Response(JSON.stringify(result.object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Topic Interview API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred while processing the interview step." }), { status: 500 });
  }
}
