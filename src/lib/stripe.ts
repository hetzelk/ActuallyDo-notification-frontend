import { loadStripe } from '@stripe/stripe-js'
import { STRIPE_PK, APP_URL } from '@/lib/constants'

const stripePromise = loadStripe(STRIPE_PK)

export const PRICE_IDS = {
  monthly: 'price_monthly_3',
  annual: 'price_annual_24',
  lifetime: 'price_lifetime_49',
} as const

export type PricePlan = keyof typeof PRICE_IDS

export async function redirectToCheckout(plan: PricePlan, userId: string) {
  const stripe = await stripePromise
  if (!stripe) {
    throw new Error('Stripe failed to load. Check your VITE_STRIPE_PK.')
  }

  const priceId = PRICE_IDS[plan]
  const mode = plan === 'lifetime' ? 'payment' : 'subscription'

  await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode,
    successUrl: `${APP_URL}/settings?payment=success`,
    cancelUrl: `${APP_URL}/settings?payment=cancelled`,
    clientReferenceId: userId,
  })
}
