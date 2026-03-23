import { useCallback, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '@/api/settings'
import type { UpdateSettingsRequest } from '@/lib/types'
import { useToast } from './use-toast'
import { DEBOUNCE_MS } from '@/lib/constants'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mutation = useMutation({
    mutationFn: (data: UpdateSettingsRequest) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setShowSaved(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
    },
    onError: () => {
      toast.error('Failed to save settings. Please try again.')
    },
  })

  const debouncedUpdate = useCallback(
    (data: UpdateSettingsRequest) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        mutation.mutate(data)
      }, DEBOUNCE_MS)
    },
    [mutation]
  )

  return { debouncedUpdate, showSaved, isPending: mutation.isPending }
}
