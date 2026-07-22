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
  UserPlus,
  Shield,
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
    ...((role === 'admin' || role === 'admin_compliance')
      ? [{ label: 'Managers', href: '/my-team/managers', adminOnly: true } as SubItem]
      : []),
    ...((role === 'admin' || role === 'admin_compliance')
      ? [{ label: 'Admins', href: '/my-team/admins', adminOnly: true } as SubItem]
      : []),
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
    ...((role === 'admin' || role === 'admin_compliance')
      ? [
          {
            icon: Shield,
            label: 'Security',
            href: '/security/uninstall-otp',
            subItems: [
              { label: 'Uninstall OTP', href: '/security/uninstall-otp', adminOnly: true },
            ],
          } as Item,
        ]
      : []),
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
      if (
        item.subItems?.some(
          (si) => pathname === si.href || pathname.startsWith(si.href + '/'),
        )
      ) {
        initialOpenMenus[item.label] = true;
      }
      if (
        item.subItems?.some(
          (si) =>
            pathname.startsWith('/my-team') && si.href.startsWith('/my-team'),
        )
      ) {
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

  const linkActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const isAdmin = !isMemberRole(role);

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col bg-inverse-surface py-6 px-4 shadow-sm md:flex">
      <div className="mb-8 px-2">
        <div className="mb-4 flex items-center gap-2">
          <Image src="/logo.png" alt="CUS Monitor" width={36} height={36} />
          <span className="text-lg font-bold text-white">CUS Monitor</span>
        </div>
        <h1 className="text-sm font-bold text-inverse-on-surface">
          {isAdmin ? 'Enterprise Admin' : 'User Portal'}
        </h1>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-inverse-primary/70">
          {isAdmin ? 'Global View' : 'Personal Workspace'}
        </p>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    openMenus[item.label] ||
                      item.subItems.some((si) => linkActive(si.href))
                      ? 'font-bold text-inverse-on-surface'
                      : 'text-inverse-primary/80 hover:bg-white/10 hover:text-inverse-on-surface',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <svg
                    className={cn(
                      'h-4 w-4 transition-transform',
                      openMenus[item.label] && 'rotate-180',
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>
                <ul
                  className={cn(
                    'ml-4 space-y-0.5 overflow-hidden transition-all duration-300',
                    openMenus[item.label]
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0',
                  )}
                >
                  {item.subItems
                    .filter(
                      (si) =>
                        !(
                          si.adminOnly &&
                          role !== 'admin' &&
                          role !== 'admin_compliance'
                        ),
                    )
                    .map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={cn(
                            'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                            linkActive(subItem.href)
                              ? 'bg-secondary-container font-bold text-on-secondary-container'
                              : 'text-inverse-primary/70 hover:bg-white/10 hover:text-inverse-on-surface',
                          )}
                        >
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  linkActive(item.href)
                    ? 'bg-secondary-container font-bold text-on-secondary-container'
                    : 'text-inverse-primary/80 hover:bg-white/10 hover:text-inverse-on-surface',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        {isAdmin && (
          <Link
            href="/my-team/members"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Link>
        )}
        {!isMemberRole(role) && (
          <>
            <Link
              href="/forgot-password"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-inverse-primary/70 hover:bg-white/10"
            >
              <KeyRound className="h-4 w-4" />
              <span>Forgot password</span>
            </Link>
            <Link
              href="/support"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-inverse-primary/70 hover:bg-white/10"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Support Forum</span>
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
