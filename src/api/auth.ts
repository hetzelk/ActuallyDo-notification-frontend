import { apiFetch } from './client'
import type { AuthTokens } from '@/lib/types'

interface SignupResponse {
  user_id: string
  message: string
}

export async function signup(email: string, password: string): Promise<SignupResponse> {
  return apiFetch<SignupResponse>('/platform/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/platform/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function requestMagicLink(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/platform/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyMagicLink(
  email: string,
  code: string,
  session?: string
): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/platform/auth/magic-link/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code, session }),
  })
}
