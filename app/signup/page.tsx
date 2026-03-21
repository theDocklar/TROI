'use client';

/**
 * Sign-up page — split layout with product value proposition on the left, registration form on the right.
 * No auth logic: clicking "Create account" sets localStorage["troi_authed"] and redirects to /onboard.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const PLAN_FEATURES = [
  'Unlimited campaigns & channels',
  'True ROI with full P&L breakdown',
  'Product-level margin analysis',
  'LTV cohort tracking',
  'A/B experiment runner',
  'Real-time Shopify sync',
];

/** Sign-up page — full registration form for new users. */
export default function SignUpPage(): React.JSX.Element {
  const router = useRouter();
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [agreed, setAgreed]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSignUp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!agreed) return;
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.register(name, email, password);
      localStorage.setItem('troi_token', token);
      localStorage.setItem('troi_authed', 'true');
      localStorage.setItem('troi_user_email', user.email);
      localStorage.setItem('troi_user_name', user.name);
      localStorage.removeItem('troi_onboarded');
      router.replace('/onboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignUp(): void {
    // Google OAuth — not yet implemented
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — value prop ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-gray-950 text-white overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-[-80px] right-[-40px] w-80 h-80 bg-violet-600/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-64 h-64 bg-indigo-600/25 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-sm">T</div>
            <span className="text-xl font-bold tracking-tight">TROI</span>
            <span className="text-xs text-white/40 font-medium border border-white/10 rounded-full px-2 py-0.5">Free during Beta</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Start knowing where<br />
              <span className="text-indigo-400">your money actually goes.</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Connect Shopify and your ad accounts in minutes.
              No spreadsheets. No guessing. Just the numbers that matter.
            </p>
          </div>

          {/* Plan features */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Everything included, free</p>
            {PLAN_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle size={14} className="text-indigo-400 shrink-0" />
                <span className="text-white/70 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof numbers */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '2,400+', label: 'Shopify stores' },
            { value: '$840M',  label: 'Revenue tracked' },
            { value: '38%',    label: 'Avg. ROI lift' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Free during beta · No credit card required
            </p>
          </div>

          {/* Social sign-up */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 gap-2 text-sm font-medium"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Registration form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-gray-700 dark:text-gray-300">Full name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Work email</Label>
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
              <Label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          level <= passwordStrength ? strengthColor[passwordStrength] : 'bg-gray-200 dark:bg-gray-700',
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn('text-xs', passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-green-600')}>
                    {strengthLabel[passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                  agreed
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-400',
                )}
                onClick={() => setAgreed((v) => !v)}
              >
                {agreed && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>
              </span>
            </label>

            <Button
              type="submit"
              className={cn(
                'w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium',
                (!agreed || loading) && 'opacity-60 cursor-not-allowed',
              )}
              disabled={!agreed || loading}
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-12 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} TROI · <a href="#" className="hover:underline">Privacy</a> · <a href="#" className="hover:underline">Terms</a>
        </p>
      </div>
    </div>
  );
}
