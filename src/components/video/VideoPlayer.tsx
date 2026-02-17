'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { saveVideoProgress, getVideoProgress, trackVideoStream } from '@/lib/video/actions'

interface VideoPlayerProps {
  src: string
  poster?: string
  lessonId: string
  enrollmentId?: string
  userId?: string
  orgId?: string
  duration?: number
  onComplete?: () => void
  onProgress?: (progress: { currentTime: number; duration: number; percent: number }) => void
  autoPlay?: boolean
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  lessonId,
  enrollmentId,
  userId,
  orgId,
  duration: initialDuration,
  onComplete,
  onProgress,
  autoPlay = false,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const watchTimeRef = useRef(0) // Accumulated watch time
  const lastTimeRef = useRef(0) // Last position for tracking
  const lastSaveRef = useRef(0) // Last saved position
  const streamTrackTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration ?? 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isResuming, setIsResuming] = useState(false)
  const [resumePosition, setResumePosition] = useState<number | null>(null)

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null)

  // Load saved progress on mount
  useEffect(() => {
    if (!enrollmentId) return

    const loadProgress = async () => {
      const result = await getVideoProgress({ lessonId, enrollmentId })
      if (result.success && result.data && result.data.lastPosition > 0) {
        setResumePosition(result.data.lastPosition)
        watchTimeRef.current = result.data.watchTime
      }
    }

    loadProgress()
  }, [lessonId, enrollmentId])

  // Handle progress saving (every 30 seconds while playing)
  useEffect(() => {
    if (!enrollmentId || !userId || !isPlaying) return

    progressSaveTimerRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || video.paused) return

      saveVideoProgress({
        lessonId,
        enrollmentId,
        userId,
        watchTime: Math.round(watchTimeRef.current),
        lastPosition: Math.round(video.currentTime),
        duration: video.duration,
      })

      lastSaveRef.current = video.currentTime
    }, 30000) // Save every 30 seconds

    return () => {
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current)
      }
    }
  }, [lessonId, enrollmentId, userId, isPlaying])

  // Track streaming bandwidth (estimate every 60 seconds)
  useEffect(() => {
    if (!orgId || !isPlaying) return

    streamTrackTimerRef.current = setInterval(() => {
      // Estimate: ~1.5MB per minute for 720p video
      const estimatedBytes = 1.5 * 1024 * 1024
      trackVideoStream({
        orgId,
        lessonId,
        bytesStreamed: estimatedBytes,
      })
    }, 60000)

    return () => {
      if (streamTrackTimerRef.current) {
        clearInterval(streamTrackTimerRef.current)
      }
    }
  }, [orgId, lessonId, isPlaying])

  // Save progress when component unmounts or video pauses
  const saveCurrentProgress = useCallback(() => {
    if (!enrollmentId || !userId || !videoRef.current) return

    const video = videoRef.current
    if (video.currentTime > lastSaveRef.current + 5) {
      // Only save if position changed by >5 seconds
      saveVideoProgress({
        lessonId,
        enrollmentId,
        userId,
        watchTime: Math.round(watchTimeRef.current),
        lastPosition: Math.round(video.currentTime),
        duration: video.duration,
      })
      lastSaveRef.current = video.currentTime
    }
  }, [lessonId, enrollmentId, userId])

  // Save on unmount
  useEffect(() => {
    return () => {
      saveCurrentProgress()
    }
  }, [saveCurrentProgress])

  // Auto-hide controls
  const resetHideControlsTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current)
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const newTime = video.currentTime
    setCurrentTime(newTime)

    // Track watch time (time actually watched, not seeking)
    if (newTime > lastTimeRef.current && newTime - lastTimeRef.current < 2) {
      watchTimeRef.current += newTime - lastTimeRef.current
    }
    lastTimeRef.current = newTime

    // Check for completion (90% watched)
    const percent = (newTime / video.duration) * 100
    onProgress?.({ currentTime: newTime, duration: video.duration, percent })

    if (percent >= 90 && !video.ended) {
      onComplete?.()
    }
  }, [onProgress, onComplete])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setDuration(video.duration)
    setIsLoading(false)
  }, [])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    saveCurrentProgress()
  }, [saveCurrentProgress])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    onComplete?.()
    saveCurrentProgress()
  }, [onComplete, saveCurrentProgress])

  // Control handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [])

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = value[0]
    video.currentTime = newTime
    setCurrentTime(newTime)
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(!isMuted)
  }, [isMuted])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  const handleResumeFromPosition = useCallback(() => {
    const video = videoRef.current
    if (!video || resumePosition === null) return

    video.currentTime = resumePosition
    setResumePosition(null)
    setIsResuming(false)
    video.play()
  }, [resumePosition])

  const handleStartFromBeginning = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setResumePosition(null)
    setIsResuming(false)
    video.currentTime = 0
    video.play()
  }, [])

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group aspect-video",
        className
      )}
      onMouseMove={resetHideControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        autoPlay={autoPlay}
        playsInline
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Resume from position dialog */}
      {resumePosition !== null && !isResuming && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center space-y-4 max-w-sm mx-4">
            <p className="text-gray-900 font-medium">Resume where you left off?</p>
            <p className="text-sm text-gray-500">
              You were at {formatTime(resumePosition)}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleStartFromBeginning}>
                Start Over
              </Button>
              <Button onClick={handleResumeFromPosition}>
                Resume
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && !isLoading && resumePosition === null && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
          >
            <Play className="h-12 w-12 text-white fill-white" />
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            {/* Skip buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => skip(-10)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => skip(10)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="w-20 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-sm tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs"
                >
                  {playbackRate}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={cn(playbackRate === rate && "bg-gray-100")}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  Quality: Auto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
