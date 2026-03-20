/**
 * Notification service — sends WhatsApp alerts via the mock Twilio endpoint.
 *
 * In production, replace the fetch call with the real Twilio SDK:
 *   const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *   await twilio.messages.create({
 *     from: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
 *     to: payload.to,
 *     body: payload.body,
 *   });
 */

import type { NotificationPayload } from '@/types';

interface TwilioMockResponse {
  sid: string;
  status: 'queued' | 'failed';
  to: string;
  body: string;
  error?: string;
}

/**
 * Sends a WhatsApp alert using the /api/notify mock endpoint.
 * Logs the full payload to console with timestamp.
 * Never throws — errors are caught and logged.
 */
export async function sendWhatsAppAlert(payload: NotificationPayload): Promise<void> {
  console.log(`[ROI Intelligence / notify] Sending alert at ${payload.timestamp}`);
  console.log(`  Store : ${payload.store}`);
  console.log(`  To    : ${payload.to}`);
  console.log(`  Body  :\n${payload.body}`);

  const res = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await res.json() as TwilioMockResponse;

  if (result.status === 'queued') {
    console.log(`[ROI Intelligence / notify] Queued — SID: ${result.sid}`);
  } else {
    console.error(`[ROI Intelligence / notify] Failed: ${result.error ?? 'unknown error'}`);
  }
}
