'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Upload,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
  Search
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';
import { formatTimeSpent } from '../../../../lib/utils';

interface LogEntry {
  _id: string;
  userId: string;
  userName: string;
  title: string;
  app_name: string;
  site?: string;
  start_time: string;
  duration_seconds: number;
}

interface UserSummary {
  userId: string;
  userName: string;
  working: number;
  idle: number;
  stopped: number;
  total: number;
  logs: LogEntry[];
}

interface DaySummary {
  date: string;
  working: number;
  idle: number;
  stopped: number;
  total: number;
  users: Record<string, UserSummary>;
}

export default function ActivityLogPage() {
  const [logsByDate, setLogsByDate] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 200;

  // Expanded states
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  async function fetchLogs(targetPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(limit));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/activity-log?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setTotal(Number(json.total || 0));
        setPage(Number(json.page || targetPage));
        const summaryMap: Record<string, DaySummary> = {};

        json.data.forEach((log: LogEntry) => {
          const dateObj = new Date(log.start_time);
          const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

          if (!summaryMap[dateStr]) {
            summaryMap[dateStr] = { date: dateStr, working: 0, idle: 0, stopped: 0, total: 0, users: {} };
          }

          const dayEntry = summaryMap[dateStr];
          dayEntry.working += log.duration_seconds;
          dayEntry.total += log.duration_seconds;

          if (!dayEntry.users[log.userId]) {
            dayEntry.users[log.userId] = {
              userId: log.userId,
              userName: log.userName || log.userId,
              working: 0,
              idle: 0,
              stopped: 0,
              total: 0,
              logs: []
            };
          }

          const userEntry = dayEntry.users[log.userId];
          userEntry.working += log.duration_seconds;
          userEntry.total += log.duration_seconds;
          userEntry.logs.push(log);
        });

        // Sort days descending
        const sortedLogs = Object.values(summaryMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Sort logs within users descending
        sortedLogs.forEach(day => {
          Object.values(day.users).forEach(user => {
            user.logs.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
          });
        });

        setLogsByDate(sortedLogs);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const toggleUser = (date: string, userId: string) => {
    const key = `${date}-${userId}`;
    setExpandedUsers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DashboardLayout>
      {/* Header Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, app, site"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-[13px] text-slate-600 outline-none min-w-[220px]"
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm min-w-[320px]">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-[13px] text-slate-600 outline-none" />
          <span className="text-slate-300">—</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-[13px] text-slate-600 outline-none" />
          <Calendar className="h-5 w-5 text-slate-300" />
          <Button size="sm" onClick={() => fetchLogs(1)} className="rounded-lg bg-[#5E35B1] text-white hover:bg-[#4527A0] px-3 py-1.5 h-auto">Apply</Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {/* Legend and Actions Bar */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-end p-8 border-b border-slate-50">
          <div className="flex items-center gap-8 rounded-xl border border-blue-100 bg-white px-6 py-3 shadow-sm">
            <LegendItem color="bg-[#22C55E]" label="Working" />
            <LegendItem color="bg-[#A05E2C]" label="Stopped" />
            <LegendItem color="bg-[#FBBF24]" label="Idle" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-slate-100/50 text-slate-400 px-6 py-3 rounded-xl border-none font-bold text-[13px] h-auto">
              <Upload className="h-5 w-5 rotate-180" />
              Export
            </Button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[13px] font-bold text-[#0D1B3E] w-1/3">
                  Date / User / Activity
                </th>
                <th className="px-8 py-6 text-[13px] font-bold text-[#0D1B3E] w-1/3 text-center">
                  Duration / Details
                </th>
                <th className="px-8 py-6 text-[13px] font-bold text-[#0D1B3E] w-1/3 text-right">
                  Total Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-8 text-center text-slate-500">Loading activity logs...</td>
                </tr>
              ) : logsByDate.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-8 text-center text-slate-500">No activity logs found.</td>
                </tr>
              ) : (
                logsByDate.map((dayLog) => (
                  <React.Fragment key={dayLog.date}>
                    {/* Date Row */}
                    <tr
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer bg-slate-50/20"
                      onClick={() => toggleDate(dayLog.date)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {expandedDates[dayLog.date] ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                          <span className="text-[14px] font-bold text-[#0D1B3E]">{dayLog.date}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center text-slate-500 text-[13px]">
                        {Object.keys(dayLog.users).length} Users Logged
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-[14px] font-bold text-[#22C55E]">{formatTimeSpent(dayLog.total)}</span>
                      </td>
                    </tr>

                    {/* Users Rows (Expanded Date) */}
                    {expandedDates[dayLog.date] && Object.values(dayLog.users).map((user) => (
                      <React.Fragment key={`${dayLog.date}-${user.userId}`}>
                        <tr
                          className="group hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => toggleUser(dayLog.date, user.userId)}
                        >
                          <td className="px-8 py-5 pl-14">
                            <div className="flex items-center gap-3">
                              {expandedUsers[`${dayLog.date}-${user.userId}`] ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                  {user.userName.substring(0, 2)}
                                </div>
                                <span className="text-[14px] font-semibold text-[#0D1B3E]">{user.userName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex justify-center gap-6">
                              <DurationItem color="bg-[#22C55E]" value={formatTimeSpent(user.working)} />
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-[13px] font-semibold text-slate-600">{formatTimeSpent(user.total)}</span>
                          </td>
                        </tr>

                        {/* Logs Rows (Expanded User) */}
                        {expandedUsers[`${dayLog.date}-${user.userId}`] && user.logs.map((log) => (
                          <tr key={log._id} className="bg-slate-50/40 hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-4 pl-[5.5rem]">
                              <div className="flex items-start gap-3 max-w-[350px]">
                                <div className="mt-0.5 min-w-5">
                                  {log.site ? <Globe className="h-4 w-4 text-blue-400" /> : <Monitor className="h-4 w-4 text-slate-400" />}
                                </div>
                                <div>
                                  <p className="text-[13px] font-medium text-[#0D1B3E] truncate" title={log.title}>
                                    {log.title}
                                  </p>
                                  <p className="text-[12px] text-slate-500 mt-0.5">
                                    {log.site ? `Website: ${log.site}` : log.app_name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <p className="text-[12px] font-medium text-slate-500">
                                {new Date(log.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <span className="text-[13px] font-medium text-slate-600 bg-white border border-slate-100 rounded-md px-2 py-1 shadow-sm">
                                {formatTimeSpent(log.duration_seconds)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-50">
          <span className="text-[12px] text-slate-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-lg"
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(page + 1)}
            disabled={page * limit >= total || loading}
            className="rounded-lg"
          >
            Next
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("h-3.5 w-3.5 rounded-full", color)}></div>
      <span className="text-[13px] font-medium text-slate-600">{label}</span>
    </div>
  );
}

function DurationItem({ color, value }: { color: string, value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-3.5 w-3.5 rounded-full", color)}></div>
      <span className="text-[12px] font-bold text-[#0D1B3E]">{value}</span>
    </div>
  );
}
