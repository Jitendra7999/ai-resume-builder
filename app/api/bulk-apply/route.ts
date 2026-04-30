import { NextRequest } from 'next/server';
import { applyToJob, type ApplyPayload, type Profile } from '@/lib/applyToJob';
import { connectDB } from '@/lib/mongodb';
import User, { IAppliedJob } from '@/lib/models/User';

type BulkApplyJob = {
  id: string;
  url: string;
  title: string;
  company: string;
  description: string;
  matchScore?: number;
};

type BulkApplyRequest = {
  jobs: BulkApplyJob[];
  profile: Profile;
  resumeContent: string;
  autoSubmit: boolean;
  alreadyAppliedUrls: string[];
  userId?: string;
};

export async function POST(req: NextRequest) {
  const payload: BulkApplyRequest = await req.json();
  const userId = payload.userId || req.headers.get('x-user-id') || 'test-user';
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let applied = 0;
      let failed = 0;
      let captcha = 0;
      let skipped = 0;
      let duplicates = 0;

      try {
        await connectDB();
        const user = await User.findById(userId);

        for (let i = 0; i < payload.jobs.length; i++) {
          const job = payload.jobs[i];

          // Double-check: skip if already applied or scheduled
          const alreadyApplied = user?.appliedJobs.find(j => j.jobUrl === job.url);
          const alreadyScheduled = user?.scheduledJobs.find(j => j.jobUrl === job.url);

          if (alreadyApplied || alreadyScheduled || payload.alreadyAppliedUrls.includes(job.url)) {
            duplicates++;
            send({
              type: 'job_done',
              jobId: job.id,
              status: 'skipped',
              index: i,
              total: payload.jobs.length,
              reason: 'already_applied',
            });
            continue;
          }

          // Notify job start
          send({
            type: 'job_start',
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            index: i,
            total: payload.jobs.length,
          });

          try {
            const applyPayload: ApplyPayload = {
              jobUrl: job.url,
              jobTitle: job.title,
              companyName: job.company,
              jobDescription: job.description,
              resumeContent: payload.resumeContent,
              profile: payload.profile,
              autoSubmit: payload.autoSubmit,
            };

            let captchaHit = false;

            // Apply to job with custom send handler to track logs
            const result = await applyToJob(applyPayload, payload.autoSubmit, (data: any) => {
              if (data.type === 'captcha') {
                captchaHit = true;
                send({
                  type: 'job_log',
                  jobId: job.id,
                  message: data.message,
                });
              } else if (data.type === 'status' || data.type === 'error') {
                send({
                  type: 'job_log',
                  jobId: job.id,
                  message: data.message || '',
                });
              }
            });

            if (captchaHit) {
              captcha++;
              send({
                type: 'job_done',
                jobId: job.id,
                status: 'captcha',
                ats: result.ats,
              });
            } else {
              applied++;

              // Save to DB
              if (user) {
                const appliedJob: IAppliedJob = {
                  jobId: job.id,
                  jobTitle: job.title,
                  company: job.company,
                  jobUrl: job.url,
                  appliedAt: new Date(),
                  status: 'applied',
                  ats: result.ats,
                  coverLetter: result.coverLetter,
                  source: 'bulk-apply',
                  matchScore: job.matchScore,
                };
                user.appliedJobs.push(appliedJob);
                user.applicationAnalytics.totalApplications = user.appliedJobs.length;
                await user.save();
              }

              send({
                type: 'job_done',
                jobId: job.id,
                status: 'success',
                ats: result.ats,
                coverLetter: result.coverLetter,
              });
            }
          } catch (err) {
            failed++;
            send({
              type: 'job_done',
              jobId: job.id,
              status: 'failed',
              error: String(err),
            });
          }

          // Rate limiting: 2s between applies
          if (i < payload.jobs.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        // Final summary
        send({
          type: 'batch_done',
          applied,
          failed,
          captcha,
          skipped,
          duplicates,
          total: payload.jobs.length,
        });
      } catch (err) {
        send({ type: 'error', message: String(err) });
      } finally {
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
