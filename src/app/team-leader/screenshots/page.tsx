'use client';

import { useState, useEffect } from 'react';
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';

export default function TeamLeaderScreenshots() {
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchScreenshots = async (nextPage = page, nextLimit = limit) => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const res = await fetch(
        `/api/team-leader/screenshots?page=${nextPage}&limit=${nextLimit}&search=${encodeURIComponent(searchTerm)}`,
        cred
      );
      const data = await res.json();
      if (data.success) {
        setScreenshots(data.data);
        setPage(Number(data.page || nextPage));
        setLimit(Number(data.limit || nextLimit));
        setTotal(Number(data.total || 0));
      }
    } catch (err) {
      console.error('Failed to fetch screenshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchScreenshots(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    fetchScreenshots(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const changeLimit = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col gap-8">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-lg text-[#0D1B3E]">Team Screenshots</h2>
              <div className="flex gap-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search screenshots..."
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

            {/* Screenshots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <p className="col-span-full text-center text-slate-500 py-8">Loading…</p>
              ) : screenshots.length === 0 ? (
                <p className="col-span-full text-center text-slate-500 py-8">No screenshots found.</p>
              ) : (
                screenshots.map((screenshot: any) => (
                  <Card key={screenshot._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-slate-100 relative">
                      {screenshot.imageUrl ? (
                        <img
                          src={screenshot.imageUrl}
                          alt="Screenshot"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm text-[#0D1B3E] truncate mb-1">
                        {screenshot.userId?.username || screenshot.userId?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        {screenshot.createdAt && new Date(screenshot.createdAt).toLocaleString()}
                      </p>
                      {screenshot.appName && (
                        <p className="text-xs text-slate-400">App: {screenshot.appName}</p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {screenshots.length > 0 && (
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
