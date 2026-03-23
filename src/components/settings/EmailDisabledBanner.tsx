import { AlertTriangle } from 'lucide-react'

export function EmailDisabledBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Email notifications paused</p>
        <p className="text-sm mt-1">
          Your email address appears to be bouncing. Email notifications have been paused.
          Please verify your email is correct or contact support.
        </p>
      </div>
    </div>
  )
}
