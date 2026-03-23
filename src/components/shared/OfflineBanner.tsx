import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline. Some features may be unavailable.</span>
    </div>
  )
}
