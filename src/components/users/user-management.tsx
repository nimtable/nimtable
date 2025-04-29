"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle } from "lucide-react"

import { createUser, getUsers } from "@/lib/client/sdk.gen"
import type { UserCreate } from "@/lib/client/types.gen"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { AddUserDialog } from "@/components/users/add-user-dialog"
import { UserTable } from "@/components/users/user-table"

export function UserManagement() {
  const { toast } = useToast()
  const { data: users, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers().then((res) => res.data),
  })

  const [open, setOpen] = useState(false)

  const addUser = (user: UserCreate) => {
    createUser({
      body: user,
    })
      .then(() => {
        refetch()
        setOpen(false)
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.message,
        })
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <UserTable users={users ?? []} refetch={refetch} />

      <AddUserDialog open={open} onOpenChange={setOpen} onAddUser={addUser} />
    </div>
  )
}
