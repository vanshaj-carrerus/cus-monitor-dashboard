'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/auth-context';
import { Check, Copy, KeyRound, Loader2, RefreshCw, Shield } from 'lucide-react';

type GenerateResponse = {
  success: boolean;
  otp?: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  error?: string;
};

function isAdminRole(role?: string) {
  return role === 'admin' || role === 'admin_compliance';
}

export default function UninstallOtpPage() {
  const { user, loading: authLoading } = useAuth();
  const [otp, setOtp] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch('/api/uninstall/otp/generate', {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok || !data.success || !data.otp) {
        setError(data.error || 'Failed to generate OTP.');
        setOtp(null);
        setExpiresAt(null);
        return;
      }
      setOtp(data.otp);
      setExpiresAt(data.expiresAt || null);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const copyOtp = async () => {
    if (!otp) return;
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdminRole(user.role)) {
    return (
      <DashboardLayout>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <Shield className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900">Admins only</h1>
          <p className="mt-2 text-sm text-slate-500">
            Uninstall OTP generation is restricted to administrators.
          </p>
        </Card>
      </DashboardLayout>
    );
  }

  const expired = !!otp && secondsLeft <= 0;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Uninstall OTP</h1>
        <p className="text-sm text-slate-500">
          Generate a one-time code so IT can uninstall CUS Monitor on an employee PC.
        </p>
      </div>

      <Card className="max-w-xl p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admin uninstall code</h2>
            <p className="mt-1 text-sm text-slate-500">
              Uninstall requires the company password <strong>and</strong> this OTP. Codes are 8
              characters (mixed case + digits), valid for 10 minutes, and usable once.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {otp ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current OTP
            </p>
            <p
              className={`font-mono text-3xl font-bold tracking-[0.2em] ${
                expired ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {otp}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {expired
                ? 'Expired — generate a new code.'
                : `Expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button type="button" variant="secondary" onClick={copyOtp} disabled={expired}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
            No active OTP. Generate one when an employee needs the app uninstalled.
          </div>
        )}

        <Button type="button" className="w-full" onClick={generate} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {otp ? 'Generate new OTP' : 'Generate OTP'}
        </Button>
      </Card>
    </DashboardLayout>
  );
}
