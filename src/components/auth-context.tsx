'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  role: string;
  managerProfile: {
    managedDepartments: unknown[];
    managedLocations: unknown[];
  } | null;
};

const AuthContext = React.createContext<{
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export const useAuth = () => React.useContext(AuthContext);

export function isMemberRole(role: string) {
  return role === 'common' || role === 'common_compliance';
}

function memberCanAccess(pathname: string) {
  return (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/reports/time-tracker') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = /^\/(login|forgot-password|reset-password|accept-invite)(\/|$)/;
  const isPublic = pathname === '/' ? false : publicPaths.test(pathname || '');

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.success) setUser(data.user);
      else setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void (async () => {
      if (isPublic) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [isPublic, refresh, pathname]);

  React.useEffect(() => {
    if (loading) return;
    if (user && pathname?.startsWith('/login')) {
      router.replace('/');
      return;
    }
    if (isPublic) return;
    if (!user) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/login?next=${next}`);
      return;
    }
    if (isMemberRole(user.role) && pathname && !memberCanAccess(pathname)) {
      router.replace('/reports/time-tracker');
      return;
    }
    if (
      user.role !== 'admin' &&
      user.role !== 'admin_compliance' &&
      pathname &&
      (pathname.startsWith('/my-team/managers') ||
        pathname.startsWith('/my-team/admins') ||
        pathname.startsWith('/security'))
    ) {
      router.replace(pathname.startsWith('/security') ? '/' : '/my-team/members');
    }
  }, [user, loading, pathname, router, isPublic]);

  const logout = React.useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
