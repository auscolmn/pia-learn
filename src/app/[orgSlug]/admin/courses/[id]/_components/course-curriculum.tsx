'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { CourseWithModules, ModuleWithLessons, Lesson, LessonType } from '@/lib/supabase/types'
import { ModuleDialog } from './module-dialog'
import { LessonDialog } from './lesson-dialog'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import { deleteModule, deleteLesson } from '@/lib/courses/actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CourseCurriculumProps {
  course: CourseWithModules
}

function getLessonIcon(type: LessonType) {
  switch (type) {
    case 'video':
      return Video
    case 'text':
      return FileText
    case 'quiz':
      return HelpCircle
    default:
      return FileText
  }
}

function getLessonTypeLabel(type: LessonType) {
  switch (type) {
    case 'video':
      return 'Video'
    case 'text':
      return 'Text'
    case 'quiz':
      return 'Quiz'
    default:
      return type
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const router = useRouter()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map(m => m.id)) // All expanded by default
  )
  
  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<ModuleWithLessons | null>(null)
  
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'module' | 'lesson'; id: string; name: string } | null>(null)

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleAddModule = () => {
    setEditingModule(null)
    setModuleDialogOpen(true)
  }

  const handleEditModule = (module: ModuleWithLessons) => {
    setEditingModule(module)
    setModuleDialogOpen(true)
  }

  const handleAddLesson = (moduleId: string) => {
    setEditingLesson(null)
    setLessonModuleId(moduleId)
    setLessonDialogOpen(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonModuleId(lesson.module_id)
    setLessonDialogOpen(true)
  }

  const handleDeleteModule = (module: ModuleWithLessons) => {
    setDeleteTarget({ type: 'module', id: module.id, name: module.title })
    setDeleteDialogOpen(true)
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    setDeleteTarget({ type: 'lesson', id: lesson.id, name: lesson.title })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'module') {
      await deleteModule(deleteTarget.id)
    } else {
      await deleteLesson(deleteTarget.id)
    }

    setDeleteDialogOpen(false)
    setDeleteTarget(null)
    router.refresh()
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((lacc, l) => lacc + (l.duration ?? 0), 0), 
    0
  )

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>
                {course.modules.length} modules • {totalLessons} lessons
                {totalDuration > 0 && ` • ${formatDuration(totalDuration)} total`}
              </CardDescription>
            </div>
            <Button onClick={handleAddModule}>
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Modules List */}
      {course.modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No modules yet</h3>
            <p className="mt-2 text-sm text-gray-600 text-center max-w-sm">
              Start building your course curriculum by adding your first module.
            </p>
            <Button onClick={handleAddModule} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Add First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.id)
            const Icon = isExpanded ? ChevronDown : ChevronRight

            return (
              <Card key={module.id}>
                {/* Module Header */}
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleModule(module.id)}
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-grab shrink-0" />
                  <Icon className="h-5 w-5 text-gray-400 shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Module {moduleIndex + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-gray-500 truncate">{module.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleAddLesson(module.id)
                        }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Lesson
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleEditModule(module)
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Module
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteModule(module)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Lessons */}
                {isExpanded && (
                  <div className="border-t">
                    {module.lessons.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-gray-500 mb-3">No lessons in this module</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddLesson(module.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Lesson
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const LessonIcon = getLessonIcon(lesson.type)
                          
                          return (
                            <div 
                              key={lesson.id}
                              className="flex items-center gap-3 px-4 py-3 pl-12 hover:bg-gray-50 transition-colors"
                            >
                              <GripVertical className="h-4 w-4 text-gray-300 cursor-grab shrink-0" />
                              
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                                lesson.type === 'video' && "bg-blue-50 text-blue-600",
                                lesson.type === 'text' && "bg-purple-50 text-purple-600",
                                lesson.type === 'quiz' && "bg-orange-50 text-orange-600",
                              )}>
                                <LessonIcon className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    {moduleIndex + 1}.{lessonIndex + 1}
                                  </span>
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {lesson.title}
                                  </h4>
                                  {lesson.is_preview && (
                                    <Badge variant="outline" className="text-xs">
                                      <Eye className="mr-1 h-3 w-3" />
                                      Preview
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{getLessonTypeLabel(lesson.type)}</span>
                                  {lesson.duration && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDuration(lesson.duration)}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditLesson(lesson)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Lesson
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    {lesson.is_preview ? (
                                      <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Remove Preview
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Make Preview
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteLesson(lesson)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Lesson
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )
                        })}
                        
                        {/* Add Lesson Button */}
                        <div className="p-3 pl-12">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-gray-500 hover:text-gray-900"
                            onClick={() => handleAddLesson(module.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Lesson
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        courseId={course.id}
        module={editingModule}
        onSuccess={() => {
          setModuleDialogOpen(false)
          setEditingModule(null)
          router.refresh()
        }}
      />

      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        moduleId={lessonModuleId}
        lesson={editingLesson}
        onSuccess={() => {
          setLessonDialogOpen(false)
          setEditingLesson(null)
          setLessonModuleId(null)
          router.refresh()
        }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.type === 'module' ? 'Delete Module' : 'Delete Lesson'}
        description={
          deleteTarget?.type === 'module'
            ? `Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all lessons within this module.`
            : `Are you sure you want to delete "${deleteTarget?.name}"?`
        }
        onConfirm={confirmDelete}
      />
    </div>
  )
}
