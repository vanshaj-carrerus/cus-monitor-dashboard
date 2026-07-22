"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  Monitor,
  Play,
  Square,
  X,
  RefreshCw,
  AlertCircle,
  MousePointerClick,
  Keyboard,
  Radio,
  Wifi,
  WifiOff,
  Users,
  Signal,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "../../../lib/utils";
import { useAuth } from "@/components/auth-context";
import { useP2PViewer } from "@/hooks/useP2PViewer";

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

type StatusFilter = "all" | "active" | "inactive";

function getInitials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isUserPcActive(user: User) {
  return typeof user.pcActive === "boolean" ? user.pcActive : user.active;
}

interface UserCardProps {
  user: User;
  onViewStream: (user: User) => void;
}

function UserCard({ user, onViewStream }: UserCardProps) {
  const isPcActive = isUserPcActive(user);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        isPcActive
          ? "border-emerald-200/80 hover:border-emerald-300 hover:shadow-emerald-500/10"
          : "border-slate-100 hover:border-primary/20 hover:shadow-primary/10",
      )}
    >

      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold transition-colors",
            isPcActive
              ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
              : "bg-secondary text-primary group-hover:bg-primary group-hover:text-white",
          )}
        >
          {getInitials(user.username)}
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {user.role}
        </span>
      </div>

      <div className="mb-5 space-y-1">
        <h4 className="truncate text-sm font-bold text-slate-900">
          {user.username}
        </h4>
        <p className="truncate text-[11px] font-medium text-slate-400">
          {user.email}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              isPcActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isPcActive ? "animate-pulse bg-emerald-500" : "bg-red-400",
              )}
            />
            {isPcActive ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <Button
        onClick={() => onViewStream(user)}
        className="w-full justify-center gap-2 rounded-xl bg-primary py-5 text-[13px] font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <Play className="h-4 w-4 fill-white" />
        View Stream
      </Button>
    </div>
  );
}

const ACTOR_ROLE = "admin";

function ConnectionBadge({
  state,
}: {
  state: RTCPeerConnectionState | "idle" | "connecting";
}) {
  const config = {
    connected: {
      label: "Connected",
      className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
      icon: Wifi,
    },
    connecting: {
      label: "Connecting",
      className: "bg-amber-500/20 text-amber-200 border-amber-400/30",
      icon: Signal,
    },
    disconnected: {
      label: "Disconnected",
      className: "bg-red-500/20 text-red-200 border-red-400/30",
      icon: WifiOff,
    },
    failed: {
      label: "Failed",
      className: "bg-red-500/20 text-red-200 border-red-400/30",
      icon: AlertCircle,
    },
    idle: {
      label: "Idle",
      className: "bg-slate-500/20 text-slate-300 border-slate-400/30",
      icon: Radio,
    },
    closed: {
      label: "Closed",
      className: "bg-slate-500/20 text-slate-300 border-slate-400/30",
      icon: Radio,
    },
    new: {
      label: "Initializing",
      className: "bg-primary/20 text-primary-foreground border-primary/30",
      icon: RefreshCw,
    },
  } as const;

  const current = config[state] ?? config.idle;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md",
        current.className,
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          (state === "connecting" || state === "new") && "animate-spin",
        )}
      />
      {current.label}
    </span>
  );
}

