import { useState } from 'react'
import { Calendar, MoreHorizontal, Trash2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatRelativeDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface BacklogTaskCardProps {
  task: Task
  onActivate: (taskId: string, dueDate: string) => void
  onDelete: (taskId: string) => void
}

export function BacklogTaskCard({ task, onActivate, onDelete }: BacklogTaskCardProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dueDate, setDueDate] = useState('')

  function handleActivate() {
    if (dueDate) {
      onActivate(task.task_id, dueDate)
      setShowDatePicker(false)
      setDueDate('')
    }
  }

  return (
    <>
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{task.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Added {formatRelativeDate(task.created_at)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="default"
              className="sm:h-7 sm:text-[0.8rem] sm:px-2.5"
              onClick={() => setShowDatePicker(true)}
            >
              <ArrowRight className="mr-1 h-3.5 w-3.5" />
              Activate
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-10 w-10 sm:h-8 sm:w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(task.task_id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set due date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a due date to activate "{task.title}"
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                Cancel
              </Button>
              <Button onClick={handleActivate} disabled={!dueDate}>
                Activate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
