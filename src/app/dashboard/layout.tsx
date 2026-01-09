import { ReactNode } from "react"

import DashboardClientLayout from "./DashboardClientLayout"

export default function layout({ children }: { children: ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}
