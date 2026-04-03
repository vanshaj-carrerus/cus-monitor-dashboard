'use client';

import { useState } from 'react';
import {
  User,
  Calendar,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../lib/utils';
cn
const attendanceData = [
  { name: 'Yash sapkale', range: '01/04/2026 - 02/04/2026', logged: '--:--:--', expected: '00:00:00', holidays: 0, untracked: 0 },
  { name: '', range: '01/04/2026 - 02/04/2026', logged: '02:20:29', expected: '00:00:00', holidays: 0, untracked: 1 },
  { name: '', range: '01/04/2026 - 02/04/2026', logged: '06:03:54', expected: '00:00:00', holidays: 0, untracked: 1 },
  { name: '', range: '01/04/2026 - 02/04/2026', logged: '04:12:37', expected: '00:00:00', holidays: 0, untracked: 1 },
  { name: '', range: '01/04/2026 - 02/04/2026', logged: '06:37:55', expected: '00:00:00', holidays: 0, untracked: 1 },
  { name: '', range: '01/04/2026 - 02/04/2026', logged: '--:--:--', expected: '00:00:00', holidays: 0, untracked: 2 },
  { name: 'Abhishek Sadhu', range: '01/04/2026 - 02/04/2026', logged: '04:56:54', expected: '00:00:00', holidays: 0, untracked: 1 },
  { name: 'Adikate', range: '01/04/2026 - 02/04/2026', logged: '09:56:53', expected: '00:00:00', holidays: 0, untracked: 1 },
];

export default function AttendancePage() {
  const [activeView, setActiveView] = useState<'org' | 'ind'>('org');
  const [orgFilter, setOrgFilter] = useState<'manager' | 'loc_dept'>('manager');

  return (
    <DashboardLayout>
      {/* View Switcher */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setActiveView('org')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-bold transition-all border",
            activeView === 'org'
              ? "bg-[#F5F3FF] text-[#0D1B3E] border-[#5E35B1]"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          <Users2 className={cn("h-4 w-4", activeView === 'org' ? "text-[#0D1B3E]" : "text-slate-600")} />
          Organization View
        </button>
        <button
          onClick={() => setActiveView('ind')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-bold transition-all border",
            activeView === 'ind'
              ? "bg-[#F5F3FF] text-[#0D1B3E] border-[#5E35B1]"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          <User className={cn("h-4 w-4", activeView === 'ind' ? "text-[#0D1B3E]" : "text-slate-600")} />
          Individual View
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {activeView === 'ind' ? (
            <div className="flex items-center gap-3 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer w-full sm:w-auto h-10">
              <span className="text-[13px] text-slate-400 mr-2">Select Member</span>
              <span className="text-[13px] text-[#0D1B3E] font-bold flex-1">Yash sapkale</span>
              <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 xl:mr-2">
                <button
                  onClick={() => setOrgFilter('manager')}
                  className={cn(
                    "rounded-md px-6 py-1.5 text-[13px] font-bold transition-all w-full sm:w-auto",
                    orgFilter === 'manager' ? "bg-[#5E35B1] text-white" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Manager
                </button>
                <button
                  onClick={() => setOrgFilter('loc_dept')}
                  className={cn(
                    "rounded-md px-6 py-1.5 text-[13px] font-bold transition-all w-full sm:w-auto",
                    orgFilter === 'loc_dept' ? "bg-[#5E35B1] text-white" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Location & Department
                </button>
              </div>

              {orgFilter === 'manager' ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 cursor-pointer w-full sm:w-auto h-10">
                  <span className="text-[13px] text-slate-600 flex-1 min-w-[140px]">All Members</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 cursor-pointer w-full sm:w-auto h-10">
                    <span className="text-[13px] text-slate-600 flex-1 min-w-[120px]">All Location</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 cursor-pointer w-full sm:w-auto h-10">
                    <span className="text-[13px] text-slate-600 flex-1 min-w-[120px]">All Department</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 cursor-pointer w-full sm:w-auto h-10">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-slate-600">2026-04-01</span>
              <Upload className="h-3 w-3 text-slate-300 rotate-90" /> {/* Arrow mapping */}
              <span className="text-[13px] text-slate-600">2026-04-02</span>
            </div>
            <Calendar className="ml-4 h-4 w-4 text-slate-400" />
          </div>
          <Button className="flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg px-6 h-10 font-bold w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-50 bg-white">
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Name</th>
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Date Range</th>
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Logged</th>
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Expected</th>
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Holidays</th>
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Untracked Days</th>
                <th className="px-8 py-5 text-[14px] font-bold text-[#0D1B3E]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendanceData.map((row, idx) => (
                <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors", idx === 0 && activeView === 'ind' && "bg-[#F4F9FF]")}>
                  <td className="px-8 py-5 text-[13px] font-bold text-[#0D1B3E]">{row.name}</td>
                  <td className="px-8 py-5 text-[13px] font-bold text-[#0D1B3E]">{row.range}</td>
                  <td className="px-8 py-5 text-[13px] font-bold text-green-500">{row.logged}</td>
                  <td className="px-8 py-5 text-[13px] font-bold text-[#5E35B1]">{row.expected}</td>
                  <td className="px-8 py-5 text-[13px] font-bold text-[#3B82F6]">{row.holidays}</td>
                  <td className={cn("px-8 py-5 text-[13px] font-bold", row.untracked > 0 ? "text-yellow-500" : "text-[#3B82F6]")}>
                    {row.untracked}
                  </td>
                  <td className="px-8 py-5">
                    <button className="p-1.5 flex items-center justify-center rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors">
                      <Calendar className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="p-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-[13px] font-bold text-[#0D1B3E] border-t border-slate-50">
          <div className="flex items-center gap-3">
            <span>Rows per page:</span>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-500 shadow-sm cursor-pointer w-[70px]">
              10
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5E35B1] text-white font-bold shadow-sm">1</button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">2</button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">3</button>
              <span className="flex h-8 w-8 items-center justify-center text-slate-400">...</span>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">6</button>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-50 transition-colors text-[#0D1B3E]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
