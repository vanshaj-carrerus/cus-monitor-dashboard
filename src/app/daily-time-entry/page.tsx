'use client';

import {
  Calendar,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';

export default function DailyTimeEntryPage() {
  return (
    <DashboardLayout>
      {/* Header Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[280px]">
            <span className="text-[14px] font-medium text-slate-500">2026-04-01</span>
            <span className="text-slate-300">—</span>
            <span className="text-[14px] font-medium text-slate-500">2026-04-01</span>
            <Calendar className="ml-4 h-5 w-5 text-slate-300" />
          </div>
          <Button className="flex items-center gap-2 bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white rounded-xl px-6 py-3 h-auto font-bold">
            <Upload className="h-5 w-5 rotate-180" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Name</th>
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Date Range</th>
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Logged</th>
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Expected</th>
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Holidays</th>
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Untracked Days</th>
                <th className="px-8 py-5 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="bg-blue-50/50">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-[14px] font-bold text-[#0D1B3E] italic">No Name Selected</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-[14px] font-bold text-[#0D1B3E]">01/04/2026 - 01/04/2026</td>
                <td className="px-8 py-6 text-[14px] text-green-500 font-bold">--:--:--</td>
                <td className="px-8 py-6 text-[14px] text-[#5E35B1] font-bold">00:00:00</td>
                <td className="px-8 py-6 text-[14px] text-blue-500 font-bold">0</td>
                <td className="px-8 py-6 text-[14px] text-orange-500 font-bold">0</td>
                <td className="px-8 py-6 text-center">
                  <button className="p-2 rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <Calendar className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-[14px] text-slate-400 border-t border-slate-50">
          <div className="flex items-center gap-6">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[12px]">ROWS PER PAGE:</span>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2 text-slate-400 shadow-sm cursor-pointer min-w-[80px] justify-between">
              10
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50 transition-colors text-slate-300">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E35B1] text-white font-bold shadow-lg shadow-purple-200">1</button>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50 transition-colors text-slate-300">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
