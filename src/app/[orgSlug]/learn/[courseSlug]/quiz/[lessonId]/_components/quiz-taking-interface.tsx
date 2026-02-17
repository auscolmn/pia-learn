'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitQuizAttempt } from '@/lib/quizzes/actions'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Home,
  HelpCircle,
  Trophy,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  Organization,
  Lesson,
  Enrollment,
  QuizWithQuestions,
  QuizQuestion,
  QuizAttempt,
  QuizQuestionOption,
} from '@/lib/supabase/types'

interface QuizTakingInterfaceProps {
  org: Organization
  orgSlug: string
  courseSlug: string
  courseTitle: string
  lesson: Lesson
  quiz: QuizWithQuestions
  enrollment: Enrollment
  currentAttempt?: QuizAttempt
  previousAttempts: QuizAttempt[]
  attemptsRemaining: number | null
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

export function QuizTakingInterface({
  org,
  orgSlug,
  courseSlug,
  courseTitle,
  lesson,
  quiz,
  enrollment,
  currentAttempt,
  previousAttempts,
  attemptsRemaining,
}: QuizTakingInterfaceProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Quiz state
  const [mode, setMode] = useState<'intro' | 'taking' | 'results' | 'review'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.time_limit ? quiz.time_limit * 60 : null
  )
  const [submittedAttempt, setSubmittedAttempt] = useState<QuizAttempt | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get questions (optionally shuffled)
  const [questions] = useState(() => {
    const qs = [...quiz.questions]
    if (quiz.shuffle_questions) {
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[qs[i], qs[j]] = [qs[j], qs[i]]
      }
    }
    return qs
  })

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  // Timer effect
  useEffect(() => {
    if (mode !== 'taking' || timeRemaining === null) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          // Auto-submit when time runs out
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [mode, timeRemaining])

  const handleStartQuiz = () => {
    if (!currentAttempt) {
      setError('Unable to start quiz. Please try again.')
      return
    }
    setMode('taking')
  }

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSubmit = useCallback(() => {
    if (!currentAttempt) return

    setError(null)
    startTransition(async () => {
      const result = await submitQuizAttempt({
        attemptId: currentAttempt.id,
        answers,
      })

      if (!result.success) {
        setError(result.error ?? 'Failed to submit quiz')
        return
      }

      setSubmittedAttempt(result.data!)
      setMode('results')
    })
  }, [currentAttempt, answers])

  const handleRetry = () => {
    router.refresh()
    setAnswers({})
    setCurrentQuestionIndex(0)
    setTimeRemaining(quiz.time_limit ? quiz.time_limit * 60 : null)
    setSubmittedAttempt(null)
    setMode('intro')
  }

  const handleReturnToCourse = () => {
    router.push(`/${orgSlug}/learn/${courseSlug}?lesson=${lesson.id}`)
  }

  // Best attempt from previous attempts
  const bestAttempt = previousAttempts.length > 0
    ? previousAttempts.reduce((best, current) => 
        (current.score ?? 0) > (best.score ?? 0) ? current : best
      )
    : null

  // Intro Screen
  if (mode === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/${orgSlug}/learn/${courseSlug}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Course
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-gray-600">{quiz.description}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Quiz Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Questions</p>
                  <p className="font-medium">{questions.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Passing Score</p>
                  <p className="font-medium">{quiz.passing_score}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Time Limit</p>
                  <p className="font-medium">
                    {quiz.time_limit ? `${quiz.time_limit} minutes` : 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Attempts</p>
                  <p className="font-medium">
                    {attemptsRemaining === null 
                      ? 'Unlimited' 
                      : `${attemptsRemaining} remaining`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previous Attempts */}
          {previousAttempts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Previous Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousAttempts.slice(0, 5).map((attempt, index) => (
                    <div 
                      key={attempt.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {attempt.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">Attempt {previousAttempts.length - index}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(attempt.completed_at!).toLocaleDateString()}
                            {attempt.time_spent && ` • ${formatTimeSpent(attempt.time_spent)}`}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={attempt.passed ? 'default' : 'secondary'}
                        className={attempt.passed ? 'bg-green-100 text-green-700' : ''}
                      >
                        {attempt.score}%
                      </Badge>
                    </div>
                  ))}
                </div>

                {bestAttempt && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Best Score: {bestAttempt.score}%
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {attemptsRemaining === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Attempts Remaining
              </h3>
              <p className="text-gray-600 mb-4">
                You&apos;ve used all {quiz.max_attempts} attempts for this quiz.
              </p>
              <Button onClick={handleReturnToCourse} variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Return to Course
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button onClick={handleStartQuiz} className="flex-1" size="lg">
                {previousAttempts.length > 0 ? 'Retry Quiz' : 'Start Quiz'}
              </Button>
              <Button onClick={handleReturnToCourse} variant="outline" size="lg">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Taking Quiz Screen
  if (mode === 'taking') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  timeRemaining <= 60 
                    ? "bg-red-100 text-red-700" 
                    : timeRemaining <= 300 
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
                )}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
              )}
              
              <Badge variant="outline">
                {answeredCount}/{questions.length} answered
              </Badge>
            </div>
          </div>
          <div className="max-w-3xl mx-auto mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </header>

        {/* Question Content */}
        <main className="flex-1 overflow-auto py-8 px-4">
          <div className="max-w-3xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  {currentQuestion.question}
                </CardTitle>
                <CardDescription>
                  {currentQuestion.type === 'multiple_choice' && 'Select one answer'}
                  {currentQuestion.type === 'true_false' && 'Select true or false'}
                  {currentQuestion.type === 'short_answer' && 'Type your answer'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentQuestion.type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() ?? ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                  >
                    {(currentQuestion.options as QuizQuestionOption[]).map((option, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                          answers[currentQuestion.id] === index
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                        onClick={() => handleAnswerChange(currentQuestion.id, index)}
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'true_false' && (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() ?? ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                  >
                    {['True', 'False'].map((option, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                          answers[currentQuestion.id] === index
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                        onClick={() => handleAnswerChange(currentQuestion.id, index)}
                      >
                        <RadioGroupItem value={index.toString()} id={`tf-${index}`} />
                        <Label htmlFor={`tf-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'short_answer' && (
                  <div className="space-y-2">
                    <Input
                      value={(answers[currentQuestion.id] as string) ?? ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="text-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    "h-3 w-3 rounded-full transition-colors",
                    index === currentQuestionIndex
                      ? "bg-green-600"
                      : answers[q.id] !== undefined
                      ? "bg-green-300"
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                  aria-label={`Go to question ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="bg-white border-t px-4 py-4 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </footer>
      </div>
    )
  }

  // Results Screen
  if (mode === 'results' && submittedAttempt) {
    const passed = submittedAttempt.passed
    const score = submittedAttempt.score ?? 0

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Results Card */}
          <Card className={cn(
            "mb-6 border-2",
            passed ? "border-green-500" : "border-red-500"
          )}>
            <CardContent className="py-8 text-center">
              <div className={cn(
                "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4",
                passed ? "bg-green-100" : "bg-red-100"
              )}>
                {passed ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-500" />
                )}
              </div>

              <h2 className={cn(
                "text-2xl font-bold mb-2",
                passed ? "text-green-700" : "text-red-700"
              )}>
                {passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
              </h2>

              <p className="text-gray-600 mb-4">
                {passed 
                  ? 'Great job! You\'ve successfully completed this quiz.'
                  : `You need ${quiz.passing_score}% to pass.`}
              </p>

              <div className="text-5xl font-bold mb-2">
                {score}%
              </div>

              <p className="text-sm text-gray-500">
                {submittedAttempt.answers?.filter(a => a.is_correct).length ?? 0} of {questions.length} correct
                {submittedAttempt.time_spent && ` • ${formatTimeSpent(submittedAttempt.time_spent)}`}
              </p>
            </CardContent>
          </Card>

          {/* Review Answers (if show_correct_answers is enabled) */}
          {quiz.show_correct_answers && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Review Answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => {
                  const answerRecord = submittedAttempt.answers?.find(
                    a => a.question_id === question.id
                  )
                  const isCorrect = answerRecord?.is_correct ?? false

                  return (
                    <div 
                      key={question.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {index + 1}. {question.question}
                          </p>
                          
                          {/* Show answer */}
                          <div className="text-sm">
                            <p className="text-gray-600">
                              Your answer:{' '}
                              {question.type === 'short_answer' 
                                ? (answerRecord?.answer as string) || '(no answer)'
                                : question.type === 'multiple_choice' || question.type === 'true_false'
                                ? (question.options as QuizQuestionOption[])?.[answerRecord?.answer as number]?.text || '(no answer)'
                                : '(no answer)'}
                            </p>
                            
                            {!isCorrect && (
                              <p className="text-green-700 font-medium mt-1">
                                Correct answer:{' '}
                                {question.type === 'short_answer'
                                  ? question.correct_answer
                                  : (question.options as QuizQuestionOption[])?.find(o => o.is_correct)?.text}
                              </p>
                            )}
                          </div>

                          {/* Explanation */}
                          {question.explanation && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {(attemptsRemaining === null || attemptsRemaining > 0) && !passed && (
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Quiz
              </Button>
            )}
            <Button onClick={handleReturnToCourse} className="flex-1">
              <ChevronRight className="h-4 w-4 mr-2" />
              {passed ? 'Continue' : 'Return to Course'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
