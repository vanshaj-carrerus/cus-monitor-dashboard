'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth-context';

const SidebarContext = React.createContext<{ isOpen: boolean; toggle: () => void; close: () => void }>({
  isOpen: false,
  toggle: () => { },
  close: () => { },
});

export const useSidebar = () => React.useContext(SidebarContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Use useEffect to ensure the component is mounted on the client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(prev => !prev), close: () => setIsOpen(false) }}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false} // Try setting this to false if not needed
          disableTransitionOnChange
        >
          {/* Only render children that depend on theme after mounting to avoid hydration mismatch */}
          {children}
        </NextThemesProvider>
      </SidebarContext.Provider>
    </AuthProvider>
  );
}