import { useEffect, useState } from 'react'
import { riskApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Question {
  id: string
  question: string
  options: { value: string; text: string; score: number }[]
}

interface Assessment {
  id: string
  score: number
  risk_level: number
  riskLevelName: string
  submitted_at: string
  expired_at: string
}

export default function RiskAssessment() {
  const { user, updateUser } = useAuthStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [result, setResult] = useState<{ score: number; riskLevel: number; riskLevelName: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [questionsRes, assessmentRes] = await Promise.all([
        riskApi.getQuestions(),
        riskApi.getAssessment()
      ])
      
      setQuestions(questionsRes.data.questions || [])
      setCurrentAssessment(assessmentRes.data.assessment)
      setIsValid(assessmentRes.data.isValid)
    } catch (error) {
      console.error('获取风险测评数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId: string, optionValue: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionValue
    }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('请完成所有问题')
      return
    }

    setSubmitting(true)
    try {
      const response = await riskApi.submitAssessment(answers)
      setResult({
        score: response.data.assessment.score,
        riskLevel: response.data.assessment.riskLevel,
        riskLevelName: response.data.assessment.riskLevelName
      })
      updateUser({ riskLevel: response.data.assessment.riskLevel })
      await fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const getRiskLevelColor = (level: number) => {
    const colors = [
      '',
      'bg-green-100 text-green-700 border-green-200',
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-red-100 text-red-700 border-red-200',
    ]
    return colors[level] || colors[1]
  }

  const getRiskLevelDesc = (level: number) => {
    const descs = [
      '',
      '适合追求本金安全、风险承受能力较低的投资者。可投资R1风险等级产品。',
      '适合希望在相对稳健的基础上获取一定收益的投资者。可投资R1-R2风险等级产品。',
      '适合愿意承担中等风险、追求收益与风险平衡的投资者。可投资R1-R3风险等级产品。',
      '适合追求较高收益、能承受较大波动的投资者。可投资R1-R4风险等级产品。',
      '适合追求高收益、能承受较大亏损的激进型投资者。可投资全部风险等级产品。',
    ]
    return descs[level] || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">风险测评</h1>
          <p className="text-gray-500 mt-1">完成风险测评以确定您的风险承受能力等级</p>
        </div>
      </div>

      {currentAssessment && (
        <div className={`card border-2 ${getRiskLevelColor(currentAssessment.risk_level)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">您的风险等级</p>
              <p className="text-2xl font-bold mt-1">{currentAssessment.riskLevelName}</p>
              <p className="text-sm mt-2 opacity-80">{getRiskLevelDesc(currentAssessment.risk_level)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">测评得分</p>
              <p className="text-3xl font-bold">{currentAssessment.score}</p>
              <p className={`text-sm mt-2 ${isValid ? 'text-green-600' : 'text-orange-600'}`}>
                {isValid ? '✓ 测评有效' : '⚠ 测评已过期，请重新测评'}
              </p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="card bg-success-50 border border-success-200">
          <div className="text-center py-4">
            <p className="text-success-600 font-semibold text-lg">🎉 测评完成！</p>
            <p className="text-gray-600 mt-2">
              您的风险等级为 <span className="font-bold">{result.riskLevelName}</span>，
              可投资风险等级 ≤ {result.riskLevel} 的产品
            </p>
          </div>
        </div>
      )}

      {(!currentAssessment || !isValid) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">风险测评问卷</h2>
          <p className="text-gray-500 text-sm mb-6">
            请根据您的实际情况回答以下问题，这将帮助我们为您推荐合适的基金产品。
          </p>

          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="pb-6 border-b border-gray-100 last:border-0">
                <h3 className="font-medium text-gray-900 mb-4">
                  {index + 1}. {question.question}
                </h3>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        answers[question.id] === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() => handleAnswer(question.id, option.value)}
                        className="mr-3 text-primary-600"
                      />
                      <span className="text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                已完成 {Object.keys(answers).length} / {questions.length} 题
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="btn-primary"
              >
                {submitting ? '提交中...' : '提交测评'}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentAssessment && isValid && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">风险等级说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((level) => {
              const names = ['', 'R1 保守型', 'R2 稳健型', 'R3 平衡型', 'R4 成长型', 'R5 激进型']
              const isActive = currentAssessment.risk_level >= level
              return (
                <div
                  key={level}
                  className={`p-4 rounded-lg border text-center ${
                    isActive
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
                >
                  <p className={`font-medium ${isActive ? 'text-primary-700' : 'text-gray-500'}`}>
                    {names[level]}
                  </p>
                  <p className={`text-xs mt-1 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                    {isActive ? '✓ 可投资' : '✗ 禁止投资'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
