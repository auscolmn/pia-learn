'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Video, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getVideoUploadUrl, completeVideoUpload, deleteVideo } from '@/lib/video/actions'

interface VideoUploaderProps {
  orgId: string
  lessonId: string
  currentVideoUrl?: string | null
  currentVideoPath?: string | null
  onUploadComplete?: (videoUrl: string, duration?: number) => void
  onDelete?: () => void
  disabled?: boolean
}

type UploadState = 'idle' | 'preparing' | 'uploading' | 'processing' | 'complete' | 'error'

export function VideoUploader({
  orgId,
  lessonId,
  currentVideoUrl,
  currentVideoPath,
  onUploadComplete,
  onDelete,
  disabled = false,
}: VideoUploaderProps) {
  const [state, setState] = useState<UploadState>(currentVideoUrl ? 'complete' : 'idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(currentVideoUrl ?? null)
  const [videoPath, setVideoPath] = useState<string | null>(currentVideoPath ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const resetState = useCallback(() => {
    setState('idle')
    setProgress(0)
    setError(null)
    setVideoUrl(null)
    setVideoPath(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setError(null)
    setState('preparing')

    // Validate file
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.')
      setState('error')
      return
    }

    const MAX_SIZE = 500 * 1024 * 1024 // 500MB
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 500MB.')
      setState('error')
      return
    }

    try {
      // Get upload URL from server
      const result = await getVideoUploadUrl({
        orgId,
        lessonId,
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Failed to prepare upload')
      }

      const { uploadUrl, videoPath: newVideoPath } = result.data
      setVideoPath(newVideoPath)
      setState('uploading')

      // Upload directly to Supabase Storage
      abortControllerRef.current = new AbortController()
      
      const xhr = new XMLHttpRequest()
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100)
            setProgress(pct)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)

        // Store abort function
        abortControllerRef.current!.signal.addEventListener('abort', () => {
          xhr.abort()
        })
      })

      setState('processing')

      // Try to get video duration
      let duration: number | undefined
      try {
        duration = await getVideoDuration(file)
      } catch {
        // Duration detection failed - that's okay
      }

      // Complete upload on server
      const completeResult = await completeVideoUpload({
        orgId,
        lessonId,
        videoPath: newVideoPath,
        fileSize: file.size,
        duration,
      })

      if (!completeResult.success || !completeResult.data) {
        throw new Error(completeResult.error ?? 'Failed to complete upload')
      }

      setVideoUrl(completeResult.data.videoUrl)
      setState('complete')
      onUploadComplete?.(completeResult.data.videoUrl, duration)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }, [orgId, lessonId, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || state === 'uploading' || state === 'processing') return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }, [disabled, state, handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleDelete = useCallback(async () => {
    if (!videoPath) return

    try {
      await deleteVideo({
        orgId,
        lessonId,
        videoPath,
      })
      resetState()
      onDelete?.()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete video')
    }
  }, [orgId, lessonId, videoPath, resetState, onDelete])

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort()
    resetState()
  }, [resetState])

  // Render complete state with video preview
  if (state === 'complete' && videoUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
            preload="metadata"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Video uploaded</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    )
  }

  // Render uploading state
  if (state === 'uploading' || state === 'processing') {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {state === 'uploading' ? 'Uploading video...' : 'Processing...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {state === 'uploading' ? 'Please wait while your video uploads' : 'Almost done!'}
            </p>
          </div>
        </div>
        
        {state === 'uploading' && (
          <>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-xs text-gray-500">{progress}%</p>
          </>
        )}

        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Render error state
  if (state === 'error') {
    return (
      <div className="border-2 border-dashed border-red-200 rounded-lg p-6 bg-red-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-900">Upload failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={resetState}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Render idle state (dropzone)
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
        isDragging
          ? "border-green-400 bg-green-50"
          : "border-gray-200 hover:border-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={cn(
          "p-3 rounded-full",
          isDragging ? "bg-green-100" : "bg-gray-100"
        )}>
          {isDragging ? (
            <Video className="h-6 w-6 text-green-600" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isDragging ? 'Drop your video here' : 'Upload a video'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Drag & drop or click to select (max 500MB)
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={disabled}>
          Select File
        </Button>
      </div>
    </div>
  )
}

// Helper to get video duration from a file
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration))
    }

    video.onerror = () => {
      reject(new Error('Could not load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}
