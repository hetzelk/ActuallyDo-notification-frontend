import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SnoozeDropdown } from './SnoozeDropdown'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { DEBOUNCE_MS } from '@/lib/constants'
import type { Task, UpdateTaskRequest } from '@/lib/types'

interface TaskDetailProps {
  task: Task
  onUpdate: (data: UpdateTaskRequest) => void
  onComplete: (taskId: string) => void
  onSnooze: (taskId: string, days: number) => void
  onDelete: (taskId: string) => void
  isUpdating: boolean
}

export function TaskDetail({
  task,
  onUpdate,
  onComplete,
  onSnooze,
  onDelete,
  isUpdating,
}: TaskDetailProps) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [notify, setNotify] = useState(task.notify)
  const [showSaved, setShowSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from prop changes (e.g. after mutation settles)
  useEffect(() => {
    setTitle(task.title)
    setNotes(task.notes ?? '')
    setDueDate(task.due_date ?? '')
    setNotify(task.notify)
  }, [task.task_id, task.title, task.notes, task.due_date, task.notify])

  const scheduleUpdate = useCallback(
    (data: UpdateTaskRequest) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onUpdate(data)
        setShowSaved(true)
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
      }, DEBOUNCE_MS)
    },
    [onUpdate]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const isCompleted = task.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Saved indicator */}
      <div className="h-5 text-right">
        {isUpdating && (
          <span className="text-xs text-muted-foreground">
            <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {showSaved && !isUpdating && (
          <span className="text-xs text-muted-foreground">Saved</span>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="detail-title">Title</Label>
        <Input
          id="detail-title"
          value={title}
          disabled={isCompleted}
          onChange={(e) => {
            setTitle(e.target.value)
            if (e.target.value.trim()) {
              scheduleUpdate({ title: e.target.value })
            }
          }}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="detail-notes">Notes</Label>
        <textarea
          id="detail-notes"
          value={notes}
          disabled={isCompleted}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add notes..."
          onChange={(e) => {
            setNotes(e.target.value)
            scheduleUpdate({ notes: e.target.value })
          }}
        />
      </div>

      {/* Due date */}
      <div className="space-y-2">
        <Label htmlFor="detail-due-date">Due date</Label>
        <Input
          id="detail-due-date"
          type="date"
          value={dueDate}
          disabled={isCompleted}
          onChange={(e) => {
            setDueDate(e.target.value)
            scheduleUpdate({ due_date: e.target.value })
          }}
        />
      </div>

      {/* Notify toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="detail-notify">Notifications</Label>
        <Switch
          id="detail-notify"
          checked={notify}
          disabled={isCompleted}
          onCheckedChange={(checked) => {
            setNotify(checked)
            scheduleUpdate({ notify: checked })
          }}
        />
      </div>

      {/* Status line */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Status: <span className={cn('capitalize', task.status === 'completed' && 'text-green-600')}>{task.status}</span></p>
        <p>Created: {formatDate(task.created_at)}</p>
        {task.completed_at && <p>Completed: {formatDate(task.completed_at)}</p>}
      </div>

      {/* Actions */}
      {!isCompleted && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button onClick={() => onComplete(task.task_id)}>
            <Check className="mr-1 h-4 w-4" />
            Mark as done
          </Button>
          <SnoozeDropdown onSnooze={(days) => onSnooze(task.task_id, days)} />
          <Button
            variant="destructive"
            onClick={() => onDelete(task.task_id)}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}
