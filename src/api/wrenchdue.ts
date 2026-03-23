import { apiFetch } from './client'
import type {
  Vehicle,
  MaintenanceItem,
  MaintenanceLogEntry,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UpdateMileageRequest,
  LogCompletionRequest,
  MaintenanceLogParams,
  CostSummaryParams,
  CostSummary,
  PaginatedResponse,
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

export async function updateVehicle(vehicleId: string, data: UpdateVehicleRequest): Promise<{ message: string }> {
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
  data: { name: string; interval_miles?: number | null; interval_months?: number | null; notify?: boolean; notes?: string },
): Promise<{ data: { item_id: string }; message: string }> {
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateItem(
  vehicleId: string,
  itemId: string,
  data: Partial<Pick<MaintenanceItem, 'interval_miles' | 'interval_months' | 'notify' | 'notes'>>,
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
  return apiFetch(`/apps/wrenchdue/vehicles/${vehicleId}/items/${itemId}/done`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Maintenance log (global route with optional vehicle_id filter)
export async function getLog(params: MaintenanceLogParams = {}): Promise<PaginatedResponse<MaintenanceLogEntry>> {
  const searchParams = new URLSearchParams()
  if (params.vehicle_id) searchParams.set('vehicle_id', params.vehicle_id)
  if (params.q) searchParams.set('q', params.q)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.next_token) searchParams.set('next_token', params.next_token)
  return apiFetch(`/apps/wrenchdue/log?${searchParams}`)
}

export async function exportLog(vehicleId?: string): Promise<string> {
  const params = vehicleId ? `?vehicle_id=${vehicleId}` : ''
  return apiFetch(`/apps/wrenchdue/log/export${params}`)
}

export async function importLog(csv: string): Promise<{ message: string }> {
  return apiFetch('/apps/wrenchdue/log/import', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  })
}

export async function getCostSummary(params: CostSummaryParams): Promise<{ data: CostSummary }> {
  const searchParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  })
  if (params.vehicle_id) searchParams.set('vehicle_id', params.vehicle_id)
  return apiFetch(`/apps/wrenchdue/costs?${searchParams}`)
}
