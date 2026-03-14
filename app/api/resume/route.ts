import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    const { jd, personalDetails, experience, education, projects } = await req.json();

    const systemPrompt = `You are an Expert Resume Writer and Applicant Tracking System (ATS) Specialist.
Your goal is to write a highly professional, ATS-optimized resume tailored EXACTLY to the provided Job Description.
Incorporate the user's personal details, work experience, education, and projects.
Crucially observe these formatting and content rules: 
1. The entire resume MUST fit concisely on a SINGLE PAGE. Prioritize the most impressive achievements.
2. The Professional Summary MUST be exactly 2-3 lines/sentences max. You MUST calculate their total years of experience based on the Experience section (e.g., "Software Engineer with 3+ years of experience...") and include this in the first sentence.
3. Every role in the Professional Experience section MUST be limited to exactly 2 impactful bullet points using the STAR method.
4. Every entry in the Projects section MUST be limited to exactly 2 impactful expanded bullet points using the STAR method.
5. If the user provides a URL or link for a project, you MUST format the Project Name as a markdown link, like \`### [Project Name](https://url)\`
6. In the Core Competencies & Skills section, you MUST break the skills down into categories (e.g., Languages, Frameworks, Tools, Soft Skills) rather than a flat list.

Structure the resume strictly in Markdown:
# [Full Name]
[Email] | [Phone] | [LinkedIn/GitHub]

## Professional Summary
[Exactly 2-3 strong sentences. Start with "Dynamic [Role] with X+ years of experience..." calculated from their history]

## Core Competencies & Skills
- **Languages:** [Skill 1, Skill 2]
- **Frameworks/Libraries:** [Skill 1, Skill 2]
- **Tools/Platforms:** [Skill 1, Skill 2]
- **Soft Skills:** [Skill 1, Skill 2]

## Professional Experience
### [Job Title] | [Company Name] | [Dates]
- [Impactful bullet point 1]
- [Impactful bullet point 2]

## Projects
### [Project Name]([URL if provided])
- [Expanded, impactful bullet point 1]
- [Expanded, impactful bullet point 2]

## Education
### [Degree/Certificate] | [Institution] | [Dates]

Ensure the formatting is perfectly clean and professional. Do NOT include any conversational introduction, just output the markdown resume document directly.`;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing GOOGLE_GENERATIVE_AI_API_KEY. Please add it to your .env file."
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const compiledPrompt = `
Job Description to tailor against:
${jd || 'Not provided. Write a general best-practice resume.'}

Candidate Details:
- Personal Info: ${personalDetails || 'Not provided'}
- Professional Experience: ${experience || 'Not provided'}
- Education: ${education || 'Not provided'}
- Projects (Please expand these short descriptions into professional bullet points): ${projects || 'Not provided'}

Please generate the ATS-friendly resume.
`;

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      prompt: compiledPrompt,
      system: systemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Resume API Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred during Resume generation." }), { status: 500 });
  }
}
