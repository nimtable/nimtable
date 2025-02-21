import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

const CatalogLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CatalogLayout;
