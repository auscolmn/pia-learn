'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Circle,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CourseWithModules, LessonProgress } from '@/lib/supabase/types'

interface CourseSidebarProps {
  course: CourseWithModules
  selectedLessonId: string | undefined
  progressMap: Record<string, LessonProgress>
  onLessonSelect: (lessonId: string) => void
}

function getLessonIcon(type: string) {
  switch (type) {
    case 'video':
      return PlayCircle
    case 'text':
      return FileText
    case 'quiz':
      return HelpCircle
    default:
      return BookOpen
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 1) return `${secs}s`
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CourseSidebar({
  course,
  selectedLessonId,
  progressMap,
  onLessonSelect,
}: CourseSidebarProps) {
  // Find which module contains the selected lesson to open it by default
  const selectedModuleIndex = course.modules.findIndex(m =>
    m.lessons.some(l => l.id === selectedLessonId)
  )

  const [openModules, setOpenModules] = useState<string[]>(
    selectedModuleIndex >= 0 
      ? [course.modules[selectedModuleIndex].id] 
      : course.modules.length > 0 
        ? [course.modules[0].id] 
        : []
  )

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  return (
    <div className="py-2">
      {course.modules.map((module, moduleIndex) => {
        const moduleLessons = module.lessons
        const completedInModule = moduleLessons.filter(
          l => progressMap[l.id]?.completed
        ).length
        const isOpen = openModules.includes(module.id)

        return (
          <Collapsible
            key={module.id}
            open={isOpen}
            onOpenChange={() => toggleModule(module.id)}
          >
            <CollapsibleTrigger asChild>
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Module {moduleIndex + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {completedInModule}/{moduleLessons.length}
                    </span>
                  </div>
                  <h3 className="font-medium truncate">{module.title}</h3>
                </div>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    isOpen && "rotate-180"
                  )} 
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="pb-2">
                {moduleLessons.map((lesson, lessonIndex) => {
                  const isSelected = lesson.id === selectedLessonId
                  const isComplete = progressMap[lesson.id]?.completed ?? false
                  const LessonIcon = getLessonIcon(lesson.type)

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onLessonSelect(lesson.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected 
                          ? "bg-primary/10 border-l-2 border-primary" 
                          : "hover:bg-muted/50 border-l-2 border-transparent",
                      )}
                    >
                      {/* Completion Status */}
                      <div className="shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <LessonIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span 
                            className={cn(
                              "truncate text-sm",
                              isSelected && "font-medium",
                              isComplete && "text-muted-foreground"
                            )}
                          >
                            {lesson.title}
                          </span>
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-muted-foreground ml-6">
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
