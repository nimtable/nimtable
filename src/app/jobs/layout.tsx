import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout title="Jobs">{children}</DashboardLayout>
}
