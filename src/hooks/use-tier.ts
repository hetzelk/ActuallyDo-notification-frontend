import { useSettings } from './use-settings'

export function useTier(appId: string = 'nagme') {
  const settingsQuery = useSettings()
  const tier = settingsQuery.data?.apps[appId]?.tier ?? 'free'

  return {
    tier,
    isFree: tier === 'free',
    isPro: tier === 'pro',
    isLoading: settingsQuery.isLoading,
  }
}
