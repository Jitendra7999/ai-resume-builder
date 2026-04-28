import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

type EmailPayload = {
  to: string;
  hrName: string;
  company: string;
  jobTitle: string;
  jobDescription: string;
  senderName: string;
  senderEmail: string;
  experience: string;
  skills: string;
  resumeContent: string;
};

function extractEmailFromText(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

async function generateEmailBody(payload: EmailPayload): Promise<{ subject: string; body: string }> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      subject: `Application for ${payload.jobTitle} – ${payload.senderName}`,
      body: `Dear ${payload.hrName || 'Hiring Manager'},\n\nI am writing to express my interest in the ${payload.jobTitle} position at ${payload.company}.\n\nBest regards,\n${payload.senderName}`,
    };
  }

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: `Write a professional cold email to an HR/hiring manager for a job application.

HR Name: ${payload.hrName || 'Hiring Manager'}
Company: ${payload.company}
Job Title: ${payload.jobTitle}
Job Description: ${payload.jobDescription?.slice(0, 400) || 'Software Development role'}
Applicant: ${payload.senderName}
Experience: ${payload.experience}
Skills: ${payload.skills}

Requirements:
- Subject line first (prefix with "Subject: ")
- 3 short paragraphs max
- Professional, confident, not desperate
- Mention 2-3 specific relevant skills matching the role
- End with a clear call to action
- Under 150 words total
- No placeholders`,
  });

  const lines = text.split('\n');
  const subjectLine = lines.find((l) => l.toLowerCase().startsWith('subject:'));
  const subject = subjectLine
    ? subjectLine.replace(/^subject:\s*/i, '').trim()
    : `Application for ${payload.jobTitle} – ${payload.senderName}`;
  const body = lines.filter((l) => !l.toLowerCase().startsWith('subject:')).join('\n').trim();

  return { subject, body };
}

export async function POST(req: NextRequest) {
  const payload: EmailPayload = await req.json();

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ error: 'Gmail credentials not configured in .env.local' }, { status: 500 });
  }

  try {
    const { subject, body } = await generateEmailBody(payload);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const resumeAttachment = payload.resumeContent
      ? [{
          filename: `Resume_${payload.senderName.replace(' ', '_')}.txt`,
          content: payload.resumeContent,
          contentType: 'text/plain',
        }]
      : [];

    await transporter.sendMail({
      from: `"${payload.senderName}" <${gmailUser}>`,
      to: payload.to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      attachments: resumeAttachment,
    });

    return NextResponse.json({ success: true, subject, body });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  const email = extractEmailFromText(text);
  return NextResponse.json({ email });
}
