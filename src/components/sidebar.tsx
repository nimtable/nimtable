"use client"

import {
  Code,
  Database,
  Home,
  LayoutGrid,
  Users,
  Calendar,
  Bot,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { FeedbackButton } from "@/components/feedback-button"

export function Sidebar() {
  const pathname = usePathname()

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
      icon: Database,
    },
    // {
    //   title: "Namespaces",
    //   href: "/data/namespaces",
    //   icon: FolderOpen,
    // },
    // {
    //   title: "Tables",
    //   href: "/data/tables",
    //   icon: Database,
    // },
  ]

  const otherNavItems = [
    {
      title: "Optimization",
      href: "/optimization",
      icon: LayoutGrid,
    },
    {
      title: "Tasks",
      href: "/jobs",
      icon: Calendar,
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
    {
      title: "AI Settings",
      href: "/settings/ai",
      icon: Bot,
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
        <div className="mt-1 px-2">
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
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>

        <div className="mt-1">
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

      {/* Feedback Button */}
      <div className="px-2 pb-2">
        <FeedbackButton />
      </div>
    </div>
  )
}
