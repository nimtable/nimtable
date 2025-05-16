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

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home, Search, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarInset } from "@/components/ui/sidebar"
import Image from "next/image"

export default function NotFound() {
  const router = useRouter()

  return (
    <SidebarInset className="bg-gradient-to-b from-background to-muted/20">
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-50 dark:bg-blue-950/20 opacity-50"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <div className="relative mx-auto max-w-5xl p-4">
            <div className="flex items-center justify-center">
              <Image
                src="/square-light.svg"
                alt="Nimtable Logo"
                width={128}
                height={128}
                className="h-32 w-auto"
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="mx-auto max-w-3xl flex flex-col items-center justify-center h-full py-12">
            <div className="relative mb-8">
              <div className="text-[10rem] font-bold text-blue-600/10 leading-none select-none">
                404
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-3 text-center">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl text-center mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
              <div className="bg-white dark:bg-gray-950 rounded-lg border p-6 shadow-sm flex flex-col items-center text-center">
                <Home className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="font-medium mb-2">Return Home</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Go back to the main dashboard to select a catalog
                </p>
                <Button className="mt-auto" onClick={() => router.push("/")}>
                  Go to Dashboard
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-950 rounded-lg border p-6 shadow-sm flex flex-col items-center text-center">
                <Search className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="font-medium mb-2">Browse Catalogs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a catalog from the sidebar to browse tables
                </p>
                <Button
                  variant="outline"
                  className="mt-auto"
                  onClick={() => {
                    // This will just focus on the sidebar dropdown
                    const dropdown = document.querySelector(
                      "[data-radix-select-trigger]"
                    )
                    if (dropdown instanceof HTMLElement) {
                      dropdown.focus()
                    }
                  }}
                >
                  Select Catalog
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-background py-5 px-8">
          <div className="mx-auto max-w-5xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/horizontal-light.svg"
                alt="Nimtable Logo"
                width={120}
                height={24}
                className="h-10 w-auto -mr-5 -mt-[2px]"
              />
              <p className="text-sm text-muted-foreground">
                v1.0 — Managed Iceberg Made Simple
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm gap-1.5 h-8 hover:bg-muted/80"
                asChild
              >
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </SidebarInset>
  )
}
