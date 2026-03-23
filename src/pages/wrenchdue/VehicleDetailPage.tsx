import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MaintenanceList } from '@/components/maintenance/MaintenanceList'
import { MaintenanceHistory } from '@/components/maintenance/MaintenanceHistory'
import { CompletionForm } from '@/components/maintenance/CompletionForm'
import { MileageCheckInModal } from '@/components/vehicles/MileageCheckInModal'
import { useVehicle, useMaintenanceItems, useMaintenanceLog, useLogCompletion, useDeleteItem } from '@/hooks/use-vehicle'
import { useUpdateMileage } from '@/hooks/use-vehicles'
import { useTier } from '@/hooks/use-tier'
import { calculateEstimatedMileage, formatDate, formatRelativeDate } from '@/lib/utils'
import type { MaintenanceItem, Vehicle } from '@/lib/types'
import type { MileageUpdateFormValues } from '@/lib/schemas'

export function VehicleDetailPage() {
  const { id: vehicleId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isPro } = useTier('wrenchdue')

  const vehicleQuery = useVehicle(vehicleId!)
  const itemsQuery = useMaintenanceItems(vehicleId!)
  const logQuery = useMaintenanceLog(vehicleId!)
  const logCompletionMutation = useLogCompletion(vehicleId!)
  const deleteItemMutation = useDeleteItem(vehicleId!)
  const updateMileageMutation = useUpdateMileage()

  const [completionItem, setCompletionItem] = useState<MaintenanceItem | null>(null)
  const [mileageVehicle, setMileageVehicle] = useState<Vehicle | null>(null)

  const vehicle = vehicleQuery.data
  const items = itemsQuery.data ?? []
  const logEntries = logQuery.data ?? []

  const estimatedMileage = useMemo(
    () =>
      vehicle
        ? calculateEstimatedMileage(vehicle.current_mileage, vehicle.weekly_miles_estimate, vehicle.mileage_updated_at)
        : 0,
    [vehicle],
  )

  const isMileageStale = useMemo(
    () => vehicle ? differenceInDays(new Date(), parseISO(vehicle.mileage_updated_at)) > 14 : false,
    [vehicle],
  )

  function handleLogCompletion(itemId: string, data: { mileage_at_completion?: number; cost?: number; shop?: string; notes?: string }) {
    logCompletionMutation.mutate(
      { itemId, data },
      { onSuccess: () => setCompletionItem(null) },
    )
  }

  function handleMileageSubmit(vId: string, data: MileageUpdateFormValues) {
    updateMileageMutation.mutate(
      { vehicleId: vId, data },
      { onSuccess: () => setMileageVehicle(null) },
    )
  }

  if (vehicleQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vehicle not found.</p>
        <Button variant="link" onClick={() => navigate('/wrenchdue')}>Back to vehicles</Button>
      </div>
    )
  }

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/wrenchdue')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Vehicles
      </Button>

      {/* Vehicle header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        {vehicle.nickname && (
          <p className="text-muted-foreground">"{vehicle.nickname}"</p>
        )}
        <p className="text-sm text-muted-foreground">
          ~{estimatedMileage.toLocaleString()} miles
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated: {formatDate(vehicle.mileage_updated_at)} ({formatRelativeDate(vehicle.mileage_updated_at)})
        </p>
        <p className="text-sm text-muted-foreground">
          Weekly estimate: ~{vehicle.weekly_miles_estimate} mi/week
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setMileageVehicle(vehicle)}>
            Update mileage
          </Button>
        </div>
      </div>

      {/* Stale mileage warning */}
      {isMileageStale && (
        <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your mileage hasn't been updated in {differenceInDays(new Date(), parseISO(vehicle.mileage_updated_at))} days.
            Maintenance estimates may be inaccurate.
          </p>
          <Button variant="outline" size="sm" className="shrink-0 ml-auto" onClick={() => setMileageVehicle(vehicle)}>
            Update now
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({items.length})</TabsTrigger>
          <TabsTrigger value="history">Completed history</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {itemsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No maintenance items yet.
            </p>
          ) : (
            <MaintenanceList
              items={items}
              estimatedMileage={estimatedMileage}
              isPro={isPro}
              onLogCompletion={setCompletionItem}
              onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <MaintenanceHistory
            entries={logEntries}
            isPro={isPro}
            isLoading={logQuery.isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Completion form modal */}
      <CompletionForm
        item={completionItem}
        vehicleDisplayName={displayName}
        estimatedMileage={estimatedMileage}
        isPro={isPro}
        open={completionItem !== null}
        onOpenChange={(open) => { if (!open) setCompletionItem(null) }}
        onSubmit={handleLogCompletion}
        isPending={logCompletionMutation.isPending}
      />

      {/* Mileage check-in modal */}
      <MileageCheckInModal
        vehicle={mileageVehicle}
        open={mileageVehicle !== null}
        onOpenChange={(open) => { if (!open) setMileageVehicle(null) }}
        onSubmit={handleMileageSubmit}
        isPending={updateMileageMutation.isPending}
      />
    </div>
  )
}
