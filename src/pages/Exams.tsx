import { useState } from 'react'
import {
  BookOpen,
  Search,
  Play,
  Clock,
  FileText,
  CheckCircle,
  Award,
  ChevronRight,
  Filter,
  Star,
  GraduationCap,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useBusinessStore } from '@/store/business'

export default function Exams() {
  const [activeTab, setActiveTab] = useState<'courses' | 'exams'>('courses')
  const { addToast, openModal } = useBusinessStore()

  const courses = [
    {
      id: 'C01',
      title: '新品松花粉片升级版深度解析',
      category: '产品培训',
      progress: 75,
      duration: '45 分钟',
      lessons: 8,
      completedLessons: 6,
      cover: '🌰',
      gradient: 'from-amber-100 to-orange-100',
    },
    {
      id: 'C02',
      title: '合规展业话术与风险防控',
      category: '合规培训',
      progress: 100,
      duration: '60 分钟',
      lessons: 12,
      completedLessons: 12,
      cover: '🛡️',
      gradient: 'from-sky-100 to-blue-100',
    },
    {
      id: 'C03',
      title: '客户沟通与需求挖掘技巧',
      category: '销售技能',
      progress: 30,
      duration: '50 分钟',
      lessons: 10,
      completedLessons: 3,
      cover: '💬',
      gradient: 'from-violet-100 to-purple-100',
    },
    {
      id: 'C04',
      title: '健康管理基础知识',
      category: '专业知识',
      progress: 0,
      duration: '90 分钟',
      lessons: 15,
      completedLessons: 0,
      cover: '🏥',
      gradient: 'from-emerald-100 to-teal-100',
    },
  ]

  const exams = [
    {
      id: 'E01',
      title: '新品知识考核 · 松花粉片',
      questions: 20,
      passing: 80,
      duration: '30 分钟',
      status: 'pending',
      deadline: '2026-06-25',
    },
    {
      id: 'E02',
      title: '合规展业知识测试',
      questions: 15,
      passing: 90,
      duration: '20 分钟',
      status: 'passed',
      score: 95,
    },
    {
      id: 'E03',
      title: '产品基础知识月度测评',
      questions: 30,
      passing: 75,
      duration: '45 分钟',
      status: 'failed',
      score: 68,
      deadline: '2026-06-30',
    },
    {
      id: 'E04',
      title: '销售技能认证考试',
      questions: 25,
      passing: 85,
      duration: '40 分钟',
      status: 'passed',
      score: 88,
    },
  ]

  const stats = [
    { label: '已完成课程', value: 18, icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
    { label: '学习时长', value: '32h', icon: Clock, color: 'from-sky-500 to-blue-600' },
    { label: '考试通过率', value: '87.5%', icon: Target, color: 'from-amber-500 to-orange-500' },
    { label: '获得证书', value: 6, icon: Award, color: 'from-violet-500 to-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            培训考试
          </h1>
          <p className="text-slate-500 text-sm mt-1">总部标准化课件 · 在线考试 · 技能认证</p>
        </div>
      </div>

      {/* 学习进度 */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-3 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <GraduationCap className="w-4 h-4" />
              2026 年度学习进度
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-bold">已完成 72% 年度培训目标</h2>
            <p className="mt-2 text-white/80">继续加油，距离获得「高级健康顾问」认证还需完成 4 门课程</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex-1 max-w-md h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-[72%] bg-white rounded-full" />
              </div>
              <span className="text-xl font-bold">72%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                  <Icon className="w-5 h-5 text-white/70" />
                  <div className="text-2xl font-bold mt-1">{s.value}</div>
                  <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 inline-flex">
        {[
          { key: 'courses', label: '培训课程', icon: BookOpen, badge: courses.filter((c) => c.progress > 0 && c.progress < 100).length },
          { key: 'exams', label: '考试中心', icon: FileText, badge: exams.filter((e) => e.status === 'pending').length },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 培训课程 */}
      {activeTab === 'courses' && (
        <>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索课程..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {['全部', '产品培训', '合规培训', '销售技能', '专业知识'].map((c) => (
                  <button
                    key={c}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition whitespace-nowrap"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition flex items-center gap-2 whitespace-nowrap">
                <Filter className="w-4 h-4" />
                筛选
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((c) => (
              <div
                key={c.id}
                onClick={() => addToast({ type: 'info', title: '课程详情', description: '正在加载课程内容与课件...' })}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition group cursor-pointer"
              >
                <div className="flex">
                  <div
                    className={`w-32 flex-shrink-0 bg-gradient-to-br ${c.gradient} flex items-center justify-center text-5xl`}
                  >
                    {c.cover}
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-indigo-600 font-medium">{c.category}</span>
                        <h3 className="font-semibold text-slate-800 mt-1 group-hover:text-indigo-600 transition line-clamp-1">
                          {c.title}
                        </h3>
                      </div>
                      {c.progress === 100 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 whitespace-nowrap">
                          <CheckCircle className="w-3 h-3" />
                          已完成
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {c.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="w-3.5 h-3.5" />
                        {c.completedLessons}/{c.lessons} 课时
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">学习进度</span>
                        <span className="font-semibold text-slate-700">{c.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.progress === 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                              : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                          }`}
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (c.progress === 100) {
                          addToast({ type: 'success', title: '我的证书', description: '正在加载电子证书...' })
                        } else {
                          addToast({ type: 'info', title: '学习记录', description: '继续上次学习进度...' })
                        }
                      }}
                      className="mt-4 w-full py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center justify-center gap-1"
                    >
                      {c.progress === 0 ? '开始学习' : c.progress === 100 ? '查看证书' : '继续学习'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 考试中心 */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {exams.map((e) => (
            <div
              key={e.id}
              className={`bg-white rounded-2xl p-6 border transition ${
                e.status === 'pending'
                  ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white'
                  : 'border-slate-200 hover:shadow-lg'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      e.status === 'passed'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : e.status === 'failed'
                        ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-500'
                    }`}
                  >
                    {e.status === 'passed' ? (
                      <Award className="w-6 h-6 text-white" />
                    ) : e.status === 'failed' ? (
                      <Star className="w-6 h-6 text-white" />
                    ) : (
                      <FileText className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-lg">{e.title}</h3>
                      {e.status === 'pending' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full animate-pulse">
                          待完成
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {e.questions} 题
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-slate-400" />
                        及格线 {e.passing} 分
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {e.duration}
                      </span>
                      {e.deadline && (
                        <span className="flex items-center gap-1 text-rose-600">
                          ⏰ 截止 {e.deadline}
                        </span>
                      )}
                    </div>
                    {(e.status === 'passed' || e.status === 'failed') && (
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={`text-2xl font-bold ${
                            e.status === 'passed' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {e.score}
                        </span>
                        <span className="text-slate-400">/ 100 分</span>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                            e.status === 'passed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {e.status === 'passed' ? '已通过' : '未通过'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (e.status === 'pending' || e.status === 'failed') {
                      addToast({ type: 'success', title: '进入考场', description: '请在规定时间内完成答题' })
                    } else {
                      addToast({ type: 'info', title: '题解详情', description: '正在加载答卷解析与评分详情...' })
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center gap-1.5 ${
                    e.status === 'pending'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 hover:-translate-y-0.5'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {e.status === 'pending'
                    ? '开始考试'
                    : e.status === 'failed'
                    ? '重新考试'
                    : '查看答卷'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
