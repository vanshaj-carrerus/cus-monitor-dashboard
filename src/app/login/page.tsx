'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign in failed');
        return;
      }
      router.replace(next.startsWith('/') ? next : '/');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-indigo-100/40">
        <div className="mb-8 rounded-xl bg-gradient-to-r from-[#5E35B1] to-[#7E57C2] py-6 text-center text-white">
          <h1 className="text-2xl font-bold">MeraMonitor</h1>
          <p className="mt-1 text-sm opacity-90">Sign in to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/20"
                placeholder="you@company.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/20"
              />
            </div>
          </div>
          <div className="text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-[#5E35B1] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-auto w-full rounded-xl bg-[#5E35B1] py-3 font-bold text-white hover:bg-[#4527A0]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
