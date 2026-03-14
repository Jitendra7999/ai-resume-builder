import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const responseSchema = z.object({
  reply: z.string().describe("Your conversational reply as a friendly English teacher."),
  correction: z.string().nullable().describe("The corrected version of the user's sentence. Output null if the sentence was already perfect."),
  explanation: z.string().nullable().describe("Simple explanation of any grammar or sentence formation mistakes. Output null if perfect."),
  betterVersion: z.string().nullable().describe("A more native, advanced, or natural way to phrase what the user said."),
  vocabulary: z.array(z.object({
    word: z.string(),
    meaning: z.string(),
    hindiMeaning: z.string(),
    pronunciation: z.string(),
    example: z.string()
  })).describe("3-5 new English vocabulary words related to the conversation topic that the user should learn."),
  newQuestion: z.string().describe("A new real-life question or conversation prompt to keep the user engaged and talking.")
});

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = `
      You are a friendly, encouraging English Communication Teacher and AI Assistant.
      Your goal is to help the user improve their English speaking, vocabulary, sentence formation, and communication skills.
      
      RULES:
      1. Use simple, easy-to-understand English.
      2. Respond playfully and encouragingly to what the user said.
      3. Identify grammar mistakes and provide corrections.
      4. Explain their mistakes simply.
      5. Provide a "better version" (native-sounding) of what they tried to say.
      6. Teach 3-5 new vocabulary words related to what they are talking about. Include meaning, Hindi meaning, pronunciation, and an example sentence.
      7. Always ask a relevant follow-up question to keep them talking.
      
      Here is the conversation history:
      ${JSON.stringify(conversationHistory)}
    `;

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `The user just said: "${message}". Please analyze this, respond, correct it, and teach them something new.`,
      schema: responseSchema,
      temperature: 0.7,
    });

    return NextResponse.json(result.object);

  } catch (error: any) {
    console.error("API Error (english-trainer):", error);
    return NextResponse.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
