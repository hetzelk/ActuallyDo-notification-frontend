import { useNavigate } from 'react-router-dom'
import { Circle, Check, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SnoozeDropdown } from './SnoozeDropdown'
import { cn } from '@/lib/utils'
import { getDueLabel, getTaskGroup } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onComplete: (taskId: string) => void
  onSnooze: (taskId: string, days: number) => void
  isPro?: boolean
}

export function TaskCard({ task, onComplete, onSnooze, isPro }: TaskCardProps) {
  const navigate = useNavigate()
  const group = getTaskGroup(task)
  const dueLabel = getDueLabel(task)
  const isSnoozed = task.status === 'snoozed'

  return (
    <div
      className={cn(
        'border border-border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors',
        isSnoozed && 'opacity-60'
      )}
      onClick={() => navigate(`/nagme/tasks/${task.task_id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/nagme/tasks/${task.task_id}`)
      }}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-0.5 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onComplete(task.task_id)
          }}
          aria-label={`Complete "${task.title}"`}
        >
          {isSnoozed ? (
            <Moon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{task.title}</p>
          <p
            className={cn(
              'text-sm mt-0.5',
              group === 'overdue' && 'text-destructive',
              group === 'snoozed' && 'text-muted-foreground',
              group !== 'overdue' && group !== 'snoozed' && 'text-muted-foreground'
            )}
          >
            {dueLabel}
            {task.notes && !isSnoozed && (
              <span className="text-muted-foreground"> · {task.notes.slice(0, 60)}</span>
            )}
          </p>
        </div>
      </div>

      {!isSnoozed && (
        <div className="flex gap-2 mt-3 ml-8" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onComplete(task.task_id)}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Done
          </Button>
          <SnoozeDropdown
            onSnooze={(days) => onSnooze(task.task_id, days)}
            isPro={isPro}
          />
        </div>
      )}
    </div>
  )
}
