"use client"

import { usePathname } from "next/navigation"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"

import { DashboardProvider } from "./OverviewProvider"

function getDashboardTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname.startsWith("/dashboard/activity")) return "Activity Log"
  return "Dashboard"
}

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const title = getDashboardTitle(pathname)

  return (
    <DashboardProvider>
      <DashboardLayout title={title}>{children}</DashboardLayout>
    </DashboardProvider>
  )
}
