import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarRefreshContext } from '@/contexts/sidebar-refresh';
import React from 'react';

const CatalogLayout = () => {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  const triggerRefresh = React.useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <SidebarRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      <SidebarProvider>
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </SidebarRefreshContext.Provider>
  );
};

export default CatalogLayout;
