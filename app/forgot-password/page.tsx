'use client';

/**
 * Forgot-password page — minimal centred form.
 * No logic: clicking "Send reset link" simulates the email sent state.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/** Forgot-password page with "email sent" confirmation state. */
export default function ForgotPasswordPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 900);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-gray-950">
      <div className="w-full max-w-[380px] space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-sm">T</div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">TROI</span>
        </div>

        {!sent ? (
          <>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter your email and we'll send a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </>
        ) : (
          /* Email sent confirmation */
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <Mail size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your inbox</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                We sent a reset link to <strong className="text-gray-700 dark:text-gray-300">{email}</strong>.
                Check your spam folder if it doesn't arrive within a minute.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-10 text-sm"
              onClick={() => { setSent(false); setEmail(''); }}
            >
              Try a different email
            </Button>
          </div>
        )}

        <Link
          href="/signin"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
