import { Outlet } from 'react-router-dom'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function Shell() {
  const isOnline = useOnlineStatus()

  return (
    <div className="min-h-screen bg-background">
      {!isOnline && <OfflineBanner />}
      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-semibold">ActuallyDo</span>
          {/* Navbar will be added in Phase 15 */}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
