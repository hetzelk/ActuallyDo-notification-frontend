import { VehicleCard } from './VehicleCard'
import type { Vehicle } from '@/lib/types'

interface VehicleListProps {
  vehicles: Vehicle[]
  onUpdateMileage: (vehicle: Vehicle) => void
  onViewDetails: (vehicleId: string) => void
}

export function VehicleList({ vehicles, onUpdateMileage, onViewDetails }: VehicleListProps) {
  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.vehicle_id}
          vehicle={vehicle}
          onUpdateMileage={onUpdateMileage}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  )
}
