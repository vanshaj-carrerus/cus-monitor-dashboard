'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, LogOut, Search, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import Link from 'next/link';

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDashboard = pathname === '/' || pathname === '/dashboard';

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    '/manager': {
      title: 'Change Manager',
      subtitle: 'Reassign your team members to a different manager.',
    },
    '/my-team/managers': {
      title: 'Managers',
      subtitle: 'Assign departments and locations each manager can oversee.',
    },
    '/my-team/members': {
      title: 'Team Management',
      subtitle:
        "Manage your organization's hierarchy, access control, and team structures.",
    },
    '/profile': {
      title: 'Personal Workspace',
      subtitle: 'Manage your productivity logs and account security.',
    },
    '/reports/time-tracker': {
      title: 'Time Tracker Report',
      subtitle:
        'Detailed breakdown of productivity and activity across your organization.',
    },
    '/reports/activity-log': {
      title: 'Activity Log',
      subtitle: 'Comprehensive audit trail of organizational interactions.',
    },
    '/reports/web-apps': {
      title: 'Websites & Applications',
      subtitle: 'Descriptions of tracked websites and apps.',
    },
    '/reports/attendance': {
      title: 'Attendance Report',
      subtitle: 'Monitor attendance records for all employees.',
    },
    '/live-stream': {
      title: 'Live Stream Monitoring',
      subtitle: 'Real-time desktop activity from connected team members.',
    },
    '/screenshots': {
      title: 'Screenshots Gallery',
      subtitle: 'Browse captured desktop snapshots from your team.',
    },
    '/daily-time-entry': {
      title: 'Daily Time Entry',
      subtitle: 'Add your daily time entry for projects and tasks.',
    },
  };

  const matchedKey = Object.keys(pageMeta).find(
    (key) => pathname === key || pathname?.startsWith(key + '/'),
  );
  const meta = matchedKey ? pageMeta[matchedKey] : null;

  const defaultTitle =
    pathname
      ?.split('/')
      .pop()
      ?.split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Overview';

  return (
    <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 transition-all duration-300 sm:left-64 sm:w-[calc(100%-16rem)]">
      <div className="flex min-w-0 items-center gap-4">
        <div className="min-w-0">
          {isDashboard ? (
            <>
              <h1 className="truncate text-lg font-bold text-on-surface">
                Hi {user?.username || 'there'},
                {new Date().getHours() < 12
                  ? ' Good morning'
                  : new Date().getHours() < 17
                    ? ' Good afternoon'
                    : ' Good evening'}
              </h1>
              <p className="truncate text-xs text-on-surface-variant">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </>
          ) : meta ? (
            <>
              <h1 className="truncate text-lg font-bold text-on-surface">
                {meta.title}
              </h1>
              <p className="hidden truncate text-xs text-on-surface-variant sm:block">
                {meta.subtitle}
              </p>
            </>
          ) : (
            <>
              <h1 className="truncate text-lg font-bold text-on-surface">
                {defaultTitle}
              </h1>
              <p className="hidden text-xs text-on-surface-variant sm:block">
                View and manage {defaultTitle.toLowerCase()} details.
              </p>
            </>
          )}
        </div>

        <div className="relative ml-2 hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search members, activities..."
            className="w-64 rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Bell className="h-5 w-5" />
        </button>
        <Link href="/profile">
        <button
          type="button"
          className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low sm:block"
          >
          <Settings className="h-5 w-5" />
        </button>
          </Link>
        <div className="hidden h-8 w-px bg-outline-variant sm:block" />
        <span className="hidden max-w-[140px] truncate text-sm text-on-surface-variant md:inline">
          {user?.email}
        </span>
        <button
          type="button"
          onClick={() => logout()}
          className="flex h-9 items-center gap-1 rounded-lg border border-outline-variant px-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
        <div className="h-8 w-8 overflow-hidden rounded-full border border-outline-variant bg-secondary-fixed">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
