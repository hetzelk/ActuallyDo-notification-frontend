import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addVehicleSchema, type AddVehicleFormValues } from '@/lib/schemas'

interface AddVehicleFormProps {
  onSubmit: (data: AddVehicleFormValues) => void
  onCancel: () => void
  isPending: boolean
}

export function AddVehicleForm({ onSubmit, onCancel, isPending }: AddVehicleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddVehicleFormValues>({
    resolver: zodResolver(addVehicleSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="year">Year *</Label>
        <Input
          id="year"
          type="number"
          placeholder="2019"
          {...register('year', { valueAsNumber: true })}
        />
        {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="make">Make *</Label>
        <Input id="make" placeholder="Honda" {...register('make')} />
        {errors.make && <p className="text-sm text-destructive">{errors.make.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model *</Label>
        <Input id="model" placeholder="Civic" {...register('model')} />
        {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <Input id="nickname" placeholder="Daily Driver" {...register('nickname')} />
        {errors.nickname && <p className="text-sm text-destructive">{errors.nickname.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="current_mileage">Current odometer reading (miles) *</Label>
        <Input
          id="current_mileage"
          type="number"
          placeholder="85200"
          {...register('current_mileage', { valueAsNumber: true })}
        />
        {errors.current_mileage && <p className="text-sm text-destructive">{errors.current_mileage.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="weekly_miles_estimate">How many miles do you drive per week? *</Label>
        <Input
          id="weekly_miles_estimate"
          type="number"
          placeholder="200"
          {...register('weekly_miles_estimate', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Used to estimate your mileage between check-ins. You can update this anytime.
        </p>
        {errors.weekly_miles_estimate && (
          <p className="text-sm text-destructive">{errors.weekly_miles_estimate.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add vehicle
        </Button>
      </div>
    </form>
  )
}
