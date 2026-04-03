'use client';

import {
  Calendar,
  Search,
  FileX
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';

export default function ApplicationUsageReportPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Application Usage Report</h1>
        <p className="text-[12px] text-slate-400">To view the usage report, Search application or website name in the search bar. The report will display detailed usage data for selected date range.</p>
      </div>

      {/* Main Content Card */}
      <Card className="p-12 shadow-sm border-slate-100 min-h-[480px] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 mb-24">
          {/* Search Section */}
          <div className="w-full max-w-md">
            <label className="block text-[14px] font-bold text-slate-800 mb-5">Search App/URL</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-300 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Enter more than 3 characters"
                className="w-full rounded-xl border border-slate-100 bg-[#F8FAFC] py-4 pl-12 pr-4 text-[14px] text-slate-500 focus:border-blue-400 focus:bg-white focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Date Range Section */}
          <div className="w-full max-w-xs md:ml-auto">
            <label className="block text-[14px] font-bold text-slate-800 mb-5">Date Range</label>
            <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 transition-all">
              <span className="text-[14px] font-medium text-slate-600">2026-03-25</span>
              <span className="text-slate-300">—</span>
              <span className="text-[14px] font-medium text-slate-600">2026-04-01</span>
              <Calendar className="ml-auto h-5 w-5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-24">
          <div className="mb-6 opacity-40">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 2V9H20" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="18" r="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
              <path d="M16.5 16.5L19.5 19.5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <path d="M19.5 16.5L16.5 19.5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[18px] font-bold text-slate-400">No data to display</p>
        </div>
      </Card>
    </DashboardLayout>
  );
}
