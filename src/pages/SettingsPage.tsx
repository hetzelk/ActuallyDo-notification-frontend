import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { AppPreferencesSection } from '@/components/settings/AppPreferencesSection'
import { SubscriptionSection } from '@/components/settings/SubscriptionSection'
import { EmailDisabledBanner } from '@/components/settings/EmailDisabledBanner'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import { useAuth } from '@/hooks/use-auth'

export function SettingsPage() {
  const { user } = useAuth()
  const settingsQuery = useSettings()
  const { debouncedUpdate, showSaved, isPending } = useUpdateSettings()

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

      <SubscriptionSection settings={settings} />
    </div>
  )
}
