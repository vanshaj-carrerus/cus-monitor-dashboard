'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Users2,
  HelpCircle,
  User,
  Clock,
  KeyRound,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { isMemberRole } from '@/components/auth-context';
import Image from 'next/image';

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
    ...((role === 'admin' || role === 'admin_compliance') ? [{ label: 'Managers', href: '/my-team/managers', adminOnly: true } as SubItem] : []),
    ...((role === 'admin' || role === 'admin_compliance') ? [{ label: 'Admins', href: '/my-team/admins', adminOnly: true } as SubItem] : []),
  ];

  return [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Users2, label: 'My Team', href: '/my-team/members', subItems: myTeamSub },
    {
      icon: Activity,
      label: 'Live Tracking',
      href: '/live-stream',
      subItems: [
        { label: 'Live Stream', href: '/live-stream' },
        { label: 'Screenshot', href: '/screenshots' },
      ],
    },
    {
      icon: BarChart3,
      label: 'Reports',
      href: '/reports/time-tracker',
      subItems: [
        { label: 'Time Tracker', href: '/reports/time-tracker' },
        { label: 'Activity Log', href: '/reports/activity-log' },
        { label: 'Web And Apps', href: '/reports/web-apps' },
      ],
    },
    { icon: User, label: 'Profile', href: '/profile' },
  ];
}

export function Sidebar({ role }: { role: string }) {
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
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-dashed border-slate-200 p-6">
          <div className="flex cursor-pointer items-center gap-2 transition-transform hover:scale-105">
            <div className="flex shrink-0 items-center justify-center rounded-xl text-white">
              <Image src={"/logo.png"} alt="CUS Monitor" width={40} height={40} />
            </div>
            <span className="text-xl font-bold text-[#5E35B1]">CUS Monitor</span>
          </div>
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
                    <span className="ml-3 flex-1">{item.label}</span>
                    <svg
                      className={cn('h-4 w-4 transition-transform', openMenus[item.label] && 'rotate-180')}
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
                      openMenus[item.label] ? 'max-h-auto opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    {item.subItems
                      .filter((si) => !(si.adminOnly && role !== 'admin' && role !== 'admin_compliance'))
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
                  <span className="ml-3">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {!isMemberRole(role) && (
          <div className="mt-auto border-t border-slate-200 p-4">
            <Link href="/forgot-password" className="flex items-center rounded-xl p-3 text-slate-500 hover:bg-slate-50">
              <KeyRound className="h-5 w-5 text-slate-400" />
              <span className="ml-3">Forgot password</span>
            </Link>
            <Link href="/support" className="flex items-center rounded-xl p-3 text-slate-500 hover:bg-slate-50">
              <HelpCircle className="h-5 w-5 text-slate-400" />
              <span className="ml-3">Support Forum</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
