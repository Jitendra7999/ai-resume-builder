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
  role: string;
  expYears: string;
};

function extractEmailFromText(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

async function generateEmailBody(payload: EmailPayload): Promise<{ subject: string; body: string }> {
  const isColdEmail = !payload.jobTitle && !payload.jobDescription;
  const role = payload.role || 'Frontend Developer';
  const expYears = payload.expYears || '1';

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      subject: isColdEmail
        ? `${role} with ${expYears} year exp – Open to Opportunities`
        : `Application for ${payload.jobTitle} – ${payload.senderName}`,
      body: `Dear ${payload.hrName || 'Hiring Manager'},\n\nI am a ${role} with ${expYears} year of experience in ${payload.skills}. I would love to be considered for any relevant openings at ${payload.company}.\n\nI have attached my resume for your reference.\n\nBest regards,\n${payload.senderName}`,
    };
  }

  const prompt = isColdEmail
    ? `Write a short, soft cold outreach email to an HR at a tech company.

Profile:
- Name: ${payload.senderName}
- Role: ${role}
- Experience: ${expYears} year(s)
- Skills: ${payload.skills}
- Company being contacted: ${payload.company || 'the company'}
- HR Name: ${payload.hrName || 'Hiring Manager'}

Requirements:
- Subject line first (prefix with "Subject: ")
- Very soft tone — not applying for a specific job, just introducing self
- 3 lines max body
- Mention role + exp years + 2 key skills
- End: "I've attached my resume, happy to connect if there's an opportunity."
- Under 80 words
- No placeholders`
    : `Write a professional job application email to an HR.

HR Name: ${payload.hrName || 'Hiring Manager'}
Company: ${payload.company}
Job Title: ${payload.jobTitle}
Job Description: ${payload.jobDescription?.slice(0, 400)}
Applicant: ${payload.senderName}
Role: ${role}, ${expYears} year(s) experience
Skills: ${payload.skills}

Requirements:
- Subject line first (prefix with "Subject: ")
- 3 short paragraphs max
- Match skills to job description
- End with call to action
- Under 130 words
- No placeholders`;

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt,
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
