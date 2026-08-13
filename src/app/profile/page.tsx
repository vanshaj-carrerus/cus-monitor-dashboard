'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/auth-context';
import {
  Timer,
  Shield,
  UserRound,
  BarChart3,
  Monitor,
  Laptop,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { cn, formatTimeSpent } from '../../../lib/utils';

type ReportRow = {
  _id: string;
  trackedTimeSeconds?: number;
  productiveSeconds?: number;
  date?: string;
};

type ActivityRow = {
  _id: string;
  title: string;
  app_name: string;
  start_time: string;
  duration_seconds: number;
};

function getWeekRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const { startDate, endDate } = getWeekRange();
    (async () => {
      setLoading(true);
      try {
        const [reportsRes, activityRes] = await Promise.all([
          fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include',
          }),
          fetch(`/api/activity-log?startDate=${startDate}&endDate=${endDate}&limit=20`, {
            credentials: 'include',
          }),
        ]);
        const reportsJson = await reportsRes.json();
        const activityJson = await activityRes.json();
        if (reportsJson.success) setReports(reportsJson.data || []);
        if (activityJson.success) setActivities(activityJson.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const weeklyTotal = reports.reduce(
    (acc, r) => acc + Number(r.trackedTimeSeconds || 0),
    0,
  );
  const avgDaily = reports.length > 0 ? weeklyTotal / Math.min(reports.length, 7) : 0;

  const dailyBars = useMemo(() => {
    const { startDate } = getWeekRange();
    const bars: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${startDate}T00:00:00`);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const dayTotal = reports
        .filter((r) => r.date?.startsWith(key))
        .reduce((acc, r) => acc + Number(r.trackedTimeSeconds || 0), 0);
      bars.push(dayTotal);
    }
    const max = Math.max(...bars, 1);
    return bars.map((v) => Math.round((v / max) * 100));
  }, [reports]);

  const recentActivities = activities.slice(0, 4);
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">
            Personal Workspace
          </h2>
          <p className="text-base text-on-surface-variant">
            Manage your personal productivity logs and account security.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-fixed-variant">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Active Session
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Recent Activity */}
        <Card className="md:col-span-8 border-outline-variant p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
              <Timer className="h-5 w-5 text-primary" />
              Recent Activity
            </h3>
            <Link
              href="/reports/activity-log"
              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              View Full Log
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  {['Date', 'Project', 'Duration', 'Status'].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        'py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant',
                        h === 'Duration' && 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-on-surface-variant">
                      Loading activity...
                    </td>
                  </tr>
                ) : recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-on-surface-variant">
                      No recent activity found.
                    </td>
                  </tr>
                ) : (
                  recentActivities.map((log) => (
                    <tr
                      key={log._id}
                      className="transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-2 py-4 text-sm font-medium tabular-nums text-on-surface">
                        {new Date(log.start_time).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-2 py-4 text-sm font-semibold text-on-surface">
                        {log.title || log.app_name}
                      </td>
                      <td className="px-2 py-4 text-right text-sm font-medium tabular-nums text-on-surface">
                        {formatTimeSpent(log.duration_seconds)}
                      </td>
                      <td className="px-2 py-4">
                        <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[11px] font-bold text-on-surface">
                          LOGGED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4 md:col-span-4">
          <div className="relative overflow-hidden rounded-xl bg-inverse-surface p-5 text-white shadow-md">
            <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-10">
              <Monitor className="h-40 w-40" />
            </div>
            <h3 className="relative z-10 mb-2 text-lg font-semibold">Tracker Desktop</h3>
            <p className="relative z-10 mb-4 text-sm text-secondary-fixed-dim">
              Automatically log your activity for accurate reports.
            </p>
            <div className="relative z-10 space-y-2">
              <Link
                href="/CUS.Monitor_2.1.4_x64-setup.exe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/10 px-4 py-3 transition-colors hover:bg-white/20"
              >
                <span className="flex items-center gap-3 text-sm">
                  <Monitor className="h-5 w-5" />
                  Download for Windows
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 opacity-60"
              >
                <span className="flex items-center gap-3 text-sm">
                  <Laptop className="h-5 w-5" />
                  Download for MacOS
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Card className="border-outline-variant p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-on-surface">
              <Shield className="h-5 w-5 text-error" />
              Security Status
            </h3>
            <div className="mb-4 rounded-lg border border-error/20 bg-error-container/20 p-3">
              <p className="text-sm text-on-error-container">
                Reset your password regularly to keep your account secure.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center rounded-lg bg-on-surface py-2 text-[10px] font-bold uppercase tracking-wider text-surface transition-opacity hover:opacity-90"
            >
              Reset Password
            </Link>
          </Card>
        </div>

        {/* Profile Settings */}
        <Card className="border-outline-variant p-5 md:col-span-12 lg:col-span-7">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-on-surface">
            <UserRound className="h-5 w-5 text-primary" />
            Profile Settings
          </h3>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-on-surface-variant">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full rounded-lg border border-outline px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-on-surface-variant">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-outline px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-on-surface-variant">
                  Current Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role || ''}
                  className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container px-4 py-2 capitalize text-on-surface-variant"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-on-surface-variant">
                  Account ID
                </label>
                <input
                  type="text"
                  disabled
                  value={user?._id?.slice(-8).toUpperCase() || '—'}
                  className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container px-4 py-2 text-on-surface-variant"
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-outline-variant pt-4">
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Card>

        {/* Productivity Glance */}
        <Card className="flex flex-col justify-between border-outline-variant p-5 md:col-span-12 lg:col-span-5">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-on-surface">
              <BarChart3 className="h-5 w-5 text-primary" />
              Productivity Glance
            </h3>
            <div className="mb-6 flex items-center gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Weekly Total
                </p>
                <p className="text-2xl font-bold text-on-surface">
                  {loading ? '—' : formatTimeSpent(weeklyTotal)}
                </p>
              </div>
              <div className="h-12 w-px bg-outline-variant" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Avg Daily
                </p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? '—' : formatTimeSpent(Math.round(avgDaily))}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex h-32 items-end gap-2 px-2">
              {dailyBars.map((height, i) => (
                <div
                  key={dayLabels[i]}
                  className={cn(
                    'flex-1 rounded-t transition-colors',
                    height === Math.max(...dailyBars) && height > 0
                      ? 'bg-primary'
                      : 'bg-surface-container-highest hover:bg-primary/60',
                  )}
                  style={{ height: `${Math.max(height, 8)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between px-2">
              {dayLabels.map((d) => (
                <span key={d} className="text-[10px] font-bold text-on-surface-variant">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-inverse-surface px-6 py-3 text-white shadow-xl">
          <CheckCircle className="h-5 w-5 text-secondary-fixed-dim" />
          <p className="text-sm">Settings updated successfully</p>
        </div>
      )}
    </DashboardLayout>
  );
}
