import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

type Profile = {
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

type ApplyPayload = {
  jobUrl: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeContent: string;
  profile: Profile;
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

async function detectCaptcha(page: puppeteer.Page): Promise<boolean> {
  return page.evaluate(() => !!(
    document.querySelector('iframe[src*="recaptcha"]') ||
    document.querySelector('iframe[src*="hcaptcha"]') ||
    document.querySelector('.g-recaptcha') ||
    document.querySelector('[data-sitekey]') ||
    document.querySelector('.cf-challenge') ||
    document.querySelector('#challenge-form') ||
    document.querySelector('iframe[title*="captcha" i]')
  ));
}

async function generateCoverLetter(payload: ApplyPayload): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return '';
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: `Write a concise, professional cover letter (3 short paragraphs, under 200 words) for:
Job Title: ${payload.jobTitle}
Company: ${payload.companyName}
Job Description: ${payload.jobDescription?.slice(0, 600)}
Candidate: ${payload.profile.firstName} ${payload.profile.lastName}
Experience: ${payload.profile.experience}
Skills: ${payload.profile.skills}
Education: ${payload.profile.education}
Professional tone. No placeholders. Output only the letter text.`,
  });
  return text;
}

async function fill(page: puppeteer.Page, sel: string, val: string) {
  const el = await page.$(sel).catch(() => null);
  if (el) {
    await el.click({ clickCount: 3 });
    await el.type(val, { delay: 25 });
  }
}

async function tryFill(page: puppeteer.Page, selectors: string[], val: string) {
  for (const sel of selectors) {
    const el = await page.$(sel).catch(() => null);
    if (el) {
      await el.click({ clickCount: 3 });
      await el.type(val, { delay: 25 });
      return;
    }
  }
}

async function uploadResume(page: puppeteer.Page, resumePath: string) {
  if (!resumePath) return;
  const fileInput = await page.$('input[type="file"]').catch(() => null);
  if (fileInput) await fileInput.uploadFile(resumePath);
}

async function fillForm(page: puppeteer.Page, ats: string, payload: ApplyPayload, coverLetter: string) {
  const p = payload.profile;
  const fullName = `${p.firstName} ${p.lastName}`;

  if (ats === 'greenhouse') {
    await page.waitForSelector('#first_name, input[name="job_application[first_name]"]', { timeout: 8000 }).catch(() => {});
    await fill(page, '#first_name, input[name="job_application[first_name]"]', p.firstName);
    await fill(page, '#last_name, input[name="job_application[last_name]"]', p.lastName);
    await fill(page, '#email, input[name="job_application[email]"]', p.email);
    await fill(page, '#phone, input[name="job_application[phone]"]', p.phone);
    await fill(page, 'input[id*="linkedin"], input[placeholder*="LinkedIn" i]', p.linkedin);
    if (coverLetter) await fill(page, 'textarea[name*="cover" i], textarea[id*="cover" i]', coverLetter);
    await uploadResume(page, p.resumePath);
  }

  else if (ats === 'lever') {
    await page.waitForSelector('input[name="name"], .application-field input', { timeout: 8000 }).catch(() => {});
    await fill(page, 'input[name="name"]', fullName);
    await fill(page, 'input[name="email"]', p.email);
    await fill(page, 'input[name="phone"]', p.phone);
    await fill(page, 'input[placeholder*="LinkedIn" i], input[name*="linkedin" i]', p.linkedin);
    if (coverLetter) await fill(page, 'textarea[name*="cover" i]', coverLetter);
    await uploadResume(page, p.resumePath);
  }

  else if (ats === 'workable') {
    await page.waitForSelector('input[name="firstname"]', { timeout: 8000 }).catch(() => {});
    await fill(page, 'input[name="firstname"]', p.firstName);
    await fill(page, 'input[name="lastname"]', p.lastName);
    await fill(page, 'input[type="email"]', p.email);
    await fill(page, 'input[name="phone"]', p.phone);
    if (coverLetter) await fill(page, 'textarea[name*="cover" i]', coverLetter);
    await uploadResume(page, p.resumePath);
  }

  else {
    // Generic fallback
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 8000 }).catch(() => {});
    await tryFill(page, ['input[name*="first" i]', 'input[id*="first" i]', 'input[placeholder*="First" i]'], p.firstName);
    await tryFill(page, ['input[name*="last" i]', 'input[id*="last" i]', 'input[placeholder*="Last" i]'], p.lastName);
    await tryFill(page, ['input[name="name"]', 'input[placeholder*="full name" i]'], fullName);
    await tryFill(page, ['input[type="email"]', 'input[name*="email" i]'], p.email);
    await tryFill(page, ['input[type="tel"]', 'input[name*="phone" i]'], p.phone);
    await tryFill(page, ['input[name*="linkedin" i]', 'input[placeholder*="linkedin" i]'], p.linkedin);
    if (coverLetter) {
      const ta = await page.$('textarea[name*="cover" i], textarea[id*="cover" i]').catch(() => null);
      if (ta) { await ta.click({ clickCount: 3 }); await ta.type(coverLetter, { delay: 10 }); }
    }
    await uploadResume(page, p.resumePath);
  }
}

export async function POST(req: NextRequest) {
  const payload: ApplyPayload = await req.json();
  const ats = detectATS(payload.jobUrl);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let browser: puppeteer.Browser | null = null;
      try {
        // Step 1: Generate cover letter
        send({ type: 'status', step: 1, message: 'Generating cover letter with AI...' });
        const coverLetter = await generateCoverLetter(payload);
        send({ type: 'cover_letter', coverLetter });

        // Step 2: Launch browser
        send({ type: 'status', step: 2, message: `Opening browser (${ats} detected)...` });
        browser = await puppeteer.launch({
          headless: false,
          defaultViewport: null,
          args: ['--start-maximized', '--no-sandbox'],
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Step 3: Navigate
        send({ type: 'status', step: 3, message: 'Loading job application page...' });
        await page.goto(payload.jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Step 4: Check for CAPTCHA before filling — wait until solved
        let captchaBefore = await detectCaptcha(page);
        if (captchaBefore) {
          send({ type: 'captcha', message: '⚠️ CAPTCHA detected! Solve it in the browser window. Waiting until resolved...' });
          // Poll every 3s until CAPTCHA is gone (max 2 min)
          for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            captchaBefore = await detectCaptcha(page);
            if (!captchaBefore) break;
          }
          send({ type: 'status', step: 3, message: 'CAPTCHA resolved. Proceeding to fill form...' });
        }

        // Step 5: Fill form
        send({ type: 'status', step: 4, message: 'Filling application form...' });
        await fillForm(page, ats, payload, coverLetter);

        // Step 6: Check for CAPTCHA after filling
        const captchaAfter = await detectCaptcha(page);
        if (captchaAfter) {
          send({ type: 'captcha', message: '⚠️ CAPTCHA appeared after filling! Solve it in the browser before submitting.' });
        } else {
          send({ type: 'status', step: 5, message: '✅ Form filled! Review in browser and click Submit.' });
        }

        // Wait 60s for user to review and submit
        send({ type: 'status', step: 5, message: 'Waiting 60s for you to review and submit...' });
        await new Promise((r) => setTimeout(r, 60000));

        send({ type: 'done', success: true, ats, coverLetter });
      } catch (err) {
        send({ type: 'error', message: String(err) });
      } finally {
        if (browser) await browser.close().catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
