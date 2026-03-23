import { apiFetch } from './client'

export async function sendTestPush(): Promise<{ message: string }> {
  return apiFetch('/platform/push/test', {
    method: 'POST',
  })
}

export async function consumeActionToken(token: string): Promise<void> {
  return apiFetch(`/platform/actions/${token}`)
}
