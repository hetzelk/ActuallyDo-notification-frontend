import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PlatformSettings, UpdateSettingsRequest } from '@/lib/types'

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
]

interface ProfileSectionProps {
  settings: PlatformSettings
  email: string
  onUpdate: (data: UpdateSettingsRequest) => void
}

export function ProfileSection({ settings, email, onUpdate }: ProfileSectionProps) {
  const [timezone, setTimezone] = useState(settings.timezone ?? '')
  const [reminderTime, setReminderTime] = useState(settings.reminder_time ?? '09:00')

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Profile</h2>

      <div className="space-y-2">
        <Label htmlFor="settings-email">Email</Label>
        <Input id="settings-email" value={email} disabled className="bg-muted" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-timezone">Timezone</Label>
        <select
          id="settings-timezone"
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value)
            onUpdate({ timezone: e.target.value })
          }}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select timezone...</option>
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-reminder-time">Daily reminder time</Label>
        <Input
          id="settings-reminder-time"
          type="time"
          value={reminderTime}
          onChange={(e) => {
            setReminderTime(e.target.value)
            onUpdate({ reminder_time: e.target.value })
          }}
        />
        <p className="text-xs text-muted-foreground">
          When you'll receive your daily digest email
        </p>
      </div>
    </section>
  )
}
