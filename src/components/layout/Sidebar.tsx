'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Monitor,
  Users2,
  HelpCircle,
  User,
  Clock,
  X,
  KeyRound,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { isMemberRole } from '@/components/auth-context';

type SubItem = { label: string; href: string; adminOnly?: boolean };
type Item =
  | {
      icon: typeof LayoutDashboard;
      label: string;
      href: string;
      subItems?: undefined;
    }
  | {
      icon: typeof LayoutDashboard;
      label: string;
      href: string;
      subItems: SubItem[];
    };

function itemsForRole(role: string): Item[] {
  if (isMemberRole(role)) {
    return [
      { icon: Clock, label: 'Time logs', href: '/reports/time-tracker' },
      { icon: User, label: 'Profile', href: '/profile' },
      { icon: KeyRound, label: 'Forgot password', href: '/forgot-password' },
    ];
  }

  const myTeamSub: SubItem[] = [
    { label: 'Members', href: '/my-team/members' },
    ...(role === 'admin' ? [{ label: 'Managers', href: '/my-team/managers', adminOnly: true } as SubItem] : []),
  ];

  return [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Users2, label: 'My Team', href: '#', subItems: myTeamSub },
    {
      icon: Activity,
      label: 'Live Tracking',
      href: '#',
      subItems: [
        { label: 'Live Stream', href: '/live-stream' },
        { label: 'Screenshot', href: '/screenshots' },
      ],
    },
    {
      icon: BarChart3,
      label: 'Reports',
      href: '#',
      subItems: [
        { label: 'Time Tracker', href: '/reports/time-tracker' },
        { label: 'Productivity Breakdown', href: '/reports/productivity' },
        { label: 'Activity Log', href: '/reports/activity-log' },
        { label: 'Web And Apps', href: '/reports/web-apps' },
        { label: 'Attendance', href: '/reports/attendance' },
        { label: 'Productive vs Unproductive', href: '/reports/productivity-vs-unproductive' },
      ],
    },
  ];
}

export function Sidebar({
  isOpen,
  onClose,
  onToggle,
  role,
}: {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  role: string;
}) {
  const pathname = usePathname();
  const sidebarItems = useMemo(() => itemsForRole(role), [role]);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialOpenMenus: Record<string, boolean> = {};
    sidebarItems.forEach((item) => {
      if (item.subItems?.some((si) => pathname === si.href || pathname.startsWith(si.href + '/'))) {
        initialOpenMenus[item.label] = true;
      }
      if (item.subItems?.some((si) => pathname.startsWith('/my-team') && si.href.startsWith('/my-team'))) {
        initialOpenMenus[item.label] = true;
      }
    });
    setOpenMenus(initialOpenMenus);
  }, [pathname, sidebarItems]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const linkActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen border-r border-slate-200 bg-white transition-transform duration-300',
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full sm:translate-x-0 sm:w-20'
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-dashed border-slate-200 p-6">
          <div
            className="flex cursor-pointer items-center gap-2 transition-transform hover:scale-105"
            onClick={onToggle}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5E35B1] text-white">
              <Monitor className="h-6 w-6" />
            </div>
            <span
              className={cn(
                'text-xl font-bold text-[#5E35B1] transition-opacity',
                !isOpen && 'sm:hidden sm:opacity-0'
              )}
            >
              CUS Monitor
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 sm:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        <ul className="mt-6 space-y-1 px-3 font-medium">
          {sidebarItems.map((item) => (
            <li key={item.label}>
              {item.subItems ? (
                <div className="space-y-1">
                  <div
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'group flex cursor-pointer items-center rounded-xl p-3 text-slate-500 transition-all hover:bg-slate-50',
                      (openMenus[item.label] ||
                        item.subItems.some((si) => linkActive(si.href))) &&
                        'font-bold text-[#5E35B1]'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className={cn('ml-3 flex-1 transition-opacity', !isOpen && 'sm:hidden')}>{item.label}</span>
                    <svg
                      className={cn('h-4 w-4 transition-transform', openMenus[item.label] && 'rotate-180', !isOpen && 'sm:hidden')}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </div>
                  <ul
                    className={cn(
                      'ml-9 space-y-1 overflow-auto transition-all duration-300',
                      openMenus[item.label] && isOpen ? 'max-h-auto opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    {item.subItems
                      .filter((si) => !(si.adminOnly && role !== 'admin'))
                      .map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              'flex items-center rounded-xl p-2 text-sm text-slate-500 transition-all hover:bg-slate-50',
                              linkActive(subItem.href) && 'bg-[#5E35B1] text-white hover:bg-[#5E35B1]/90'
                            )}
                          >
                            <div
                              className={cn(
                                'mr-3 h-1.5 w-1.5 rounded-full',
                                linkActive(subItem.href) ? 'bg-white' : 'bg-slate-300'
                              )}
                            />
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-xl p-3 text-slate-500 transition-all hover:bg-slate-50',
                    linkActive(item.href) && 'bg-[#5E35B1] text-white hover:bg-[#5E35B1]/90'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition duration-75',
                      linkActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'
                    )}
                  />
                  <span className={cn('ml-3 transition-opacity', !isOpen && 'sm:hidden')}>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {!isMemberRole(role) && (
          <div className="mt-auto border-t border-slate-200 p-4">
            <Link href="/forgot-password" className="flex items-center rounded-xl p-3 text-slate-500 hover:bg-slate-50">
              <KeyRound className="h-5 w-5 text-slate-400" />
              <span className={cn('ml-3 transition-opacity', !isOpen && 'sm:hidden')}>Forgot password</span>
            </Link>
            <Link href="/support" className="flex items-center rounded-xl p-3 text-slate-500 hover:bg-slate-50">
              <HelpCircle className="h-5 w-5 text-slate-400" />
              <span className={cn('ml-3 transition-opacity', !isOpen && 'sm:hidden')}>Support Forum</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
