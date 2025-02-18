import { GalleryVerticalEnd } from "lucide-react"
import type React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface RootLayoutProps {
  children: React.ReactNode
}

// Remove the default export and html/body tags since this is now a React component
const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 bg-[#020817] px-6 text-white">
        <div className="flex items-center gap-2">
          <GalleryVerticalEnd className="h-8 w-8" />
          <span className="text-lg font-semibold">Iceberg Catalog</span>
        </div>
      </header>
      <SidebarProvider>
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default RootLayout;
