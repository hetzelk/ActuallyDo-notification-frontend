import { Badge } from '@/components/ui/badge'

interface TierBadgeProps {
  tier: 'free' | 'pro'
}

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <Badge variant={tier === 'pro' ? 'default' : 'secondary'} className="text-xs">
      {tier === 'pro' ? 'Pro' : 'Free'}
    </Badge>
  )
}
