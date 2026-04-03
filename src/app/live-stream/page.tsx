'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Monitor, Play, Square, X, RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../lib/utils';

interface User {
  username: string;
  email: string;
  role: string;
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

function StreamModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Toggle stream on/off
  const toggleStream = async (start: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stream?action=toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.username, isActive: start }),
      });
      const data = await res.json();
      if (data.success) {
        setIsActive(start);
        if (!start) setFrame(null);
      }
    } catch (err) {
      setError("Failed to communicate with server");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch frames when active
  useEffect(() => {
    if (isActive) {
      const fetchFrame = async () => {
        try {
          const res = await fetch(`/api/stream?action=frame&userId=${user.username}`);
          const data = await res.json();
          if (data.success) {
            setFrame(data.frame);
            // If the server says it's not active anymore, stop
            if (!data.isActive && isActive) setIsActive(false);
          }
        } catch (err) {
          console.error("Frame fetch error", err);
        }
      };

      fetchFrame(); // Immediate
      frameTimerRef.current = setInterval(fetchFrame, 1000); // 1 FPS polling
    } else {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    }

    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, [isActive, user.username]);

  // Stop stream on modal close
  useEffect(() => {
    return () => {
      toggleStream(false);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-50 px-8">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
               <div className={cn("h-3 w-3 rounded-full bg-red-500", isActive && "animate-ping")} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Live Stream: {user.username}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5E35B1]">
                {isActive ? 'Connected • Streaming Live' : 'Not Connected • Click Start to Begin'}
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

        <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
          {isActive ? (
            frame ? (
              <img src={frame} alt="Live Stream" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <RefreshCw className="h-10 w-10 animate-spin text-purple-500" />
                <p className="text-sm font-medium text-slate-400">Waiting for first frame from {user.username}'s monitor...</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                 <Monitor className="h-10 w-10 text-white/20" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">Stream is currently {isActive ? 'starting...' : 'offline'}</p>
                <p className="text-sm text-slate-500">The monitor app will begin capturing once you toggle the live state.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center p-8 backdrop-blur-md">
               <div className="text-center space-y-4">
                 <AlertCircle className="h-12 w-12 text-white mx-auto" />
                 <p className="text-white font-bold">{error}</p>
                 <Button variant="secondary" onClick={() => setError(null)}>Dismiss</Button>
               </div>
            </div>
          )}
        </div>

        <div className="flex h-20 items-center justify-between bg-slate-50/50 px-8">
           <div className="flex items-center gap-3">
             <p className="text-[12px] font-medium text-slate-500 italic max-w-sm">
                * There may be a 1-2s delay depending on {user.username}'s internet upload speed.
             </p>
           </div>
           <div className="flex items-center gap-4">
              {isActive ? (
                <Button 
                  onClick={() => toggleStream(false)}
                  disabled={loading}
                  className="gap-2 rounded-xl bg-red-500 px-8 py-5 font-bold text-white hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  <Square className="h-4 w-4 fill-white" />
                  Stop Stream
                </Button>
              ) : (
                <Button 
                  onClick={() => toggleStream(true)}
                  disabled={loading}
                  className="gap-2 rounded-xl bg-[#5E35B1] px-8 py-5 font-bold text-white hover:bg-[#4527A0] transition-all shadow-lg shadow-purple-200"
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
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
          setFilteredUsers(json.data);
        }
      } catch (err) {
        console.error("Fetch users failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredUsers(users.filter(u => 
      u.username.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower)
    ));
  }, [search, users]);

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
           {[1,2,3,4].map(i => (
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
