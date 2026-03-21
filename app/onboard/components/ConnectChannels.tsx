'use client';

/**
 * Onboarding Step 2 — Connect ad channels.
 * Shows mock OAuth connection cards for Meta, Google, TikTok and Klaviyo.
 * Persists connection state to localStorage "troi_channels" so the
 * dashboard Channels settings tab reflects what was set here.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChannelCard {
  id: string;
  name: string;
  color: string;
  initial: string;
}

export const CHANNEL_DEFINITIONS: ChannelCard[] = [
  { id: 'meta',    name: 'Meta Ads',    color: 'bg-blue-600',  initial: 'M' },
  { id: 'google',  name: 'Google Ads',  color: 'bg-red-500',   initial: 'G' },
  { id: 'tiktok',  name: 'TikTok Ads',  color: 'bg-gray-900',  initial: 'T' },
  { id: 'klaviyo', name: 'Klaviyo',     color: 'bg-green-600', initial: 'K' },
];

/** Read persisted channel connections from localStorage. */
export function getStoredChannels(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('troi_channels') ?? '{}');
  } catch {
    return {};
  }
}

interface Props {
  onContinue: () => void;
  onBack: () => void;
}

/** Step 2 of onboarding: connect ad channels via simulated OAuth. */
export default function ConnectChannels({ onContinue, onBack }: Props): React.JSX.Element {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  // Restore any previously saved state (e.g. re-running onboarding)
  useEffect(() => {
    setConnected(getStoredChannels());
  }, []);

  function handleConnect(id: string): void {
    setPending((p) => ({ ...p, [id]: true }));
    setTimeout(() => {
      setPending((p) => ({ ...p, [id]: false }));
      setConnected((c) => {
        const next = { ...c, [id]: true };
        localStorage.setItem('troi_channels', JSON.stringify(next));
        return next;
      });
    }, 1500);
  }

  function handleDisconnect(id: string): void {
    setConnected((c) => {
      const next = { ...c, [id]: false };
      localStorage.setItem('troi_channels', JSON.stringify(next));
      return next;
    });
  }

  function handleContinue(): void {
    // Persist final state before advancing
    localStorage.setItem('troi_channels', JSON.stringify(connected));
    onContinue();
  }

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const canContinue = connectedCount >= 1 || CHANNEL_DEFINITIONS.every((ch) => !pending[ch.id]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {connectedCount} of {CHANNEL_DEFINITIONS.length} connected
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CHANNEL_DEFINITIONS.map((ch) => (
          <Card key={ch.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                  ch.color,
                )}
              >
                {ch.initial}
              </span>
              <div>
                <p className="font-medium text-sm">{ch.name}</p>
                {connected[ch.id] && (
                  <Badge variant="outline" className="text-green-600 border-green-400 text-xs mt-0.5">
                    Connected
                  </Badge>
                )}
              </div>
            </div>
            {connected[ch.id] ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => handleDisconnect(ch.id)}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending[ch.id]}
                  onClick={() => handleConnect(ch.id)}
                >
                  {pending[ch.id] ? 'Connecting…' : 'Connect'}
                </Button>
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => handleDisconnect(ch.id)}
                >
                  Skip for now
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Blurred dashboard preview */}
      <div className="relative rounded-xl overflow-hidden border h-36 bg-muted">
        <div className="absolute inset-0">
          <div
            className="w-full h-full opacity-40 pointer-events-none blur-sm"
            aria-hidden
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm font-medium text-white drop-shadow">
            Your ROI dashboard unlocks here
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
