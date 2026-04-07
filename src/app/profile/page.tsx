'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/auth-context';
import { KeyRound, User } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-6">
        <Card className="border-none p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#5E35B1]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Account</h2>
              <p className="text-sm text-slate-500">Your profile information</p>
            </div>
          </div>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-400">Username</dt>
              <dd className="text-slate-900">{user?.username}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-400">Email</dt>
              <dd className="text-slate-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-400">Role</dt>
              <dd className="capitalize text-slate-900">{user?.role}</dd>
            </div>
          </dl>
        </Card>

        <Card className="border-none p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-[#5E35B1]" />
            <h3 className="font-bold text-slate-900">Security</h3>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Reset your password via email. You will receive a link to choose a new password.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex rounded-xl bg-[#5E35B1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4527A0]"
          >
            Forgot password
          </Link>
        </Card>
      </div>
    </DashboardLayout>
  );
}
