'use client';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/components/auth-context';
import { Loader2 } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar role={user.role} />
      <main className="custom-scrollbar min-h-screen p-4 pt-20 transition-all duration-300 sm:ml-64 sm:p-6">
        <div className="mx-auto max-w-7xl pt-20">{children}</div>
      </main>
    </div>
  );
}
