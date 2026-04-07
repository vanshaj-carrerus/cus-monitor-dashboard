'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Forgot password</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Enter your account email. If it exists, we will send a reset link.
        </p>

        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-sm text-slate-600">
              If an account exists for that email, reset instructions have been sent. Check your inbox and spam folder.
            </p>
            <p className="text-xs text-slate-400">
              When email is not configured in this environment, check the server console for the reset link.
            </p>
            <Link href="/login" className="inline-block font-medium text-[#5E35B1] hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-[#5E35B1] focus:outline-none"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-auto w-full rounded-xl bg-[#5E35B1] py-3 font-bold text-white"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </span>
              ) : (
                'Send reset link'
              )}
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-[#5E35B1] hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
