import { API_BASE } from '@/lib/constants'
import type { ApiError } from '@/lib/types'

export class ApiRequestError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

let getToken: (() => string | null) | null = null

export function setTokenGetter(getter: () => string | null) {
  getToken = getter
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  const token = getToken?.()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorBody: ApiError
    try {
      errorBody = await response.json()
    } catch {
      errorBody = { error: 'unknown', message: 'An unexpected error occurred' }
    }
    throw new ApiRequestError(response.status, errorBody.error, errorBody.message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
