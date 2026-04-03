'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const SidebarContext = React.createContext<{isOpen: boolean; toggle: () => void; close: () => void}>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(prev => !prev), close: () => setIsOpen(false) }}>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme="light" 
        disableTransitionOnChange
        enableColorScheme={false}
      >
        {children}
      </NextThemesProvider>
    </SidebarContext.Provider>
  );
}
