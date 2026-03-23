import { useMemo } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import { Car, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Vehicle } from '@/lib/types'
import { calculateEstimatedMileage, formatRelativeDate } from '@/lib/utils'

interface VehicleCardProps {
  vehicle: Vehicle
  onUpdateMileage: (vehicle: Vehicle) => void
  onViewDetails: (vehicleId: string) => void
}

export function VehicleCard({ vehicle, onUpdateMileage, onViewDetails }: VehicleCardProps) {
  const estimatedMileage = calculateEstimatedMileage(
    vehicle.current_mileage,
    vehicle.weekly_miles_estimate,
    vehicle.mileage_updated_at,
  )

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const nickname = vehicle.nickname ? `"${vehicle.nickname}"` : null

  const isMileageStale = useMemo(
    () => differenceInDays(new Date(), parseISO(vehicle.mileage_updated_at)) > 14,
    [vehicle.mileage_updated_at],
  )

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Car className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">
              {displayName}
              {nickname && (
                <span className="text-muted-foreground ml-1">{nickname}</span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              ~{estimatedMileage.toLocaleString()} miles · Updated{' '}
              {formatRelativeDate(vehicle.mileage_updated_at)}
            </p>
          </div>
        </div>

        {isMileageStale && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            Mileage may be inaccurate — update your odometer
          </div>
        )}

        {/* Status summary placeholder — will be computed from maintenance items in US10 */}
        <div className="flex items-center gap-1.5 text-sm text-green-600">
          {isMileageStale ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              <span>Update mileage for accurate estimates</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>All caught up</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button variant="outline" size="sm" onClick={() => onUpdateMileage(vehicle)}>
            Update mileage
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(vehicle.vehicle_id)}>
            View details →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
