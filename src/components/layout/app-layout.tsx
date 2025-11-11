import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { GlobalHeader } from './global-header';
import { AppsDataProvider } from '@/contexts/apps-data-context';
import { useAuth } from '@/contexts/auth-context';
import clsx from 'clsx';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  // Collapse the sidebar by default on the landing page, open elsewhere when authenticated.
  // Remount provider on auth state change so defaultOpen is reapplied.
  const sidebarKey = `sidebar-${Boolean(user)}`;
  const defaultOpen = pathname !== '/' && Boolean(user);
  return (
    <AppsDataProvider>
      <SidebarProvider 
        key={sidebarKey}
        defaultOpen={defaultOpen}
        style={{
          "--sidebar-width": "320px",
          "--sidebar-width-mobile": "280px",
          "--sidebar-width-icon": "52px"
        } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className={clsx("bg-bg-3 flex flex-col h-screen relative", pathname !== "/" && "overflow-hidden")}>
          {pathname !== "/" && <GlobalHeader />}
          <div className={clsx("flex-1 bg-bg-3", pathname !== "/" && "min-h-0 overflow-auto")}>
            {children || <Outlet />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AppsDataProvider>
  );
}
