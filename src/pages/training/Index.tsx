import { GraduationCap, BookOpen, FileQuestion, Trophy, ArrowRight, Clock, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { courses, exams } from '@/data/mockData'

export default function TrainingIndex() {
  const completedCourses = courses.filter(c => c.status === 'completed').length
  const completionRate = Math.round((completedCourses / courses.length) * 100)
  const activeExams = exams.filter(e => e.status === 'active')
  const avgScore = exams.reduce((sum, e) => sum + e.avgScore, 0) / exams.length

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="培训中心" subtitle="管理课程学习、考试测评与业绩排行" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stagger-1 animate-fade-in-up">
          <StatCard
            title="课程总数"
            value={courses.length}
            change={12.5}
            icon={<GraduationCap size={20} />}
            iconBg="bg-emerald-50 text-emerald-600"
            suffix="门"
          />
        </div>
        <div className="stagger-2 animate-fade-in-up">
          <StatCard
            title="完成率"
            value={completionRate}
            change={8.3}
            icon={<BookOpen size={20} />}
            iconBg="bg-blue-50 text-blue-600"
            suffix="%"
          />
        </div>
        <div className="stagger-3 animate-fade-in-up">
          <StatCard
            title="平均考试分数"
            value={avgScore.toFixed(1)}
            change={5.2}
            icon={<FileQuestion size={20} />}
            iconBg="bg-amber-50 text-amber-600"
            suffix="分"
          />
        </div>
        <div className="stagger-4 animate-fade-in-up">
          <StatCard
            title="获得证书"
            value={3}
            change={1}
            icon={<Trophy size={20} />}
            iconBg="bg-purple-50 text-purple-600"
            suffix="个"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">课程进度</h2>
              <Link to="/training/courses" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{course.title}</h4>
                        <span className="text-xs text-gray-400">{course.category} · {course.duration}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      course.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      course.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {course.status === 'completed' ? '已完成' : course.status === 'in_progress' ? '学习中' : '未开始'}
                    </span>
                  </div>
                  <div className="ml-11">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>{course.completedLessons}/{course.totalLessons} 课时</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          course.status === 'completed' ? 'bg-emerald-500' :
                          course.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">即将到期的考试</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {activeExams.map((exam) => (
                <div key={exam.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <FileQuestion size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{exam.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />{exam.duration}分钟
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Award size={12} />及格{exam.passScore}分
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-amber-600 font-medium">截止: {exam.deadline}</span>
                        <Link to="/training/exams" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                          去考试 →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">快捷入口</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/training/courses" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors">
                <BookOpen size={20} className="text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">课程中心</span>
              </Link>
              <Link to="/training/exams" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                <FileQuestion size={20} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-700">考试测评</span>
              </Link>
              <Link to="/training/rankings" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                <Trophy size={20} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-700">业绩排行</span>
              </Link>
              <Link to="/" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <GraduationCap size={20} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-700">我的证书</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
