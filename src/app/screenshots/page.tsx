'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  BarChart3,
  Calendar,
  X,
  Trash2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '../../../lib/utils';
import { useAuth } from '@/components/auth-context';

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
  const { user } = useAuth();
  const canManageScreenshots = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'team_leader';

  const [activeTab, setActiveTab] = useState<'gallery' | 'productivity'>('gallery');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userScreenshots, setUserScreenshots] = useState<Screenshot[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/screenshots?limit=1000&search=${encodeURIComponent(searchTerm)}`,
          { credentials: 'include' }
        );
        const json = await res.json();
        if (json.success) {
          setUsers(json.data.filter((u: User) => u.username !== user?.username));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [user?.username, searchTerm]);

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setScreenshotsLoading(true);
    try {
      const res = await fetch(`/api/screenshots?userId=${user._id}`, { credentials: 'include' });
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

  const handleDeleteScreenshot = async (screenshotId: string) => {
    if (!confirm('Are you sure you want to delete this screenshot? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/screenshots/${screenshotId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();

      if (res.ok) {
        // Remove the screenshot from the local state
        setUserScreenshots(prev => prev.filter(shot => shot._id !== screenshotId));
      } else {
        alert(json.error || 'Failed to delete screenshot');
      }
    } catch (err) {
      console.error('Error deleting screenshot:', err);
      alert('Failed to delete screenshot');
    }
  };

  const handleOpenInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Screenshots</h1>
        <p className="text-sm text-slate-500">View user screenshots captured on specific dates from this page.</p>
      </div>

      {/* Content Card */}
      <Card className="p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            Gallery
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-4 pr-10 text-sm text-gray-500 focus:border-[#5E35B1] focus:outline-none dark:border-slate-800 sm:w-64"
              />
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
                <p className="break-all text-sm font-medium text-slate-800 mb-2">
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
                    <div key={shot._id} className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 group relative">
                      <img src={shot.imageUrl || '/placeholder.png'} alt="Screenshot" className="w-full h-auto object-cover bg-slate-100" />
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500 mb-2">
                          {new Date(shot.createdAt).toLocaleString()}
                        </p>
                        {canManageScreenshots && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenInNewTab(shot.imageUrl)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </button>
                          </div>
                        )}
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
