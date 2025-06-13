import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function AccountSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
