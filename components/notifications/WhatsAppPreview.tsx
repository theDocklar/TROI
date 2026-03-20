/**
 * Simulated WhatsApp UI showing the generated notification message.
 * "Send test alert" button fires POST /api/notify and shows a toast.
 */

'use client';

import { useState } from 'react';
import { Send, CheckCheck } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useUIStore } from '@/store/uiStore';
import { generateNotificationText } from '@/lib/insights';
import { sendWhatsAppAlert } from '@/lib/notify';
import { toast } from 'sonner';

const STORE_NUMBER = process.env.NEXT_PUBLIC_NOTIFY_TO ?? 'whatsapp:+61400000000';

/** Simulated WhatsApp chat preview with a send-alert button. */
export default function WhatsAppPreview(): React.JSX.Element {
  const range = useUIStore((s) => s.range);
  const { metrics } = useMetrics(range);
  const [sending, setSending] = useState(false);

  const messageBody = metrics
    ? generateNotificationText(metrics.current, range)
    : 'Loading…';

  const now = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  const handleSend = async (): Promise<void> => {
    if (!metrics) return;
    setSending(true);
    try {
      await sendWhatsAppAlert({
        to: STORE_NUMBER,
        body: messageBody,
        store: 'Blank',
        timestamp: new Date().toISOString(),
      });
      toast.success('Test alert sent (logged to console)');
    } catch {
      toast.error('Failed to send alert');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* WhatsApp header */}
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">B</div>
        <div>
          <p className="text-white text-sm font-semibold">Blank Store Alerts</p>
          <p className="text-white/70 text-xs">ROI Intelligence</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-[#ece5dd] dark:bg-gray-800 px-4 py-4 min-h-[200px]">
        {/* Bubble */}
        <div className="max-w-[85%] ml-auto">
          <div className="bg-[#dcf8c6] dark:bg-green-900 rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm">
            <pre className="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap font-sans leading-relaxed">
              {messageBody}
            </pre>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{now}</span>
              <CheckCheck size={12} className="text-[#53bdeb]" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Sends to <span className="font-mono text-gray-600 dark:text-gray-300">{STORE_NUMBER}</span> via Twilio
        </p>
        <button
          onClick={handleSend}
          disabled={sending || !metrics}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#075e54] hover:bg-[#054c44] disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          <Send size={14} />
          {sending ? 'Sending…' : 'Send test alert'}
        </button>
      </div>
    </section>
  );
}
