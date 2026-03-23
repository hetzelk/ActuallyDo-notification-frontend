import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestMagicLink } from '@/api/auth'
import { ApiRequestError } from '@/api/client'
import { useToast } from '@/hooks/use-toast'

const magicLinkRequestSchema = z.object({
  email: z.email('Please enter a valid email address'),
})

type MagicLinkRequestValues = z.infer<typeof magicLinkRequestSchema>

interface MagicLinkRequestFormProps {
  onCodeSent: (email: string) => void
}

export function MagicLinkRequestForm({ onCodeSent }: MagicLinkRequestFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MagicLinkRequestValues>({
    resolver: zodResolver(magicLinkRequestSchema),
  })

  async function onSubmit(data: MagicLinkRequestValues) {
    setServerError(null)
    try {
      await requestMagicLink(data.email)
      onCodeSent(data.email)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.message)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send magic link
      </Button>
    </form>
  )
}
