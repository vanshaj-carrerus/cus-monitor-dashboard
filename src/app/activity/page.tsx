'use client';

import { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  Clock,
  Monitor,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatTimeSpent } from '../../../lib/utils';

interface ActivityLog {
  _id: string;
  userName: string;
  app_name: string;
  duration_seconds: number;
  start_time: string;
  site?: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  console.log(logs);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/activity-log');
        const json = await res.json();
        if (json.success) {
          setLogs(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Tracking</h1>
          <p className="text-slate-500 dark:text-slate-400">Real-time view of application usage and work activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Logs
          </Button>
          <Button size="sm">Export Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Activity Timeline" description="Detailed chronological log of user activity">
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 mt-6 space-y-8 pb-4">
              {loading ? (
                <p className="px-4 text-sm text-slate-500">Loading activities...</p>
              ) : logs.length === 0 ? (
                <p className="px-4 text-sm text-slate-500">No activity logs found.</p>
              ) : (
                logs.map((log) => (
                  <div key={log._id} className="relative pl-8">
                    <div className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white dark:bg-blue-900/30 dark:ring-slate-950">
                      <ActivityIcon className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {log.userName || 'Unknown User'} <span className="font-normal text-slate-500">started using</span> {log.app_name}
                        </h4>
                        <div className="mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {new Date(log.start_time).toLocaleTimeString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Monitor className="h-3 w-3" />
                            {formatTimeSpent(log.duration_seconds)}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600  dark:text-slate-400">
                            {log.site ? 'web' : 'app'}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Top Apps by Team" description="Most used applications today">
            <div className="space-y-4">
              {[
                { name: 'VS Code', time: '12h 45m', percentage: 75, color: 'bg-blue-600' },
                { name: 'Chrome', time: '8h 20m', percentage: 50, color: 'bg-green-500' },
                { name: 'Slack', time: '4h 15m', percentage: 30, color: 'bg-purple-500' },
                { name: 'Figma', time: '3h 30m', percentage: 20, color: 'bg-orange-500' },
              ].map((app) => (
                <div key={app.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{app.name}</span>
                    <span className="text-xs text-slate-500">{app.time}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100  overflow-hidden">
                    <div className={`h-full ${app.color} transition-all duration-500`} style={{ width: `${app.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Productivity Tips" description="Based on team activity">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                The team is most productive between 10 AM and 12 PM. Consider scheduling deep work sessions during this time.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
