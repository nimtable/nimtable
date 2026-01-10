"use client"

import {
  Code,
  Database,
  Home,
  LayoutGrid,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

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

  const primaryNavItems = [
    {
      title: "Catalogs",
      href: "/data/catalogs",
      icon: Database,
    },
    {
      title: "SQL Query",
      href: "/data/sql-editor",
      icon: Code,
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

  const operationNavItems = [
    {
      title: "Optimize",
      href: "/optimization",
      icon: LayoutGrid,
    },
    {
      title: "Jobs",
      href: "/jobs",
      icon: Calendar,
    },
  ]

  const isOperationsRoute = operationNavItems.some(
    (item) => pathname === item.href
  )
  const [operationsOpen, setOperationsOpen] = useState<boolean>(() => true)

  useEffect(() => {
    if (isOperationsRoute) setOperationsOpen(true)
  }, [isOperationsRoute])

  const isCatalogsRoute =
    pathname === "/data/catalogs" ||
    pathname === "/data/catalog" ||
    pathname.startsWith("/data/catalog/") ||
    pathname.startsWith("/data/catalogs/") ||
    pathname.startsWith("/data/tables") ||
    pathname.startsWith("/data/namespaces")

  const isSqlRoute = pathname === "/data/sql-editor"

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-white">
      {/* Sidebar Header */}
      <div className="h-14 px-4 flex items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/logo_dark.svg"
            alt="Nimtable Logo"
            width={20}
            height={20}
          />
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

        {/* Primary section */}
        <div className="mt-1 px-2">
          {primaryNavItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                item.href === "/data/catalogs"
                  ? isCatalogsRoute
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  : isSqlRoute
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>

        {/* Operations (collapsible) */}
        <div className="mt-4 px-2">
          <button
            type="button"
            onClick={() => setOperationsOpen((prev) => !prev)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide",
              "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            )}
            aria-expanded={operationsOpen}
          >
            <span>Operations</span>
            {operationsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {operationsOpen && (
            <nav className="mt-1 space-y-1">
              {operationNavItems.map((item) => (
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
          )}
        </div>
      </div>

      {/* Feedback Button */}
      <div className="px-2 pb-2">
        <FeedbackButton />
      </div>
    </div>
  )
}
