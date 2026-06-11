import { TrendingUp, Target, Briefcase, BookOpen, ArrowRight, Zap, Users, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Target,
    title: '能力差距诊断',
    desc: '输入职业目标，自动生成能力差距报告，精准定位提升方向',
    link: '/gap-diagnosis',
    color: 'from-primary-500 to-primary-700',
  },
  {
    icon: TrendingUp,
    title: '职业能力图谱',
    desc: '覆盖300+岗位胜任力模型，含硬技能树、软技能维度与晋升路径',
    link: '/competency',
    color: 'from-accent-500 to-accent-600',
  },
  {
    icon: Briefcase,
    title: '成长性职位匹配',
    desc: '融合显性条件与隐性信号，关注职业成长而非单纯薪资撮合',
    link: '/job-match',
    color: 'from-warn-500 to-warn-600',
  },
  {
    icon: BookOpen,
    title: '职业百科',
    desc: '真实工作流视频、从业者访谈、入行门槛阶梯图',
    link: '/encyclopedia',
    color: 'from-danger-400 to-danger-600',
  },
]

const stats = [
  { value: '300+', label: '岗位胜任力模型' },
  { value: '50+', label: '行业认证路径' },
  { value: '12', label: '职业大类覆盖' },
  { value: '85%', label: '匹配准确率' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6">
              <Zap className="w-4 h-4 text-warn-400" />
              <span>职业发展导向 · 重新定义求职匹配</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              不只是找一份工作
              <br />
              <span className="text-primary-200">而是规划一段职业旅程</span>
            </h1>
            <p className="text-lg text-primary-100 mb-10 leading-relaxed max-w-2xl">
              CareerPath 基于职业能力图谱与成长性分析，帮助求职者看清能力差距，
              帮助企业找到真正匹配的人才，让每一次职业选择都通向更好的未来。
            </p>
            <div className="flex gap-4">
              <Link
                to="/gap-diagnosis"
                className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors shadow-lg"
              >
                开始差距诊断
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/job-match"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                浏览职位
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 -mt-8">
        <div className="grid grid-cols-4 gap-4 bg-white rounded-2xl shadow-lg p-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center px-4 py-2">
              <div className="text-3xl font-bold text-primary-600">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">核心能力</h2>
          <p className="text-gray-500 text-lg">围绕职业发展全链路构建的智能匹配系统</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc, link, color }) => (
            <Link
              key={title}
              to={link}
              className="group bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:border-primary-100 transition-all duration-300"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed mb-4">{desc}</p>
              <div className="flex items-center gap-2 text-primary-600 font-medium text-sm group-hover:gap-3 transition-all">
                了解更多 <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-10 text-center">
          <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">HR 人才池运营工具</h3>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            潜力人才标记、长期跟进提醒、岗位需求变化预警，帮助HR团队高效运营人才储备
          </p>
          <Link
            to="/hr-tools"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            进入HR工作台
          </Link>
        </div>
      </div>
    </div>
  )
}
