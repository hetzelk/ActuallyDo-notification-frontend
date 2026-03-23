import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ResultStatus = 'success' | 'already_used' | 'expired' | 'error'

interface ResultConfig {
  icon: typeof CheckCircle2
  iconColor: string
  heading: string
  defaultMessage: string
}

const RESULT_CONFIGS: Record<ResultStatus, ResultConfig> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    heading: 'Done!',
    defaultMessage: 'Your action was completed successfully.',
  },
  already_used: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    heading: 'Already processed',
    defaultMessage: 'This action link has already been used.',
  },
  expired: {
    icon: Clock,
    iconColor: 'text-muted-foreground',
    heading: 'Link expired',
    defaultMessage: 'This action link has expired. Please use a newer email.',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-destructive',
    heading: 'Something went wrong',
    defaultMessage: 'We couldn\'t process your request. Please try again from the app.',
  },
}

export function ActionResultPage() {
  const [searchParams] = useSearchParams()
  const status = (searchParams.get('status') ?? 'error') as ResultStatus
  const message = searchParams.get('message')

  const config = RESULT_CONFIGS[status] ?? RESULT_CONFIGS.error
  const Icon = config.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          <Icon className={cn('h-16 w-16 mx-auto', config.iconColor)} />
          <h1 className="text-2xl font-bold">{config.heading}</h1>
          <p className="text-muted-foreground">
            {message ? decodeURIComponent(message) : config.defaultMessage}
          </p>
          <Link to="/">
            <Button variant="outline" className="mt-4">
              Open ActuallyDo
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
