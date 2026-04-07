'use client';

import { cn } from '../../../lib/utils';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/components/providers';
import { useAuth } from '@/components/auth-context';
import { Loader2 } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle, close } = useSidebar();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#5E35B1]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar isOpen={isOpen} onMenuClick={toggle} />
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm sm:hidden transition-opacity"
          onClick={close}
        />
      )}
      <Sidebar isOpen={isOpen} onClose={close} onToggle={toggle} role={user.role} />
      <main className={cn("p-4 pt-20 transition-all duration-300", isOpen ? "sm:ml-64" : "sm:ml-20")}>
        <div className="mx-auto max-w-7xl rounded-lg p-2 sm:p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
