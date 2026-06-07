import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Clock, RotateCcw, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'

interface Question {
  id: number
  question_text: string
  options: string[]
  sort_order: number
}

interface QuizData {
  id: number
  title: string
  description: string
  time_limit: number
  questions: Question[]
}

interface QuizResult {
  score: number
  total: number
  correctAnswers: number[]
}

type Phase = 'ready' | 'playing' | 'result'

const LABELS = ['A', 'B', 'C', 'D']
const SCORE_EMOJI: Record<string, string> = {
  perfect: '🏆',
  great: '🎉',
  good: '👍',
  ok: '😊',
  low: '💪',
}

function getScoreEmoji(score: number, total: number) {
  const pct = (score / total) * 100
  if (pct === 100) return SCORE_EMOJI.perfect
  if (pct >= 80) return SCORE_EMOJI.great
  if (pct >= 60) return SCORE_EMOJI.good
  if (pct >= 40) return SCORE_EMOJI.ok
  return SCORE_EMOJI.low
}

export default function QuizPlay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('ready')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<QuizData>(`/quizzes/${id}`)
      .then(setQuiz)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  const startQuiz = useCallback(() => {
    if (!quiz) return
    setPhase('playing')
    setCurrentIdx(0)
    setAnswers(new Array(quiz.questions.length).fill(-1))
    setSelectedOption(null)
    setResult(null)
    startTimeRef.current = Date.now()
    setTimeLeft(quiz.time_limit)
  }, [quiz])

  useEffect(() => {
    if (phase !== 'playing' || !quiz) return

    clearTimer()
    setTimeLeft(quiz.time_limit)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearTimer()
  }, [phase, currentIdx])

  const handleTimeout = useCallback(() => {
    if (!quiz) return
    const question = quiz.questions[currentIdx]
    if (!question) return

    const newAnswers = [...answers]
    if (newAnswers[currentIdx] === -1) {
      newAnswers[currentIdx] = -1
    }
    setAnswers(newAnswers)

    setTimeout(() => {
      advanceQuestion(newAnswers)
    }, 500)
  }, [quiz, currentIdx, answers])

  const advanceQuestion = useCallback((currentAnswers: number[]) => {
    if (!quiz) return
    const nextIdx = currentIdx + 1
    if (nextIdx >= quiz.questions.length) {
      finishQuiz(currentAnswers)
    } else {
      setCurrentIdx(nextIdx)
      setSelectedOption(null)
    }
  }, [quiz, currentIdx])

  const handleSelect = useCallback((optionIdx: number) => {
    if (!quiz || selectedOption !== null) return
    const question = quiz.questions[currentIdx]
    if (!question) return

    setSelectedOption(optionIdx)
    const newAnswers = [...answers]
    newAnswers[currentIdx] = optionIdx
    setAnswers(newAnswers)

    clearTimer()

    setTimeout(() => {
      advanceQuestion(newAnswers)
    }, 1000)
  }, [quiz, currentIdx, answers, selectedOption, clearTimer])

  const finishQuiz = useCallback(async (finalAnswers: number[]) => {
    if (!id || !quiz) return
    setPhase('result')
    setSubmitting(true)
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await api.post<QuizResult>(`/quizzes/${id}/play`, {
        answers: finalAnswers,
        time_spent: timeSpent,
      })
      setResult(res)
    } catch {
    } finally {
      setSubmitting(false)
    }
  }, [id, quiz])

  const handleRestart = useCallback(() => {
    setPhase('ready')
    setCurrentIdx(0)
    setAnswers([])
    setSelectedOption(null)
    setResult(null)
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        <p>答题不存在</p>
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">{quiz.description}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-8">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {quiz.time_limit} 秒/题
            </span>
            <span>{quiz.questions.length} 题</span>
          </div>
          <button
            onClick={startQuiz}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            开始答题
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'playing') {
    const question = quiz.questions[currentIdx]
    if (!question) return null

    const timerColor = timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : 'text-blue-600'

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            第 {currentIdx + 1}/{quiz.questions.length} 题
          </span>
          <span className={`flex items-center gap-1 font-mono text-lg font-bold ${timerColor}`}>
            <Clock className="w-4 h-4" />
            {timeLeft}s
          </span>
        </div>

        <div className="mb-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{question.question_text}</h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selectedOption !== null}
                className={`w-full text-left rounded-xl border p-4 transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-100 bg-white hover:border-blue-200'
                } ${selectedOption !== null && !isSelected ? 'opacity-50' : ''}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {LABELS[idx] || String(idx + 1)}
                </span>
                <span className="text-gray-900">{option}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    if (submitting) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">正在提交结果...</p>
        </div>
      )
    }

    const score = result?.score ?? 0
    const total = result?.total ?? quiz.questions.length

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-8 mb-8">
          <div className="text-6xl mb-4">{getScoreEmoji(score, total)}</div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {score}<span className="text-lg text-gray-400">/{total}</span>
          </div>
          <p className="text-gray-500">答对 {score} 题，共 {total} 题</p>
        </div>

        {result && (
          <div className="space-y-3 mb-8">
            {quiz.questions.map((question, idx) => {
              const userAnswer = answers[idx]
              const correctAnswer = result.correctAnswers[idx]
              const isCorrect = userAnswer === correctAnswer
              const userOption = userAnswer >= 0 ? question.options[userAnswer] : null
              const correctOption = correctAnswer >= 0 ? question.options[correctAnswer] : null

              return (
                <div
                  key={question.id}
                  className={`rounded-xl border p-4 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className="font-medium text-gray-900 mb-2">
                    {idx + 1}. {question.question_text}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-green-700 mb-1">
                      正确答案：{correctOption ? `${LABELS[correctAnswer]}. ${correctOption}` : '-'}
                    </p>
                  )}
                  <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    你的答案：{userOption ? `${LABELS[userAnswer]}. ${userOption}` : '未作答'}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            再试一次
          </button>
          <button
            onClick={() => navigate('/quizzes')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return null
}
