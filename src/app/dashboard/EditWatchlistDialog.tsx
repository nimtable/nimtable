"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Table {
  id: string
  name: string
  status: string
  lastModified: string
}

interface EditWatchlistDialogProps {
  tables: Table[]
  onSave: (tables: Table[]) => void
}

export function EditWatchlistDialog(
  { tables, onSave }: EditWatchlistDialogProps
) {
  const [open, setOpen] = useState(false)
  const [editedTables, setEditedTables] = useState<Table[]>(tables)

  const handleSave = () => {
    onSave(editedTables)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Watchlist</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* {editedTables.map((table: Table, index: number) => (
            <div key={table.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`name-${index}`} className="text-right">
                Name
              </Label>
              <Input
                id={`name-${index}`}
                value={table.name}
                onChange={(e) => {
                  const newTables = [...editedTables]
                  newTables[index] = { ...table, name: e.target.value }
                  setEditedTables(newTables)
                }}
                className="col-span-3"
              />
            </div>
          ))} */}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
