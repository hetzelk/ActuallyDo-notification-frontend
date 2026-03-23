import { TaskCard } from './TaskCard'
import { getTaskGroup } from '@/lib/utils'
import type { Task, TaskGroup } from '@/lib/types'

interface TaskListProps {
  tasks: Task[]
  onComplete: (taskId: string) => void
  onSnooze: (taskId: string, days: number) => void
  isPro?: boolean
}

const GROUP_ORDER: TaskGroup[] = ['overdue', 'due-today', 'snoozed', 'upcoming']

const GROUP_LABELS: Record<TaskGroup, string> = {
  overdue: 'Overdue',
  'due-today': 'Due Today',
  snoozed: 'Snoozed',
  upcoming: 'Upcoming',
}

export function TaskList({ tasks, onComplete, onSnooze, isPro }: TaskListProps) {
  const grouped = tasks.reduce<Record<TaskGroup, Task[]>>(
    (acc, task) => {
      const group = getTaskGroup(task)
      acc[group].push(task)
      return acc
    },
    { overdue: [], 'due-today': [], snoozed: [], upcoming: [] }
  )

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((group) => {
        const groupTasks = grouped[group]
        if (groupTasks.length === 0) return null

        return (
          <div key={group}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {GROUP_LABELS[group]}
            </h3>
            <div className="space-y-2">
              {groupTasks.map((task) => (
                <TaskCard
                  key={task.task_id}
                  task={task}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  isPro={isPro}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
