'use client';

import {
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ShiftReportPage() {
  return (
    <DashboardLayout>
      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer min-w-[280px]">
            <span className="text-[14px] text-slate-400 flex-1">Yash sapkale</span>
            <ChevronDown className="h-5 w-5 text-slate-300" />
          </div>
          <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer min-w-[320px]">
            <span className="text-[14px] font-medium text-slate-500">2026-03-30</span>
            <span className="text-slate-300">—</span>
            <span className="text-[14px] font-medium text-slate-500">2026-04-05</span>
            <Calendar className="ml-4 h-5 w-5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Empty State Card */}
      <div className="flex flex-col items-center justify-center py-32 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-50 border-4 border-white shadow-inner">
          <Calendar className="h-10 w-10 text-slate-200" />
        </div>
        <p className="text-[16px] font-bold text-slate-300">No shift report data found</p>
      </div>
    </DashboardLayout>
  );
}
