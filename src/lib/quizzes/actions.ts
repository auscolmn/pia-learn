'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizWithQuestions,
  QuizQuestionOption,
  QuizAnswerRecord,
  QuestionType,
} from '@/lib/supabase/types'

// ============================================
// ACTION RESULT TYPE
// ============================================

export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

// ============================================
// QUIZ CRUD ACTIONS
// ============================================

export interface CreateQuizInput {
  lessonId: string
  title: string
  description?: string
  passingScore?: number
  maxAttempts?: number | null
  timeLimit?: number | null
  shuffleQuestions?: boolean
  showCorrectAnswers?: boolean
}

export async function createQuiz(input: CreateQuizInput): Promise<ActionResult<Quiz>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify user has access to this lesson (is org member)
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id,
      module:modules (
        course:courses (
          org_id
        )
      )
    `)
    .eq('id', input.lessonId)
    .single()

  if (!lesson) {
    return { success: false, error: 'Lesson not found' }
  }

  // Check if quiz already exists for this lesson
  const { data: existingQuiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('lesson_id', input.lessonId)
    .single()

  if (existingQuiz) {
    return { success: false, error: 'A quiz already exists for this lesson' }
  }

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({
      lesson_id: input.lessonId,
      title: input.title,
      description: input.description ?? null,
      passing_score: input.passingScore ?? 70,
      max_attempts: input.maxAttempts ?? null,
      time_limit: input.timeLimit ?? null,
      shuffle_questions: input.shuffleQuestions ?? false,
      show_correct_answers: input.showCorrectAnswers ?? true,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: quiz as Quiz }
}

export interface UpdateQuizInput {
  id: string
  title?: string
  description?: string | null
  passingScore?: number
  maxAttempts?: number | null
  timeLimit?: number | null
  shuffleQuestions?: boolean
  showCorrectAnswers?: boolean
}

export async function updateQuiz(input: UpdateQuizInput): Promise<ActionResult<Quiz>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.passingScore !== undefined) updateData.passing_score = input.passingScore
  if (input.maxAttempts !== undefined) updateData.max_attempts = input.maxAttempts
  if (input.timeLimit !== undefined) updateData.time_limit = input.timeLimit
  if (input.shuffleQuestions !== undefined) updateData.shuffle_questions = input.shuffleQuestions
  if (input.showCorrectAnswers !== undefined) updateData.show_correct_answers = input.showCorrectAnswers

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: quiz as Quiz }
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

export async function getQuizByLessonId(lessonId: string): Promise<ActionResult<QuizWithQuestions | null>> {
  const supabase = await createServerClient()

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      questions:quiz_questions (*)
    `)
    .eq('lesson_id', lessonId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message }
  }

  if (!quiz) {
    return { success: true, data: null }
  }

  // Sort questions by sort_order
  const quizWithSortedQuestions = {
    ...quiz,
    questions: (quiz.questions as QuizQuestion[]).sort((a, b) => a.sort_order - b.sort_order),
  } as QuizWithQuestions

  return { success: true, data: quizWithSortedQuestions }
}

// ============================================
// QUESTION CRUD ACTIONS
// ============================================

export interface CreateQuestionInput {
  quizId: string
  question: string
  type: QuestionType
  options?: QuizQuestionOption[]
  correctAnswer?: string
  explanation?: string
  points?: number
}

export async function createQuestion(input: CreateQuestionInput): Promise<ActionResult<QuizQuestion>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get max sort_order for this quiz
  const { data: existingQuestions } = await supabase
    .from('quiz_questions')
    .select('sort_order')
    .eq('quiz_id', input.quizId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingQuestions && existingQuestions.length > 0
    ? existingQuestions[0].sort_order + 1
    : 0

  // Validate based on question type
  if (input.type === 'multiple_choice') {
    if (!input.options || input.options.length < 2) {
      return { success: false, error: 'Multiple choice questions require at least 2 options' }
    }
    if (!input.options.some(o => o.is_correct)) {
      return { success: false, error: 'At least one option must be marked as correct' }
    }
  } else if (input.type === 'true_false') {
    // Auto-generate true/false options
    input.options = [
      { text: 'True', is_correct: input.correctAnswer === 'true' },
      { text: 'False', is_correct: input.correctAnswer === 'false' },
    ]
  }

  const { data: question, error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: input.quizId,
      question: input.question,
      type: input.type,
      options: input.type !== 'short_answer' ? input.options : null,
      correct_answer: input.type === 'short_answer' ? input.correctAnswer : null,
      explanation: input.explanation ?? null,
      points: input.points ?? 1,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: question as QuizQuestion }
}

