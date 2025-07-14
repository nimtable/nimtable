"use client"

import { useQuery } from "@tanstack/react-query"
import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { AddUserDialog } from "@/components/users/add-user-dialog"
import { getUsers } from "@/lib/acc-api/client/sdk.gen"
import { UserTable } from "@/components/users/user-table"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { PermissionGuard } from "@/components/shared/permission-guard"
export function UserManagement() {
  const { user } = useAuth()

  const { data: users, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers().then((res) => res.data),
  })

  const [open, setOpen] = useState(false)

  const addUser = () => {
    refetch()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="mb-2 text-3xl font-semibold">Users</h2>
        <PermissionGuard allowedRoles={["admin", "superadmin"]}>
          <Button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      <UserTable currentUser={user} users={users ?? []} refetch={refetch} />

      <AddUserDialog open={open} onOpenChange={setOpen} onAddUser={addUser} />
    </div>
  )
}
