'use client';

import { History } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function TimeEntryPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Time Entry</h1>
        <p className="text-sm text-slate-500">View and manage historical time logs.</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm border border-slate-50">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50">
          <History className="h-10 w-10 text-slate-200" />
        </div>
        <p className="text-2xl font-bold text-slate-200">No Time Entry Records</p>
      </div>
    </DashboardLayout>
  );
}
