'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizByLessonId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '@/lib/quizzes/actions'
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  Circle,
  Settings,
  HelpCircle,
  Save,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Quiz, QuizQuestion, QuizWithQuestions, QuizQuestionOption, QuestionType } from '@/lib/supabase/types'

interface QuizBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  lessonTitle: string
  orgId: string
  onSuccess?: () => void
}

export function QuizBuilder({
  open,
  onOpenChange,
  lessonId,
  lessonTitle,
  orgId,
  onSuccess,
}: QuizBuilderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  // Quiz settings state
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true)

  // Load quiz data
  const loadQuiz = useCallback(async () => {
    setIsLoading(true)
    const result = await getQuizByLessonId(lessonId)
    if (result.success && result.data) {
      setQuiz(result.data)
      setQuizTitle(result.data.title)
      setQuizDescription(result.data.description ?? '')
      setPassingScore(result.data.passing_score)
      setMaxAttempts(result.data.max_attempts)
      setTimeLimit(result.data.time_limit)
      setShuffleQuestions(result.data.shuffle_questions)
      setShowCorrectAnswers(result.data.show_correct_answers)
    } else {
      // Initialize for new quiz
      setQuizTitle(`${lessonTitle} Quiz`)
      setQuizDescription('')
    }
    setIsLoading(false)
  }, [lessonId, lessonTitle])

  useEffect(() => {
    if (open) {
      loadQuiz()
      setError(null)
    }
  }, [open, loadQuiz])

  const handleCreateOrUpdateQuiz = () => {
    setError(null)
    startTransition(async () => {
      if (quiz) {
        // Update existing quiz
        const result = await updateQuiz({
          id: quiz.id,
          title: quizTitle,
          description: quizDescription || null,
          passingScore,
          maxAttempts,
          timeLimit,
          shuffleQuestions,
          showCorrectAnswers,
        })
        if (!result.success) {
          setError(result.error ?? 'Failed to update quiz')
          return
        }
        setQuiz({ ...quiz, ...result.data!, questions: quiz.questions })
      } else {
        // Create new quiz
        const result = await createQuiz({
          lessonId,
          title: quizTitle,
          description: quizDescription || undefined,
          passingScore,
          maxAttempts: maxAttempts ?? undefined,
          timeLimit: timeLimit ?? undefined,
          shuffleQuestions,
          showCorrectAnswers,
        })
        if (!result.success) {
          setError(result.error ?? 'Failed to create quiz')
          return
        }
        setQuiz({ ...result.data!, questions: [] })
      }
      setShowSettings(false)
      router.refresh()
    })
  }

  const handleDeleteQuiz = () => {
    if (!quiz || !confirm('Are you sure you want to delete this quiz? All questions will be lost.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteQuiz(quiz.id)
      if (!result.success) {
        setError(result.error ?? 'Failed to delete quiz')
        return
      }
      setQuiz(null)
      onSuccess?.()
      onOpenChange(false)
      router.refresh()
    })
  }

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Delete this question?')) return

    startTransition(async () => {
      const result = await deleteQuestion(questionId)
      if (!result.success) {
        setError(result.error ?? 'Failed to delete question')
        return
      }
      if (quiz) {
        setQuiz({
          ...quiz,
          questions: quiz.questions.filter(q => q.id !== questionId),
        })
      }
      router.refresh()
    })
  }

  const handleQuestionSaved = (question: QuizQuestion) => {
    if (quiz) {
      const existingIndex = quiz.questions.findIndex(q => q.id === question.id)
      if (existingIndex >= 0) {
        const updatedQuestions = [...quiz.questions]
        updatedQuestions[existingIndex] = question
        setQuiz({ ...quiz, questions: updatedQuestions })
      } else {
        setQuiz({ ...quiz, questions: [...quiz.questions, question] })
      }
    }
    setEditingQuestion(null)
    setIsAddingQuestion(false)
    router.refresh()
  }

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Quiz Builder</DialogTitle>
                <DialogDescription>
                  Create and manage quiz questions for &quot;{lessonTitle}&quot;
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                {quiz && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteQuiz}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mx-1">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex-1 overflow-y-auto py-4">
            {!quiz ? (
              // No quiz yet - show create form
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Quiz Created Yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create a quiz to assess student understanding of this lesson.
                </p>
                <Button onClick={() => setShowSettings(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </div>
            ) : (
              // Quiz exists - show questions
              <div className="space-y-4">
                {/* Quiz info bar */}
                <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  <Badge variant="outline">
                    {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                  </Badge>
                  <span>Pass: {quiz.passing_score}%</span>
                  {quiz.max_attempts && <span>Max {quiz.max_attempts} attempts</span>}
                  {quiz.time_limit && <span>{quiz.time_limit} min limit</span>}
                </div>

                {/* Questions list */}
                {quiz.questions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500 mb-4">No questions yet</p>
                    <Button onClick={() => setIsAddingQuestion(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quiz.questions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        onEdit={() => setEditingQuestion(question)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                        disabled={isPending}
                      />
                    ))}
                  </div>
                )}

                {quiz.questions.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsAddingQuestion(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{quiz ? 'Quiz Settings' : 'Create Quiz'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quizTitle">Quiz Title</Label>
              <Input
                id="quizTitle"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g., Module 1 Assessment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizDescription">Description (optional)</Label>
              <Textarea
                id="quizDescription"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Instructions for the quiz..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min={1}
                  value={maxAttempts ?? ''}
                  onChange={(e) => setMaxAttempts(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={1}
                value={timeLimit ?? ''}
                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No limit"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Shuffle Questions</Label>
                <p className="text-xs text-gray-500">
                  Randomize question order for each attempt
                </p>
              </div>
              <Switch
                checked={shuffleQuestions}
                onCheckedChange={setShuffleQuestions}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Show Correct Answers</Label>
                <p className="text-xs text-gray-500">
                  Show correct answers after submission
                </p>
              </div>
              <Switch
                checked={showCorrectAnswers}
                onCheckedChange={setShowCorrectAnswers}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdateQuiz} disabled={isPending || !quizTitle.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {quiz ? 'Save Settings' : 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Editor Dialog */}
      {(editingQuestion || isAddingQuestion) && quiz && (
        <QuestionEditor
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditingQuestion(null)
              setIsAddingQuestion(false)
            }
          }}
          quizId={quiz.id}
          question={editingQuestion}
          onSave={handleQuestionSaved}
        />
      )}
    </>
  )
}

// Question Card Component
function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  disabled,
}: {
  question: QuizQuestion
  index: number
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  const typeLabels: Record<QuestionType, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True/False',
    short_answer: 'Short Answer',
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onEdit}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <GripVertical className="h-4 w-4" />
            <span className="text-sm font-medium w-6">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 line-clamp-2">{question.question}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {typeLabels[question.type]}
              </Badge>
              <span className="text-xs text-gray-500">{question.points} point{question.points !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-gray-400 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Question Editor Dialog
function QuestionEditor({
  open,
  onOpenChange,
  quizId,
  question,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  quizId: string
  question: QuizQuestion | null
  onSave: (question: QuizQuestion) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [questionText, setQuestionText] = useState('')
  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [options, setOptions] = useState<QuizQuestionOption[]>([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
  ])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [trueFalseAnswer, setTrueFalseAnswer] = useState('true')
  const [explanation, setExplanation] = useState('')
  const [points, setPoints] = useState(1)

  useEffect(() => {
    if (open && question) {
      setQuestionText(question.question)
      setType(question.type)
      setExplanation(question.explanation ?? '')
      setPoints(question.points)

      if (question.type === 'multiple_choice' && question.options) {
        setOptions(question.options as QuizQuestionOption[])
      } else if (question.type === 'true_false' && question.options) {
        const opts = question.options as QuizQuestionOption[]
        setTrueFalseAnswer(opts[0]?.is_correct ? 'true' : 'false')
      } else if (question.type === 'short_answer') {
        setCorrectAnswer(question.correct_answer ?? '')
      }
    } else if (open) {
      // Reset for new question
      setQuestionText('')
      setType('multiple_choice')
      setOptions([
        { text: '', is_correct: true },
        { text: '', is_correct: false },
      ])
      setCorrectAnswer('')
      setTrueFalseAnswer('true')
      setExplanation('')
      setPoints(1)
    }
  }, [open, question])

  const addOption = () => {
    setOptions([...options, { text: '', is_correct: false }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, i) => i !== index)
    // Ensure at least one is correct
    if (!newOptions.some(o => o.is_correct)) {
      newOptions[0].is_correct = true
    }
    setOptions(newOptions)
  }

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const setCorrectOption = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }))
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    setError(null)

    if (!questionText.trim()) {
      setError('Question text is required')
      return
    }

    if (type === 'multiple_choice') {
      if (options.some(o => !o.text.trim())) {
        setError('All options must have text')
        return
      }
    }

    if (type === 'short_answer' && !correctAnswer.trim()) {
      setError('Correct answer is required for short answer questions')
      return
    }

    startTransition(async () => {
      let result

      if (question) {
        // Update
        result = await updateQuestion({
          id: question.id,
          question: questionText.trim(),
          type,
          options: type === 'multiple_choice' ? options : undefined,
          correctAnswer: type === 'short_answer' ? correctAnswer : 
                        type === 'true_false' ? trueFalseAnswer : undefined,
          explanation: explanation.trim() || null,
          points,
        })
      } else {
        // Create
        result = await createQuestion({
          quizId,
          question: questionText.trim(),
          type,
          options: type === 'multiple_choice' ? options : undefined,
          correctAnswer: type === 'short_answer' ? correctAnswer :
                        type === 'true_false' ? trueFalseAnswer : undefined,
          explanation: explanation.trim() || undefined,
          points,
        })
      }

      if (!result.success) {
        setError(result.error ?? 'Failed to save question')
        return
      }

      onSave(result.data!)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit Question' : 'Add Question'}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
                <SelectItem value="short_answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Multiple Choice Options */}
          {type === 'multiple_choice' && (
            <div className="space-y-3">
              <Label>Answer Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectOption(index)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0 transition-colors",
                      option.is_correct
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {option.is_correct && <CheckCircle className="h-4 w-4" />}
                  </button>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
              <p className="text-xs text-gray-500">
                Click the circle to mark the correct answer
              </p>
            </div>
          )}

          {/* True/False */}
          {type === 'true_false' && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="trueFalse"
                    value="true"
                    checked={trueFalseAnswer === 'true'}
                    onChange={() => setTrueFalseAnswer('true')}
                    className="w-4 h-4 text-green-600"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="trueFalse"
                    value="false"
                    checked={trueFalseAnswer === 'false'}
                    onChange={() => setTrueFalseAnswer('false')}
                    className="w-4 h-4 text-green-600"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* Short Answer */}
          {type === 'short_answer' && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">Correct Answer</Label>
              <Input
                id="correctAnswer"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Enter the correct answer"
              />
              <p className="text-xs text-gray-500">
                Student answers will be compared (case-insensitive)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explanation shown after answering..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {question ? 'Save Changes' : 'Add Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
