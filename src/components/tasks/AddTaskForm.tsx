import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const addTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  notes: z.string().max(1000).optional(),
  due_date: z.string().optional(),
})

type AddTaskFormValues = z.infer<typeof addTaskSchema>

interface AddTaskFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AddTaskFormValues) => Promise<void>
}

export function AddTaskForm({ open, onClose, onSubmit }: AddTaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: { title: '', notes: '', due_date: '' },
  })

  async function handleFormSubmit(data: AddTaskFormValues) {
    const cleaned = {
      title: data.title,
      notes: data.notes || undefined,
      due_date: data.due_date || undefined,
    }
    await onSubmit(cleaned)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What do you need to do?"
              autoFocus
              disabled={isSubmitting}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              placeholder="Optional details..."
              rows={3}
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('notes')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due date</Label>
            <Input
              id="due_date"
              type="date"
              disabled={isSubmitting}
              {...register('due_date')}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to add to your backlog
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
