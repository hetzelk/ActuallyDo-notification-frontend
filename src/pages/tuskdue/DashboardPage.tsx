import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ListTodo, Inbox, CheckSquare } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskList } from '@/components/tasks/TaskList'
import { BacklogTaskCard } from '@/components/tasks/BacklogTaskCard'
import { CompletedTaskCard } from '@/components/tasks/CompletedTaskCard'
import { AddTaskForm } from '@/components/tasks/AddTaskForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { UpgradePrompt } from '@/components/shared/UpgradePrompt'
import { ProTeaser } from '@/components/tasks/ProTeaser'
import { useTasks, useCompleteTask, useSnoozeTask, useDeleteTask } from '@/hooks/use-tasks'
import { useTier } from '@/hooks/use-tier'
import { createTask, activateTask } from '@/api/tuskdue'
import { useToast } from '@/hooks/use-toast'
import { ApiRequestError } from '@/api/client'
import { FREE_TIER_LIMITS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CreateTaskRequest } from '@/lib/types'

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('active')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const activeTasks = useTasks('active')
  const backlogTasks = useTasks('backlog')
  const completedTasks = useTasks('completed')
  const { isFree, isPro } = useTier('tuskdue')

  const completeTaskMutation = useCompleteTask()
  const snoozeTaskMutation = useSnoozeTask()
  const deleteTaskMutation = useDeleteTask()

  const queryClient = useQueryClient()
  const toast = useToast()

  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(data),
    onSuccess: (_result, variables) => {
      toast.success('Task created')
      setShowUpgradePrompt(false)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (variables.due_date) {
        setActiveTab('active')
      } else {
        setActiveTab('backlog')
      }
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 403) {
        setShowUpgradePrompt(true)
      } else {
        toast.error('Failed to create task')
      }
    },
  })

  const activateTaskMutation = useMutation({
    mutationFn: ({ taskId, dueDate }: { taskId: string; dueDate: string }) =>
      activateTask(taskId, { due_date: dueDate }),
    onSuccess: () => {
      toast.success('Task activated')
      setShowUpgradePrompt(false)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setActiveTab('active')
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 403) {
        setShowUpgradePrompt(true)
      } else {
        toast.error('Failed to activate task')
      }
    },
  })

  const activeCount = activeTasks.data?.data.count ?? 0
  const backlogCount = backlogTasks.data?.data.count ?? 0
  const maxActive = FREE_TIER_LIMITS.tuskdue.maxActiveTasks
  const nearLimit = isFree && activeCount >= maxActive - 2 // warning at 13+

  function activeTabLabel() {
    if (isFree && activeCount > 0) {
      return `Active (${activeCount} of ${maxActive})`
    }
    if (activeCount > 0) {
      return `Active (${activeCount})`
    }
    return 'Active'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">TuskDue</h1>
        <Button onClick={() => setShowAddTask(true)} className="hidden sm:flex">
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>

      {showUpgradePrompt && (
        <div className="mb-4">
          <UpgradePrompt
            message="You've hit the free task limit"
            description="Upgrade to Pro for unlimited active tasks, custom snooze durations, and more."
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger
            value="active"
            className={cn('flex-1', nearLimit && 'text-amber-600 dark:text-amber-400')}
          >
            {activeTabLabel()}
          </TabsTrigger>
          <TabsTrigger value="backlog" className="flex-1">
            Backlog{backlogCount > 0 ? ` (${backlogCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeTasks.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : activeTasks.data?.data.tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              heading="No active tasks"
              description="Add your first task to get started."
              actionLabel="+ Add task"
              onAction={() => setShowAddTask(true)}
            />
          ) : (
            <>
              <TaskList
                tasks={activeTasks.data?.data.tasks ?? []}
                onComplete={(taskId) => completeTaskMutation.mutate(taskId)}
                onSnooze={(taskId, days) => snoozeTaskMutation.mutate({ taskId, days })}
                isPro={isPro}
              />
              {isFree && <ProTeaser />}
            </>
          )}
        </TabsContent>

        <TabsContent value="backlog" className="mt-4">
          {backlogTasks.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : backlogTasks.data?.data.tasks.length === 0 ? (
            <EmptyState
              icon={Inbox}
              heading="No backlog tasks"
              description="Tasks without a due date will appear here."
              actionLabel="+ Add task"
              onAction={() => setShowAddTask(true)}
            />
          ) : (
            <div className="space-y-2">
              {backlogTasks.data?.data.tasks.map((task) => (
                <BacklogTaskCard
                  key={task.task_id}
                  task={task}
                  onActivate={(taskId, dueDate) =>
                    activateTaskMutation.mutate({ taskId, dueDate })
                  }
                  onDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedTasks.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : completedTasks.data?.data.tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              heading="No completed tasks"
              description="Tasks you complete will appear here."
            />
          ) : (
            <div className="space-y-2">
              {completedTasks.data?.data.tasks.map((task) => (
                <CompletedTaskCard key={task.task_id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile FAB */}
      <Button
        onClick={() => setShowAddTask(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddTaskForm
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={async (data) => {
          await createTaskMutation.mutateAsync(data)
        }}
      />
    </div>
  )
}
