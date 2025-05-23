import { ReactNode } from "react"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { DashboardProvider } from "./OverviewProvider"
export default function layout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      <DashboardProvider>{children}</DashboardProvider>
    </DashboardLayout>
  )
}
