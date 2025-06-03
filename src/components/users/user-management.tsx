"use client"

import { useQuery } from "@tanstack/react-query"
import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { AddUserDialog } from "@/components/users/add-user-dialog"
import { deleteUser, getUsers } from "@/lib/client/sdk.gen"
import { UserTable } from "@/components/users/user-table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function UserManagement() {
  const { toast } = useToast()

  const { data: users, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers().then((res) => res.data),
  })

  const [open, setOpen] = useState(false)

  const addUser = () => {
    refetch()
    setOpen(false)
  }

  const removeUser = (id: number) => {
    deleteUser({
      path: {
        userId: id,
      },
    })
      .then(() => {
        refetch()
        toast({
          title: "User removed",
          description: "The user has been removed successfully",
        })
      })
      .catch((err) => {
        console.error(err)
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="mb-2 text-3xl font-semibold">Users</h2>
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <UserTable users={users ?? []} refetch={refetch} onRemove={removeUser} />

      <AddUserDialog open={open} onOpenChange={setOpen} onAddUser={addUser} />
    </div>
  )
}
