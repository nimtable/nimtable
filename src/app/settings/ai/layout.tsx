import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function AISettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout title="AI Settings">{children}</DashboardLayout>
}
