"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Users as UsersIcon } from "lucide-react"
import { useState } from "react"

import { AddUserDialog } from "@/components/users/add-user-dialog"
import { getUsers } from "@/lib/acc-api/client/sdk.gen"
import { UserTable } from "@/components/users/user-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { PermissionGuard } from "@/components/shared/permission-guard"

export function UserManagement() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")

  const {
    data: users,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers().then((res) => res.data),
  })

  const [open, setOpen] = useState(false)

  const addUser = () => {
    refetch()
    setOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Search and actions bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-10 bg-card border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <PermissionGuard allowedRoles={["admin", "superadmin"]}>
            <Button
              onClick={() => setOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-card-foreground" />
            <h2 className="text-m font-normal text-card-foreground">
              Users (
              {searchTerm
                ? users?.filter((user) =>
                    user.username
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  ).length || 0
                : users?.length || 0}
              )
            </h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <UserTable
            currentUser={user}
            users={users ?? []}
            refetch={refetch}
            loading={isLoading}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      <AddUserDialog open={open} onOpenChange={setOpen} onAddUser={addUser} />
    </div>
  )
}
