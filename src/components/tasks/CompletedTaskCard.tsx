import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface CompletedTaskCardProps {
  task: Task
  onDuplicate?: (task: Task) => void
}

export function CompletedTaskCard({ task, onDuplicate }: CompletedTaskCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setExpanded(!expanded)
      }}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-muted-foreground line-through">
            {task.title}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Completed {task.completed_at ? formatDate(task.completed_at) : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {onDuplicate && (
            <button
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onDuplicate(task) }}
              aria-label={`Duplicate "${task.title}"`}
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-8 space-y-1 text-sm text-muted-foreground">
          {task.due_date && (
            <p>Due date: {formatDate(task.due_date)}</p>
          )}
          <p>Created: {formatDate(task.created_at)}</p>
          {task.notes && (
            <p className="whitespace-pre-wrap">{task.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
