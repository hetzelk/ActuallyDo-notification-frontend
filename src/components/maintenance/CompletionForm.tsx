import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { MaintenanceItem } from '@/lib/types'

const completionSchema = z.object({
  mileage_at_completion: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  shop: z.string().optional(),
  notes: z.string().optional(),
})

type CompletionFormValues = z.infer<typeof completionSchema>

interface CompletionFormProps {
  item: MaintenanceItem | null
  vehicleDisplayName: string
  estimatedMileage: number
  isPro: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (itemId: string, data: CompletionFormValues) => void
  isPending: boolean
}

export function CompletionForm({
  item,
  vehicleDisplayName,
  estimatedMileage,
  isPro,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CompletionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompletionFormValues>({
    resolver: zodResolver(completionSchema),
    values: {
      mileage_at_completion: estimatedMileage,
      cost: undefined,
      shop: undefined,
      notes: undefined,
    },
  })

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log maintenance</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSubmit(item.item_id, data))}
          className="space-y-4"
        >
          <div>
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground">{vehicleDisplayName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-mileage">Mileage at completion</Label>
            <Input
              id="completion-mileage"
              type="number"
              {...register('mileage_at_completion', { valueAsNumber: true })}
            />
            {errors.mileage_at_completion && (
              <p className="text-sm text-destructive">{errors.mileage_at_completion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="completion-cost">Cost ($)</Label>
              {!isPro && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-0.5" />
                  Pro
                </Badge>
              )}
            </div>
            <Input
              id="completion-cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={!isPro}
              {...register('cost', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="completion-shop">Shop / Location</Label>
              {!isPro && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-0.5" />
                  Pro
                </Badge>
              )}
            </div>
            <Input
              id="completion-shop"
              placeholder="e.g. Quick Lube on Main St"
              disabled={!isPro}
              {...register('shop')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-notes">Notes</Label>
            <Input
              id="completion-notes"
              placeholder="Optional notes"
              {...register('notes')}
            />
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
              Log completion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
