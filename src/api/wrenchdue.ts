import { apiFetch } from './client'
import type {
  Vehicle,
  CreateVehicleRequest,
  UpdateMileageRequest,
} from '@/lib/types'

export async function listVehicles(): Promise<{ data: { vehicles: Vehicle[] } }> {
  return apiFetch('/apps/wrenchdue/vehicles')
}

export async function getVehicle(vehicleId: string): Promise<{ data: { vehicle: Vehicle } }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}`)
}

export async function createVehicle(data: CreateVehicleRequest): Promise<{ data: { vehicle_id: string }; message: string }> {
  return apiFetch('/apps/wrenchdue/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVehicle(vehicleId: string, data: Partial<CreateVehicleRequest>): Promise<{ message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteVehicle(vehicleId: string): Promise<{ message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}`, {
    method: 'DELETE',
  })
}

export async function updateMileage(vehicleId: string, data: UpdateMileageRequest): Promise<{ message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/mileage`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
