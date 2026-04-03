'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  BarChart3,
  Calendar,
  X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '../../../lib/utils';

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

export default function ScreenshotsPage() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'productivity'>('gallery');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userScreenshots, setUserScreenshots] = useState<Screenshot[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/screenshots');
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setScreenshotsLoading(true);
    try {
      const res = await fetch(`/api/screenshots?userId=${user._id}`);
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Screenshots</h1>
        <p className="text-sm text-slate-500">View user screenshots captured on specific dates from this page.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('gallery')}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all",
            activeTab === 'gallery'
              ? "bg-[#F5F3FF] text-[#5E35B1] border border-[#5E35B1]/20"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <ImageIcon className="h-4 w-4" />
          Gallery
        </button>
        <button
          onClick={() => setActiveTab('productivity')}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all",
            activeTab === 'productivity'
              ? "bg-[#F5F3FF] text-[#5E35B1] border border-[#5E35B1]/20"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Productivity
        </button>
      </div>

      {/* Content Card */}
      <Card className="p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            {activeTab === 'gallery' ? 'Screenshots' : 'Productivity'}
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-4 pr-10 text-sm focus:border-[#5E35B1] focus:outline-none dark:border-slate-800   sm:w-64"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                defaultValue="2026-04-01"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none dark:border-slate-800  "
              />
              <Calendar className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">No users found.</p>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserClick(user)}
                className="cursor-pointer rounded-2xl border border-slate-100 bg-[#F9FAFB] p-6 dark:border-slate-800/50 hover:bg-slate-50 shadow-sm transition-all"
              >
                <p className="break-all text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {user.username}
                </p>
                <p className="break-all text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Screenshots Popup Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Screenshots - {selectedUser.username}
                </h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {screenshotsLoading ? (
                <p className="text-center text-slate-500">Loading screenshots...</p>
              ) : userScreenshots.length === 0 ? (
                <p className="text-center text-slate-500">No screenshots available for this user.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userScreenshots.map((shot) => (
                    <div key={shot._id} className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                      <img src={shot.imageUrl || '/placeholder.png'} alt="Screenshot" className="w-full h-auto object-cover bg-slate-100" />
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">
                          {new Date(shot.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
