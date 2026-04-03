'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, User, ArrowLeft, Menu } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function Navbar({ onMenuClick, isOpen = false }: { onMenuClick: () => void; isOpen?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDashboard = pathname === '/' || pathname === '/dashboard';
  const isManagerPage = pathname === '/manager';
  const isMyTeamPage = pathname === '/my-team';
  const isTimeTrackerPage = pathname === '/reports/time-tracker';
  const isShiftTrackerPage = pathname === '/reports/shift-tracker';
  const isProductivityPage = pathname === '/reports/productivity';
  const isActivityLogPage = pathname === '/reports/activity-log';
  const isWebAppsPage = pathname === '/reports/web-apps';
  const isAttendancePage = pathname === '/reports/attendance';
  const isDailyTimeEntryPage = pathname === '/daily-time-entry';

  // Create a readable title for unmatched paths (e.g. '/pricing-and-billing' -> 'Pricing And Billing')
  const defaultTitle = pathname
    .split('/')
    .pop()
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Overview';

  return (
    <nav className={cn(
      "fixed top-0 z-40 w-full bg-white px-4 sm:px-6 py-4 transition-all duration-300",
      isOpen ? "sm:w-[calc(100%-16rem)] sm:left-64" : "sm:w-[calc(100%-5rem)] sm:left-20"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors sm:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          {(isManagerPage || isMyTeamPage || isTimeTrackerPage || isShiftTrackerPage || isProductivityPage || isActivityLogPage || isWebAppsPage || isAttendancePage || isDailyTimeEntryPage) && (
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            {isManagerPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Change Manager</h1>
                <p className="text-sm text-slate-400">Reassign your team members to a different manager from this page.</p>
              </>
            ) : isMyTeamPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">My Team</h1>
                <p className="text-sm text-slate-400">Manage your team members, departments, and locations from this page.</p>
              </>
            ) : isTimeTrackerPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Time Tracker</h1>
                <p className="text-sm text-slate-400">Detailed Report of how your time was spent with segregation based on different time metrics.</p>
              </>
            ) : isShiftTrackerPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Shift Report</h1>
                <p className="text-sm text-slate-400">View shift time and activity details for employees from this page.</p>
              </>
            ) : isProductivityPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Productivity Breakdown</h1>
                <p className="text-sm text-slate-400">Comprehensive breakdown of active working hours compared to idle time, helping you measure efficiency and optimize productivity.</p>
              </>
            ) : isActivityLogPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Activity Log</h1>
                <p className="text-sm text-slate-400">A consolidated weekly report featuring a 24-hour visual timeline of daily activity, designed to drill down from a day summary into specific work sessions and the applications used within them.</p>
              </>
            ) : isWebAppsPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Websites & Applications</h1>
                <p className="text-sm text-slate-400">Descriptions of the websites and apps tracked by your system up to today.</p>
              </>
            ) : isAttendancePage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Attendance Report</h1>
                <p className="text-sm text-slate-400">Monitor attendance records for all employees from this page.</p>
              </>
            ) : isDailyTimeEntryPage ? (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">Daily Time Entry</h1>
                <p className="text-sm text-slate-400">Add your daily time entry for projects and tasks.</p>
              </>
            ) : isDashboard ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 ">Hi Yash sapkale, Good Afternoon</h1>
                <p className="text-sm text-slate-400">2nd April, 2026</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[#0D1B3E]">{defaultTitle}</h1>
                <p className="text-sm text-slate-400">View and manage {defaultTitle.toLowerCase()} details.</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-white">
              9
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-green-500 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"
                alt="User"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
