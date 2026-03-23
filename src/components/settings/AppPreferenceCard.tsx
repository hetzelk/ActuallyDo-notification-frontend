import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { AppSettings } from '@/lib/types'

interface AppPreferenceCardProps {
  appId: string
  app: AppSettings
  onToggleEnabled: (appId: string, enabled: boolean) => void
  onChangeFrequency: (appId: string, frequency: string) => void
  onChangeDay: (appId: string, day: string | null) => void
}

const FREQUENCY_OPTIONS = ['daily', 'weekly', 'monthly'] as const
const DAY_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function AppPreferenceCard({
  appId,
  app,
  onToggleEnabled,
  onChangeFrequency,
  onChangeDay,
}: AppPreferenceCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{app.app_name}</span>
          <Badge variant={app.tier === 'pro' ? 'default' : 'secondary'} className="text-xs">
            {app.tier === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>
        <Switch
          checked={app.enabled}
          onCheckedChange={(checked) => onToggleEnabled(appId, checked)}
        />
      </div>

      {app.enabled && (
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Frequency</label>
            <select
              value={app.frequency}
              onChange={(e) => onChangeFrequency(appId, e.target.value)}
              className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {app.frequency === 'weekly' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Preferred day</label>
              <select
                value={app.preferred_day ?? ''}
                onChange={(e) => onChangeDay(appId, e.target.value || null)}
                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Any day</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
