"use client"

import type React from "react"

// import { TableDetail } from "@/components/table-detail"
// import { CopilotPanel } from "@/components/copilot-panel"
import { Sidebar } from "../sidebar"
import {
  Bot,
  ChevronDown,
  Database,
  LogOut,
  Settings,
  UserIcon,
  Users,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useDemoMode } from "@/contexts/demo-mode-context"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export function DashboardLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const { demoMode, disable } = useDemoMode()
  const searchParams = useSearchParams()
  const catalogParam = searchParams.get("catalog")

  const username = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.username || ""

  return (
    <div className="relative flex h-screen max-h-screen overflow-hidden w-full bg-gray-50">
      {/* Single, continuous top divider line to avoid 1px seams between Sidebar + Header */}
      <div className="pointer-events-none absolute left-0 right-0 top-14 border-b border-border" />
      <Sidebar />
      <div className="flex-1 h-full overflow-hidden">
        <header className="bg-card">
          <div className="flex items-center justify-between px-6 h-14 bg-card">
            <h1 className="text-sm font-normal text-card-foreground">
              {title}
            </h1>
            <div className="flex items-center gap-4">
              {demoMode && (
                <button
                  className="flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm ring-1 ring-primary/30 transition hover:bg-primary hover:shadow-md"
                  onClick={() => {
                    disable()
                    // hard refresh to reload real data
                    window.location.reload()
                  }}
                >
                  <span>Exit demo mode</span>
                </button>
              )}

              {catalogParam && (
                <Link
                  href={`/data/catalog?catalog=${encodeURIComponent(catalogParam)}`}
                  className="flex items-center gap-2 rounded-md p-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  title="Open catalog details"
                >
                  <Database className="w-4 h-4" />
                  <span className="max-w-[220px] truncate">{catalogParam}</span>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-gray-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <UserIcon className="w-4 h-4" />
                    <span> {username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/settings/account">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/settings/ai">
                      <Bot className="mr-2 h-4 w-4" />
                      <span>AI Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/users">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto h-[calc(100vh-56px)]">
          {children}
        </main>
      </div>

      {/* Table Detail Panel */}
      {/* {selectedTable && <TableDetail tableName={selectedTable} onClose={() => setSelectedTable(null)} />} */}

      {/* Copilot Panel */}
      {/* <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} selectedTable={selectedTable} /> */}
    </div>
  )
}
