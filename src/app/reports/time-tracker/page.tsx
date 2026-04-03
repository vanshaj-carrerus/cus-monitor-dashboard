'use client';

import { useState } from 'react';
import {
  User,
  Calendar,
  Filter,
  Upload,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Users2,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';

const orgData = [
  { name: '', avg: '1hrs 22Min 50Sec', active: '4hrs 8Min 28Sec', productive: '0hrs 1Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '4hrs 7Min 28Sec', idle: '0hrs 39Min 21Sec' },
  { name: '', avg: '2hrs 1Min 56Sec', active: '10hrs 9Min 40Sec', productive: '7hrs 11Min 9Sec', unproductive: '0hrs 0Min 0Sec', neutral: '2hrs 58Min 31Sec', idle: '13hrs 42Min 46Sec' },
  { name: '', avg: '4hrs 18Min 18Sec', active: '21rs 31Min 29Sec', productive: '0hrs 12Min 24Sec', unproductive: '0hrs 0Min 0Sec', neutral: '21hrs 19Min 5Sec', idle: '4hrs 35Min 15Sec' },
  { name: '', avg: '3hrs 56Min 36Sec', active: '19hrs 43Min 0Sec', productive: '16hrs 16Min 49Sec', unproductive: '0hrs 0Min 0Sec', neutral: '3hrs 26Min 11Sec', idle: '3hrs 55Min 4Sec' },
  { name: '', avg: '4hrs 13Min 26Sec', active: '21hrs 7Min 7Sec', productive: '12hrs 26Min 42Sec', unproductive: '0hrs 0Min 0Sec', neutral: '8hrs 40Min 25Sec', idle: '4hrs 30Min 29Sec' },
  { name: '', avg: '0hrs 0Min 0Sec', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec' },
  { name: 'Abhishek Sadhu', avg: '2hrs 39Min 37Sec', active: '10hrs 38Min 25Sec', productive: '0hrs 2Min 33Sec', unproductive: '0hrs 0Min 0Sec', neutral: '10hrs 35Min 52Sec', idle: '1hrs 17Min 20Sec' },
  { name: 'Adikate', avg: '4hrs 53Min 28Sec', active: '24hrs 27Min 16Sec', productive: '16hrs 0Min 33Sec', unproductive: '0hrs 0Min 0Sec', neutral: '8hrs 26Min 43Sec', idle: '2hrs 42Min 49Sec' },
  { name: 'Adoreen', dept: 'Sales', avg: '5hrs 36Min 4Sec', active: '28hrs 0Min 18Sec', productive: '22hrs 45Min 2Sec', unproductive: '0hrs 0Min 0Sec', neutral: '5hrs 15Min 16Sec', idle: '2hrs 38Min 53Sec' },
  { name: 'Alfaiz khatri', avg: '6hrs 13Min 18Sec', active: '37hrs 19Min 47Sec', productive: '0hrs 2Min 30Sec', unproductive: '0hrs 0Min 0Sec', neutral: '37hrs 17Min 17Sec', idle: '9hrs 41Min 51Sec' },
];

const indData = [
  { date: '26 Mar 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
  { date: '27 Mar 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
  { date: '28 Mar 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
  { date: '29 Mar 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
  { date: '30 Mar 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
  { date: '31 Mar 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
  { date: '1 Apr 2026', span: '-', active: '0hrs 0Min 0Sec', productive: '0hrs 0Min 0Sec', unproductive: '0hrs 0Min 0Sec', neutral: '0hrs 0Min 0Sec', idle: '0hrs 0Min 0Sec', away: '0hrs 0Min 0Sec', total: '0hrs 0Min 0Sec' },
];

export default function TimeTrackerPage() {
  const [activeView, setActiveView] = useState<'org' | 'ind'>('org');
  const [orgFilter, setOrgFilter] = useState<'manager' | 'loc_dept'>('manager');

  return (
    <DashboardLayout>
      {/* Sub-header Controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            <div className={cn("p-1 rounded-md", activeView === 'org' ? "bg-white" : "bg-transparent")}>
              <Users2 className={cn("h-4 w-4", activeView === 'org' ? "text-[#0D1B3E]" : "text-slate-400")} />
            </div>
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
            <div className={cn("p-1 rounded-md", activeView === 'ind' ? "bg-white" : "bg-transparent")}>
              <User className={cn("h-4 w-4", activeView === 'ind' ? "text-[#0D1B3E]" : "text-slate-400")} />
            </div>
            Individual View
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-2.5 shadow-sm cursor-pointer">
            <span className="text-[14px] font-medium text-slate-500">2026-03-27</span>
            <span className="text-slate-300">—</span>
            <span className="text-[14px] font-medium text-slate-500">2026-04-02</span>
            <Calendar className="ml-4 h-5 w-5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm overflow-hidden">
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6 flex-1 min-w-0">
              {activeView === 'org' && (
                <div className="relative w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 pl-12 text-[14px] text-slate-600 focus:border-[#5E35B1] focus:outline-none placeholder:text-slate-300"
                  />
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                </div>
              )}

              {activeView === 'org' ? (
                <div className="flex items-center gap-1 rounded-xl bg-slate-50/50 p-1 border border-slate-100 shrink-0">
                  <button
                    onClick={() => setOrgFilter('manager')}
                    className={cn(
                      "rounded-lg px-4 py-2 text-[12px] font-bold transition-all",
                      orgFilter === 'manager' ? "bg-[#5E35B1] text-white shadow-lg shadow-purple-200" : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    Manager
                  </button>
                  <button
                    onClick={() => setOrgFilter('loc_dept')}
                    className={cn(
                      "rounded-lg px-4 py-2 text-[12px] font-bold transition-all",
                      orgFilter === 'loc_dept' ? "bg-[#5E35B1] text-white shadow-lg shadow-purple-200" : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    Location & Department
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[240px] shrink-0">
                  <span className="text-[14px] text-slate-500 flex-1">Yash sapkale</span>
                  <ChevronDown className="h-5 w-5 text-slate-300" />
                </div>
              )}

              <div className="text-[16px] font-bold text-[#0D1B3E] whitespace-nowrap overflow-hidden text-ellipsis">
                {activeView === 'org' ? (
                  <>Total Team Productivity: <span className="text-[#0D1B3E]">277hrs 43Min 41Sec</span></>
                ) : (
                  <>Total Productivity: <span className="text-[#0D1B3E]">0hrs 0Min 0Sec</span></>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0 ml-auto">
              {activeView === 'org' && (
                <>
                  {orgFilter === 'manager' ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[200px]">
                      <span className="text-[14px] text-slate-500 flex-1">All members</span>
                      <ChevronDown className="h-5 w-5 text-slate-300" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[160px]">
                        <span className="text-[14px] text-slate-500 flex-1">All Location</span>
                        <ChevronDown className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-sm cursor-pointer min-w-[160px]">
                        <span className="text-[14px] text-slate-500 flex-1">All Department</span>
                        <ChevronDown className="h-5 w-5 text-slate-300" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-slate-100/50 text-slate-400 px-6 py-3 rounded-xl border-none font-bold text-[13px] h-auto whitespace-nowrap">
                  <Filter className="h-5 w-5" />
                  Filter
                </Button>
                <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-slate-100/50 text-slate-400 px-6 py-3 rounded-xl border-none font-bold text-[13px] h-auto whitespace-nowrap">
                  <Upload className="h-5 w-5 rotate-180" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-y border-slate-50 bg-slate-50/30">
                {activeView === 'org' ? (
                  <>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                      <div className="flex items-center gap-2">
                        NAME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        AVERAGE TIME <Info className="h-4 w-4" /> <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        ACTIVE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        PRODUCTIVE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        UNPRODUCTIVE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        NEUTRAL TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        IDLE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                      <div className="flex items-center gap-2">
                        DATE <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">ACTIVITY SPAN</th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        ACTIVE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        PRODUCTIVE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        UNPRODUCTIVE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        NEUTRAL TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        IDLE TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        AWAY TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        TOTAL TIME <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeView === 'org' ? (
                orgData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-5 font-bold text-[#0D1B3E] text-[13px]">
                      {row.name || ' '}
                      {row.dept && <div className="text-[10px] font-medium text-slate-400 mt-1">{row.dept}</div>}
                    </td>
                    <td className="px-4 py-5 text-right font-bold text-slate-400 text-[13px]">{row.avg}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#3B82F6] text-[13px]">{row.active}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#10B981] text-[13px]">{row.productive}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#EF4444] text-[13px]">{row.unproductive}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#F59E0B] text-[13px]">{row.neutral}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#FBBF24] text-[13px]">{row.idle}</td>
                  </tr>
                ))
              ) : (
                indData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-5 font-bold text-[#0D1B3E] text-[13px]">{row.date}</td>
                    <td className="px-4 py-5 text-center font-bold text-slate-400 text-[13px]">{row.span}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#3B82F6] text-[13px]">{row.active}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#10B981] text-[13px]">{row.productive}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#EF4444] text-[13px]">{row.unproductive}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#F59E0B] text-[13px]">{row.neutral}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#FBBF24] text-[13px]">{row.idle}</td>
                    <td className="px-4 py-5 text-right font-bold text-slate-400 text-[13px]">{row.away}</td>
                    <td className="px-4 py-5 text-right font-bold text-slate-400 text-[13px]">{row.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-[14px] text-slate-400 border-t border-slate-50 pt-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-2.5 text-slate-400 shadow-sm cursor-pointer min-w-[120px] justify-between">
              10 rows
              <ChevronDown className="h-4 w-4" />
            </div>
            <span className="font-medium">Showing 1 to {activeView === 'org' ? '10 of 51' : '7 of 7'} entries</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50 transition-colors text-slate-300">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E35B1] text-white font-bold shadow-lg shadow-purple-200">
                1
              </button>
              {activeView === 'org' && (
                <>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">
                    2
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">
                    3
                  </button>
                  <span className="flex items-center justify-center w-10 text-slate-300 font-bold tracking-widest">...</span>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">
                    6
                  </button>
                </>
              )}
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
