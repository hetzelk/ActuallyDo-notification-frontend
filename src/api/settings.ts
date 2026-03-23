import { apiFetch } from './client'
import type { PlatformSettings, UpdateSettingsRequest } from '@/lib/types'

export async function getSettings(): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>('/platform/settings')
}

export async function updateSettings(data: UpdateSettingsRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/platform/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