export interface UpdateQuestionInput {
  id: string
  question?: string
  type?: QuestionType
  options?: QuizQuestionOption[]
  correctAnswer?: string | null
  explanation?: string | null
  points?: number
}

export async function updateQuestion(input: UpdateQuestionInput): Promise<ActionResult<QuizQuestion>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const updateData: Record<string, unknown> = {}
  if (input.question !== undefined) updateData.question = input.question
  if (input.type !== undefined) updateData.type = input.type
  if (input.explanation !== undefined) updateData.explanation = input.explanation
  if (input.points !== undefined) updateData.points = input.points

  // Handle type-specific fields
  if (input.type === 'short_answer') {
    updateData.options = null
    if (input.correctAnswer !== undefined) updateData.correct_answer = input.correctAnswer
  } else if (input.type === 'true_false') {
    updateData.correct_answer = null
    if (input.correctAnswer !== undefined) {
      updateData.options = [
        { text: 'True', is_correct: input.correctAnswer === 'true' },
        { text: 'False', is_correct: input.correctAnswer === 'false' },
      ]
    }
  } else if (input.type === 'multiple_choice' && input.options !== undefined) {
    updateData.options = input.options
    updateData.correct_answer = null
  }

  const { data: question, error } = await supabase
    .from('quiz_questions')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: question as QuizQuestion }
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

export async function reorderQuestions(
  quizId: string,
  questionIds: string[]
): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Update sort_order for each question
  const updates = questionIds.map((id, index) => 
    supabase
      .from('quiz_questions')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('quiz_id', quizId)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    return { success: false, error: 'Failed to reorder questions' }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

// ============================================
// QUIZ ATTEMPT ACTIONS
// ============================================

export async function startQuizAttempt(
  quizId: string,
  enrollmentId: string
): Promise<ActionResult<QuizAttempt>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify enrollment belongs to user
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, user_id')
    .eq('id', enrollmentId)
    .eq('user_id', user.id)
    .single()

  if (!enrollment) {
    return { success: false, error: 'Enrollment not found' }
  }

  // Get quiz to check max_attempts
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, max_attempts')
    .eq('id', quizId)
    .single()

  if (!quiz) {
    return { success: false, error: 'Quiz not found' }
  }

  // Check if max attempts exceeded
  if (quiz.max_attempts) {
    const { count } = await supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('enrollment_id', enrollmentId)
      .not('completed_at', 'is', null)

    if (count && count >= quiz.max_attempts) {
      return { success: false, error: 'Maximum attempts exceeded' }
    }
  }

  // Check for incomplete attempt
  const { data: incompleteAttempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('enrollment_id', enrollmentId)
    .is('completed_at', null)
    .single()

  if (incompleteAttempt) {
    return { success: true, data: incompleteAttempt as QuizAttempt }
  }

  // Create new attempt
  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      enrollment_id: enrollmentId,
      user_id: user.id,
      answers: [],
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: attempt as QuizAttempt }
}

export interface SubmitQuizInput {
  attemptId: string
  answers: Record<string, string | number> // question_id -> answer
}

