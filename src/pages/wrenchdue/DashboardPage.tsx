import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { VehicleList } from '@/components/vehicles/VehicleList'
import { MileageCheckInModal } from '@/components/vehicles/MileageCheckInModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { UpgradePrompt } from '@/components/shared/UpgradePrompt'
import { useVehicles, useUpdateMileage } from '@/hooks/use-vehicles'
import { useTier } from '@/hooks/use-tier'
import { FREE_TIER_LIMITS } from '@/lib/constants'
import type { Vehicle } from '@/lib/types'
import type { MileageUpdateFormValues } from '@/lib/schemas'

export function WrenchDueDashboardPage() {
  const navigate = useNavigate()
  const vehiclesQuery = useVehicles()
  const updateMileage = useUpdateMileage()
  const { isFree } = useTier('wrenchdue')
  const [mileageVehicle, setMileageVehicle] = useState<Vehicle | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const vehicles = vehiclesQuery.data ?? []
  const atLimit = isFree && vehicles.length >= FREE_TIER_LIMITS.wrenchdue.maxVehicles

  function handleAddVehicle() {
    if (atLimit) {
      setShowUpgradePrompt(true)
    } else {
      navigate('/wrenchdue/vehicles/new')
    }
  }

  function handleMileageSubmit(vehicleId: string, data: MileageUpdateFormValues) {
    updateMileage.mutate(
      { vehicleId, data },
      { onSuccess: () => setMileageVehicle(null) },
    )
  }

  if (vehiclesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WrenchDue</h1>
        {isFree && vehicles.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Vehicles ({vehicles.length} of {FREE_TIER_LIMITS.wrenchdue.maxVehicles})
          </span>
        )}
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          heading="No vehicles yet"
          description="Add your first vehicle to get started with maintenance tracking."
          actionLabel="Add vehicle"
          onAction={() => navigate('/wrenchdue/vehicles/new')}
        />
      ) : (
        <>
          <VehicleList
            vehicles={vehicles}
            onUpdateMileage={setMileageVehicle}
            onViewDetails={(id) => navigate(`/wrenchdue/vehicles/${id}`)}
          />

          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddVehicle}
          >
            {atLimit ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Add vehicle
                <Badge variant="secondary" className="ml-2">Pro</Badge>
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add vehicle
              </>
            )}
          </Button>
        </>
      )}

      {showUpgradePrompt && (
        <UpgradePrompt
          message={`Free accounts support ${FREE_TIER_LIMITS.wrenchdue.maxVehicles} vehicle. Upgrade to Pro for unlimited.`}
        />
      )}

      <MileageCheckInModal
        vehicle={mileageVehicle}
        open={mileageVehicle !== null}
        onOpenChange={(open) => { if (!open) setMileageVehicle(null) }}
        onSubmit={handleMileageSubmit}
        isPending={updateMileage.isPending}
      />
    </div>
  )
}
