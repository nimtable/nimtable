import { GalleryVerticalEnd } from "lucide-react"
import type React from "react"
import { useLocation } from "react-router-dom"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface RootLayoutProps {
  children: React.ReactNode
}

// Remove the default export and html/body tags since this is now a React component
const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Parse the catalog name from the URL
  const catalogName = location.pathname.split('/catalog/')[1];

  return (
    <div className="flex min-h-screen flex-col">
      <SidebarProvider>
        <div className="flex flex-1">
          <AppSidebar selectedCatalog={catalogName} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default RootLayout;
