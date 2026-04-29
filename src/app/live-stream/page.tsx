'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Monitor, Play, Square, X, RefreshCw, AlertCircle, MousePointerClick, Keyboard } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../lib/utils';
import { useAuth } from '@/components/auth-context';

interface User {
  username: string;
  email: string;
  role: string;
  active: boolean;
  pcActive?: boolean;
  departmentId?: { _id?: string; name?: string } | string | null;
  locationId?: { _id?: string; name?: string } | string | null;
  teamLeaderId?: string | null;
}

interface UserCardProps {
  user: User;
  onViewStream: (user: User) => void;
}

function UserCard({ user, onViewStream }: UserCardProps) {
  const isPcActive = typeof user.pcActive === 'boolean' ? user.pcActive : user.active;
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
        <p className={cn("text-[11px] font-bold uppercase tracking-wider", isPcActive ? "text-green-600" : "text-red-500")}>
          {isPcActive ? 'PC Active' : 'PC Inactive'}
        </p>
      </div>

      <Button
        onClick={() => onViewStream(user)}
        className="w-full justify-center gap-2 rounded-xl bg-[#5E35B1] py-5 text-[13px] font-bold text-white hover:bg-[#4527A0] active:scale-95 transition-all"
      >
        <Play className="h-4 w-4 fill-white" />
        View Stream
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
        <div key={trackRef.publication.trackSid} className="relative flex flex-col gap-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden min-h-75">
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
      const reliable = command.t !== 'mouseMove';
      await room.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable, topic: 'remote-control' },
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
          credentials: 'include',
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
  const [adminIdentity, setAdminIdentity] = useState<string>('');
  const [fallbackActive, setFallbackActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const startFallback = useCallback(async () => {
    console.log("Starting WebRTC Fallback...");
    setFallbackActive(true);

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    const dc = pc.createDataChannel('control');
    dcRef.current = dc;

    pc.ontrack = (e) => {
      console.log("Fallback track received:", e.track);
      if (videoRef.current) {
        if (e.streams && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0];
        } else {
          const stream = new MediaStream();
          stream.addTrack(e.track);
          videoRef.current.srcObject = stream;
        }
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'candidate',
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          target_id: user.username
        }));
      }
    };

    const ws = new WebSocket('wss://cus-monitor-mediator.onrender.com');
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("Connected to Mediator WS");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({
        type: 'offer',
        sdp: offer.sdp,
        target_id: user.username
      }));
    };

    ws.onmessage = async (msg) => {
      const sig = JSON.parse(msg.data);
      if (sig.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sig.sdp }));
      } else if (sig.type === 'candidate') {
        const candidateData = {
          candidate: sig.candidate,
          sdpMid: sig.sdpMid,
          sdpMLineIndex: sig.sdpMLineIndex === undefined ? undefined : Number(sig.sdpMLineIndex)
        };
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      }
    };

    ws.onclose = () => console.log("Mediator WS closed");
    ws.onerror = (e) => console.error("Mediator WS error", e);

  }, [user.username]);

  const stopFallback = useCallback(() => {
    setFallbackActive(false);
    pcRef.current?.close();
    wsRef.current?.close();
    pcRef.current = null;
    wsRef.current = null;
    dcRef.current = null;
  }, []);

  const toggleStream = async (start: boolean) => {
    setLoading(true);
    setError(null); // Clear any previous error states
    if (start) setFallbackActive(false);
    try {
      const res = await fetch(`/api/stream?action=toggle`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-role': ACTOR_ROLE,
        },
        body: JSON.stringify({
          userId: user.username,
          isActive: start,
          controlEnabled: isControlMode,
          controllerId: isControlMode ? adminIdentity : '',
          reasonStopped: start ? '' : 'stopped_by_admin',
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (start) {
          const identity = `admin_${Math.random().toString(36).substring(7)}`;
          setAdminIdentity(identity);
          const tokenRes = await fetch(`/api/stream/token?room=room_${user.username}&identity=${encodeURIComponent(identity)}&clientType=admin`, {
            credentials: 'include',
            headers: { 'x-actor-role': ACTOR_ROLE },
          });
          const tokenData = await tokenRes.json();
          if (tokenData.token) {
            setLkToken(tokenData.token);
            setLkUrl(tokenData.url);
            setIsActive(true);
            setFallbackActive(false);
            setStatusLabel(isControlMode ? 'control-active' : 'view-only');
          } else {
            setError("Failed to generate access token. Using fallback...");
            startFallback();
          }
        } else {
          setIsActive(false);
          setIsControlMode(false);
          stopFallback();
          setStatusLabel('view-only');
          setLkToken(null);
          setAdminIdentity('');
        }
      }
    } catch {
      setError("Failed to communicate with server. Using fallback...");
      startFallback();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/stream?action=status&userId=${encodeURIComponent(user.username)}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!data?.success) return;

        // Never block the livestream just because the PC is idle/unproductive.
        // We only reflect status and let the admin decide whether to stop.
        if (data.isUserActive === false) {
          setStatusLabel('paused(inactive)');
          setIsControlMode(false);
        } else {
          setStatusLabel(isControlMode ? 'control-active' : 'view-only');
        }

        // Only stop locally if the stream was explicitly stopped (admin closed/toggled off).
        if (data.isActive === false && data.reasonStopped && data.reasonStopped !== 'user_became_inactive') {
          setIsControlMode(false);
          setIsActive(false);
          setLkToken(null);
          setError(data.reasonStopped);
        }
      } catch {
        // noop
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [isActive, user.username, isControlMode]);

  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    return () => {
      // When the component unmounts, if the stream is still active, we must notify the agent to stop.
      // This loophole was previously consuming thousands of LiveKit minutes.
      if (isActiveRef.current) {
        fetch(`/api/stream?action=toggle`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-actor-role': ACTOR_ROLE,
          },
          body: JSON.stringify({
            userId: user.username,
            isActive: false,
            reasonStopped: 'admin_closed_modal',
          }),
          keepalive: true, // Ensures the request completes even if the page is closed or navigates
        }).catch(() => { });
      }
    };
  }, [user.username]);

  const handleClose = async () => {
    if (isActive) {
      await toggleStream(false);
    }
    onClose();
  };

  const setControlMode = useCallback(async (next: boolean) => {
    setIsControlMode(next);
    setStatusLabel(next ? 'control-active' : 'view-only');
    // Persist controller selection so the agent can block local input + accept only admin commands
    try {
      await fetch(`/api/stream?action=toggle`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-role': ACTOR_ROLE,
        },
        body: JSON.stringify({
          userId: user.username,
          isActive: true,
          controlEnabled: next,
          controllerId: next ? adminIdentity : '',
        }),
      });
    } catch {
      // If we can't persist, we still disable locally to avoid UI lying about control mode.
      // Agent will auto-timeout control via heartbeat/lastControlAt logic.
    }
  }, [adminIdentity, user.username]);

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
            onClick={handleClose}
            className="rounded-full bg-slate-50 p-2 text-slate-400 transition-hover hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
          {isActive && lkToken && lkUrl && !fallbackActive ? (
            <LiveKitRoom
              key={lkToken}
              token={lkToken}
              serverUrl={lkUrl}
              connect={true}
              audio={false}
              video={false}
              data-lk-theme="default"
              className="h-full w-full"
              onDisconnected={() => {
                setIsActive(false);
                setControlMode(false);
                setLkToken(null);
              }}
              onError={(e) => {
                console.error("LiveKit Error:", e);
                setError("LiveKit failed. Switching to WebRTC fallback...");
                startFallback();
              }}
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
          ) : fallbackActive ? (
            <div className="relative h-full w-full bg-slate-950 flex items-center justify-center">
              <div className="absolute top-4 left-4 z-30 rounded-lg bg-red-600/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                FALLBACK MODE (P2P) • {user.username.toUpperCase()}
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-contain z-10"
                onMouseMove={(e) => {
                  if (dcRef.current?.readyState === 'open') {
                    const rect = videoRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      dcRef.current.send(JSON.stringify({ type: 'move', x, y }));
                    }
                  }
                }}
                onClick={() => {
                  if (dcRef.current?.readyState === 'open') {
                    dcRef.current.send(JSON.stringify({ type: 'click', button: 'left' }));
                  }
                }}
              />
            </div>
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
                  setControlMode(next);
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
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canSeeFilters =
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'admin_compliance';

  const extractRefId = (ref: User['departmentId'] | User['locationId']): string | null => {
    if (!ref) return null;
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'object' && ref._id) return String(ref._id);
    return null;
  };

  const refreshUserStatuses = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      await fetch('/api/users/inactivity-sweep', {
        method: 'POST',
        cache: 'no-store',
      });
    } catch (err) {
      console.error("Inactivity sweep failed", err);
    }

    try {
      const res = await fetch('/api/users?page=1&limit=1000', { cache: 'no-store', credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setUsers((json.data || []).filter((u: User) => u.username !== currentUser?.username));
      }
    } catch (err) {
      console.error("Fetch users failed", err);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    refreshUserStatuses(false);
  }, [refreshUserStatuses]);

  useEffect(() => {
    if (!canSeeFilters) return;

    const loadOptions = async () => {
      try {
        const [deptRes, locRes] = await Promise.all([
          fetch('/api/departments', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/locations', { cache: 'no-store', credentials: 'include' }),
        ]);

        const deptJson = await deptRes.json();
        const locJson = await locRes.json();

        if (deptJson?.departments) setDepartments(deptJson.departments);
        if (locJson?.locations) setLocations(locJson.locations);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };

    void loadOptions();
  }, [canSeeFilters]);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredUsers(
      users.filter((u) => {
        const searchOk = u.username.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower);

        const deptOk =
          selectedDepartmentId === 'all' ||
          (extractRefId(u.departmentId) ? extractRefId(u.departmentId) === selectedDepartmentId : false);

        const locOk =
          selectedLocationId === 'all' ||
          (extractRefId(u.locationId) ? extractRefId(u.locationId) === selectedLocationId : false);

        return searchOk && deptOk && locOk;
      }),
    );
  }, [search, users, selectedDepartmentId, selectedLocationId]);

  useEffect(() => {
    if (!selectedUser) return;
    const latest = users.find((u) => u.username === selectedUser.username);
    // Do not auto-close the stream modal when the user becomes inactive;
    // inactivity must not block viewing the live stream.
    void latest;
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

        <div className="flex flex-wrap items-center gap-3 justify-end">
          {canSeeFilters && (
            <>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-56 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] text-slate-600 shadow-sm transition-all focus:border-[#5E35B1] focus:ring-4 focus:ring-purple-50 focus:outline-none"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-56 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] text-slate-600 shadow-sm transition-all focus:border-[#5E35B1] focus:ring-4 focus:ring-purple-50 focus:outline-none"
              >
                <option value="all">All Locations</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </>
          )}

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
          <Button
            type="button"
            onClick={() => refreshUserStatuses(true)}
            disabled={refreshing}
            className="gap-2 rounded-xl bg-[#5E35B1] px-4 py-3 text-[12px] font-bold text-white hover:bg-[#4527A0]"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
