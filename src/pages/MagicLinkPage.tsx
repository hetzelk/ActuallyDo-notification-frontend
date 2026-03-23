import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MagicLinkRequestForm } from '@/components/auth/MagicLinkRequestForm'
import { MagicLinkVerifyForm } from '@/components/auth/MagicLinkVerifyForm'
import { useAuth } from '@/hooks/use-auth'

export function MagicLinkPage() {
  const { isAuthenticated } = useAuth()
  const [sentToEmail, setSentToEmail] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/tuskdue" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {sentToEmail ? 'Check your email' : 'Sign in with magic link'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentToEmail ? (
            <MagicLinkVerifyForm
              email={sentToEmail}
              onBack={() => setSentToEmail(null)}
            />
          ) : (
            <MagicLinkRequestForm onCodeSent={setSentToEmail} />
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-center">
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
