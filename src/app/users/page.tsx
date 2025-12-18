import { UserManagement } from "@/components/users/user-management"

export default function Users() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <UserManagement />
    </div>
  )
}
