'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createModule, updateModule } from '@/lib/courses/actions'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Module } from '@/lib/supabase/types'

interface ModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  module: Module | null
  onSuccess: () => void
}

export function ModuleDialog({ 
  open, 
  onOpenChange, 
  courseId, 
  module, 
  onSuccess 
}: ModuleDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const isEditing = !!module

  // Reset form when dialog opens/closes or module changes
  useEffect(() => {
    if (open) {
      setTitle(module?.title ?? '')
      setDescription(module?.description ?? '')
      setError(null)
    }
  }, [open, module])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Module title is required')
      return
    }

    startTransition(async () => {
      let result
      
      if (isEditing) {
        result = await updateModule({
          id: module.id,
          title: title.trim(),
          description: description.trim() || undefined,
        })
      } else {
        result = await createModule({
          courseId,
          title: title.trim(),
          description: description.trim() || undefined,
        })
      }

      if (!result.success) {
        setError(result.error ?? 'Failed to save module')
        return
      }

      onSuccess()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Module' : 'Add Module'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the module details.' 
                : 'Create a new module for your course curriculum.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="moduleTitle">Module Title *</Label>
              <Input
                id="moduleTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Getting Started"
                disabled={isPending}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moduleDescription">Description (optional)</Label>
              <Textarea
                id="moduleDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this module covers..."
                rows={3}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Module'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
