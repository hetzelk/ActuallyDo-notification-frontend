import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpgradePromptProps {
  message: string
  description?: string
}

export function UpgradePrompt({ message, description }: UpgradePromptProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
      <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-3" />
      <p className="font-medium mb-1">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <Button onClick={() => navigate('/settings')}>
        Upgrade to Pro
      </Button>
    </div>
  )
}
