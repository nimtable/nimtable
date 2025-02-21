import { GalleryVerticalEnd } from "lucide-react"
import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"

interface RootLayoutProps {
  children: ReactNode
}

// Remove the default export and html/body tags since this is now a React component
const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
      <Toaster />
    </div>
  );
}

export default RootLayout;
