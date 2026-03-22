import { CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface CompletedTaskCardProps {
  task: Task
}

export function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  return (
    <div className="border border-border rounded-lg p-4">
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
      </div>
    </div>
  )
}
