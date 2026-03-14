import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Formulate System Prompt 
    const systemPrompt = `You are an expert, friendly Customer Support AI and Website Chatbot.
Your goal is to answer FAQs, provide customer support, and help guide users through the website.
Keep your responses helpful, concise, and professional. Use formatting (like bullet points or bold text) when it improves clarity.`;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      // Fallback if user hasn't added API keys yet
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Generate Streaming Response using Vercel AI SDK
    const result = await streamText({
      model: google('gemini-2.5-flash'),
      messages,
      system: systemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred during chat processing." }), { status: 500 });
  }
}
