import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, isToday, isBefore, parseISO, differenceInDays, differenceInMonths, format } from "date-fns"
import type { Task, TaskGroup, MaintenanceItem, MaintenanceUrgency } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMMM d, yyyy")
}

export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d")
}

export function getTaskGroup(task: Task): TaskGroup {
  if (task.status === 'snoozed') return 'snoozed'
  if (!task.due_date) return 'upcoming'

  const dueDate = parseISO(task.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isToday(dueDate)) return 'due-today'
  if (isBefore(dueDate, today)) return 'overdue'
  return 'upcoming'
}

export function getDaysOverdue(dueDateString: string): number {
  const dueDate = parseISO(dueDateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return differenceInDays(today, dueDate)
}

export function getDueLabel(task: Task): string {
  if (task.status === 'snoozed' && task.snoozed_until) {
    return `Snoozed until ${formatShortDate(task.snoozed_until)}`
  }
  if (!task.due_date) return 'No due date'

  const group = getTaskGroup(task)
  switch (group) {
    case 'overdue': {
      const days = getDaysOverdue(task.due_date)
      return days === 1 ? '1 day overdue' : `${days} days overdue`
    }
    case 'due-today':
      return 'Due today'
    case 'upcoming': {
      const days = differenceInDays(parseISO(task.due_date), new Date())
      return days === 1 ? 'Due in 1 day' : `Due in ${days} days`
    }
    default:
      return ''
  }
}

export function calculateEstimatedMileage(
  currentMileage: number,
  weeklyEstimate: number,
  lastUpdated: string
): number {
  const daysSinceUpdate = differenceInDays(new Date(), parseISO(lastUpdated))
  return Math.round(currentMileage + (daysSinceUpdate * weeklyEstimate) / 7)
}

export function getMaintenanceUrgency(
  item: MaintenanceItem,
  estimatedMileage: number,
): MaintenanceUrgency {
  const now = new Date()

  // Check mileage-based overdue
  if (item.interval_miles && item.last_completed_mileage !== null) {
    const nextDueMileage = item.last_completed_mileage + item.interval_miles
    if (estimatedMileage >= nextDueMileage) return 'overdue'
  }

  // Check time-based overdue
  if (item.interval_months && item.last_completed_date) {
    const monthsSince = differenceInMonths(now, parseISO(item.last_completed_date))
    if (monthsSince >= item.interval_months) return 'overdue'
  }

  // Never completed — treat as overdue
  if (item.last_completed_mileage === null && item.last_completed_date === null) {
    return 'overdue'
  }

  // Check if coming up (within 80% of interval)
  if (item.interval_miles && item.last_completed_mileage !== null) {
    const nextDueMileage = item.last_completed_mileage + item.interval_miles
    const threshold = item.last_completed_mileage + item.interval_miles * 0.8
    if (estimatedMileage >= threshold && estimatedMileage < nextDueMileage) return 'coming-up'
  }

  if (item.interval_months && item.last_completed_date) {
    const monthsSince = differenceInMonths(now, parseISO(item.last_completed_date))
    const threshold = item.interval_months * 0.8
    if (monthsSince >= threshold && monthsSince < item.interval_months) return 'coming-up'
  }

  return 'all-clear'
}

export function getNextDueMileage(item: MaintenanceItem): number | null {
  if (!item.interval_miles || item.last_completed_mileage === null) return null
  return item.last_completed_mileage + item.interval_miles
}

export function getMilesSinceService(item: MaintenanceItem, estimatedMileage: number): number | null {
  if (item.last_completed_mileage === null) return null
  return estimatedMileage - item.last_completed_mileage
}
