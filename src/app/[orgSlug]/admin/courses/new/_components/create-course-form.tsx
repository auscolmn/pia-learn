'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCourse } from '@/lib/courses/actions'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CreateCourseFormProps {
  orgId: string
  orgSlug: string
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const currencies = [
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
]

export function CreateCourseForm({ orgId, orgSlug }: CreateCourseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('AUD')
  const [slugEdited, setSlugEdited] = useState(false)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugEdited) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Course title is required')
      return
    }

    if (!slug.trim()) {
      setError('Course URL slug is required')
      return
    }

    startTransition(async () => {
      const result = await createCourse({
        orgId,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        price: price ? parseFloat(price) : 0,
        currency,
      })

      if (!result.success) {
        setError(result.error ?? 'Failed to create course')
        return
      }

      if (result.data) {
        router.push(`/${orgSlug}/admin/courses/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Introduction to Psychedelic Science"
          disabled={isPending}
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">Course URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">/{orgSlug}/courses/</span>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="course-slug"
            className="flex-1"
            disabled={isPending}
          />
        </div>
        <p className="text-xs text-gray-500">
          Only lowercase letters, numbers, and hyphens allowed
        </p>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input
          id="shortDescription"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="A brief one-line description for cards and previews"
          maxLength={160}
          disabled={isPending}
        />
        <p className="text-xs text-gray-500">
          {shortDescription.length}/160 characters
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what students will learn in this course..."
          rows={4}
          disabled={isPending}
        />
      </div>

      {/* Pricing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            disabled={isPending}
          />
          <p className="text-xs text-gray-500">
            Leave empty or 0 for free courses
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="flex-1 sm:flex-initial"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1 sm:flex-initial">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Course'
          )}
        </Button>
      </div>
    </form>
  )
}
