import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { mileageUpdateSchema, type MileageUpdateFormValues } from '@/lib/schemas'
import type { Vehicle } from '@/lib/types'
import { calculateEstimatedMileage } from '@/lib/utils'

interface MileageCheckInModalProps {
  vehicle: Vehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (vehicleId: string, data: MileageUpdateFormValues) => void
  isPending: boolean
}

export function MileageCheckInModal({
  vehicle,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: MileageCheckInModalProps) {
  const estimatedMileage = vehicle
    ? calculateEstimatedMileage(
        vehicle.current_mileage,
        vehicle.weekly_miles_estimate,
        vehicle.mileage_updated_at,
      )
    : 0

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MileageUpdateFormValues>({
    resolver: zodResolver(mileageUpdateSchema),
    values: {
      current_mileage: estimatedMileage,
    },
  })

  if (!vehicle) return null

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update your odometer</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSubmit(vehicle.vehicle_id, data))}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            {displayName}
            <br />
            Current estimate: ~{estimatedMileage.toLocaleString()} mi
          </p>

          <div className="space-y-2">
            <Label htmlFor="mileage-reading">Odometer reading *</Label>
            <Input
              id="mileage-reading"
              type="number"
              {...register('current_mileage', { valueAsNumber: true })}
            />
            {errors.current_mileage && (
              <p className="text-sm text-destructive">{errors.current_mileage.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
