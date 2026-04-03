'use client';

import {
  Calendar,
  Upload,
  ChevronDown,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';

const activityLogs = [
  { date: 'Wed - 01 Apr 2026', working: '00:00:00', idle: '00:00:00', stopped: '00:00:00', total: '00:00:00' },
  { date: 'Tue - 31 Mar 2026', working: '00:00:00', idle: '00:00:00', stopped: '00:00:00', total: '00:00:00' },
  { date: 'Mon - 30 Mar 2026', working: '00:00:00', idle: '00:00:00', stopped: '00:00:00', total: '00:00:00' },
  { date: 'Sun - 29 Mar 2026', working: '00:00:00', idle: '00:00:00', stopped: '00:00:00', total: '00:00:00' },
];

export default function ActivityLogPage() {
  return (
    <DashboardLayout>
      {/* Header Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer min-w-[320px]">
          <span className="text-[14px] font-medium text-slate-500">2026-03-27</span>
          <span className="text-slate-300">—</span>
          <span className="text-[14px] font-medium text-slate-500">2026-04-02</span>
          <Calendar className="ml-4 h-5 w-5 text-slate-300" />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {/* Legend and Actions Bar */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-end p-8 border-b border-slate-50">
          <div className="flex items-center gap-8 rounded-xl border border-blue-100 bg-white px-6 py-3 shadow-sm">
            <LegendItem color="bg-slate-200" label="Offline" />
            <LegendItem color="bg-[#22C55E]" label="Working" />
            <LegendItem color="bg-[#A05E2C]" label="Stopped" />
            <LegendItem color="bg-[#FBBF24]" label="Idle" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer min-w-[240px]">
              <span className="text-[14px] text-slate-400 flex-1">Yash sapkale</span>
              <ChevronDown className="h-5 w-5 text-slate-300" />
            </div>
            <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-slate-100/50 text-slate-400 px-6 py-3 rounded-xl border-none font-bold text-[13px] h-auto">
              <Upload className="h-5 w-5 rotate-180" />
              Export
            </Button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[13px] font-bold text-[#0D1B3E] w-1/4">
                  Date
                </th>
                <th className="px-8 py-6 text-[13px] font-bold text-[#0D1B3E] w-1/2 text-center">
                  Activity Breakdown (24 Hr Time line)
                </th>
                <th className="px-8 py-6 text-[13px] font-bold text-[#0D1B3E] w-1/4 text-center">
                  Total Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activityLogs.map((log, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-6">
                      <ChevronDown className="h-5 w-5 text-slate-400 cursor-pointer" />
                      <span className="text-[13px] font-bold text-[#0D1B3E]">{log.date}</span>
                    </div>
                  </td>

                  <td className="px-8 py-8">
                    <div className="space-y-4">
                      {/* Timeline Bar Placeholder */}
                      <div className="h-5 w-full rounded-full border border-slate-200 bg-white shadow-sm relative overflow-hidden">
                        {/* Empty timeline as per screenshot */}
                      </div>

                      {/* Durations */}
                      <div className="flex justify-start gap-8 pl-2">
                        <DurationItem color="bg-[#22C55E]" value={log.working} />
                        <DurationItem color="bg-[#FBBF24]" value={log.idle} />
                        <DurationItem color="bg-[#A05E2C]" value={log.stopped} />
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-8 text-center">
                    <span className="text-[13px] font-medium text-slate-500">{log.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("h-3.5 w-3.5 rounded-full", color)}></div>
      <span className="text-[13px] font-medium text-slate-600">{label}</span>
    </div>
  );
}

function DurationItem({ color, value }: { color: string, value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-3.5 w-3.5 rounded-full", color)}></div>
      <span className="text-[12px] font-bold text-[#0D1B3E]">{value}</span>
    </div>
  );
}
