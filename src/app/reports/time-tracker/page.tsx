'use client';

import { useState, useEffect } from 'react';
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
import { cn, formatTimeSpent } from '../../../../lib/utils';
import { useAuth, isMemberRole } from '@/components/auth-context';

export default function TimeTrackerPage() {
  const { user } = useAuth();
  const memberOnly = user ? isMemberRole(user.role) : false;

  const [activeView, setActiveView] = useState<'org' | 'ind'>(memberOnly ? 'ind' : 'org');
  const [orgFilter, setOrgFilter] = useState<'manager' | 'loc_dept'>('manager');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const totalProductive = reports.reduce((acc, row) => acc + Number(row.productiveSeconds || 0), 0);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/reports?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setReports(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (memberOnly) setActiveView('ind');
  }, [memberOnly]);

  return (
    <DashboardLayout>
      {/* Sub-header Controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
          {!memberOnly && (
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
          )}
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
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 shadow-sm">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[13px] text-slate-600 outline-none" />
            <span className="text-slate-300">—</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[13px] text-slate-600 outline-none" />
            <Calendar className="h-5 w-5 text-slate-300" />
            <Button size="sm" onClick={fetchReports} className="rounded-lg bg-[#5E35B1] text-white hover:bg-[#4527A0] px-3 py-1.5 h-auto">Apply</Button>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  <>Total Team Productivity: <span className="text-[#0D1B3E]">{formatTimeSpent(totalProductive)}</span></>
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
                <Button variant="secondary" size="sm" onClick={fetchReports} className="flex items-center gap-2 bg-slate-100/50 text-slate-500 px-6 py-3 rounded-xl border-none font-bold text-[13px] h-auto whitespace-nowrap">
                  <Filter className="h-5 w-5" />
                  Apply Filters
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-center text-slate-500">Loading data...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-center text-slate-500">No data found.</td>
                </tr>
              ) : activeView === 'org' ? (
                reports.map((row: any, idx: number) => (
                  <tr key={row._id || idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-5 font-bold text-[#0D1B3E] text-[13px]">
                      {row.username || ' '}
                      {row.role && <div className="text-[10px] font-medium text-slate-400 mt-1 capitalize">{row.role}</div>}
                    </td>
                    <td className="px-4 py-5 text-right font-bold text-slate-400 text-[13px]">{formatTimeSpent(row.trackedTimeSeconds || 0)}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#3B82F6] text-[13px]">{formatTimeSpent(row.trackedTimeSeconds || 0)}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#10B981] text-[13px]">{formatTimeSpent(row.productiveSeconds || 0)}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#EF4444] text-[13px]">{formatTimeSpent(row.unproductiveSeconds || 0)}</td>
                    <td className="px-4 py-5 text-right font-bold text-[#F59E0B] text-[13px]">0h 0m</td>
                    <td className="px-4 py-5 text-right font-bold text-[#FBBF24] text-[13px]">0h 0m</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-5 text-center text-slate-500">Individual view not yet populated with dynamic data</td>
                </tr>
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
