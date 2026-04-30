import { NextRequest } from 'next/server';
import { applyToJob, ApplyPayload, type Profile } from '@/lib/applyToJob';

export async function POST(req: NextRequest) {
  const payload: ApplyPayload = await req.json();
  const autoSubmit = payload.autoSubmit ?? false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await applyToJob(payload, autoSubmit, send);
        send({ type: 'done', success: result.success, ats: result.ats, coverLetter: result.coverLetter });
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
