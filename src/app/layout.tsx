import type React from "react"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import "@/styles/animations.css"
import { RefreshProvider } from "@/contexts/refresh-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RefreshProvider>
              <SidebarProvider>
                <ProtectedRoute>
                  {/* The AppSidebar should only be rendered when the user is authenticated */}
                  <AppSidebar />
                  <Suspense fallback={<></>}>{children}</Suspense>
                </ProtectedRoute>
                <Toaster />
              </SidebarProvider>
            </RefreshProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

