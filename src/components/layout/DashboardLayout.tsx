'use client';

import { useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/components/providers';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const runSweep = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        await fetch('/api/users/inactivity-sweep', {
          method: 'POST',
          cache: 'no-store',
        });
      } catch {
        // noop
      }
    };

    runSweep();
    timer = setInterval(runSweep, 4 * 60 * 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar isOpen={isOpen} onMenuClick={toggle} />
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm sm:hidden transition-opacity"
          onClick={close}
        />
      )}
      <Sidebar isOpen={isOpen} onClose={close} onToggle={toggle} />
      <main className={cn("p-4 pt-20 transition-all duration-300", isOpen ? "sm:ml-64" : "sm:ml-20")}>
        <div className="mx-auto max-w-7xl rounded-lg p-2 sm:p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
