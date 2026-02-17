'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  Circle,
  Play,
  FileText,
  HelpCircle,
  Clock,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VideoPlayer } from '@/components/video'
import { cn } from '@/lib/utils'
import type {
  Organization,
  CourseWithModules,
  Enrollment,
  Lesson,
  LessonProgress,
  AuthUser,
} from '@/lib/supabase/types'

interface LearningInterfaceProps {
  org: Organization
  orgSlug: string
  course: CourseWithModules
  enrollment: Enrollment
  selectedLesson: Lesson | null
  selectedModuleIndex: number
  progressMap: Record<string, LessonProgress>
  prevLesson: { lesson: Lesson; moduleTitle: string } | null
  nextLesson: { lesson: Lesson; moduleTitle: string } | null
  user: AuthUser
}

function getLessonIcon(type: Lesson['type']) {
  switch (type) {
    case 'video':
      return Play
    case 'text':
      return FileText
    case 'quiz':
      return HelpCircle
    default:
      return FileText
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs > 0 ? `${secs}s` : ''}`
}

export function LearningInterface({
  org,
  orgSlug,
  course,
  enrollment,
  selectedLesson,
  selectedModuleIndex,
  progressMap,
  prevLesson,
  nextLesson,
  user,
}: LearningInterfaceProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Calculate progress
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = Object.values(progressMap).filter(p => p.completed).length
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const navigateToLesson = useCallback((lessonId: string) => {
    router.push(`/${orgSlug}/learn/${course.slug}?lesson=${lessonId}`)
    setSidebarOpen(false)
  }, [router, orgSlug, course.slug])

  const handleLessonComplete = useCallback(() => {
    // Refresh the page to update progress
    router.refresh()
    
    // Auto-navigate to next lesson after a short delay
    if (nextLesson) {
      setTimeout(() => {
        navigateToLesson(nextLesson.lesson.id)
      }, 1000)
    }
  }, [router, nextLesson, navigateToLesson])

  const currentProgress = selectedLesson ? progressMap[selectedLesson.id] : null

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link 
            href={`/${orgSlug}/dashboard`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
            {course.title}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span>{completedLessons}/{totalLessons} lessons</span>
            <Progress value={progressPercent} className="w-24 h-2" />
            <span className="text-green-600 font-medium">{progressPercent}%</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-80 bg-white border-r flex flex-col shrink-0 transition-all duration-300",
            "fixed inset-y-14 left-0 z-40 lg:relative lg:inset-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <ScrollArea className="flex-1 py-4">
            <div className="space-y-2 px-3">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="space-y-1">
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module {moduleIndex + 1}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900 mt-1">
                      {module.title}
                    </h3>
                  </div>
                  
                  {module.lessons.map((lesson, lessonIndex) => {
                    const progress = progressMap[lesson.id]
                    const isCompleted = progress?.completed
                    const isSelected = selectedLesson?.id === lesson.id
                    const Icon = getLessonIcon(lesson.type)
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => navigateToLesson(lesson.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                          isSelected
                            ? "bg-green-50 text-green-700"
                            : "hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                          isCompleted
                            ? "bg-green-100 text-green-600"
                            : isSelected
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Icon className="h-3 w-3" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            isSelected ? "font-medium" : ""
                          )}>
                            {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                          </p>
                          {lesson.duration && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDuration(lesson.duration)}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedLesson ? (
            <>
              {/* Lesson Content */}
              <div className="flex-1 overflow-auto">
                {selectedLesson.type === 'video' && selectedLesson.video_url ? (
                  <div className="bg-black">
                    <div className="max-w-5xl mx-auto">
                      <VideoPlayer
                        src={selectedLesson.video_url}
                        lessonId={selectedLesson.id}
                        enrollmentId={enrollment.id}
                        userId={user.id}
                        orgId={org.id}
                        duration={selectedLesson.duration ?? undefined}
                        onComplete={handleLessonComplete}
                        autoPlay={false}
                      />
                    </div>
                  </div>
                ) : selectedLesson.type === 'text' ? (
                  <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="prose prose-gray max-w-none">
                      {selectedLesson.content ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                      ) : (
                        <p className="text-gray-500 italic">No content available for this lesson.</p>
                      )}
                    </div>
                  </div>
                ) : selectedLesson.type === 'quiz' ? (
                  <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="bg-green-50 rounded-lg p-8 text-center">
                      <HelpCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedLesson.title}
                      </h3>
                      {selectedLesson.description && (
                        <p className="text-sm text-gray-600 mt-2 mb-4">
                          {selectedLesson.description}
                        </p>
                      )}
                      <Link href={`/${orgSlug}/learn/${course.slug}/quiz/${selectedLesson.id}`}>
                        <Button className="mt-4 bg-green-600 hover:bg-green-700">
                          {currentProgress?.completed ? 'Retake Quiz' : 'Start Quiz'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedLesson.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedLesson.description || 'No content available.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lesson Info */}
                <div className="max-w-3xl mx-auto px-4 py-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedLesson.title}
                  </h1>
                  {selectedLesson.description && (
                    <p className="mt-2 text-gray-600">
                      {selectedLesson.description}
                    </p>
                  )}
                  
                  {currentProgress?.completed && (
                    <div className="mt-4 flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Lesson completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <footer className="border-t bg-white px-4 py-3 shrink-0">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                  {prevLesson ? (
                    <Button
                      variant="outline"
                      onClick={() => navigateToLesson(prevLesson.lesson.id)}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="text-center text-sm text-gray-500">
                    {selectedModuleIndex + 1} of {course.modules.length} modules
                  </div>

                  {nextLesson ? (
                    <Button
                      onClick={() => navigateToLesson(nextLesson.lesson.id)}
                      className="gap-2"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button disabled className="gap-2">
                      <span>Complete</span>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">No lesson selected</h2>
                <p className="text-gray-500 mt-2">
                  Choose a lesson from the sidebar to get started.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
