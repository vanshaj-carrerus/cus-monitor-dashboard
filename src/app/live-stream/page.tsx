'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Monitor, Play, Square, X, RefreshCw, AlertCircle, MousePointerClick, Keyboard } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../lib/utils';

interface User {
  username: string;
  email: string;
  role: string;
  active: boolean;
}

interface UserCardProps {
  user: User;
  onViewStream: (user: User) => void;
}

function UserCard({ user, onViewStream }: UserCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
          <Monitor className="h-6 w-6" />
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {user.role}
        </span>
      </div>

      <div className="mb-6 space-y-1">
        <h4 className="text-sm font-bold text-slate-900 truncate">{user.username}</h4>
        <p className="text-[11px] font-medium text-slate-400 truncate">{user.email}</p>
        <p className={cn("text-[11px] font-bold uppercase tracking-wider", user.active ? "text-green-600" : "text-red-500")}>
          {user.active ? 'Active' : 'Inactive'}
        </p>
      </div>

      <Button
        onClick={() => onViewStream(user)}
        disabled={!user.active}
        className="w-full justify-center gap-2 rounded-xl bg-[#5E35B1] py-5 text-[13px] font-bold text-white hover:bg-[#4527A0] active:scale-95 transition-all"
      >
        <Play className="h-4 w-4 fill-white" />
        {user.active ? 'View Stream' : 'Inactive'}
      </Button>
    </div>
  );
}

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  TrackReference,
  useRoomContext
} from '@livekit/components-react';
import '@livekit/components-styles';

type RemoteCommand =
  | { t: 'mouseMove'; x: number; y: number }
  | { t: 'mouseDown' | 'mouseUp'; button: number; x: number; y: number }
  | { t: 'mouseWheel'; deltaY: number; x: number; y: number }
  | { t: 'keyDown' | 'keyUp'; key: string; code: string };

const ACTOR_ROLE = 'admin';

