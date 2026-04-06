'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  // In Next.js 15+, params is a Promise. We must unwrap it with `use()`.
  const { token } = use(params);

  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength indicator
  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-4
  };

  const strength = getStrength(password);
  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/invite/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100/40 border border-slate-100">
        <div className="mb-8 text-center bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white py-6 rounded-xl">
          <h1 className="text-2xl font-bold">Welcome to CUS Monitor</h1>
          <p className="text-sm opacity-90 mt-1">Set up your account to get started</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Account Created!</h2>
            <p className="text-slate-500">Redirecting to login...</p>
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-12 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColor : 'bg-slate-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strengthLabel}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-12 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"
                    placeholder="Verify your password"
                  />
                  {confirmPassword.length > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {password === confirmPassword ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold h-auto shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
