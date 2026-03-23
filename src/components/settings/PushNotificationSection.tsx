import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { VAPID_PUBLIC_KEY } from '@/lib/constants'
import type { UpdateSettingsRequest } from '@/lib/types'

interface PushNotificationSectionProps {
  pushSubscription: PushSubscriptionJSON | null
  onUpdate: (data: UpdateSettingsRequest) => void
}

type PushStatus = 'loading' | 'unsupported' | 'denied' | 'enabled' | 'disabled'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationSection({ pushSubscription, onUpdate }: PushNotificationSectionProps) {
  const [status, setStatus] = useState<PushStatus>('loading')
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    setStatus(pushSubscription ? 'enabled' : 'disabled')
  }, [pushSubscription])

  async function handleToggle(checked: boolean) {
    setIsToggling(true)
    try {
      if (checked) {
        await subscribe()
      } else {
        await unsubscribe()
      }
    } finally {
      setIsToggling(false)
    }
  }

  async function subscribe() {
    const permission = await Notification.requestPermission()
    if (permission === 'denied') {
      setStatus('denied')
      return
    }
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    onUpdate({ push_subscription: subscription.toJSON() })
    setStatus('enabled')
  }

  async function unsubscribe() {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }

    onUpdate({ push_subscription: null })
    setStatus('disabled')
  }

  if (status === 'unsupported') {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Push Notifications</h2>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Push Notifications</h2>
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'enabled' ? (
              <Bell className="h-4 w-4 text-foreground" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="push-toggle">
              {status === 'enabled' ? 'Notifications on' : 'Notifications off'}
            </Label>
          </div>
          <Switch
            id="push-toggle"
            checked={status === 'enabled'}
            onCheckedChange={handleToggle}
            disabled={status === 'denied' || status === 'loading' || isToggling}
          />
        </div>

        {status === 'denied' && (
          <p className="text-sm text-destructive">
            Notifications are blocked in your browser. Update your browser settings to enable them.
          </p>
        )}

        {status === 'enabled' && (
          <p className="text-sm text-muted-foreground">
            You'll receive push notifications for task reminders and maintenance alerts.
          </p>
        )}

        {status === 'disabled' && (
          <p className="text-sm text-muted-foreground">
            Enable push notifications to get reminders even when the app is closed.
          </p>
        )}
      </div>
    </section>
  )
}
