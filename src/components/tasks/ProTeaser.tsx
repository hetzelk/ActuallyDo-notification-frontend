import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProTeaser() {
  const navigate = useNavigate()

  return (
    <div className="rounded-lg border border-dashed border-border p-4 mt-4 flex items-center gap-3">
      <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Unlock Pro features</p>
        <p className="text-xs text-muted-foreground">
          Unlimited tasks, custom snooze, and heads-up reminders.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
        Upgrade
      </Button>
    </div>
  )
}
