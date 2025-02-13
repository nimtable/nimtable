import { Inter } from "next/font/google"
import { GalleryVerticalEnd } from "lucide-react"
import type React from "react" // Added import for React

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
