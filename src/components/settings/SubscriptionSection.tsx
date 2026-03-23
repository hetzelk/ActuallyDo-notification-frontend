import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PlatformSettings } from '@/lib/types'

interface SubscriptionSectionProps {
  settings: PlatformSettings
}

const PRICING = [
  { label: 'Monthly', price: '$3/mo', priceId: 'monthly' },
  { label: 'Annual', price: '$24/yr', priceId: 'annual', badge: 'Save 33%' },
  { label: 'Lifetime', price: '$49', priceId: 'lifetime' },
] as const

export function SubscriptionSection({ settings }: SubscriptionSectionProps) {
  // Derive tier from the first app that has a tier (they should all match)
  const tier = Object.values(settings.apps).find((a) => a.tier)?.tier ?? 'free'
  const isPro = tier === 'pro'

  if (isPro) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Subscription</h2>
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">ActuallyDo Pro</span>
            <Badge>Pro</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Unlimited tasks, custom snooze durations, and heads-up reminders.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Manage subscription</Button>
            <Button variant="ghost" size="sm" className="text-destructive">Cancel</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Subscription</h2>
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">Free Plan</span>
          <Badge variant="secondary">Free</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade to Pro for unlimited tasks, custom snooze, and more.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRICING.map((plan) => (
            <Button key={plan.priceId} variant="outline" className="flex flex-col h-auto py-3">
              <span className="font-medium">{plan.price}</span>
              <span className="text-xs text-muted-foreground">{plan.label}</span>
              {plan.badge && (
                <Badge variant="secondary" className="mt-1 text-xs">{plan.badge}</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
