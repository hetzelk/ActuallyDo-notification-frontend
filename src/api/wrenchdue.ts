import { apiFetch } from './client'
import type {
  Vehicle,
  MaintenanceItem,
  MaintenanceLogEntry,
  CreateVehicleRequest,
  UpdateMileageRequest,
  LogCompletionRequest,
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

// Maintenance items
export async function listItems(vehicleId: string): Promise<{ data: { items: MaintenanceItem[] } }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items`)
}

export async function createItem(
  vehicleId: string,
  data: { name: string; interval_miles?: number | null; interval_months?: number | null; notes?: string },
): Promise<{ data: { item_id: string }; message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateItem(
  vehicleId: string,
  itemId: string,
  data: Partial<Pick<MaintenanceItem, 'name' | 'interval_miles' | 'interval_months' | 'notify' | 'notes'>>,
): Promise<{ message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteItem(vehicleId: string, itemId: string): Promise<{ message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items/${itemId}`, {
    method: 'DELETE',
  })
}

export async function logCompletion(
  vehicleId: string,
  itemId: string,
  data: LogCompletionRequest,
): Promise<{ data: { log_id: string }; message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items/${itemId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Maintenance log
export async function getLog(vehicleId: string): Promise<{ data: { entries: MaintenanceLogEntry[] } }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/log`)
}
