"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Database,
  LayoutGrid,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  FolderTree,
  Layers,
  FolderOpen,
  PackageIcon as PipelineIcon,
  ServerIcon,
  TableIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function Sidebar() {
  const pathname = usePathname()
  const [dataExpanded, setDataExpanded] = useState(true)
  const [ingestionExpanded, setIngestionExpanded] = useState(true)

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
      href: "/catalogs",
      icon: FolderTree,
    },
    {
      title: "Namespaces",
      href: "/namespaces",
      icon: FolderOpen,
    },
    {
      title: "Tables",
      href: "/tables",
      icon: Database,
    },
  ]

  const ingestionNavItems = [
    {
      title: "Pipelines",
      href: "/ingestion/pipelines",
      icon: PipelineIcon,
    },
    {
      title: "Sources",
      href: "/ingestion/sources",
      icon: ServerIcon,
    },
    {
      title: "Destinations",
      href: "/ingestion/destinations",
      icon: TableIcon,
    },
  ]

  const otherNavItems = [
    {
      title: "Optimization",
      href: "/optimization",
      icon: LayoutGrid,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
  ]

  const secondaryNavItems = [
    {
      title: "Team",
      href: "/team",
      icon: Users,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="font-semibold text-lg">Nimtable</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="px-2 space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Data Section with Collapsible */}
        <div className="mt-6">
          <Collapsible open={dataExpanded} onOpenChange={setDataExpanded} className="px-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-50">
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
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {dataNavItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Ingestion Section with Collapsible */}
        <div className="mt-6">
          <Collapsible open={ingestionExpanded} onOpenChange={setIngestionExpanded} className="px-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <PipelineIcon className="h-5 w-5" />
                <span>Ingestion</span>
              </div>
              {ingestionExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {ingestionNavItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
          <nav className="px-2 space-y-1">
            {otherNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                  pathname === item.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8">
          <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Other</div>
          <nav className="mt-2 px-2 space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                  pathname === item.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">john@example.com</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  )
}
