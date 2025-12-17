"use client"

import { useState } from "react"
import { Edit2, Trash2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { Button } from "../ui/button"
import { LoadingButton } from "../ui/loading-button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserRoleId } from "./type"
import { deleteUser, updateUser, User } from "@/lib/acc-api/client"
import { useToast } from "@/hooks/use-toast"

interface UserTableProps {
  users: User[]
  currentUser?: User
  refetch: () => void
  loading?: boolean
  searchTerm?: string
}

export function UserTable({
  users,
  currentUser,
  refetch,
  loading = false,
  searchTerm = "",
}: UserTableProps) {
  const { toast } = useToast()
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number>(
    UserRoleId.VIEWER
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getRoleId = (role: string) => {
    switch (role) {
      case "superadmin":
        return UserRoleId.SUPERADMIN
      case "admin":
        return UserRoleId.ADMIN
      case "editor":
        return UserRoleId.EDITOR
      default:
        return UserRoleId.VIEWER
    }
  }

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700"
      case "editor":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
  }

  const handleEdit = (user: User) => {
    setUserToEdit(user)
    setSelectedRoleId(getRoleId(user.role))
  }

  const confirmDelete = () => {
    if (userToDelete) {
      setIsDeleting(true)
      deleteUser({
        path: {
          userId: userToDelete.id,
        },
      })
        .then(() => {
          refetch()
          toast({
            title: "User removed",
            description: "The user has been removed successfully",
          })
          setUserToDelete(null)
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: "User removal failed",
            description: err.error,
          })
        })
        .finally(() => {
          setIsDeleting(false)
        })
    }
  }

  const confirmEdit = () => {
    if (userToEdit) {
      setIsEditing(true)
      updateUser({
        path: {
          userId: userToEdit.id,
        },
        body: {
          roleId: selectedRoleId,
        },
      })
        .then(() => {
          refetch()
          toast({
            title: "User updated",
            description: "The user has been updated successfully",
          })
          setUserToEdit(null)
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: "User update failed",
            description: err.error,
          })
        })
        .finally(() => {
          setIsEditing(false)
        })
    }
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-table-header border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Last Modified
              </th>
              <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {[1, 2, 3, 4, 5].map((index) => (
              <tr key={index} className="hover:bg-table-row-hover">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-5 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {filteredUsers.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No users found</div>
      ) : (
        <table className="w-full min-w-[600px]">
          <thead className="bg-table-header border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Last Modified
              </th>
              <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="group hover:bg-table-row-hover transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-normal text-card-foreground">
                    {user.username}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-normal ${getRoleStyle(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {user.updatedAt &&
                    formatDate(new Date(user.updatedAt).getTime())}
                </td>
                {(currentUser?.role === "superadmin" ||
                  currentUser?.role === "admin") &&
                user.role !== "superadmin" &&
                user.id !== currentUser?.id ? (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 text-primary hover:!text-primary hover:bg-muted/50"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        className="h-8 w-8 text-primary hover:!text-primary hover:bg-muted/50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </td>
                ) : (
                  <td className="px-6 py-4 whitespace-nowrap"></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete user {userToDelete?.username}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <LoadingButton
              onClick={confirmDelete}
              variant="destructive"
              loading={isDeleting}
              loadingText="Deleting..."
            >
              Delete
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!userToEdit} onOpenChange={() => setUserToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for user {userToEdit?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedRoleId.toString()}
              onValueChange={(value) => setSelectedRoleId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRoleId.ADMIN.toString()}>
                  Admin
                </SelectItem>
                <SelectItem value={UserRoleId.EDITOR.toString()}>
                  Editor
                </SelectItem>
                <SelectItem value={UserRoleId.VIEWER.toString()}>
                  Viewer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToEdit(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={confirmEdit}
              loading={isEditing}
              loadingText="Saving..."
            >
              Save changes
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
