import { AppPreferenceCard } from './AppPreferenceCard'
import type { PlatformSettings, UpdateSettingsRequest } from '@/lib/types'

interface AppPreferencesSectionProps {
  settings: PlatformSettings
  onUpdate: (data: UpdateSettingsRequest) => void
}

export function AppPreferencesSection({ settings, onUpdate }: AppPreferencesSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">My Apps</h2>
      <div className="space-y-3">
        {Object.entries(settings.apps).map(([appId, app]) => (
          <AppPreferenceCard
            key={appId}
            appId={appId}
            app={app}
            onToggleEnabled={(id, enabled) =>
              onUpdate({ apps: { [id]: { enabled } } })
            }
            onChangeFrequency={(id, frequency) =>
              onUpdate({ apps: { [id]: { frequency: frequency as 'daily' | 'weekly' | 'monthly' } } })
            }
            onChangeDay={(id, preferred_day) =>
              onUpdate({ apps: { [id]: { preferred_day } } })
            }
          />
        ))}
      </div>
    </section>
  )
}
