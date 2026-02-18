'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Award } from 'lucide-react'
import { toast } from 'sonner'
import { manuallyIssueCertificate } from '@/lib/certificates/actions'

interface IssueCertificateDialogProps {
  orgId: string
  courses: { id: string; title: string }[]
  students: { id: string; email: string; full_name: string | null }[]
}

export function IssueCertificateDialog({
  orgId,
  courses,
  students,
}: IssueCertificateDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const selectedStudentData = students.find((s) => s.id === selectedStudent)

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId)
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setRecipientName(student.full_name || student.email.split('@')[0])
    }
  }

  const handleSubmit = () => {
    if (!selectedStudent || !selectedCourse) {
      toast.error('Please select a student and course')
      return
    }

    startTransition(async () => {
      const result = await manuallyIssueCertificate({
        orgId,
        userId: selectedStudent,
        courseId: selectedCourse,
        recipientName: recipientName || undefined,
      })

      if (result.success) {
        toast.success('Certificate issued successfully')
        setOpen(false)
        setSelectedStudent('')
        setSelectedCourse('')
        setRecipientName('')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to issue certificate')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Issue Certificate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Issue Certificate Manually
          </DialogTitle>
          <DialogDescription>
            Issue a certificate to a student for completing a course. This bypasses
            the automatic issuance flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Select */}
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <Select value={selectedStudent} onValueChange={handleStudentChange}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No enrolled students found
                  </div>
                ) : (
                  students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name || student.email}
                      {student.full_name && (
                        <span className="text-muted-foreground ml-2">
                          ({student.email})
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Course Select */}
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No published courses found
                  </div>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Name Override */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">
              Recipient Name
              <span className="text-muted-foreground font-normal ml-1">
                (on certificate)
              </span>
            </Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={
                selectedStudentData?.full_name ||
                selectedStudentData?.email.split('@')[0] ||
                'Recipient name'
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the student&apos;s profile name
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedStudent || !selectedCourse}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Issuing...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Issue Certificate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
