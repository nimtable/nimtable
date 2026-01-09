import { ReactNode } from "react"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function layout({ children }: { children: ReactNode }) {
  // Each data sub-page already renders its own in-page header. Keep the shell header neutral.
  return <DashboardLayout title="">{children}</DashboardLayout>
}
