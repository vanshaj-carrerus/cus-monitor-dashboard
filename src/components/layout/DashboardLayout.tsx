'use client';

import { cn } from '../../../lib/utils';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/components/providers';
import { useAuth } from '@/components/auth-context';
import { Loader2 } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { close } = useSidebar();
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
      <Navbar onMenuClick={() => undefined} />
      <Sidebar role={user.role} />
      <main className="p-4 pt-20 transition-all duration-300 sm:ml-64">
        <div className="mx-auto max-w-7xl rounded-lg p-2 sm:p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
