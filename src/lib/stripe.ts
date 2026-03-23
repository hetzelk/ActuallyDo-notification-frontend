import { apiFetch } from '@/api/client'

export const PRICE_IDS = {
  monthly: 'price_monthly_3',
  annual: 'price_annual_24',
  lifetime: 'price_lifetime_49',
} as const

export type PricePlan = keyof typeof PRICE_IDS

export async function redirectToCheckout(plan: PricePlan, userId: string) {
  const priceId = PRICE_IDS[plan]
  const mode = plan === 'lifetime' ? 'payment' : 'subscription'

  const { url } = await apiFetch<{ url: string }>('/platform/checkout', {
    method: 'POST',
    body: JSON.stringify({
      price_id: priceId,
      mode,
      client_reference_id: userId,
    }),
  })

  window.location.href = url
}
