import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Clock, Lock } from 'lucide-react'
import { SNOOZE_OPTIONS } from '@/lib/constants'

interface SnoozeDropdownProps {
  onSnooze: (days: number) => void
  isPro?: boolean
  disabled?: boolean
}

export function SnoozeDropdown({ onSnooze, isPro = false, disabled }: SnoozeDropdownProps) {
  const options = SNOOZE_OPTIONS.free

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
      >
        <Clock className="h-3.5 w-3.5" />
        Snooze
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((days) => (
          <DropdownMenuItem key={days} onClick={() => onSnooze(days)}>
            Snooze {days} day{days === 1 ? '' : 's'}
          </DropdownMenuItem>
        ))}
        {!isPro && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-muted-foreground">
              <Lock className="mr-2 h-3.5 w-3.5" />
              Custom... Pro
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