function RemoteControlOverlay({
  enabled,
  sendCommand,
  onDisabledByInactivity,
}: {
  enabled: boolean;
  sendCommand: ReturnType<typeof useP2PViewer>["sendCommand"];
  onDisabledByInactivity: () => void;
}) {
  const areaRef = useRef<HTMLDivElement | null>(null);

  const getNorm = useCallback((event: React.MouseEvent | React.WheelEvent) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    const y = Math.min(
      1,
      Math.max(0, (event.clientY - rect.top) / rect.height),
    );
    return { x, y };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      try {
        sendCommand({ t: "keyDown", key: e.key, code: e.code });
      } catch {
        onDisabledByInactivity();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      try {
        sendCommand({ t: "keyUp", key: e.key, code: e.code });
      } catch {
        onDisabledByInactivity();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled, sendCommand, onDisabledByInactivity]);

  return (
    <div
      ref={areaRef}
      tabIndex={0}
      className={cn(
        "absolute inset-0 z-20 outline-none",
        enabled ? "cursor-crosshair bg-primary/5" : "pointer-events-none",
      )}
      onMouseMove={(e) => {
        if (!enabled) return;
        const pos = getNorm(e);
        sendCommand({ t: "mouseMove", ...pos });
      }}
      onMouseDown={(e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getNorm(e);
        sendCommand({ t: "mouseDown", button: e.button, ...pos });
      }}
      onMouseUp={(e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getNorm(e);
        sendCommand({ t: "mouseUp", button: e.button, ...pos });
      }}
      onWheel={(e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getNorm(e);
        sendCommand({ t: "mouseWheel", deltaY: e.deltaY, ...pos });
      }}
    />
  );
}

function P2PVideoPlayer({
  stream,
  connectionState,
  phase,
  statusMessage,
  error,
}: {
  stream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "idle" | "connecting";
  phase: import("@/hooks/useP2PViewer").P2PPhase;
  statusMessage: string;
  error: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFailed = phase === "failed" || connectionState === "failed" || Boolean(error);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.muted = true;
    const play = () => {
      el.play().catch(() => {});
    };
    play();
    // Some browsers need a second play() after the first frame arrives.
    const t = window.setTimeout(play, 500);
    return () => window.clearTimeout(t);
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2",
              isFailed ? "border-red-400/30" : "border-primary/20",
            )}
          />
          {!isFailed && (
            <div className="absolute inset-0 animate-ping rounded-full border border-primary/30" />
          )}
          {isFailed ? (
            <AlertCircle className="relative h-9 w-9 text-red-400" />
          ) : (
            <RefreshCw className="relative h-9 w-9 animate-spin text-primary" />
          )}
        </div>
        <div className="max-w-lg space-y-2">
          <p
            className={cn(
              "text-sm font-bold",
              isFailed ? "text-red-300" : "text-white",
            )}
          >
            {isFailed
              ? "Connection failed"
              : phase === "waiting-agent"
                ? "Waiting for desktop agent…"
                : phase === "ice" || phase === "answering"
                  ? "Negotiating secure P2P link…"
                  : "Connecting…"}
          </p>
          <p
            className={cn(
              "text-xs leading-relaxed",
              isFailed ? "text-red-200/90" : "text-slate-300",
            )}
          >
            {error || statusMessage || "Direct peer connection via WebRTC"}
          </p>
          {!isFailed && (
            <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Phase: {phase} · State: {connectionState}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full bg-black object-contain"
    />
  );
}

function StreamModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [isControlMode, setIsControlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<
    "view-only" | "control-active" | "paused(inactive)"
  >("view-only");
  const [adminIdentity, setAdminIdentity] = useState<string>("");

  const {
    stream,
    connectionState,
    phase,
    statusMessage,
    error: p2pError,
    sendCommand,
  } = useP2PViewer({
    userId: user.username,
    enabled: isActive,
    adminId: adminIdentity,
    controlEnabled: isControlMode,
  });

  useEffect(() => {
    if (p2pError) setError(p2pError);
  }, [p2pError]);

  const toggleStream = async (start: boolean) => {
    setLoading(true);
    setError(null);
    console.log("[P2P UI] toggleStream", {
      start,
      userId: user.username,
      controlEnabled: isControlMode,
    });
    try {
      const res = await fetch(`/api/stream?action=toggle`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-actor-role": ACTOR_ROLE,
        },
        body: JSON.stringify({
          userId: user.username,
          isActive: start,
          controlEnabled: isControlMode,
          controllerId: isControlMode ? adminIdentity : "",
          reasonStopped: start ? "" : "stopped_by_admin",
        }),
      });
      const data = await res.json();
      console.log("[P2P UI] toggle API response", {
        ok: res.ok,
        status: res.status,
        data,
      });

      if (data.success) {
        if (start) {
          const identity = `admin_${Math.random().toString(36).substring(7)}`;
          console.log("[P2P UI] session start — adminId assigned", identity);
          setAdminIdentity(identity);
          setIsActive(true);
          setStatusLabel(isControlMode ? "control-active" : "view-only");
        } else {
          console.log("[P2P UI] session stop");
          setIsActive(false);
          setIsControlMode(false);
          setStatusLabel("view-only");
          setAdminIdentity("");
        }
      } else {
        console.error("[P2P UI] toggle failed — success=false", data);
        setError(data.error || "Failed to toggle stream");
      }
    } catch (err) {
      console.error("[P2P UI] toggle network error", err);
      setError("Failed to communicate with server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/stream?action=status&userId=${encodeURIComponent(user.username)}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (!data?.success) return;

        if (data.isUserActive === false) {
          setStatusLabel("paused(inactive)");
          setIsControlMode(false);
        } else {
          setStatusLabel(isControlMode ? "control-active" : "view-only");
        }

        if (
          data.isActive === false &&
          data.reasonStopped &&
          data.reasonStopped !== "user_became_inactive"
        ) {
          setIsControlMode(false);
          setIsActive(false);
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
      if (isActiveRef.current) {
        fetch(`/api/stream?action=toggle`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-actor-role": ACTOR_ROLE,
          },
          body: JSON.stringify({
            userId: user.username,
            isActive: false,
            reasonStopped: "admin_closed_modal",
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [user.username]);

  const handleClose = async () => {
    if (isActive) {
      await toggleStream(false);
    }
    onClose();
  };

  const setControlMode = useCallback(
    async (next: boolean) => {
      setIsControlMode(next);
      setStatusLabel(next ? "control-active" : "view-only");
      try {
        await fetch(`/api/stream?action=toggle`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-actor-role": ACTOR_ROLE,
          },
          body: JSON.stringify({
            userId: user.username,
            isActive: true,
            controlEnabled: next,
            controllerId: next ? adminIdentity : "",
          }),
        });
      } catch {
        // Agent will auto-timeout control via heartbeat/lastControlAt logic.
      }
    },
    [adminIdentity, user.username],
  );

  useEffect(() => {
    if (!isActive || !isControlMode) return;
    const timer = setInterval(async () => {
      try {
        await fetch("/api/stream?action=control-heartbeat", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-actor-role": ACTOR_ROLE,
          },
          body: JSON.stringify({ userId: user.username }),
        });
      } catch {
        // noop
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [isActive, isControlMode, user.username]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
      <Card className="w-full max-w-5xl overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-primary">
              {getInitials(user.username)}
              {isActive && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
                </span>
              )}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">
                Live Stream · {user.username}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {isActive ? statusLabel.replace(/[()]/g, " ") : "Ready to connect"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video area */}
        <div className="relative aspect-video overflow-hidden bg-slate-950">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,53,177,0.18),transparent_55%)]" />

          {isActive ? (
            <div className="relative h-full w-full">
              <div className="absolute left-4 top-4 z-30 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  P2P Direct
                </span>
                <ConnectionBadge
                  state={
                    phase === "failed" || p2pError
                      ? "failed"
                      : connectionState
                  }
                />
              </div>

              {isControlMode && (
                <div className="absolute right-4 top-4 z-30 rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200 backdrop-blur-md">
                  Control Active
                </div>
              )}

              <P2PVideoPlayer
                stream={stream}
                connectionState={connectionState}
                phase={phase}
                statusMessage={statusMessage}
                error={p2pError ?? error}
              />
              <RemoteControlOverlay
                enabled={isControlMode}
                sendCommand={sendCommand}
                onDisabledByInactivity={() => {
                  setIsControlMode(false);
                  setStatusLabel("paused(inactive)");
                }}
              />
            </div>
          ) : (
            <div className="relative flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Monitor className="h-10 w-10 text-white/30" />
              </div>
              <div className="space-y-2 px-6">
                <p className="text-lg font-bold text-white">
                  {loading ? "Initializing session..." : "Stream offline"}
                </p>
                <p className="text-sm text-slate-400">
                  Start a direct encrypted connection to {user.username}&apos;s
                  desktop.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-red-950/90 p-8 backdrop-blur-md">
              <div className="space-y-4 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-white" />
                <p className="font-bold text-white">{error}</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setError(null);
                    setIsActive(false);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] font-medium text-slate-500">
              WebRTC P2P · Supabase signaling · Zero relay
            </p>
            {isActive && (
              <button
                type="button"
                onClick={() => setControlMode(!isControlMode)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                  isControlMode
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary/30",
                )}
              >
                <MousePointerClick className="h-4 w-4" />
                <Keyboard className="h-4 w-4" />
                Remote Control
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isActive ? (
              <Button
                onClick={() => toggleStream(false)}
                disabled={loading}
                className="gap-2 rounded-xl bg-red-500 px-8 py-5 font-bold text-white shadow-lg transition-all hover:bg-red-600"
              >
                <Square className="h-4 w-4 fill-white" />
                Stop Stream
              </Button>
            ) : (
              <Button
                onClick={() => toggleStream(true)}
                disabled={loading}
                className="gap-2 rounded-xl bg-primary px-8 py-5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <Play className="h-4 w-4 fill-white" />
                Start Live View
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departments, setDepartments] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [locations, setLocations] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<string>("all");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canSeeFilters =
    currentUser?.role === "manager" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "admin_compliance";

  const extractRefId = (
    ref: User["departmentId"] | User["locationId"],
  ): string | null => {
    if (!ref) return null;
    if (typeof ref === "string") return ref;
    if (typeof ref === "object" && ref._id) return String(ref._id);
    return null;
  };

  const refreshUserStatuses = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      try {
        await fetch("/api/users/inactivity-sweep", {
          method: "POST",
          cache: "no-store",
        });
      } catch (err) {
        console.error("Inactivity sweep failed", err);
      }

      try {
        const res = await fetch("/api/users?page=1&limit=1000", {
          cache: "no-store",
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) {
          setUsers(
            (json.data || []).filter(
              (u: User) => u.username !== currentUser?.username,
            ),
          );
        }
      } catch (err) {
        console.error("Fetch users failed", err);
      } finally {
        setLoading(false);
        if (showRefreshing) setRefreshing(false);
      }
    },
    [currentUser?.username],
  );

  useEffect(() => {
    refreshUserStatuses(false);
  }, [refreshUserStatuses]);

  useEffect(() => {
    if (!canSeeFilters) return;

    const loadOptions = async () => {
      try {
        const [deptRes, locRes] = await Promise.all([
          fetch("/api/departments", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/locations", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const deptJson = await deptRes.json();
        const locJson = await locRes.json();

        if (deptJson?.departments) setDepartments(deptJson.departments);
        if (locJson?.locations) setLocations(locJson.locations);
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };

    void loadOptions();
  }, [canSeeFilters]);

  const filteredUsers = useMemo(() => {
    const lower = search.toLowerCase();
    return users
      .filter((u) => {
        const searchOk =
          u.username.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower);

        const deptOk =
          selectedDepartmentId === "all" ||
          extractRefId(u.departmentId) === selectedDepartmentId;

        const locOk =
          selectedLocationId === "all" ||
          extractRefId(u.locationId) === selectedLocationId;

        const statusOk =
          statusFilter === "all" ||
          (statusFilter === "active" && isUserPcActive(u)) ||
          (statusFilter === "inactive" && !isUserPcActive(u));

        return searchOk && deptOk && locOk && statusOk;
      })
      .sort((a, b) => {
        const aActive = isUserPcActive(a);
        const bActive = isUserPcActive(b);
        if (aActive === bActive) return a.username.localeCompare(b.username);
        return aActive ? -1 : 1;
      });
  }, [search, users, selectedDepartmentId, selectedLocationId, statusFilter]);

  const stats = useMemo(() => {
    const online = users.filter(isUserPcActive).length;
    return {
      total: users.length,
      online,
      offline: users.length - online,
    };
  }, [users]);

  const filterPills: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "active", label: "Online", count: stats.online },
    { id: "inactive", label: "Offline", count: stats.offline },
  ];

  return (
    <DashboardLayout>
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Real-time Monitoring
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                Live Stream Monitoring
              </h1>
              <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
                Launch direct P2P desktop sessions with zero server relay.
                Monitor team activity in real time with encrypted WebRTC.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: stats.total, icon: Users },
              { label: "Online", value: stats.online, icon: Wifi },
              { label: "Offline", value: stats.offline, icon: WifiOff },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
              >
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <p className="text-2xl font-bold text-on-surface">
                  {loading ? "—" : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-6 border-outline-variant p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterPills.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all",
                    statusFilter === pill.id
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-100 text-slate-600 hover:bg-secondary hover:text-primary",
                  )}
                >
                  {pill.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      statusFilter === pill.id
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-500",
                    )}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canSeeFilters && (
                <>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-48"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-48"
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

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-600 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-72"
                />
              </div>

              <Button
                type="button"
                onClick={() => refreshUserStatuses(true)}
                disabled={refreshing}
                className="gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white hover:bg-primary/90"
              >
                <RefreshCw
                  className={cn("h-4 w-4", refreshing && "animate-spin")}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-slate-100 bg-white"
            />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-20 text-center">
          <Monitor className="mb-5 h-16 w-16 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900">No users found</h3>
          <p className="mt-2 text-sm text-slate-400">
            Try a different search term or filter combination.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.username}
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
