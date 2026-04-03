'use client';

import { useState } from 'react';
import {
  User,
  Calendar,
  Search,
  Upload,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';

export default function WebAndAppsPage() {
  const [activeView, setActiveView] = useState<'org' | 'ind'>('org');
  const [orgFilter, setOrgFilter] = useState<'manager' | 'loc_dept'>('manager');
  const [activeTab, setActiveTab] = useState<'all' | 'websites' | 'applications'>('all');

  const webAppsData = [
    { name: 'Almas saiyed', dept: '', sites: '47hrs 19Min 26Sec', url: 'https://mail.google.com', extra: '+491 more', productive: '0hrs 5Min 33Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '47hrs 13Min 53Sec', neutralApps: '491 apps' },
    { name: 'Dhruv patel', dept: '', sites: '45hrs 53Min 58Sec', url: 'whatsapp.root', extra: '+230 more', productive: '0hrs 11Min 46Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '45hrs 42Min 12Sec', neutralApps: '230 apps' },
    { name: 'Manthan patel', dept: '', sites: '63hrs 53Min 1Sec', url: 'https://mail.google.com', extra: '+592 more', productive: '0hrs 16Min 22Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '63hrs 36Min 39Sec', neutralApps: '592 apps' },
    { name: 'Arsh Saiyed', dept: '', sites: '36hrs 58Min 52Sec', url: 'chrome.exe', extra: '+13 more', productive: '25hrs 26Min 7Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '11hrs 32Min 45Sec', neutralApps: '13 apps' },
    { name: 'Zaid kasmani', dept: '', sites: '6hrs 42Min 26Sec', url: 'whatsapp.root', extra: '+26 more', productive: '0hrs 6Min 4Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '6hrs 36Min 22Sec', neutralApps: '26 apps' },
    { name: 'Vishal more', dept: 'Sales', sites: '22hrs 6Min 14Sec', url: 'chrome.exe', extra: '+6 more', productive: '20hrs 47Min 46Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '1hrs 18Min 28Sec', neutralApps: '6 apps' },
    { name: 'Minaz', dept: 'Sales', sites: '25hrs 12Min 9Sec', url: 'https://docs.google.com', extra: '+34 more', productive: '0hrs 8Min 4Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '25hrs 4Min 5Sec', neutralApps: '34 apps' },
    { name: 'Tushar pal', dept: 'Sales', sites: '14hrs 37Min 52Sec', url: 'chrome.exe', extra: '+11 more', productive: '12hrs 38Min 44Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '1hrs 59Min 8Sec', neutralApps: '11 apps' },
    { name: 'prasad pawar', dept: 'Sales', sites: '2hrs 22Min 58Sec', url: 'https://linkedin.com', extra: '+15 more', productive: '0hrs 1Min 0Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '2hrs 21Min 58Sec', neutralApps: '15 apps' },
    { name: 'Temsurenba', dept: 'Sales', sites: '23hrs 7Min 41Sec', url: 'https://linkedin.com', extra: '+21 more', productive: '0hrs 2Min 31Sec', productiveApps: '1 apps', unproductive: '0hrs 0Min 0Sec', neutral: '23hrs 5Min 10Sec', neutralApps: '21 apps' },
  ];

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
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm overflow-hidden min-h-[600px]">
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6 flex-1 min-w-0">
              <div className="relative w-full sm:w-64 shrink-0">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 pl-12 text-[14px] text-slate-600 focus:border-[#5E35B1] focus:outline-none placeholder:text-slate-300"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
              </div>

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

          {activeView === 'ind' && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'all'
                    ? "bg-[#1F2937] text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('websites')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'websites'
                    ? "bg-[#1F2937] text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                Websites
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'applications'
                    ? "bg-[#1F2937] text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                Applications
              </button>
            </div>
          )}
        </div>

        {activeView === 'org' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y border-slate-50 bg-slate-50/30">
                  <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    <div className="flex items-center gap-2">NAME <ArrowUpDown className="h-4 w-4" /></div>
                  </th>
                  <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    <div className="flex items-center gap-2">WEBSITES/APPS <ArrowUpDown className="h-4 w-4" /></div>
                  </th>
                  <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    <div className="flex items-center gap-2">PRODUCTIVE <ArrowUpDown className="h-4 w-4" /></div>
                  </th>
                  <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    <div className="flex items-center gap-2">UNPRODUCTIVE <ArrowUpDown className="h-4 w-4" /></div>
                  </th>
                  <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    <div className="flex items-center gap-2">NEUTRAL <ArrowUpDown className="h-4 w-4" /></div>
                  </th>
                  <th className="px-4 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {webAppsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-4 py-6">
                      <div className="font-bold text-[#0D1B3E] text-[13px]">{row.name}</div>
                      {row.dept && <div className="text-[10px] text-slate-400 mt-1">{row.dept}</div>}
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-[#0D1B3E] text-[13px]">{row.sites}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        <span className="text-blue-500">{row.url}</span> <span className="font-bold text-[#5E35B1]">{row.extra}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-[#0D1B3E] text-[13px]">{row.productive}</div>
                      <div className="text-[11px] text-[#5E35B1] font-bold mt-1">{row.productiveApps}</div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-[#0D1B3E] text-[13px]">{row.unproductive}</div>
                      <div className="text-[11px] text-[#5E35B1] font-bold mt-1">0 apps</div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-[#0D1B3E] text-[13px]">{row.neutral}</div>
                      <div className="text-[11px] text-[#5E35B1] font-bold mt-1">{row.neutralApps}</div>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <button className="bg-slate-50 hover:bg-slate-100 text-[#5E35B1] px-4 py-1.5 rounded-lg text-[12px] font-bold border border-slate-100 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-slate-50 bg-white shadow-inner">
              <BarChart3 className="h-12 w-12 text-slate-200" />
            </div>
            <p className="text-[20px] font-bold text-slate-300">No Active Data</p>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="mt-auto pt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-[14px] text-slate-400 border-t border-slate-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-2.5 text-slate-400 shadow-sm cursor-pointer min-w-[120px] justify-between">
              10 rows
              <ChevronDown className="h-4 w-4" />
            </div>
            <span className="font-medium">
              {activeView === 'org' ? 'Showing 1 to 10 of 42 entries' : 'No entries to show'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", activeView === 'ind' ? "text-slate-200 cursor-not-allowed" : "hover:bg-slate-50 text-slate-300")}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex gap-3">
              {activeView === 'org' && (
                <>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E35B1] text-white font-bold shadow-lg shadow-purple-200">1</button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">2</button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">3</button>
                  <span className="flex items-center justify-center w-10 text-slate-300 font-bold tracking-widest">...</span>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">5</button>
                </>
              )}
            </div>
            <button className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", activeView === 'ind' ? "text-slate-200 cursor-not-allowed" : "hover:bg-slate-50 text-slate-300")}>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ArrowUpDown({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}
