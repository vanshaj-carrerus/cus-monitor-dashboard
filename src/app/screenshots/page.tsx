'use client';

import { useState } from 'react';
import {
  Image as ImageIcon,
  BarChart3,
  Search,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '../../../lib/utils';
cn
export default function ScreenshotsPage() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'productivity'>('gallery');

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
          <div className="rounded-2xl border border-slate-100 bg-[#F9FAFB] p-6 dark:border-slate-800  /50">
            <p className="break-all text-sm text-slate-500">
              aswanijayesh500@gmail.c<br />om
            </p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