function VideoPlayer() {
  const tracks = useTracks();

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center p-10">
        <RefreshCw className="h-10 w-10 animate-spin text-purple-500" />
        <p className="text-sm font-medium text-slate-400">Waiting for tracks from participant...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 h-full w-full overflow-y-auto p-4 bg-slate-950">
      {tracks.map((trackRef) => (
        <div key={trackRef.publication.trackSid} className="relative flex flex-col gap-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden min-h-[300px]">
          <div className="absolute top-4 left-4 z-10 rounded-lg bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {trackRef.participant.identity.toUpperCase()} • {trackRef.source.toUpperCase()}
          </div>
          <VideoTrack
            trackRef={trackRef as TrackReference}
            className="h-full w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}

function RemoteControlOverlay({
  enabled,
  onDisabledByInactivity,
}: {
  enabled: boolean;
  onDisabledByInactivity: () => void;
}) {
  const room = useRoomContext();
  const areaRef = useRef<HTMLDivElement | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sendCommand = useCallback(
    async (command: RemoteCommand) => {
      if (!enabled) return;
      const payload = JSON.stringify(command);
      await room.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable: false, topic: 'remote-control' },
      );
    },
    [enabled, room.localParticipant],
  );

  useEffect(() => {
    if (!enabled) {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
      return;
    }
    heartbeatTimerRef.current = setInterval(async () => {
      try {
        await fetch('/api/stream?action=control-heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-actor-role': ACTOR_ROLE,
          },
          body: JSON.stringify({ userId: room.name.replace('room_', '') }),
        });
      } catch {
        // noop
      }
    }, 10_000);
    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [enabled, room.name]);

  const getNorm = useCallback((event: React.MouseEvent | React.WheelEvent) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      sendCommand({ t: 'keyDown', key: e.key, code: e.code }).catch(() => onDisabledByInactivity());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      sendCommand({ t: 'keyUp', key: e.key, code: e.code }).catch(() => onDisabledByInactivity());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [enabled, sendCommand, onDisabledByInactivity]);

  return (
    <div
      ref={areaRef}
      tabIndex={0}
      className={cn(
        "absolute inset-0 z-20",
        enabled ? "cursor-crosshair bg-transparent" : "pointer-events-none",
      )}
      onMouseMove={(e) => {
        if (!enabled) return;
        const pos = getNorm(e);
        sendCommand({ t: 'mouseMove', ...pos }).catch(() => onDisabledByInactivity());
      }}
      onMouseDown={(e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getNorm(e);
        sendCommand({ t: 'mouseDown', button: e.button, ...pos }).catch(() => onDisabledByInactivity());
      }}
      onMouseUp={(e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getNorm(e);
        sendCommand({ t: 'mouseUp', button: e.button, ...pos }).catch(() => onDisabledByInactivity());
      }}
      onWheel={(e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getNorm(e);
        sendCommand({ t: 'mouseWheel', deltaY: e.deltaY, ...pos }).catch(() => onDisabledByInactivity());
      }}
    />
  );
}

function StreamModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [isControlMode, setIsControlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [lkUrl, setLkUrl] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<'view-only' | 'control-active' | 'paused(inactive)'>('view-only');

  const toggleStream = async (start: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stream?action=toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-role': ACTOR_ROLE,
        },
        body: JSON.stringify({
          userId: user.username,
          isActive: start,
          controlEnabled: isControlMode,
          controllerId: isControlMode ? 'admin-ui' : '',
          reasonStopped: start ? '' : 'stopped_by_admin',
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (start) {
          const tokenRes = await fetch(`/api/stream/token?room=room_${user.username}&identity=admin_${Math.random().toString(36).substring(7)}&clientType=admin`, {
            headers: { 'x-actor-role': ACTOR_ROLE },
          });
          const tokenData = await tokenRes.json();
          if (tokenData.token) {
            setLkToken(tokenData.token);
            setLkUrl(tokenData.url);
            setIsActive(true);
            setStatusLabel(isControlMode ? 'control-active' : 'view-only');
          } else {
            setError("Failed to generate access token");
          }
        } else {
          setIsActive(false);
          setIsControlMode(false);
          setStatusLabel('view-only');
          setLkToken(null);
        }
      }
    } catch {
      setError("Failed to communicate with server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/stream?action=status&userId=${encodeURIComponent(user.username)}`);
        const data = await res.json();
        if (data.success && (!data.isUserActive || !data.isActive)) {
          setStatusLabel('paused(inactive)');
          setIsControlMode(false);
          setIsActive(false);
          setLkToken(null);
          setError(data.reasonStopped || 'User became inactive. Stream stopped.');
        }
      } catch {
        // noop
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [isActive, user.username]);

  useEffect(() => {
    return () => {
      fetch(`/api/stream?action=toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-role': ACTOR_ROLE,
        },
        body: JSON.stringify({
          userId: user.username,
          isActive: false,
          controlEnabled: false,
          reasonStopped: 'closed_by_admin',
        }),
      }).catch(console.error);
    };
  }, [user.username]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-y-auto overflow-x-hidden rounded-3xl border-none bg-white p-0 shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-50 px-8">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <div className={cn("h-3 w-3 rounded-full bg-red-500", isActive && "animate-ping")} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">LiveStream (WebRTC): {user.username}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5E35B1]">
                {isActive ? `High-Performance Active • ${statusLabel}` : 'Not Connected • Click Start'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-50 p-2 text-slate-400 transition-hover hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
          {isActive && lkToken && lkUrl ? (
            <LiveKitRoom
              token={lkToken}
              serverUrl={lkUrl}
              connect={true}
              audio={false}
              video={false}
              data-lk-theme="default"
              className="h-full w-full"
              onDisconnected={() => setIsActive(false)}
              onError={(e) => setError(e.message)}
            >
              <VideoPlayer />
              <RemoteControlOverlay
                enabled={isControlMode}
                onDisabledByInactivity={() => {
                  setIsControlMode(false);
                  setStatusLabel('paused(inactive)');
                }}
              />
            </LiveKitRoom>
          ) : (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                <RefreshCw className={cn("h-10 w-10 text-white/20", loading && "animate-spin text-purple-500/50")} />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">Stream is {loading ? 'Initializing...' : 'Offline'}</p>
                <p className="text-sm text-slate-500">Initializing WebRTC secure connection to {user.username}.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 bg-red-900/90 flex items-center justify-center p-8 backdrop-blur-md">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-white mx-auto" />
                <p className="text-white font-bold">{error}</p>
                <Button variant="secondary" onClick={() => { setError(null); setIsActive(false); }}>Dismiss</Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-20 items-center justify-between bg-slate-50/50 px-8">
          <div className="flex items-center gap-3">
            <p className="text-[12px] font-medium text-slate-500">
              LiveKit WebRTC • Encrypted • P2P Optimized
            </p>
            {isActive && (
              <button
                type="button"
                onClick={() => {
                  const next = !isControlMode;
                  setIsControlMode(next);
                  setStatusLabel(next ? 'control-active' : 'view-only');
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider",
                  isControlMode ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-700",
                )}
              >
                <MousePointerClick className="h-4 w-4" />
                <Keyboard className="h-4 w-4" />
                Control Mode
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isActive ? (
              <Button
                onClick={() => toggleStream(false)}
                disabled={loading}
                className="gap-2 rounded-xl bg-red-500 px-8 py-5 font-bold text-white hover:bg-red-600 transition-all shadow-lg"
              >
                <Square className="h-4 w-4 fill-white" />
                Stop Stream
              </Button>
            ) : (
              <Button
                onClick={() => toggleStream(true)}
                disabled={loading}
                className="gap-2 rounded-xl bg-[#5E35B1] px-8 py-5 font-bold text-white hover:bg-[#4527A0] transition-all shadow-lg"
              >
                <Play className="h-4 w-4 fill-white" />
                Start Real-time View
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LiveStreamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        const json = await res.json();
        if (alive && json.success) {
          setUsers((json.data || []).filter((u: User) => u.role !== 'manager'));
        }
      } catch (err) {
        console.error("Fetch users failed", err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchUsers();
    const timer = setInterval(fetchUsers, 10_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredUsers(users.filter(u =>
      u.username.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower)
    ));
  }, [search, users]);

  useEffect(() => {
    if (!selectedUser) return;
    const latest = users.find((u) => u.username === selectedUser.username);
    if (!latest?.active) {
      setSelectedUser(null);
    }
  }, [users, selectedUser]);

  return (
    <DashboardLayout>
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            Real-time Monitoring
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Live User Streams</h1>
          <p className="text-[14px] font-medium text-slate-500 max-w-md">
            Securely monitor active user sessions. Select a user to initialize a real-time encrytped live stream of their screen.
          </p>
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 pr-12 text-[14px] text-slate-600 shadow-sm transition-all focus:border-[#5E35B1] focus:ring-4 focus:ring-purple-50 focus:outline-none sm:w-80"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-[#5E35B1] rounded-xl text-white">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed">
          <Monitor className="h-16 w-16 text-slate-200 mb-6" />
          <h3 className="text-lg font-bold text-slate-900">No Users Found</h3>
          <p className="text-sm text-slate-400">Try searching for a different username or email.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {filteredUsers.map((user, index) => (
            <UserCard
              key={index}
              user={user}
              onViewStream={setSelectedUser}
            />
          ))}
        </div>
      )}

      {selectedUser && (
        <StreamModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </DashboardLayout>
  );
}
