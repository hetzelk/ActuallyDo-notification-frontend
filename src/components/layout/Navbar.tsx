import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Settings, LogOut, CheckSquare, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'

const APP_META: Record<string, { label: string; icon: typeof CheckSquare; path: string }> = {
  tuskdue: { label: 'TuskDue', icon: CheckSquare, path: '/tuskdue' },
  wrenchdue: { label: 'WrenchDue', icon: Wrench, path: '/wrenchdue' },
}

function getCurrentApp(pathname: string): string {
  if (pathname.startsWith('/wrenchdue')) return 'wrenchdue'
  return 'tuskdue'
}

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentApp = getCurrentApp(location.pathname)
  const meta = APP_META[currentApp]

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
        <Link to={meta.path} className="flex items-center gap-2 text-lg font-semibold hover:opacity-80 transition-opacity">
          <meta.icon className="h-5 w-5" />
          <span>{meta.label}</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center rounded-lg h-8 px-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{user?.email ?? 'Account'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              {user?.email && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="max-w-[200px] truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </DropdownMenuGroup>
              )}
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
