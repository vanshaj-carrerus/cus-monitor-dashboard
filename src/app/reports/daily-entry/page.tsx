'use client';

import { 
  Calendar, 
  Upload, 
  ChevronDown
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DailyTimeEntryPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daily Time Entries</h1>
          <p className="text-sm text-slate-500">View detailed daily time entries of team members and monitor their logged hours from this page.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row items-center">
          <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm border border-slate-100 dark:border-slate-800 w-full sm:w-auto min-w-[200px]">
            <span className="text-sm text-slate-400 flex-1">Yash sapkale</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm border border-slate-100 dark:border-slate-800 w-full sm:w-auto">
            <span className="text-sm text-slate-400">2026-04-02</span>
            <span className="text-slate-200">→</span>
            <span className="text-sm text-slate-400">2026-04-02</span>
            <Calendar className="ml-2 h-4 w-4 text-slate-400" />
          </div>
          <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-slate-50 text-slate-400  dark:text-slate-500 border-none rounded-xl px-4 w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="p-6 border-none shadow-sm overflow-hidden">
        {/* Table Container */}
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-8 gap-4 px-6 py-4 bg-[#5E35B1] text-white rounded-xl text-xs font-medium text-center min-w-[800px]">
            <div>Date</div>
            <div>Project Name</div>
            <div>Task Name</div>
            <div>Estimated Hours</div>
            <div>Logged Hours</div>
            <div>Start Time</div>
            <div>End Time</div>
            <div>Final Hours</div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-lg font-medium text-slate-300 dark:text-slate-700">No Records Found</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
