import { useLocation, useNavigate } from 'react-router-dom'
import { CheckSquare, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

const APPS = [
  { key: 'tuskdue', label: 'TuskDue', icon: CheckSquare, path: '/tuskdue' },
  { key: 'wrenchdue', label: 'WrenchDue', icon: Wrench, path: '/wrenchdue' },
] as const

function getCurrentApp(pathname: string): string {
  if (pathname.startsWith('/wrenchdue')) return 'wrenchdue'
  return 'tuskdue'
}

export function AppSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentApp = getCurrentApp(location.pathname)

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {APPS.map((app) => {
        const isActive = app.key === currentApp
        return (
          <button
            key={app.key}
            onClick={() => navigate(app.path)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <app.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{app.label}</span>
          </button>
        )
      })}
    </div>
  )
}
