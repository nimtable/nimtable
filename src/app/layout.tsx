/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nimtable",
  description: "The Control Plane for Apache Iceberg™",
  icons: "/nimtable_icon.png",
};


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

