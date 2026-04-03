'use client';

import { cn } from '../../../lib/utils';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/components/providers';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();

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
