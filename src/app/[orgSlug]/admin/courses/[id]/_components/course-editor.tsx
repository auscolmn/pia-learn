'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CourseBasicInfo } from './course-basic-info'
import { CourseCurriculum } from './course-curriculum'
import { CourseSettings } from './course-settings'
import type { CourseWithModules } from '@/lib/supabase/types'
import { FileText, Layout, Settings } from 'lucide-react'

interface CourseEditorProps {
  course: CourseWithModules
  orgSlug: string
}

export function CourseEditor({ course, orgSlug }: CourseEditorProps) {
  return (
    <Tabs defaultValue="curriculum" className="space-y-6">
      <TabsList className="bg-gray-100 p-1 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
        <TabsTrigger 
          value="info" 
          className="gap-2 data-[state=active]:bg-white"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Basic Info</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger 
          value="curriculum" 
          className="gap-2 data-[state=active]:bg-white"
        >
          <Layout className="h-4 w-4" />
          <span className="hidden sm:inline">Curriculum</span>
          <span className="sm:hidden">Content</span>
        </TabsTrigger>
        <TabsTrigger 
          value="settings" 
          className="gap-2 data-[state=active]:bg-white"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <CourseBasicInfo course={course} orgSlug={orgSlug} />
      </TabsContent>

      <TabsContent value="curriculum">
        <CourseCurriculum course={course} />
      </TabsContent>

      <TabsContent value="settings">
        <CourseSettings course={course} />
      </TabsContent>
    </Tabs>
  )
}
