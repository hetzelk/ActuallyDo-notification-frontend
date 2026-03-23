import { apiFetch } from './client'
import type {
  TaskListResponse,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  SnoozeRequest,
  ActivateRequest,
  TaskHistoryParams,
  PaginatedResponse,
} from '@/lib/types'

type TaskStatusFilter = 'active' | 'backlog' | 'completed' | 'snoozed'

export async function listTasks(status: TaskStatusFilter, tag?: string): Promise<TaskListResponse> {
  const params = new URLSearchParams({ status })
  if (tag) params.set('tag', tag)
  return apiFetch<TaskListResponse>(`/apps/tuskdue/tasks?${params}`)
}

export async function getTask(taskId: string): Promise<{ data: Task }> {
  return apiFetch<{ data: Task }>(`/apps/tuskdue/tasks/${taskId}`)
}

export async function createTask(data: CreateTaskRequest): Promise<{ data: { task_id: string; status: string }; message: string }> {
  return apiFetch('/apps/tuskdue/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(taskId: string, data: UpdateTaskRequest): Promise<{ data: Task; message: string }> {
  return apiFetch(`/apps/tuskdue/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(taskId: string): Promise<{ message: string }> {
  return apiFetch(`/apps/tuskdue/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

export async function activateTask(taskId: string, data: ActivateRequest): Promise<{ data: { task_id: string; status: string; due_date: string }; message: string }> {
  return apiFetch(`/apps/tuskdue/tasks/${taskId}/activate`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function completeTask(taskId: string): Promise<{ data: { task_id: string; status: string; completed_at: string }; message: string }> {
  return apiFetch(`/apps/tuskdue/tasks/${taskId}/complete`, {
    method: 'POST',
  })
}

export async function snoozeTask(taskId: string, data: SnoozeRequest): Promise<{ data: { task_id: string; status: string; snoozed_until: string }; message: string }> {
  return apiFetch(`/apps/tuskdue/tasks/${taskId}/snooze`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// History, export, import

export async function getTaskHistory(params: TaskHistoryParams = {}): Promise<PaginatedResponse<Task>> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.set('q', params.q)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.next_token) searchParams.set('next_token', params.next_token)
  return apiFetch(`/apps/tuskdue/tasks/history?${searchParams}`)
}

export async function exportTasks(status?: string): Promise<string> {
  const params = status ? `?status=${status}` : ''
  return apiFetch(`/apps/tuskdue/tasks/export${params}`)
}

export async function importTasks(csv: string): Promise<{ message: string }> {
  return apiFetch('/apps/tuskdue/tasks/import', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  })
}
