import { FileQuestion, Clock, Users, Award, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { exams } from '@/data/mockData'

function getCountdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return '已截止'
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return `剩余 ${days} 天`
}

export default function Exams() {
  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="考试测评" subtitle="查看考试安排与成绩统计" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exams.map((exam, idx) => {
          const isActive = exam.status === 'active'
          const countdown = getCountdown(exam.deadline)
          const isExpired = countdown === '已截止'

          return (
            <div
              key={exam.id}
              className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden animate-fade-in-up stagger-${idx + 1} ${
                isActive ? 'border-emerald-200' : 'border-gray-100'
              }`}
            >
              <div className={`px-5 py-3 flex items-center justify-between ${
                isActive ? 'bg-emerald-50' : 'bg-gray-50'
              }`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {isActive ? '进行中' : '已结束'}
                </span>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  isExpired ? 'text-gray-400' : 'text-amber-600'
                }`}>
                  <AlertCircle size={12} />
                  {countdown}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-emerald-50' : 'bg-gray-50'
                  }`}>
                    <FileQuestion size={20} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileQuestion size={14} className="text-gray-400" />
                    <span className="text-gray-500">题目</span>
                    <span className="font-medium text-gray-900">{exam.questionCount}题</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-500">时长</span>
                    <span className="font-medium text-gray-900">{exam.duration}分钟</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award size={14} className="text-gray-400" />
                    <span className="text-gray-500">及格</span>
                    <span className="font-medium text-gray-900">{exam.passScore}分</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-gray-500">参与</span>
                    <span className="font-medium text-gray-900">{exam.participantCount}人</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-400">平均分</span>
                    <span className={`ml-1 font-semibold ${exam.avgScore >= exam.passScore ? 'text-emerald-600' : 'text-red-600'}`}>
                      {exam.avgScore}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">截止: {exam.deadline}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
