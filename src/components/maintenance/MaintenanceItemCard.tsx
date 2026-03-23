import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MaintenanceItem as MaintenanceItemType } from '@/lib/types'
import {
  formatRelativeDate,
  getNextDueMileage,
  getMilesSinceService,
} from '@/lib/utils'

interface MaintenanceItemCardProps {
  item: MaintenanceItemType
  estimatedMileage: number
  isPro: boolean
  onLogCompletion: (item: MaintenanceItemType) => void
  onDelete?: (itemId: string) => void
}

export function MaintenanceItemCard({
  item,
  estimatedMileage,
  isPro,
  onLogCompletion,
  onDelete,
}: MaintenanceItemCardProps) {
  const milesSince = getMilesSinceService(item, estimatedMileage)
  const nextDue = getNextDueMileage(item)

  function getLastCompletedLine(): string {
    if (item.last_completed_mileage === null && !item.last_completed_date) {
      return 'Never completed'
    }
    const parts: string[] = []
    if (item.last_completed_mileage !== null) {
      parts.push(`Last: ${item.last_completed_mileage.toLocaleString()} mi`)
      if (milesSince !== null) {
        parts.push(`(${milesSince.toLocaleString()} mi ago)`)
      }
    }
    if (item.last_completed_date) {
      parts.push(`· ${formatRelativeDate(item.last_completed_date)}`)
    }
    return parts.join(' ')
  }

  function getIntervalLine(): string {
    const parts: string[] = []
    if (item.interval_miles) parts.push(`${item.interval_miles.toLocaleString()} mi`)
    if (item.interval_months) parts.push(`${item.interval_months} months`)
    if (parts.length === 0) return ''
    return `Due every ${parts.join(' or ')}`
  }

  return (
    <div className="border-b border-border last:border-b-0 py-3 px-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 className="font-medium text-sm">{item.name}</h4>
          <p className="text-xs text-muted-foreground">{getLastCompletedLine()}</p>
          {getIntervalLine() && (
            <p className="text-xs text-muted-foreground">{getIntervalLine()}</p>
          )}
          {nextDue && (
            <p className="text-xs text-muted-foreground">
              Next ~{nextDue.toLocaleString()} mi
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onLogCompletion(item)}>
            Log as done
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPro && item.is_custom && onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(item.item_id)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
