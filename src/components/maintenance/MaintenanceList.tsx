import { useMemo } from 'react'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { MaintenanceItemCard } from './MaintenanceItemCard'
import type { MaintenanceItem, MaintenanceUrgency } from '@/lib/types'
import { getMaintenanceUrgency } from '@/lib/utils'

interface MaintenanceListProps {
  items: MaintenanceItem[]
  estimatedMileage: number
  isPro: boolean
  onLogCompletion: (item: MaintenanceItem) => void
  onDelete?: (itemId: string) => void
}

const SECTION_CONFIG: Record<MaintenanceUrgency, { label: string; icon: typeof AlertTriangle; className: string }> = {
  'overdue': { label: 'OVERDUE', icon: AlertTriangle, className: 'text-destructive' },
  'coming-up': { label: 'COMING UP', icon: Clock, className: 'text-amber-600' },
  'all-clear': { label: 'ALL CLEAR', icon: CheckCircle, className: 'text-green-600' },
}

export function MaintenanceList({
  items,
  estimatedMileage,
  isPro,
  onLogCompletion,
  onDelete,
}: MaintenanceListProps) {
  const grouped = useMemo(() => {
    const groups: Record<MaintenanceUrgency, MaintenanceItem[]> = {
      'overdue': [],
      'coming-up': [],
      'all-clear': [],
    }
    for (const item of items) {
      const urgency = getMaintenanceUrgency(item, estimatedMileage)
      groups[urgency].push(item)
    }
    return groups
  }, [items, estimatedMileage])

  const sections: MaintenanceUrgency[] = ['overdue', 'coming-up', 'all-clear']

  return (
    <div className="space-y-4">
      {sections.map((urgency) => {
        const sectionItems = grouped[urgency]
        if (sectionItems.length === 0) return null

        const config = SECTION_CONFIG[urgency]
        const Icon = config.icon

        return (
          <div key={urgency} className="border border-border rounded-lg overflow-hidden">
            <div className={`flex items-center gap-1.5 px-3 py-2 bg-muted/50 text-xs font-semibold ${config.className}`}>
              <Icon className="h-3.5 w-3.5" />
              {config.label}
              {urgency === 'all-clear' && ` (${sectionItems.length} items)`}
            </div>
            <div className="px-3">
              {sectionItems.map((item) => (
                <MaintenanceItemCard
                  key={item.item_id}
                  item={item}
                  estimatedMileage={estimatedMileage}
                  isPro={isPro}
                  onLogCompletion={onLogCompletion}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
