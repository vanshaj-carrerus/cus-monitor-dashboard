'use client';

import { useState } from 'react';
import {
  Calendar,
  Download,
  ChevronDown,
  Search
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';

// Mock data for the chart
const chartData = [
  { name: 'Adikate', productive: 1.5, neutral: 0.8, unproductive: 0, idle: 0 },
  { name: 'Alfaiz khatri', productive: 0, neutral: 1.1, unproductive: 0, idle: 1.4 },
  { name: 'Almas saiyed', productive: 0, neutral: 1.9, unproductive: 0, idle: 0.6 },
  { name: 'Anjali', productive: 0, neutral: 2.1, unproductive: 0, idle: 0.4 },
  { name: 'Arsh Saiyed', productive: 0.7, neutral: 0.9, unproductive: 0, idle: 0.8 },
  { name: 'Debraj chowd...', productive: 0.1, neutral: 1.9, unproductive: 0, idle: 0.3 },
  { name: 'Dhruv patel', productive: 0, neutral: 1.2, unproductive: 0, idle: 0.8 },
  { name: 'Fatima', productive: 0.9, neutral: 0.5, unproductive: 0, idle: 0 },
  { name: 'Harsh chatur', productive: 1.1, neutral: 0.7, unproductive: 0, idle: 0.4 },
  { name: 'Hindavi', productive: 0.9, neutral: 0.9, unproductive: 0, idle: 0.6 },
  { name: 'Khusbu', productive: 0, neutral: 0.1, unproductive: 0, idle: 0.3 },
];

export default function ProductivityBreakdownPage() {
  const [activeView, setActiveView] = useState<'org' | 'ind'>('org');
  const [orgFilter, setOrgFilter] = useState<'manager' | 'loc_dept'>('manager');

  return (
    <DashboardLayout>
      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveView('org')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-bold transition-all",
              activeView === 'org'
                ? "bg-[#F5F3FF] text-[#0D1B3E] border border-[#5E35B1]/20 shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Organization View
          </button>
          <button
            onClick={() => setActiveView('ind')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-bold transition-all",
              activeView === 'ind'
                ? "bg-[#F5F3FF] text-[#0D1B3E] border border-[#5E35B1]/20 shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Individual View
          </button>
        </div>

        <div className="flex items-center gap-4">
          {activeView === 'ind' && (
            <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer min-w-[240px]">
              <span className="text-[14px] text-slate-400 flex-1">Yash sapkale</span>
              <ChevronDown className="h-5 w-5 text-slate-300" />
            </div>
          )}
          <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm cursor-pointer min-w-[200px]">
            <span className="text-[14px] font-medium text-slate-500">2026-04-02</span>
            <Calendar className="ml-4 h-5 w-5 text-slate-300" />
          </div>
          <Button className="flex items-center gap-2 bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white rounded-xl px-6 py-3 h-auto font-bold">
            <Download className="h-5 w-5" />
            Download
          </Button>
        </div>
      </div>

      {activeView === 'org' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-100 shadow-sm">
            <button
              onClick={() => setOrgFilter('manager')}
              className={cn(
                "rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all",
                orgFilter === 'manager' ? "bg-[#5E35B1] text-white shadow-lg shadow-purple-200" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Manager
            </button>
            <button
              onClick={() => setOrgFilter('loc_dept')}
              className={cn(
                "rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all",
                orgFilter === 'loc_dept' ? "bg-[#5E35B1] text-white shadow-lg shadow-purple-200" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Location & Department
            </button>
          </div>

          <div className="flex items-center gap-4">
            {orgFilter === 'manager' ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[240px]">
                <span className="text-[14px] text-slate-500 flex-1">All members</span>
                <ChevronDown className="h-5 w-5 text-slate-300" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[200px]">
                  <span className="text-[14px] text-slate-500 flex-1">All Location</span>
                  <ChevronDown className="h-5 w-5 text-slate-300" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[200px]">
                  <span className="text-[14px] text-slate-500 flex-1">All Department</span>
                  <ChevronDown className="h-5 w-5 text-slate-300" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeView === 'org' ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 pl-12 text-[14px] text-slate-600 focus:border-[#5E35B1] focus:outline-none placeholder:text-slate-300 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium text-slate-500">Sort By :</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm cursor-pointer min-w-[100px]">
                <span className="text-[14px] text-slate-600 flex-1">A-Z</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative h-[500px] w-full mt-12">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[12px] text-slate-400 font-medium pb-8">
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>

            {/* Y-axis line */}
            <div className="absolute left-6 top-2 bottom-8 w-px bg-slate-200"></div>

            {/* X-axis line */}
            <div className="absolute left-6 bottom-8 right-0 h-px bg-slate-200"></div>

            {/* Bars */}
            <div className="absolute left-12 right-4 top-2 bottom-8 flex items-end justify-between px-4">
              {chartData.map((data, i) => (
                <div key={i} className="flex flex-col items-center w-16 group">
                  <div className="w-12 flex flex-col justify-end h-[400px]">
                    {/* Idle (Yellow) */}
                    {data.idle > 0 && (
                      <div
                        className="w-full bg-[#FBBF24] relative flex items-center justify-center transition-all hover:opacity-90"
                        style={{ height: `${(data.idle / 3) * 100}%` }}
                      >
                        <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity absolute">
                          00:18:00
                        </span>
                      </div>
                    )}
                    {/* Unproductive (Red) */}
                    {data.unproductive > 0 && (
                      <div
                        className="w-full bg-[#EF4444] relative flex items-center justify-center transition-all hover:opacity-90"
                        style={{ height: `${(data.unproductive / 3) * 100}%` }}
                      ></div>
                    )}
                    {/* Neutral (Orange) */}
                    {data.neutral > 0 && (
                      <div
                        className="w-full bg-[#E87922] relative flex items-center justify-center transition-all hover:opacity-90"
                        style={{ height: `${(data.neutral / 3) * 100}%` }}
                      >
                        <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity absolute">
                          00:46:01
                        </span>
                      </div>
                    )}
                    {/* Productive (Green) */}
                    {data.productive > 0 && (
                      <div
                        className="w-full bg-[#22C55E] relative flex items-center justify-center transition-all hover:opacity-90"
                        style={{ height: `${(data.productive / 3) * 100}%` }}
                      >
                        <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity absolute">
                          01:22:38
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 mt-4 truncate w-full text-center">
                    {data.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm border border-slate-50">
          <p className="text-[20px] font-bold text-slate-300">No Records Found</p>
        </div>
      )}
    </DashboardLayout>
  );
}
