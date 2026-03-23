import { apiFetch } from './client'
import type {
  TaskListResponse,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  SnoozeRequest,
  ActivateRequest,
} from '@/lib/types'

type TaskStatusFilter = 'active' | 'backlog' | 'completed'

export async function listTasks(status: TaskStatusFilter): Promise<TaskListResponse> {
  return apiFetch<TaskListResponse>(`/apps/tuskdue/tasks?status=${status}`)
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
