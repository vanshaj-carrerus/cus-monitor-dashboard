'use client';

import { useState, useEffect } from 'react';
import { Search, Video, ChevronDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TeamLeaderLiveStream() {
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLiveStreams = async () => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const res = await fetch(
        `/api/team-leader/live-stream?search=${encodeURIComponent(searchTerm)}`,
        cred
      );
      const data = await res.json();
      if (data.success) {
        setLiveStreams(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch live streams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLiveStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col gap-8">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bold text-lg text-[#0D1B3E]">Team Live Stream</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search member..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Live Streams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <p className="col-span-full text-center text-slate-500 py-8">Loading…</p>
              ) : liveStreams.length === 0 ? (
                <p className="col-span-full text-center text-slate-500 py-8">No active live streams from your team.</p>
              ) : (
                liveStreams.map((stream: any) => (
                  <Card key={stream._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-slate-900 relative">
                      {stream.streamUrl ? (
                        <video
                          src={stream.streamUrl}
                          controls
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <Video className="h-12 w-12 mb-2 opacity-50" />
                          <p>Stream unavailable</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm text-[#0D1B3E] mb-1">
                        {stream.userId?.username || stream.userId?.email || 'Unknown'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Live
                      </div>
                      {stream.createdAt && (
                        <p className="text-xs text-slate-400">
                          Started: {new Date(stream.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
