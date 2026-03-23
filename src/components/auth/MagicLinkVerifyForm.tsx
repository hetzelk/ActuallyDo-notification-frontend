import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyMagicLink, requestMagicLink } from '@/api/auth'
import { useAuth } from '@/hooks/use-auth'
import { ApiRequestError } from '@/api/client'
import { useToast } from '@/hooks/use-toast'

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

interface MagicLinkVerifyFormProps {
  email: string
  onBack: () => void
}

export function MagicLinkVerifyForm({ email, onBack }: MagicLinkVerifyFormProps) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { login: storeTokens } = useAuth()
  const toast = useToast()

  // Focus the code input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleVerify = useCallback(
    async (verifyCode: string) => {
      setServerError(null)
      setIsVerifying(true)
      try {
        const tokens = await verifyMagicLink(email, verifyCode)
        storeTokens(tokens)
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.status === 401) {
            setServerError('Invalid or expired code')
          } else {
            setServerError(err.message)
          }
        } else {
          toast.error('Something went wrong. Please try again.')
        }
        setCode('')
        inputRef.current?.focus()
      } finally {
        setIsVerifying(false)
      }
    },
    [email, storeTokens, toast]
  )

  function handleCodeChange(value: string) {
    // Only allow digits
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    setServerError(null)

    // Auto-submit when all digits entered
    if (digits.length === CODE_LENGTH) {
      handleVerify(digits)
    }
  }

  async function handleResend() {
    setIsResending(true)
    try {
      await requestMagicLink(email)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success('A new code has been sent to your email.')
    } catch {
      toast.error('Could not resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        We sent a 6-digit code to <strong>{email}</strong>
      </p>

      <div className="space-y-2">
        <Label htmlFor="magic-code">Verification code</Label>
        <Input
          ref={inputRef}
          id="magic-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          disabled={isVerifying}
          className="text-center text-2xl tracking-[0.5em] font-mono"
        />
      </div>

      {serverError && (
        <p className="text-sm text-destructive text-center" role="alert">
          {serverError}
        </p>
      )}

      {isVerifying && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying...
        </div>
      )}

      <div className="flex flex-col gap-2 text-sm text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
        >
          {isResending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : 'Resend code'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}
