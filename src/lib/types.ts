// Auth types
export interface AuthTokens {
  id_token: string
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface AuthState {
  user: { email: string } | null
  idToken: string | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  isAuthenticated: boolean
  isLoading: boolean
}

// API error
export interface ApiError {
  error: string
  message: string
}

// Settings types
export interface AppSettings {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  preferred_day: string | null
  app_name: string
  tier: 'free' | 'pro'
}

export interface PlatformSettings {
  timezone: string | null
  reminder_time: string | null
  push_subscription: PushSubscriptionJSON | null
  email_disabled: boolean
  apps: Record<string, AppSettings>
}

export interface UpdateSettingsRequest {
  timezone?: string
  reminder_time?: string
  push_subscription?: PushSubscriptionJSON | null
  apps?: Record<string, Partial<Pick<AppSettings, 'enabled' | 'frequency' | 'preferred_day'>>>
}

// TuskDue types
export type TaskStatus = 'active' | 'snoozed' | 'backlog' | 'completed'
export type TaskGroup = 'overdue' | 'due-today' | 'snoozed' | 'upcoming'

export interface Task {
  task_id: string
  title: string
  notes: string | null
  due_date: string | null
  notify: boolean
  status: TaskStatus
  snoozed_until: string | null
  created_at: string
  completed_at: string | null
  tags: string[]
}

export interface TaskListResponse {
  data: {
    tasks: Task[]
    count: number
  }
}

export interface CreateTaskRequest {
  title: string
  notes?: string
  due_date?: string
  notify?: boolean
  recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'custom'
  recurrence_interval?: number
  tags?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  notes?: string
  due_date?: string
  notify?: boolean
  recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'custom'
  recurrence_interval?: number
  tags?: string[]
}

export interface SnoozeRequest {
  days?: number
  until?: string
}

export interface ActivateRequest {
  due_date: string
}

// WrenchDue types
export interface Vehicle {
  vehicle_id: string
  year: number
  make: string
  model: string
  nickname: string | null
  current_mileage: number
  weekly_miles_estimate: number
  mileage_updated_at: string
  created_at: string
}

export interface MaintenanceItem {
  item_id: string
  name: string
  interval_miles: number | null
  interval_months: number | null
  last_completed_mileage: number | null
  last_completed_date: string | null
  notify: boolean
  is_custom: boolean
  notes: string | null
}

export interface MaintenanceLogEntry {
  log_id: string
  item_name: string
  completed_at: string
  mileage_at_completion: number
  cost: number | null
  shop: string | null
  notes: string | null
}

export interface CreateVehicleRequest {
  year: number
  make: string
  model: string
  nickname?: string
  current_mileage: number
  weekly_miles_estimate: number
}

export interface LogCompletionRequest {
  mileage_at_completion?: number
  cost?: number
  shop?: string
  notes?: string
}

export interface UpdateMileageRequest {
  current_mileage: number
}

export interface UpdateVehicleRequest {
  nickname?: string
  weekly_miles_estimate?: number
}

// Checkout types
export interface CheckoutRequest {
  app_id: string
  plan: 'monthly' | 'yearly' | 'lifetime'
  success_url: string
  cancel_url: string
}

export interface PortalRequest {
  return_url: string
}

// Task history/pagination
export interface PaginatedResponse<T> {
  data: T[]
  next_token?: string
}

export interface TaskHistoryParams {
  q?: string
  limit?: number
  next_token?: string
}

export interface MaintenanceLogParams {
  vehicle_id?: string
  q?: string
  limit?: number
  next_token?: string
}

export interface CostSummaryParams {
  vehicle_id?: string
  start_date: string
  end_date: string
}

export interface CostSummary {
  total_cost: number
  per_item: Array<{ name: string; cost: number }>
}

export type MaintenanceUrgency = 'overdue' | 'coming-up' | 'all-clear'
