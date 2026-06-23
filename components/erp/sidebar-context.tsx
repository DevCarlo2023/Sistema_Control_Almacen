'use client';

import * as React from 'react';
import { createContext, useContext, useState } from 'react';

interface SidebarContextType {
  open: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  // Keep legacy compat (collapsed not used anymore but avoid breaking imports)
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  open: false,
  toggleMobile: () => {},
  closeMobile: () => {},
  collapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggleMobile = () => setOpen(prev => !prev);
  const closeMobile = () => setOpen(false);

  return (
    <SidebarContext.Provider value={{
      open,
      toggleMobile,
      closeMobile,
      // legacy
      collapsed: false,
      toggle: toggleMobile,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
