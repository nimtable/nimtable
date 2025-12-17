"use client"

import type React from "react"

// import { TableDetail } from "@/components/table-detail"
// import { CopilotPanel } from "@/components/copilot-panel"
import { Sidebar } from "../sidebar"
import { ChevronDown, LogOut, Settings, UserIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export function DashboardLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()

  const username = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user?.username || ""

  return (
    <div className="flex h-screen max-h-screen overflow-hidden w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 h-full overflow-hidden">
        <header className="bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 h-14 text-[rgba(250,250,250,1)] bg-[rgba(250,250,250,1)]">
            <h1 className="text-sm font-normal text-card-foreground">
              {title}
            </h1>
            <div className="flex items-center gap-4">
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
