"use client"

import {
  ChevronDown,
  ChevronRight,
  Code,
  Database,
  FolderOpen,
  FolderTree,
  Home,
  Layers,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const [dataExpanded, setDataExpanded] = useState(true)
  const { user, logout } = useAuth()

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
  ]

  const dataNavItems = [
    {
      title: "Catalogs",
      href: "/data/catalogs",
      icon: FolderTree,
    },
    {
      title: "Namespaces",
      href: "/data/namespaces",
      icon: FolderOpen,
    },
    {
      title: "Tables",
      href: "/data/tables",
      icon: Database,
    },
  ]

  const otherNavItems = [
    {
      title: "Optimization",
      href: "/optimization",
      icon: LayoutGrid,
    },
    {
      title: "SQL Query",
      href: "/data/sql-editor",
      icon: Code,
    },
    {
      title: "Users",
      href: "/users",
      icon: Users,
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Sidebar Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 font-bold text-white">
            N
          </div>
          <span className="text-lg font-semibold">Nimtable</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {mainNavItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Data Section with Collapsible */}
        <div className="mt-6">
          <Collapsible
            open={dataExpanded}
            onOpenChange={setDataExpanded}
            className="px-2"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <span>Data</span>
              </div>
              {dataExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-1 pl-4">
              {dataNavItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-6">
          <nav className="space-y-1 px-2">
            {otherNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* User Profile */}
      <div className="relative border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <span className="text-sm font-medium">
                {user?.username.charAt(0)}
              </span>
            </div>
            <div className="w-36 text-left">
              <p className="truncate text-sm font-medium">{user?.username}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
  )
}
