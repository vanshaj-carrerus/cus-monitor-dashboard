'use client';

import { useState } from 'react';
import {
  Calendar,
  Upload,
  ChevronDown,
  LineChart,
  Monitor,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';

type ViewType = 'Team' | 'Individual' | 'Department';

export default function ProductiveVsUnproductivePage() {
  const [activeTab, setActiveTab] = useState<ViewType>('Team');

  const getLabel = () => {
    switch (activeTab) {
      case 'Team': return 'Manager';
      case 'Individual': return 'Member';
      case 'Department': return 'Department';
    }
  };

  const getSelectedValue = () => {
    switch (activeTab) {
      case 'Team': return 'All Members';
      case 'Individual': return 'Yash sapkale';
      case 'Department': return 'Sales';
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Productive VS Unproductive</h1>
        <p className="text-[12px] text-slate-400">View productive vs unproductive time across your organization, teams, or individual members over selected date ranges.</p>
      </div>

      {/* Controls Card */}
      <Card className="mb-8 p-8 shadow-sm border-slate-100">
        <div className="mb-8 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex w-fit items-center gap-1 rounded-xl bg-white p-1 border border-slate-100 shadow-sm">
            {(['Team', 'Individual', 'Department'] as ViewType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "min-w-[100px] rounded-lg px-6 py-2.5 text-[13px] font-bold transition-all",
                  activeTab === tab
                    ? "bg-[#5E35B1] text-white shadow-lg shadow-purple-200"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Selectors Row */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">
                {getLabel()} <span className="text-red-500">*</span>
              </span>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-100 cursor-pointer min-w-[240px] flex-1 lg:flex-none">
                <span className="text-[13px] text-slate-600 flex-1">{getSelectedValue()}</span>
                <ChevronDown className="h-4 w-4 text-slate-300" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">
                Date Range <span className="text-red-500">*</span>
              </span>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-100 cursor-pointer">
                <span className="text-[13px] font-medium text-slate-600">2026-04-01</span>
                <span className="text-slate-300">—</span>
                <span className="text-[13px] font-medium text-slate-600">2026-04-01</span>
                <Calendar className="ml-2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-[#F1F5F9] text-slate-600 px-6 py-2.5 rounded-xl border-none font-bold text-[12px]">
              <Upload className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Productive Activities */}
        <Card className="p-8 shadow-sm border-slate-100 min-h-[400px]">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <LineChart className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800">Productive Activities</h3>
              <p className="text-[12px] text-slate-400">Applications and websites that boost productivity</p>
            </div>
          </div>

          {activeTab === 'Team' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] p-6 border border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <Monitor className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800">chrome.exe</h4>
                    <p className="text-[12px] text-slate-400">Application</p>
                  </div>
                </div>
                <div className="text-[14px] font-bold text-green-500">13:28:17</div>
              </div>
            </div>
          ) : (
            <EmptyState message="No productive activities found for the selected criteria" />
          )}
        </Card>

        {/* Unproductive Activities */}
        <Card className="p-8 shadow-sm border-slate-100 min-h-[400px]">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50">
              <LineChart className="h-6 w-6 text-pink-500 rotate-180" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800">Unproductive Activities</h3>
              <p className="text-[12px] text-slate-400">Applications and websites that may reduce productivity</p>
            </div>
          </div>

          <EmptyState message="No unproductive activities found for the selected criteria" />
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="h-14 w-11 rounded-xl bg-pink-100 flex items-center justify-center">
          <LineChart className="h-6 w-6 text-pink-400 rotate-180" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 border-4 border-white">
          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
        </div>
      </div>
      <h4 className="mb-2 text-[18px] font-bold text-slate-300">No Data Available</h4>
      <p className="text-[13px] text-slate-300 font-medium max-w-[400px]">{message}</p>
    </div>
  );
}
