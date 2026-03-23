import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { useTask, useUpdateTask } from '@/hooks/use-task'
import { useCompleteTask, useSnoozeTask, useDeleteTask } from '@/hooks/use-tasks'

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const taskQuery = useTask(taskId!)
  const updateMutation = useUpdateTask(taskId!)
  const completeMutation = useCompleteTask()
  const snoozeMutation = useSnoozeTask()
  const deleteMutation = useDeleteTask()

  function handleDelete() {
    deleteMutation.mutate(taskId!, {
      onSuccess: () => navigate('/tuskdue', { replace: true }),
    })
  }

  if (taskQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (taskQuery.isError || !taskQuery.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found.</p>
        <Button variant="link" onClick={() => navigate('/tuskdue')}>
          Back to tasks
        </Button>
      </div>
    )
  }

  const task = taskQuery.data.data

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/tuskdue')}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <TaskDetail
        task={task}
        onUpdate={(data) => updateMutation.mutate(data)}
        onComplete={(id) => {
          completeMutation.mutate(id, {
            onSuccess: () => navigate('/tuskdue', { replace: true }),
          })
        }}
        onSnooze={(id, days) => {
          snoozeMutation.mutate({ taskId: id, days }, {
            onSuccess: () => navigate('/tuskdue', { replace: true }),
          })
        }}
        onDelete={() => setShowDeleteDialog(true)}
        isUpdating={updateMutation.isPending}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{task.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
