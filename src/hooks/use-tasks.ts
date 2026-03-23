import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTasks, completeTask, snoozeTask, deleteTask } from '@/api/tuskdue'
import type { Task, TaskListResponse } from '@/lib/types'
import { useToast } from './use-toast'

type TaskStatusFilter = 'active' | 'backlog' | 'completed'

export function useTasks(status: TaskStatusFilter) {
  return useQuery({
    queryKey: ['tasks', { status }],
    queryFn: () => listTasks(status),
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousActive = queryClient.getQueryData<TaskListResponse>(['tasks', { status: 'active' }])

      // Optimistic: remove from active list
      if (previousActive) {
        queryClient.setQueryData<TaskListResponse>(['tasks', { status: 'active' }], {
          data: {
            tasks: previousActive.data.tasks.filter((t: Task) => t.task_id !== taskId),
            count: previousActive.data.count - 1,
          },
        })
      }
      return { previousActive }
    },
    onSuccess: () => {
      toast.success('Task completed')
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousActive) {
        queryClient.setQueryData(['tasks', { status: 'active' }], context.previousActive)
      }
      toast.error('Failed to complete task')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useSnoozeTask() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ taskId, days }: { taskId: string; days: number }) =>
      snoozeTask(taskId, { days }),
    onSuccess: (_data, variables) => {
      toast.success(`Task snoozed for ${variables.days} day${variables.days === 1 ? '' : 's'}`)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      toast.error('Failed to snooze task')
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      toast.success('Task deleted')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })
}
