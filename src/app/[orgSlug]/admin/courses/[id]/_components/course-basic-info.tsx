'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { updateCourse } from '@/lib/courses/actions'
import { Loader2, Save, Image } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Course } from '@/lib/supabase/types'

interface CourseBasicInfoProps {
  course: Course
  orgSlug: string
}

const currencies = [
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
]

const difficultyLevels = [
  { value: '', label: 'Not specified' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function CourseBasicInfo({ course, orgSlug }: CourseBasicInfoProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [title, setTitle] = useState(course.title)
  const [slug, setSlug] = useState(course.slug)
  const [shortDescription, setShortDescription] = useState(course.short_description ?? '')
  const [description, setDescription] = useState(course.description ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? '')
  const [price, setPrice] = useState(course.price.toString())
  const [currency, setCurrency] = useState(course.currency)
  const [difficultyLevel, setDifficultyLevel] = useState(course.difficulty_level ?? '')
  const [estimatedDuration, setEstimatedDuration] = useState(
    course.estimated_duration?.toString() ?? ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!title.trim()) {
      setError('Course title is required')
      return
    }

    if (!slug.trim()) {
      setError('Course URL slug is required')
      return
    }

    startTransition(async () => {
      const result = await updateCourse({
        id: course.id,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        price: parseFloat(price) || 0,
        currency,
        difficultyLevel: difficultyLevel || undefined,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      })

      if (!result.success) {
        setError(result.error ?? 'Failed to update course')
        return
      }

      setSuccess(true)
      router.refresh()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>Course updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about your course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Course URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 shrink-0">/{orgSlug}/courses/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief one-line description"
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
              placeholder="Describe what students will learn..."
              rows={5}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
          <CardDescription>Course thumbnail and cover images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <div className="flex gap-4">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt="Thumbnail preview" 
                  className="h-24 w-40 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-24 w-40 rounded-lg bg-gray-100 flex items-center justify-center border">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 1280x720px (16:9 ratio)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Set the price for your course</CardDescription>
        </CardHeader>
        <CardContent>
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
                disabled={isPending}
              />
              <p className="text-xs text-gray-500">
                Enter 0 for free courses
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
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Optional information about your course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Difficulty Level</Label>
              <Select 
                value={difficultyLevel} 
                onValueChange={setDifficultyLevel} 
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                min="0"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="e.g., 120"
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
