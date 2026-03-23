export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
export const STRIPE_PK = import.meta.env.VITE_STRIPE_PK || ''
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
} as const

export const FREE_TIER_LIMITS = {
  tuskdue: { maxActiveTasks: 15 },
  wrenchdue: { maxVehicles: 1 },
} as const

export const SNOOZE_OPTIONS = {
  free: [1, 3, 7],
  pro: [1, 3, 7, 14, 30],
} as const

export const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export const DEBOUNCE_MS = 500
export const TOAST_DURATION_MS = 4000
