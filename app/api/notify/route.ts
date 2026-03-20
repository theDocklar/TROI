/**
 * POST /api/notify
 * Accepts a NotificationPayload, logs it to console, and returns a mock Twilio response.
 * Never throws — all errors are caught and returned as { status: 'failed' }.
 *
 * In production: swap the console.log for real Twilio SDK call (see lib/notify.ts).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NotificationPayload } from '@/types';

interface TwilioMockResponse {
  sid: string;
  status: 'queued' | 'failed';
  to: string;
  body: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<TwilioMockResponse>> {
  try {
    const payload = await req.json() as NotificationPayload;

    if (!payload.to || !payload.body) {
      return NextResponse.json(
        { sid: '', status: 'failed', to: payload.to ?? '', body: payload.body ?? '', error: 'Missing required fields: to, body' },
        { status: 400 },
      );
    }

    // Mock Twilio message SID
    const sid = `SM_mock_${Date.now()}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Console log (replace with real Twilio in prod)
    console.log(`[ROI Intelligence] WhatsApp Alert @ ${payload.timestamp}`);
    console.log(`  Store : ${payload.store}`);
    console.log(`  To    : ${payload.to}`);
    console.log(`  Body  :\n${payload.body}`);
    console.log(`  SID   : ${sid}`);

    // If real Twilio credentials are present, send a live WhatsApp message
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

    if (accountSid && authToken && !accountSid.startsWith('ACxxxxxxx')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio')(accountSid, authToken);
      const msg = await twilio.messages.create({
        from: fromNumber,
        to:   payload.to,
        body: payload.body,
      });
      return NextResponse.json({ sid: msg.sid, status: 'queued', to: payload.to, body: payload.body });
    }

    return NextResponse.json({ sid, status: 'queued', to: payload.to, body: payload.body });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { sid: '', status: 'failed', to: '', body: '', error: message },
      { status: 500 },
    );
  }
}
