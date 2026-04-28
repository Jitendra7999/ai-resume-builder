import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

type ApplyPayload = {
  jobUrl: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedin: string;
    resumePath: string;
    experience: string;
    education: string;
    skills: string;
  };
};

function detectATS(url: string): string {
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('workable.com')) return 'workable';
  if (url.includes('ashbyhq.com')) return 'ashby';
  if (url.includes('bamboohr.com')) return 'bamboohr';
  if (url.includes('recruitee.com')) return 'recruitee';
  if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
  return 'generic';
}

async function generateCoverLetter(payload: ApplyPayload): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return '';
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: `Write a concise, professional cover letter (3 short paragraphs max) for this job application.
Job Title: ${payload.jobTitle}
Company: ${payload.companyName}
Job Description: ${payload.jobDescription?.slice(0, 500)}
Candidate Experience: ${payload.profile.experience}
Education: ${payload.profile.education}
Skills: ${payload.profile.skills}
Name: ${payload.profile.firstName} ${payload.profile.lastName}
Keep it under 200 words. Professional but warm tone. No placeholders.`,
  });
  return text;
}

async function fillGreenhouse(page: puppeteer.Page, payload: ApplyPayload, coverLetter: string) {
  const p = payload.profile;
  await page.waitForSelector('input[name="job_application[first_name]"], #first_name', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));

  const fill = async (sel: string, val: string) => {
    const el = await page.$(sel).catch(() => null);
    if (el) { await el.click({ clickCount: 3 }); await el.type(val, { delay: 30 }); }
  };

  await fill('input[name="job_application[first_name]"], #first_name', p.firstName);
  await fill('input[name="job_application[last_name]"], #last_name', p.lastName);
  await fill('input[name="job_application[email]"], #email', p.email);
  await fill('input[name="job_application[phone]"], #phone', p.phone);
  await fill('input[id*="linkedin"], input[placeholder*="LinkedIn"]', p.linkedin);

  if (coverLetter) {
    await fill('textarea[name*="cover"], textarea[id*="cover"]', coverLetter);
  }

  if (p.resumePath) {
    const fileInput = await page.$('input[type="file"]').catch(() => null);
    if (fileInput) await fileInput.uploadFile(p.resumePath);
  }
}

async function fillLever(page: puppeteer.Page, payload: ApplyPayload, coverLetter: string) {
  const p = payload.profile;
  await page.waitForSelector('.application-field input, input[name="name"]', { timeout: 8000 }).catch(() => {});

  const fill = async (sel: string, val: string) => {
    const el = await page.$(sel).catch(() => null);
    if (el) { await el.click({ clickCount: 3 }); await el.type(val, { delay: 30 }); }
  };

  await fill('input[name="name"], input[placeholder*="name" i]', `${p.firstName} ${p.lastName}`);
  await fill('input[name="email"], input[placeholder*="email" i]', p.email);
  await fill('input[name="phone"], input[placeholder*="phone" i]', p.phone);
  await fill('input[placeholder*="LinkedIn" i], input[name*="linkedin" i]', p.linkedin);

  if (coverLetter) {
    await fill('textarea[name*="cover" i], textarea[placeholder*="cover" i]', coverLetter);
  }

  if (p.resumePath) {
    const fileInput = await page.$('input[type="file"]').catch(() => null);
    if (fileInput) await fileInput.uploadFile(p.resumePath);
  }
}

async function fillWorkable(page: puppeteer.Page, payload: ApplyPayload, coverLetter: string) {
  const p = payload.profile;
  await page.waitForSelector('input[name="firstname"], input[placeholder*="First" i]', { timeout: 8000 }).catch(() => {});

  const fill = async (sel: string, val: string) => {
    const el = await page.$(sel).catch(() => null);
    if (el) { await el.click({ clickCount: 3 }); await el.type(val, { delay: 30 }); }
  };

  await fill('input[name="firstname"], input[placeholder*="First" i]', p.firstName);
  await fill('input[name="lastname"], input[placeholder*="Last" i]', p.lastName);
  await fill('input[name="email"], input[type="email"]', p.email);
  await fill('input[name="phone"], input[placeholder*="phone" i]', p.phone);

  if (coverLetter) {
    await fill('textarea[name*="cover" i], textarea[placeholder*="cover" i]', coverLetter);
  }

  if (p.resumePath) {
    const fileInput = await page.$('input[type="file"]').catch(() => null);
    if (fileInput) await fileInput.uploadFile(p.resumePath);
  }
}

async function fillGeneric(page: puppeteer.Page, payload: ApplyPayload, coverLetter: string) {
  const p = payload.profile;
  await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 8000 }).catch(() => {});

  const tryFill = async (selectors: string[], value: string) => {
    for (const sel of selectors) {
      const el = await page.$(sel).catch(() => null);
      if (el) { await el.click({ clickCount: 3 }); await el.type(value, { delay: 30 }); return; }
    }
  };

  await tryFill(['input[name*="first" i]', 'input[id*="first" i]', 'input[placeholder*="First" i]'], p.firstName);
  await tryFill(['input[name*="last" i]', 'input[id*="last" i]', 'input[placeholder*="Last" i]'], p.lastName);
  await tryFill(['input[name="name"]', 'input[placeholder*="Full name" i]', 'input[id*="fullname" i]'], `${p.firstName} ${p.lastName}`);
  await tryFill(['input[type="email"]', 'input[name*="email" i]'], p.email);
  await tryFill(['input[type="tel"]', 'input[name*="phone" i]', 'input[placeholder*="phone" i]'], p.phone);
  await tryFill(['input[name*="linkedin" i]', 'input[placeholder*="LinkedIn" i]'], p.linkedin);

  if (coverLetter) {
    const ta = await page.$('textarea[name*="cover" i], textarea[placeholder*="cover" i], textarea[id*="cover" i]').catch(() => null);
    if (ta) { await ta.click({ clickCount: 3 }); await ta.type(coverLetter, { delay: 10 }); }
  }

  if (p.resumePath) {
    const fileInput = await page.$('input[type="file"]').catch(() => null);
    if (fileInput) await fileInput.uploadFile(p.resumePath);
  }
}

export async function POST(req: NextRequest) {
  const payload: ApplyPayload = await req.json();
  const ats = detectATS(payload.jobUrl);

  let browser: puppeteer.Browser | null = null;
  try {
    const coverLetter = await generateCoverLetter(payload);

    browser = await puppeteer.launch({
      headless: false, // Show browser so user can handle CAPTCHA
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(payload.jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Fill based on ATS
    if (ats === 'greenhouse') await fillGreenhouse(page, payload, coverLetter);
    else if (ats === 'lever') await fillLever(page, payload, coverLetter);
    else if (ats === 'workable') await fillWorkable(page, payload, coverLetter);
    else await fillGeneric(page, payload, coverLetter);

    // Wait 30s for user to review / solve CAPTCHA before auto-closing
    await new Promise((r) => setTimeout(r, 30000));

    return NextResponse.json({
      success: true,
      ats,
      coverLetter,
      message: `Form filled for ${ats}. Browser open for 30s — solve CAPTCHA if needed.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
