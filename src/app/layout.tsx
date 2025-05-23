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

import { Inter } from "next/font/google"
import type React from "react"

import "@/styles/animations.css"
import "@/styles/globals.css"

import { RefreshProvider } from "@/contexts/refresh-context"
import { AuthProvider } from "@/contexts/auth-context"
import type { Metadata } from "next"
import { Suspense } from "react"

import { ReactQueryProvider } from "@/components/Providers/ReactQuery"
import { ProtectedRoute } from "@/components/protected-route"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nimtable",
  description: "The Control Plane for Apache Iceberg™",
  icons: "/nimtable_icon.png",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider delayDuration={300}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReactQueryProvider>
              <AuthProvider>
                <RefreshProvider>
                  <SidebarProvider>
                    <ProtectedRoute>
                      {/* The AppSidebar should only be rendered when the user is authenticated */}
                      {/* <AppSidebar /> */}
                      <Suspense fallback={<></>}>{children}</Suspense>
                    </ProtectedRoute>
                    <Toaster />
                  </SidebarProvider>
                </RefreshProvider>
              </AuthProvider>
            </ReactQueryProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
