import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/toaster"

interface RootLayoutProps {
  children: ReactNode
}

// Remove the default export and html/body tags since this is now a React component
const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="h-full">
      {children}
      <Toaster />
    </div>
  );
}

export default RootLayout;
