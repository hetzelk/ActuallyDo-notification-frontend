import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddVehicleForm } from '@/components/vehicles/AddVehicleForm'
import { UpgradePrompt } from '@/components/shared/UpgradePrompt'
import { useCreateVehicle } from '@/hooks/use-vehicles'
import { ApiRequestError } from '@/api/client'
import { useToast } from '@/hooks/use-toast'
import type { AddVehicleFormValues } from '@/lib/schemas'
import { useState } from 'react'

export function AddVehiclePage() {
  const navigate = useNavigate()
  const createVehicle = useCreateVehicle()
  const toast = useToast()
  const [showLimitReached, setShowLimitReached] = useState(false)

  function handleSubmit(data: AddVehicleFormValues) {
    createVehicle.mutate(
      {
        year: data.year,
        make: data.make,
        model: data.model,
        nickname: data.nickname,
        current_mileage: data.current_mileage,
        weekly_miles_estimate: data.weekly_miles_estimate,
      },
      {
        onSuccess: (res) => {
          navigate(`/wrenchdue/vehicles/${res.data.vehicle_id}`)
        },
        onError: (error) => {
          if (error instanceof ApiRequestError && error.status === 403) {
            setShowLimitReached(true)
          } else {
            toast.error('Failed to add vehicle. Please try again.')
          }
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/wrenchdue')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Vehicles
        </Button>
      </div>

      <h1 className="text-2xl font-bold">Add a vehicle</h1>

      {showLimitReached ? (
        <UpgradePrompt
          message="Free accounts support 1 vehicle. Upgrade to Pro for unlimited."
        />
      ) : (
        <AddVehicleForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/wrenchdue')}
          isPending={createVehicle.isPending}
        />
      )}
    </div>
  )
}
