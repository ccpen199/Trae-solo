import { useState } from 'react'
import { BookOpen, Clock, PlayCircle, CheckCircle, CircleDot } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { courses } from '@/data/mockData'

const categories = ['全部', '产品知识', '合规培训', '销售技能', '专业知识']

const categoryColors: Record<string, string> = {
  '产品知识': 'bg-blue-50 text-blue-700',
  '合规培训': 'bg-red-50 text-red-700',
  '销售技能': 'bg-amber-50 text-amber-700',
  '专业知识': 'bg-purple-50 text-purple-700',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle size={14} className="text-emerald-500" /> },
  in_progress: { label: '学习中', color: 'bg-blue-50 text-blue-700', icon: <PlayCircle size={14} className="text-blue-500" /> },
  not_started: { label: '未开始', color: 'bg-gray-100 text-gray-500', icon: <CircleDot size={14} className="text-gray-400" /> },
}

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState('全部')

  const filtered = activeCategory === '全部' ? courses : courses.filter(c => c.category === activeCategory)

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="课程中心" subtitle="浏览和学习各类培训课程" />

      <div className="flex items-center gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((course, idx) => {
          const status = statusConfig[course.status]
          return (
            <div
              key={course.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden animate-fade-in-up stagger-${idx + 1}`}
            >
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${course.progress}%` }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[course.category] || 'bg-gray-100 text-gray-600'}`}>
                      {course.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {status.icon}
                    <span className={`text-xs font-medium ${status.color.split(' ')[1]}`}>{status.label}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-3">{course.title}</h3>

                <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />{course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />{course.totalLessons} 课时
                  </span>
                </div>

                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400">学习进度</span>
                  <span className="font-medium text-gray-600">{course.completedLessons}/{course.totalLessons}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      course.status === 'completed' ? 'bg-emerald-500' :
                      course.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="text-right mt-1 text-xs text-gray-400">{course.progress}%</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
