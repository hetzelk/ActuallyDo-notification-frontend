import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listVehicles,
  createVehicle,
  deleteVehicle,
  updateMileage,
} from '@/api/wrenchdue'
import type { CreateVehicleRequest, UpdateMileageRequest } from '@/lib/types'
import { useToast } from './use-toast'

export function useVehicles() {
  return useQuery({
    queryKey: ['wrenchdue', 'vehicles'],
    queryFn: async () => {
      const res = await listVehicles()
      return res.data.vehicles
    },
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (data: CreateVehicleRequest) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles'] })
      toast.success('Vehicle added!')
    },
    onError: () => {
      toast.error('Failed to add vehicle. Please try again.')
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles'] })
      toast.success('Vehicle deleted.')
    },
    onError: () => {
      toast.error('Failed to delete vehicle.')
    },
  })
}

export function useUpdateMileage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: UpdateMileageRequest }) =>
      updateMileage(vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles'] })
      toast.success('Mileage updated!')
    },
    onError: () => {
      toast.error('Failed to update mileage.')
    },
  })
}
