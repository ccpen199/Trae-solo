import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { salaryReports } from '@/mocks/labor'
import { cn } from '@/lib/utils'
import { Check, ArrowLeft, Star } from 'lucide-react'

export default function Track() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const report = salaryReports.find((r) => r.id === id)

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gov-muted text-lg">未找到该举报记录</p>
          <button onClick={() => navigate('/labor')} className="gov-btn-primary mt-4">
            返回劳动维权
          </button>
        </div>
      </div>
    )
  }

  const { workOrder } = report
  const steps = workOrder.steps
  const lastCompleted = steps.every((s) => s.status === 'completed')
  const showRating = lastCompleted && steps[steps.length - 1].step === '用户评价'

  const handleSubmitRating = () => {
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/labor')} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-5 h-5 text-gov-muted" />
        </button>
        <div>
          <h2 className="gov-section-title">工单追踪</h2>
          <p className="text-gov-muted text-sm mt-1 pl-4">工单编号：{workOrder.id}</p>
        </div>
      </div>

      <div className="gov-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gov-muted">举报企业</p>
          <p className="font-medium text-gov-text mt-0.5">{report.companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gov-muted">欠薪金额</p>
          <p className="font-bold text-accent-500 mt-0.5">¥{report.amount.toLocaleString()}</p>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="font-semibold text-gov-text mb-8">处理进度</h3>
        <div className="flex items-start justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            const segmentWidth = isLast ? '' : ''
            return (
              <div key={i} className="flex flex-col items-center relative z-10 flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all',
                    step.status === 'completed' && 'bg-green-500 border-green-500 text-white',
                    step.status === 'current' && 'bg-primary-500 border-primary-500 text-white animate-pulse-slow',
                    step.status === 'pending' && 'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <p className={cn(
                  'text-xs mt-2 text-center max-w-[80px]',
                  step.status === 'completed' && 'text-green-600 font-medium',
                  step.status === 'current' && 'text-primary-500 font-medium',
                  step.status === 'pending' && 'text-gray-400'
                )}>
                  {step.step}
                </p>
                {step.time && (
                  <p className="text-[10px] text-gov-muted mt-0.5 text-center">{step.time.split(' ')[0]}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gov-text">处理详情</h3>
        {steps.map((step, i) => (
          <div key={i} className="gov-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  step.status === 'completed' && 'bg-green-500',
                  step.status === 'current' && 'bg-primary-500',
                  step.status === 'pending' && 'bg-gray-300'
                )} />
                <span className="font-medium text-gov-text text-sm">{step.step}</span>
              </div>
              {step.time && <span className="text-xs text-gov-muted">{step.time}</span>}
            </div>
            {step.handler && (
              <p className="text-sm text-gov-muted ml-4">处理人：{step.handler}</p>
            )}
            {step.result && (
              <p className="text-sm text-gov-text ml-4 mt-1">结果：{step.result}</p>
            )}
            {step.status === 'pending' && (
              <p className="text-sm text-gray-400 ml-4">等待处理</p>
            )}
          </div>
        ))}
      </div>

      {showRating && (
        <div className="gov-card p-6">
          <h3 className="font-semibold text-gov-text mb-4">评价</h3>
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-gov-success font-medium">感谢您的评价！</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gov-muted mb-2">满意度评分</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-7 h-7',
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gov-muted mb-2">文字反馈</p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="请输入您的评价和建议"
                  className="gov-input min-h-[80px] resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitRating}
                  disabled={rating === 0}
                  className={cn(
                    'px-6 py-2 rounded-lg font-medium text-white transition-all duration-200',
                    rating > 0
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-sm active:scale-[0.98]'
                      : 'bg-gray-300 cursor-not-allowed'
                  )}
                >
                  提交评价
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
