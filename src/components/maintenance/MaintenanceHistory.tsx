import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { MaintenanceLogEntry } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface MaintenanceHistoryProps {
  entries: MaintenanceLogEntry[]
  isPro: boolean
  isLoading: boolean
}

export function MaintenanceHistory({ entries, isPro, isLoading }: MaintenanceHistoryProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const displayEntries = isPro ? entries : entries.slice(0, 10)

  if (displayEntries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No maintenance history yet. Log your first completion to see it here.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {displayEntries.map((entry) => (
        <div key={entry.log_id} className="border-b border-border py-3 last:border-b-0">
          <p className="text-xs text-muted-foreground">{formatDate(entry.completed_at)}</p>
          <p className="text-sm font-medium">
            {entry.item_name} at {entry.mileage_at_completion.toLocaleString()} mi
          </p>
          {isPro && (entry.cost !== null || entry.shop) && (
            <p className="text-xs text-muted-foreground">
              {entry.cost !== null && `$${entry.cost.toFixed(2)}`}
              {entry.cost !== null && entry.shop && ' · '}
              {entry.shop}
            </p>
          )}
          {entry.notes && (
            <p className="text-xs text-muted-foreground italic mt-0.5">{entry.notes}</p>
          )}
        </div>
      ))}

      {!isPro && entries.length > 10 && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-center mt-4">
          <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Upgrade to Pro for full maintenance history with search and cost totals.
          </p>
          <Button size="sm" onClick={() => navigate('/settings')}>
            Upgrade
            <Badge variant="secondary" className="ml-1.5 text-xs">Pro</Badge>
          </Button>
        </div>
      )}
    </div>
  )
}
