import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVehicle,
  listItems,
  getLog,
  logCompletion,
  deleteItem,
} from '@/api/wrenchdue'
import type { LogCompletionRequest } from '@/lib/types'
import { useToast } from './use-toast'

export function useVehicle(vehicleId: string) {
  return useQuery({
    queryKey: ['wrenchdue', 'vehicles', vehicleId],
    queryFn: async () => {
      const res = await getVehicle(vehicleId)
      return res.data.vehicle
    },
    enabled: !!vehicleId,
  })
}

export function useMaintenanceItems(vehicleId: string) {
  return useQuery({
    queryKey: ['wrenchdue', 'vehicles', vehicleId, 'items'],
    queryFn: async () => {
      const res = await listItems(vehicleId)
      return res.data.items
    },
    enabled: !!vehicleId,
  })
}

export function useMaintenanceLog(vehicleId: string) {
  return useQuery({
    queryKey: ['wrenchdue', 'log', { vehicle_id: vehicleId }],
    queryFn: async () => {
      const res = await getLog({ vehicle_id: vehicleId })
      return res.data
    },
    enabled: !!vehicleId,
  })
}

export function useLogCompletion(vehicleId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: LogCompletionRequest }) =>
      logCompletion(vehicleId, itemId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles', vehicleId, 'items'] })
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles', vehicleId, 'log'] })
      toast.success(res.message)
    },
    onError: () => {
      toast.error('Failed to log completion.')
    },
  })
}

export function useDeleteItem(vehicleId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (itemId: string) => deleteItem(vehicleId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrenchdue', 'vehicles', vehicleId, 'items'] })
      toast.success('Item deleted.')
    },
    onError: () => {
      toast.error('Failed to delete item.')
    },
  })
}
