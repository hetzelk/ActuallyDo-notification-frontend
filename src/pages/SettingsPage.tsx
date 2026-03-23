import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { AppPreferencesSection } from '@/components/settings/AppPreferencesSection'
import { SubscriptionSection } from '@/components/settings/SubscriptionSection'
import { EmailDisabledBanner } from '@/components/settings/EmailDisabledBanner'
import { PushNotificationSection } from '@/components/settings/PushNotificationSection'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

export function SettingsPage() {
  const { user } = useAuth()
  const settingsQuery = useSettings()
  const { debouncedUpdate, showSaved, isPending } = useUpdateSettings()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Handle Stripe payment return URLs
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (!payment) return

    if (payment === 'success') {
      toast.success('Payment successful! Upgrading your account...')
      // Re-fetch settings after a short delay to allow webhook processing
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['settings'] })
      }, 3000)
      // Clean up the query param
      setSearchParams({}, { replace: true })
      return () => clearTimeout(timer)
    }

    if (payment === 'cancelled') {
      toast.info('Payment cancelled. No changes made.')
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load settings.</p>
      </div>
    )
  }

  const settings = settingsQuery.data

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="h-5">
          {isPending && (
            <span className="text-xs text-muted-foreground">
              <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {showSaved && !isPending && (
            <span className="text-xs text-muted-foreground">Saved</span>
          )}
        </div>
      </div>

      {settings.email_disabled && <EmailDisabledBanner />}

      <ProfileSection
        settings={settings}
        email={user?.email ?? ''}
        onUpdate={debouncedUpdate}
      />

      <AppPreferencesSection
        settings={settings}
        onUpdate={debouncedUpdate}
      />

      <PushNotificationSection
        pushSubscription={settings.push_subscription}
        onUpdate={debouncedUpdate}
      />

      <SubscriptionSection settings={settings} />
    </div>
  )
}
