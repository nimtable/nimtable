"use client"

import { useState } from "react"
import { Edit2, Search, Trash2 } from "lucide-react"

import type { User } from "@/lib/client/types.gen"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { Button } from "../ui/button"
import {
  AlertDialog,
  AlertDialogAction,
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

interface UserTableProps {
  users: User[]
  refetch: () => void
  onRemove: (id: number) => void
  onUpdate: (id: number, username: string, roleId: number) => void
}

export function UserTable({ users, onRemove, onUpdate }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number>(
    UserRoleId.VIEWER
  )

  const getRoleId = (role: string) => {
    switch (role) {
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
      onRemove(userToDelete.id)
      setUserToDelete(null)
    }
  }

  const confirmEdit = () => {
    if (userToEdit) {
      onUpdate(userToEdit.id, userToEdit.username, selectedRoleId)
      setUserToEdit(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-normal ${getRoleStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.updatedAt && formatDate(+user.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
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
            <Button variant="outline" onClick={() => setUserToEdit(null)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
