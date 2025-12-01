import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function OptimizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout title="Optimization">{children}</DashboardLayout>
}
