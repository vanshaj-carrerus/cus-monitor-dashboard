'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ExternalLink,
  Search,
  ImageIcon,
  Users,
  CalendarDays,
  Clock,
  ChevronRight,
  ZoomIn,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth-context';
import { cn } from '../../../lib/utils';
import Image from 'next/image';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Screenshot {
  _id: string;
  imageUrl: string;
  createdAt: string;
}

function getInitials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDateLabel(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function groupByDate(screenshots: Screenshot[]) {
  const groups: Record<string, Screenshot[]> = {};
  for (const shot of screenshots) {
    const key = new Date(shot.createdAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(shot);
  }
  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
  );
}

export default function ScreenshotsPage() {
  const { user } = useAuth();
  const canManageScreenshots =
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.role === 'team_leader';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userScreenshots, setUserScreenshots] = useState<Screenshot[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewShot, setPreviewShot] = useState<Screenshot | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(
          `/api/screenshots?limit=1000&search=${encodeURIComponent(debouncedSearch)}`,
          { credentials: 'include' },
        );
        const json = await res.json();
        if (json.success) {
          setUsers(
            json.data.filter((u: User) => u.username !== user?.username),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, user?.username],
  );

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setScreenshotsLoading(true);
    setUserScreenshots([]);
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const qs = new URLSearchParams({
        userId: targetUser._id,
        createdAfter: weekAgo.toISOString(),
      });
      const res = await fetch(`/api/screenshots?${qs.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setUserScreenshots(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScreenshotsLoading(false);
    }
  };

  const handleOpenInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const closeModal = useCallback(() => {
    setSelectedUser(null);
    setPreviewShot(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewShot) setPreviewShot(null);
        else if (selectedUser) closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewShot, selectedUser, closeModal]);

  const groupedScreenshots = useMemo(
    () => groupByDate(userScreenshots),
    [userScreenshots],
  );

  return (
    <DashboardLayout>
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <ImageIcon className="h-3.5 w-3.5" />
              Visual Audit Trail
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                Screenshots Gallery
              </h1>
              <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
                Browse captured desktop snapshots from the last 7 days. Select a
                team member to review their activity timeline.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-outline-variant bg-surface-container-low px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Team Members
              </p>
              <p className="mt-1 text-2xl font-bold text-on-surface">
                {loading ? '—' : users.length}
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-low px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Retention
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">7 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-6 border-outline-variant p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">User Gallery</h2>
            <p className="text-sm text-on-surface-variant">
              Click a profile to open their screenshot timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-11 pr-4 text-sm text-on-surface shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-80"
              />
            </div>
            <Button
              type="button"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshing && 'animate-spin')}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* User grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-white"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-20 text-center">
          <Users className="mb-5 h-16 w-16 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900">No users found</h3>
          <p className="mt-2 text-sm text-slate-400">
            Try adjusting your search or refresh the list.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((targetUser) => (
            <button
              key={targetUser._id}
              type="button"
              onClick={() => handleUserClick(targetUser)}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  {getInitials(targetUser.username)}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div className="relative mt-5 space-y-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {targetUser.username}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {targetUser.email}
                </p>
              </div>
              <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <CalendarDays className="h-3 w-3" />
                Last 7 days
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Screenshot modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-primary">
                  {getInitials(selectedUser.username)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedUser.username}
                  </h3>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary sm:inline-flex">
                  {userScreenshots.length} captures
                </span>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {screenshotsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-video animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : userScreenshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ImageIcon className="mb-4 h-14 w-14 text-slate-200" />
                  <h4 className="text-base font-bold text-slate-900">
                    No screenshots yet
                  </h4>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    No captures were recorded for this user in the last 7 days.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupedScreenshots.map(([dateKey, shots]) => (
                    <section key={dateKey}>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {formatDateLabel(shots[0].createdAt)}
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {shots.map((shot) => (
                          <article
                            key={shot._id}
                            className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewShot(shot)}
                              className="relative block w-full overflow-hidden bg-slate-950"
                            >
                              <Image
                                src={shot.imageUrl || '/placeholder.png'}
                                alt="Screenshot"
                                width={640}
                                height={360}
                                className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/35">
                                <ZoomIn className="h-8 w-8 scale-75 text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100" />
                              </div>
                            </button>
                            <div className="flex items-center justify-between gap-2 p-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(shot.createdAt).toLocaleString()}
                              </div>
                              {canManageScreenshots && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenInNewTab(shot.imageUrl)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary/90"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {previewShot && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewShot(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewShot(null)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewShot.imageUrl}
              alt="Screenshot preview"
              width={1600}
              height={900}
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <p className="mt-4 text-center text-sm text-white/70">
              {new Date(previewShot.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
