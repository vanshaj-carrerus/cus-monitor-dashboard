'use client';

import {
  Calendar,
  Upload,
  ChevronDown
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProjectReportPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Project Report</h1>
          <p className="text-[12px] text-slate-400">Analyze project tasks and team member contributions over selected date ranges.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-100 cursor-pointer w-full sm:w-auto">
            <span className="text-[13px] font-medium text-slate-600">2026-04-02</span>
            <span className="text-slate-300">—</span>
            <span className="text-[13px] font-medium text-slate-600">2026-04-02</span>
            <Calendar className="ml-2 h-4 w-4 text-slate-400" />
          </div>

          <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-[#F1F5F9] text-slate-600 px-5 py-2.5 rounded-xl border-none font-bold text-[12px] w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="p-8 shadow-sm border-slate-100">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[18px] font-bold text-slate-800">Project Report</h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[600px]">
            <thead>
              <tr className="bg-[#F1F5F9]/50 text-[#5E6C84] font-bold">
                <th className="px-6 py-4 rounded-l-xl">Project Name</th>
                <th className="px-6 py-4">Project Owner</th>
                <th className="px-6 py-4">Estimated Hours</th>
                <th className="px-6 py-4">Logged Hours</th>
                <th className="px-6 py-4 rounded-r-xl">Final Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5 font-medium text-slate-700">
                  <div className="flex items-center gap-3">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                    Misc
                  </div>
                </td>
                <td className="px-6 py-5 text-slate-500">Muttalib Saiyed</td>
                <td className="px-6 py-5 text-slate-500">-</td>
                <td className="px-6 py-5 text-slate-500">68:18</td>
                <td className="px-6 py-5 text-slate-500">68:18</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
