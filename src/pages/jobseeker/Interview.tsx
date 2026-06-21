import { useState, useEffect } from 'react'
import { Calendar, Clock, Timer, AlertTriangle, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Interview, InterviewStatus } from '@/../shared/types'
import { mockInterviews } from '@/mock/data'
import { useStore } from '@/store'
import { formatDateTime, formatDate, getTimeRemaining } from '@/utils/helpers'
import InterviewCard from '@/components/business/InterviewCard'
import StatusBadge from '@/components/ui/StatusBadge'

const tabs: { key: 'all' | InterviewStatus; label: string }[] = [
  { key: 'pending', label: '待响应' },
  { key: 'accepted', label: '已接受' },
  { key: 'completed', label: '已完成' },
  { key: 'expired', label: '已过期' },
]

function PendingInterviewCard({
  interview,
  onAccept,
  onReject,
}: {
  interview: Interview
  onAccept: () => void
  onReject: () => void
}) {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const deadline = new Date(interview.scheduledAt)
    deadline.setHours(deadline.getHours() + interview.ttlHours)
    return getTimeRemaining(deadline.toISOString())
  })

  useEffect(() => {
    const deadline = new Date(interview.scheduledAt)
    deadline.setHours(deadline.getHours() + interview.ttlHours)

    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline.toISOString()))
    }, 60000)

    return () => clearInterval(timer)
  }, [interview.scheduledAt, interview.ttlHours])

  const isUrgent = timeRemaining.hours < 6

  return (
    <div className={`glass rounded-2xl p-5 transition-shadow hover:shadow-lg ${isUrgent ? 'ring-2 ring-accent/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{interview.jobTitle || '面试邀请'}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{interview.companyName}</p>
        </div>
        <StatusBadge status={interview.status} type="interview" />
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDateTime(interview.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{interview.location}</span>
        </div>
      </div>

      {!timeRemaining.expired && (
        <div
          className={`mt-4 rounded-xl p-4 ${isUrgent ? 'bg-accent/10' : 'bg-primary/5'}`}
        >
          <div className="flex items-center gap-2">
            <Timer className={`h-5 w-5 ${isUrgent ? 'text-accent' : 'text-primary'}`} />
            <div>
              <p className={`text-sm font-semibold ${isUrgent ? 'text-accent' : 'text-primary'}`}>
                请在 {timeRemaining.hours} 小时 {timeRemaining.minutes} 分钟内确认
              </p>
              <p className={`text-xs ${isUrgent ? 'text-accent/70' : 'text-gray-500'}`}>
                超时邀约将自动失效
              </p>
            </div>
          </div>
          {isUrgent && (
            <div className="mt-2 flex items-center gap-1 text-xs text-accent">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>即将到期，请尽快处理</span>
            </div>
          )}
        </div>
      )}

      {timeRemaining.expired && (
        <div className="mt-4 rounded-xl bg-danger/10 p-4">
          <div className="flex items-center gap-2">
            <X className="h-5 w-5 text-danger" />
            <p className="text-sm font-semibold text-danger">面试邀请已过期</p>
          </div>
        </div>
      )}

      {!timeRemaining.expired && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 rounded-xl border-2 border-danger py-3 text-sm font-semibold text-danger transition-all hover:bg-danger/5 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <X className="h-4 w-4" />
              拒绝
            </span>
          </button>
          <button
            onClick={onAccept}
            className="flex-1 rounded-xl bg-success py-3 text-sm font-semibold text-white transition-all hover:bg-success/90 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              接受
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

function CalendarView({ interviews }: { interviews: Interview[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const interviewsByDate: Record<string, Interview[]> = {}
  interviews.forEach((interview) => {
    const date = formatDate(interview.scheduledAt)
    if (!interviewsByDate[date]) {
      interviewsByDate[date] = []
    }
    interviewsByDate[date].push(interview)
  })

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">面试日程</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-xs font-medium text-gray-400">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="py-2" />
        ))}
        {days.map((day) => {
          const dateStr = formatDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString()
          )
          const dayInterviews = interviewsByDate[dateStr] || []
          const hasInterview = dayInterviews.length > 0
          const isToday =
            day === new Date().getDate() &&
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear()

          return (
            <div
              key={day}
              className={`relative py-2 text-center text-sm ${hasInterview ? 'font-semibold' : ''} ${isToday ? 'text-primary' : 'text-gray-700'}`}
            >
              {day}
              {hasInterview && (
                <div className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function JobseekerInterview() {
  const { myInterviews, setMyInterviews } = useStore()
  const [activeTab, setActiveTab] = useState<InterviewStatus>('pending')

  useEffect(() => {
    setMyInterviews(mockInterviews.filter((interview) => interview.userId === 'user-002'))
  }, [setMyInterviews])

  const handleAccept = (id: string) => {
    const updated = myInterviews.map((i) =>
      i.id === id ? { ...i, status: 'accepted' as InterviewStatus, respondedAt: new Date().toISOString() } : i
    )
    setMyInterviews(updated)
  }

  const handleReject = (id: string) => {
    const updated = myInterviews.map((i) =>
      i.id === id ? { ...i, status: 'rejected' as InterviewStatus, respondedAt: new Date().toISOString() } : i
    )
    setMyInterviews(updated)
  }

  const filteredInterviews = myInterviews.filter((i) => i.status === activeTab)
  const acceptedInterviews = myInterviews.filter((i) => i.status === 'accepted')

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">面试管理</h1>
        <p className="mt-1 text-sm text-gray-500">查看和管理您的面试安排</p>
      </div>

      <div className="glass mb-6 rounded-2xl p-2">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as InterviewStatus)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {myInterviews.filter((i) => i.status === tab.key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'accepted' && acceptedInterviews.length > 0 && (
        <div className="mb-6">
          <CalendarView interviews={acceptedInterviews} />
        </div>
      )}

      <div className="space-y-4">
        {filteredInterviews.map((interview) =>
          activeTab === 'pending' ? (
            <PendingInterviewCard
              key={interview.id}
              interview={interview}
              onAccept={() => handleAccept(interview.id)}
              onReject={() => handleReject(interview.id)}
            />
          ) : (
            <InterviewCard
              key={interview.id}
              interview={interview}
              role="jobseeker"
              onAccept={() => handleAccept(interview.id)}
              onReject={() => handleReject(interview.id)}
            />
          )
        )}
      </div>

      {filteredInterviews.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">暂无{tabs.find((t) => t.key === activeTab)?.label}的面试</p>
        </div>
      )}
    </div>
  )
}
