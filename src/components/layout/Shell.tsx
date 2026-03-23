import { Outlet } from 'react-router-dom'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { Navbar } from '@/components/layout/Navbar'

export function Shell() {
  const isOnline = useOnlineStatus()

  return (
    <div className="min-h-screen bg-background">
      {!isOnline && <OfflineBanner />}
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
