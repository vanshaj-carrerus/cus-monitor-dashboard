'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatTimeSpent } from '../../../../lib/utils';

export default function TeamLeaderTimeTracker() {
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimeEntries = async (nextPage = page, nextLimit = limit) => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: nextLimit.toString(),
        search: searchTerm,
      });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(
        `/api/team-leader/time-tracker?${params.toString()}`,
        cred
      );
      const data = await res.json();
      if (data.success) {
        setTimeEntries(data.data);
        setPage(Number(data.page || nextPage));
        setLimit(Number(data.limit || nextLimit));
        setTotal(Number(data.total || 0));
      }
    } catch (err) {
      console.error('Failed to fetch time entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchTimeEntries(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    setLoading(true);
    fetchTimeEntries(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const changeLimit = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col gap-8">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-lg text-[#0D1B3E]">Team Time Tracking</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#5E35B1] focus:outline-none"
                    placeholder="Start Date"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#5E35B1] focus:outline-none"
                    placeholder="End Date"
                  />
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="secondary" className="flex items-center gap-2 text-slate-400 border-none rounded-xl bg-slate-100/50 px-6 py-3 h-auto font-bold">
                  <Download className="h-5 w-5 rotate-180" />
                  Export
                </Button>
              </div>
            </div>

            {/* Time Entries Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                    </tr>
                  ) : timeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No time entries found for your team.</td>
                    </tr>
                  ) : (
                    timeEntries.map((entry: any) => (
                      <tr key={entry._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#5E35B1]/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-[#5E35B1]" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700">
                                {entry.userId?.username || entry.userId?.email || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {entry.createdAt && new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {entry.startTime && new Date(entry.startTime).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {entry.endTime && new Date(entry.endTime).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {formatDuration(entry.duration || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {entry.activity || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {timeEntries.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <select
                    value={limit}
                    onChange={(e) => changeLimit(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-200 rounded text-sm text-slate-500 bg-transparent focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-slate-500">Showing {from} to {to} of {total} entries</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-sm",
                          p === page ? "bg-[#5E35B1] text-white" : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
