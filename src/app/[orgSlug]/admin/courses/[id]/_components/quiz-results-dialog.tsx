'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  Users,
  BarChart3,
} from 'lucide-react'
import { getQuizByLessonId, getQuizStats, type QuizStats } from '@/lib/quizzes/actions'
import { createClient } from '@/lib/supabase/client'
import type { QuizWithQuestions, QuizAttempt } from '@/lib/supabase/types'

interface QuizResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  lessonTitle: string
}

interface AttemptWithUser extends QuizAttempt {
  user?: {
    full_name: string | null
    email: string
  }
}

function formatTimeSpent(seconds: number | null): string {
  if (!seconds) return '-'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

export function QuizResultsDialog({
  open,
  onOpenChange,
  lessonId,
  lessonTitle,
}: QuizResultsDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [stats, setStats] = useState<QuizStats | null>(null)
  const [attempts, setAttempts] = useState<AttemptWithUser[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)

    // Get quiz
    const quizResult = await getQuizByLessonId(lessonId)
    if (!quizResult.success || !quizResult.data) {
      setIsLoading(false)
      return
    }
    setQuiz(quizResult.data)

    // Get stats
    const statsResult = await getQuizStats(quizResult.data.id)
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }

    // Get attempts with user info
    const supabase = createClient()
    const { data: attemptData } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        user:users (
          full_name,
          email
        )
      `)
      .eq('quiz_id', quizResult.data.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (attemptData) {
      setAttempts(attemptData as AttemptWithUser[])
    }

    setIsLoading(false)
  }, [lessonId])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, loadData])

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!quiz) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Quiz Found</DialogTitle>
            <DialogDescription>
              This lesson doesn&apos;t have a quiz configured yet.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Quiz Results</DialogTitle>
          <DialogDescription>
            Results for &quot;{lessonTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        {stats && (
          <div className="grid grid-cols-4 gap-4 py-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                <p className="text-xs text-gray-500">Attempts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats.passRate}%</p>
                <p className="text-xs text-gray-500">Pass Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{formatTimeSpent(stats.averageTimeSpent)}</p>
                <p className="text-xs text-gray-500">Avg Time</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz Settings Summary */}
        <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          <span>{quiz.questions.length} questions</span>
          <span>•</span>
          <span>Pass: {quiz.passing_score}%</span>
          {quiz.max_attempts && (
            <>
              <span>•</span>
              <span>Max {quiz.max_attempts} attempts</span>
            </>
          )}
          {quiz.time_limit && (
            <>
              <span>•</span>
              <span>{quiz.time_limit} min limit</span>
            </>
          )}
        </div>

        {/* Attempts List */}
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Attempts</h4>
          
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attempts yet
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {attempt.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {attempt.user?.full_name || attempt.user?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(attempt.completed_at!).toLocaleDateString()}{' '}
                          {new Date(attempt.completed_at!).toLocaleTimeString()}
                          {attempt.time_spent && ` • ${formatTimeSpent(attempt.time_spent)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{attempt.score}%</p>
                        <p className="text-xs text-gray-500">
                          {attempt.answers?.filter(a => a.is_correct).length ?? 0}/{quiz.questions.length} correct
                        </p>
                      </div>
                      <Badge
                        variant={attempt.passed ? 'default' : 'secondary'}
                        className={attempt.passed ? 'bg-green-100 text-green-700' : ''}
                      >
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
