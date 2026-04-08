'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';

export default function TeamLeaderDashboard() {
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    totalActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const res = await fetch('/api/team-leader/stats', cred);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B3E] mb-2">Team Dashboard</h1>
          <p className="text-slate-500">Manage and monitor your team members</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-2">Total Members</p>
                <p className="text-3xl font-bold text-[#0D1B3E]">{stats.totalTeamMembers}</p>
              </div>
              <Users className="h-8 w-8 text-[#5E35B1] opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-2">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeMembers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-2">Inactive</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactiveMembers}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-2">Activities</p>
                <p className="text-3xl font-bold text-[#5E35B1]">{stats.totalActivities}</p>
              </div>
              <Activity className="h-8 w-8 text-[#5E35B1] opacity-20" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg text-[#0D1B3E] mb-4">Team Overview</h3>
            <p className="text-slate-500 text-sm mb-4">View and manage all members of your team</p>
            <a href="/team-leader/members" className="inline-block px-6 py-2 bg-[#5E35B1] text-white rounded-lg font-medium hover:bg-[#5E35B1]/90 transition">
              View Members
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg text-[#0D1B3E] mb-4">Team Time Tracking</h3>
            <p className="text-slate-500 text-sm mb-4">Monitor time tracking data from your team members</p>
            <a href="/team-leader/time-tracker" className="inline-block px-6 py-2 bg-[#5E35B1] text-white rounded-lg font-medium hover:bg-[#5E35B1]/90 transition">
              View Time Tracking
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg text-[#0D1B3E] mb-4">Screenshots</h3>
            <p className="text-slate-500 text-sm mb-4">View screenshots from your team members</p>
            <a href="/team-leader/screenshots" className="inline-block px-6 py-2 bg-[#5E35B1] text-white rounded-lg font-medium hover:bg-[#5E35B1]/90 transition">
              View Screenshots
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg text-[#0D1B3E] mb-4">Live Stream</h3>
            <p className="text-slate-500 text-sm mb-4">Monitor live streams from your team</p>
            <a href="/team-leader/live-stream" className="inline-block px-6 py-2 bg-[#5E35B1] text-white rounded-lg font-medium hover:bg-[#5E35B1]/90 transition">
              Start Monitoring
            </a>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