export async function submitQuizAttempt(input: SubmitQuizInput): Promise<ActionResult<QuizAttempt>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get attempt with quiz and questions
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quiz:quizzes (
        *,
        questions:quiz_questions (*)
      )
    `)
    .eq('id', input.attemptId)
    .eq('user_id', user.id)
    .is('completed_at', null)
    .single()

  if (!attempt) {
    return { success: false, error: 'Attempt not found or already completed' }
  }

  const quiz = attempt.quiz as QuizWithQuestions
  const questions = quiz.questions

  // Grade the quiz
  let totalPoints = 0
  let earnedPoints = 0
  const gradedAnswers: QuizAnswerRecord[] = []

  for (const question of questions) {
    totalPoints += question.points
    const userAnswer = input.answers[question.id]
    let isCorrect = false

    if (userAnswer !== undefined) {
      if (question.type === 'multiple_choice') {
        const options = question.options as QuizQuestionOption[]
        const selectedIndex = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer as string)
        isCorrect = options[selectedIndex]?.is_correct ?? false
      } else if (question.type === 'true_false') {
        const options = question.options as QuizQuestionOption[]
        const selectedIndex = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer as string)
        isCorrect = options[selectedIndex]?.is_correct ?? false
      } else if (question.type === 'short_answer') {
        // Case-insensitive comparison, trimmed
        const correctAnswer = (question.correct_answer ?? '').toLowerCase().trim()
        const givenAnswer = (userAnswer as string).toLowerCase().trim()
        isCorrect = correctAnswer === givenAnswer
      }

      if (isCorrect) {
        earnedPoints += question.points
      }
    }

    gradedAnswers.push({
      question_id: question.id,
      answer: userAnswer,
      is_correct: isCorrect,
    })
  }

  // Calculate score as percentage
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const passed = score >= quiz.passing_score

  // Calculate time spent
  const startedAt = new Date(attempt.started_at)
  const timeSpent = Math.round((Date.now() - startedAt.getTime()) / 1000)

  // Update attempt
  const { data: updatedAttempt, error } = await supabase
    .from('quiz_attempts')
    .update({
      answers: gradedAnswers,
      score,
      passed,
      completed_at: new Date().toISOString(),
      time_spent: timeSpent,
    })
    .eq('id', input.attemptId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // If passed, mark lesson as complete
  if (passed) {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('lesson_id')
      .eq('id', attempt.quiz_id)
      .single()

    if (quizData) {
      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: attempt.enrollment_id,
          lesson_id: quizData.lesson_id,
          completed: true,
          completed_at: new Date().toISOString(),
          attempts: 1,
        }, {
          onConflict: 'enrollment_id,lesson_id',
        })
    }
  }

  revalidatePath('/[orgSlug]/learn/[courseSlug]', 'page')
  return { success: true, data: updatedAttempt as QuizAttempt }
}

export async function getQuizAttempts(
  quizId: string,
  enrollmentId: string
): Promise<ActionResult<QuizAttempt[]>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('enrollment_id', enrollmentId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: attempts as QuizAttempt[] }
}

export async function getQuizAttemptById(
  attemptId: string
): Promise<ActionResult<QuizAttempt & { quiz: QuizWithQuestions }>> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quiz:quizzes (
        *,
        questions:quiz_questions (*)
      )
    `)
    .eq('id', attemptId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Sort questions
  const quiz = attempt.quiz as QuizWithQuestions
  quiz.questions = quiz.questions.sort((a, b) => a.sort_order - b.sort_order)

  return { 
    success: true, 
    data: { ...attempt, quiz } as QuizAttempt & { quiz: QuizWithQuestions } 
  }
}

// ============================================
// QUIZ STATS (for admins)
// ============================================

export interface QuizStats {
  totalAttempts: number
  averageScore: number
  passRate: number
  averageTimeSpent: number
}

export async function getQuizStats(quizId: string): Promise<ActionResult<QuizStats>> {
  const supabase = await createServerClient()

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('score, passed, time_spent')
    .eq('quiz_id', quizId)
    .not('completed_at', 'is', null)

  if (error) {
    return { success: false, error: error.message }
  }

  if (!attempts || attempts.length === 0) {
    return {
      success: true,
      data: {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
      },
    }
  }

  const totalAttempts = attempts.length
  const averageScore = Math.round(
    attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / totalAttempts
  )
  const passRate = Math.round(
    (attempts.filter(a => a.passed).length / totalAttempts) * 100
  )
  const averageTimeSpent = Math.round(
    attempts.reduce((sum, a) => sum + (a.time_spent ?? 0), 0) / totalAttempts
  )

  return {
    success: true,
    data: {
      totalAttempts,
      averageScore,
      passRate,
      averageTimeSpent,
    },
  }
}
