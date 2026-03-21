'use client';

/**
 * Sign-in page — split layout with product branding on the left, email/password form on the right.
 * No auth logic: clicking "Sign in" sets localStorage["troi_authed"] and redirects appropriately.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, TrendingUp, BarChart3, Zap, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: TrendingUp, text: 'True ROI across every ad channel — not just ROAS' },
  { icon: BarChart3,  text: 'Per-product P&L so you know what to scale' },
  { icon: Zap,        text: 'Instant insights: when to pause, when to scale' },
];

const TESTIMONIAL = {
  quote: "We thought our TikTok campaigns were killing it. TROI showed us Email was delivering 420% ROI while TikTok was barely breaking even.",
  author: 'Jamie T.',
  role: 'Founder, Blank Clothing',
  avatar: 'J',
};

/** Sign-in page — email + password form with Google OAuth stub. */
export default function SignInPage(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  function handleSignIn(e: React.FormEvent): void {
    e.preventDefault();
    setLoading(true);
    // Simulate auth round-trip
    setTimeout(() => {
      localStorage.setItem('troi_authed', 'true');
      localStorage.setItem('troi_user_email', email);
      const onboarded = localStorage.getItem('troi_onboarded') === 'true';
      router.replace(onboarded ? '/' : '/onboard');
    }, 800);
  }

  function handleGoogleSignIn(): void {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('troi_authed', 'true');
      const onboarded = localStorage.getItem('troi_onboarded') === 'true';
      router.replace(onboarded ? '/' : '/onboard');
    }, 800);
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-gray-950 text-white overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Gradient blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-sm">T</div>
            <span className="text-xl font-bold tracking-tight">TROI</span>
            <span className="text-xs text-white/40 font-medium border border-white/10 rounded-full px-2 py-0.5">Beta</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Know your<br />
              <span className="text-indigo-400">true profitability.</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              ROAS tells you what you spent. TROI tells you what you made.
              The dashboard built for DTC founders who've been burned by vanity metrics.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-indigo-400" />
                </div>
                <span className="text-white/70 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-white/80 text-sm leading-relaxed italic">"{TESTIMONIAL.quote}"</p>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
              {TESTIMONIAL.avatar}
            </div>
            <div>
              <p className="text-white text-xs font-medium">{TESTIMONIAL.author}</p>
              <p className="text-white/40 text-xs">{TESTIMONIAL.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-gray-950">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-sm">T</div>
          <span className="text-lg font-bold">TROI</span>
        </div>

        <div className="w-full max-w-[380px] space-y-6">
          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to your dashboard
            </p>
          </div>

          {/* Social sign-in */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 gap-2 text-sm font-medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {/* Google SVG logo */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourstore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-300">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className={cn('w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium', loading && 'opacity-70')}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} TROI · <a href="#" className="hover:underline">Privacy</a> · <a href="#" className="hover:underline">Terms</a>
        </p>
      </div>
    </div>
  );
}
