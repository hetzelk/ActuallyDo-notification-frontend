import { apiFetch } from '@/api/client'
import type { CheckoutRequest, PortalRequest } from '@/lib/types'

export type PricePlan = 'monthly' | 'yearly' | 'lifetime'

export async function redirectToCheckout(appId: string, plan: PricePlan) {
  const { url } = await apiFetch<{ url: string }>('/platform/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({
      app_id: appId,
      plan,
      success_url: `${window.location.origin}/settings?checkout=success`,
      cancel_url: `${window.location.origin}/settings?checkout=cancel`,
    } satisfies CheckoutRequest),
  })

  window.location.href = url
}

export async function redirectToPortal() {
  const { url } = await apiFetch<{ url: string }>('/platform/payments/portal', {
    method: 'POST',
    body: JSON.stringify({
      return_url: `${window.location.origin}/settings`,
    } satisfies PortalRequest),
  })

  window.location.href = url
}
