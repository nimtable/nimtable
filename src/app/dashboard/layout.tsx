import { ReactNode } from "react"

import { DashboardProvider } from "./OverviewProvider"
export default function layout({ children }: { children: ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>
}
