import { http, HttpResponse, delay } from 'msw'
import { mockTasks } from './data'
import type { Task } from '@/lib/types'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

// Mutable copy so mutations persist during the session
let tasks = structuredClone(mockTasks)

// Fake JWT — just enough to decode an email from payload
function makeFakeJwt(email: string): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ email, sub: 'user-001', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }))
  return `${header}.${payload}.fake-signature`
}

const fakeTokens = (email: string) => ({
  id_token: makeFakeJwt(email),
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
})

export const handlers = [
  // === Auth ===
  http.post(`${API}/platform/auth/signup`, async () => {
    await delay(400)
    return HttpResponse.json(
      { user_id: 'user-001', message: 'Account created' },
      { status: 201 }
    )
  }),

  http.post(`${API}/platform/auth/login`, async ({ request }) => {
    await delay(300)
    const body = await request.json() as { email: string; password: string }
    if (body.password === 'wrong') {
      return HttpResponse.json(
        { error: 'invalid_credentials', message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    return HttpResponse.json(fakeTokens(body.email))
  }),

  http.post(`${API}/platform/auth/magic-link`, async () => {
    await delay(500)
    return HttpResponse.json({ message: 'If that email exists, a magic link has been sent.' })
  }),

  http.post(`${API}/platform/auth/magic-link/verify`, async ({ request }) => {
    await delay(400)
    const body = await request.json() as { email: string; code: string }
    if (body.code === '000000') {
      return HttpResponse.json(
        { error: 'invalid_code', message: 'Invalid or expired code' },
        { status: 401 }
      )
    }
    return HttpResponse.json(fakeTokens(body.email))
  }),

  // === Platform Settings ===
  http.get(`${API}/platform/settings`, async () => {
    await delay(200)
    return HttpResponse.json({
      timezone: 'America/Chicago',
      reminder_time: '09:00',
      push_subscription: null,
      email_disabled: false,
      apps: {
        nagme: { enabled: true, frequency: 'daily', preferred_day: null, app_name: 'NagMe', tier: 'free' },
        milesahead: { enabled: true, frequency: 'weekly', preferred_day: 'monday', app_name: 'MilesAhead', tier: 'free' },
      },
    })
  }),

  http.put(`${API}/platform/settings`, async () => {
    await delay(300)
    return HttpResponse.json({ message: 'Settings updated' })
  }),

  // === NagMe Tasks ===
  http.get(`${API}/apps/nagme/tasks`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'active'

    let filtered: Task[]
    if (status === 'active') {
      filtered = tasks.filter((t) => t.status === 'active' || t.status === 'snoozed')
    } else {
      filtered = tasks.filter((t) => t.status === status)
    }

    return HttpResponse.json({ data: { tasks: filtered, count: filtered.length } })
  }),

  http.get(`${API}/apps/nagme/tasks/:taskId`, async ({ params }) => {
    await delay(150)
    const task = tasks.find((t) => t.task_id === params.taskId)
    if (!task) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Task not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: task })
  }),

  http.post(`${API}/apps/nagme/tasks`, async ({ request }) => {
    await delay(300)
    const body = await request.json() as { title: string; notes?: string; due_date?: string }
    const newTask: Task = {
      task_id: `task-${Date.now()}`,
      title: body.title,
      notes: body.notes || null,
      due_date: body.due_date || null,
      notify: !!body.due_date,
      status: body.due_date ? 'active' : 'backlog',
      snoozed_until: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      tags: [],
    }
    tasks.unshift(newTask)
    return HttpResponse.json(
      { data: { task_id: newTask.task_id, status: newTask.status }, message: 'Task created' },
      { status: 201 }
    )
  }),

  http.put(`${API}/apps/nagme/tasks/:taskId`, async ({ params, request }) => {
    await delay(200)
    const idx = tasks.findIndex((t) => t.task_id === params.taskId)
    if (idx === -1) {
      return HttpResponse.json({ error: 'not_found', message: 'Task not found' }, { status: 404 })
    }
    const body = await request.json() as Partial<Task>
    tasks[idx] = { ...tasks[idx], ...body }
    return HttpResponse.json({ data: tasks[idx], message: 'Task updated' })
  }),

  http.delete(`${API}/apps/nagme/tasks/:taskId`, async ({ params }) => {
    await delay(200)
    tasks = tasks.filter((t) => t.task_id !== params.taskId)
    return HttpResponse.json({ message: 'Task deleted' })
  }),

  http.post(`${API}/apps/nagme/tasks/:taskId/complete`, async ({ params }) => {
    await delay(200)
    const task = tasks.find((t) => t.task_id === params.taskId)
    if (!task) {
      return HttpResponse.json({ error: 'not_found', message: 'Task not found' }, { status: 404 })
    }
    task.status = 'completed'
    task.completed_at = new Date().toISOString()
    return HttpResponse.json({
      data: { task_id: task.task_id, status: 'completed', completed_at: task.completed_at },
      message: 'Task completed',
    })
  }),

  http.post(`${API}/apps/nagme/tasks/:taskId/snooze`, async ({ params, request }) => {
    await delay(200)
    const task = tasks.find((t) => t.task_id === params.taskId)
    if (!task) {
      return HttpResponse.json({ error: 'not_found', message: 'Task not found' }, { status: 404 })
    }
    const body = await request.json() as { days: number }
    const { addDays, format } = await import('date-fns')
    const snoozedUntil = format(addDays(new Date(), body.days), 'yyyy-MM-dd')
    task.status = 'snoozed'
    task.snoozed_until = snoozedUntil
    return HttpResponse.json({
      data: { task_id: task.task_id, status: 'snoozed', snoozed_until: snoozedUntil },
      message: 'Task snoozed',
    })
  }),

  http.post(`${API}/apps/nagme/tasks/:taskId/activate`, async ({ params, request }) => {
    await delay(200)
    const task = tasks.find((t) => t.task_id === params.taskId)
    if (!task) {
      return HttpResponse.json({ error: 'not_found', message: 'Task not found' }, { status: 404 })
    }
    const body = await request.json() as { due_date: string }
    task.status = 'active'
    task.due_date = body.due_date
    task.snoozed_until = null
    task.notify = true
    return HttpResponse.json({
      data: { task_id: task.task_id, status: 'active', due_date: body.due_date },
      message: 'Task activated',
    })
  }),
]
