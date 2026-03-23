import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTask, updateTask } from '@/api/nagme'
import type { UpdateTaskRequest } from '@/lib/types'

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  })
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateTaskRequest) => updateTask(taskId, data),
    onSuccess: (result) => {
      queryClient.setQueryData(['tasks', taskId], { data: result.data })
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false })
    },
  })
}
