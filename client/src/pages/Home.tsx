import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Briefcase, Palette, Code, FileText, Megaphone, Home as HomeIcon, TrendingUp, Users, Award, ChevronRight, DollarSign, Building2, UserCheck } from 'lucide-react'
import api from '../api'
import { Task, Skill, PlatformStats } from '../types'

const categories = [
  { name: '设计服务', icon: Palette, color: 'from-pink-500 to-rose-500', category: 'DESIGN' },
  { name: '开发服务', icon: Code, color: 'from-blue-500 to-indigo-500', category: 'DEVELOPMENT' },
  { name: '文案撰写', icon: FileText, color: 'from-amber-500 to-orange-500', category: 'COPYWRITING' },
  { name: '营销推广', icon: Megaphone, color: 'from-green-500 to-emerald-500', category: 'MARKETING' },
  { name: '装修设计', icon: HomeIcon, color: 'from-purple-500 to-violet-500', category: 'DECORATION' },
  { name: '视频制作', icon: TrendingUp, color: 'from-red-500 to-pink-500', category: 'VIDEO' },
]

const getStatusLabel = (status: string, daysLeft?: number) => {
  if (daysLeft !== undefined && daysLeft <= 0) {
    return { text: '已截止', className: 'bg-gray-100 text-gray-600' }
  }
  switch (status) {
    case 'BIDDING':
      return { text: '招标中', className: 'bg-primary-50 text-primary-700' }
    case 'IN_PROGRESS':
      return { text: '进行中', className: 'bg-amber-50 text-amber-700' }
    case 'COMPLETED':
      return { text: '已完成', className: 'bg-green-50 text-green-700' }
    default:
      return { text: '招标中', className: 'bg-primary-50 text-primary-700' }
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, skillsRes, statsRes] = await Promise.all([
          api.get('/tasks?pageSize=6'),
          api.get('/skills'),
          api.get('/tasks/stats'),
        ])
        setTasks(tasksRes.data.data || tasksRes.data)
        setSkills(skillsRes.data.slice(0, 12))
        setStats(statsRes.data)
      } catch (error) {
        console.error('获取数据失败', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿'
    } else if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toLocaleString()
  }

  const statsDisplay = stats ? [
    { label: '累计服务商', value: `${formatNumber(stats.totalProviders)}+`, icon: UserCheck },
    { label: '累计雇主', value: `${formatNumber(stats.totalEmployers)}+`, icon: Building2 },
    { label: '累计任务', value: `${formatNumber(stats.totalTasks)}+`, icon: Briefcase },
    { label: '累计交易额', value: `¥${formatNumber(stats.totalAmount)}`, icon: DollarSign },
  ] : [
    { label: '累计服务商', value: '12,380+', icon: UserCheck },
    { label: '累计雇主', value: '26,270+', icon: Building2 },
    { label: '累计任务', value: '38,650+', icon: Briefcase },
    { label: '累计交易额', value: '¥5.2亿', icon: DollarSign },
  ]

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              让创意<span className="text-yellow-300">更有价值</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              专业的创意服务众包平台，连接雇主与优质服务商，让每一个创意都能实现
            </p>

            <div className="bg-white rounded-2xl p-2 flex items-center shadow-2xl max-w-2xl mx-auto">
              <Search className="w-6 h-6 text-gray-400 ml-4" />
              <input
                type="text"
                placeholder="搜索您需要的服务：UI设计、小程序开发、文案撰写..."
                className="flex-1 px-4 py-3 text-gray-800 outline-none bg-transparent"
              />
              <Link to="/tasks/create" className="btn-primary !py-3 !px-8 rounded-xl">
                发布需求
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
              <span className="text-blue-200">热门搜索：</span>
              {['UI设计', '微信小程序', 'Logo设计', '短视频脚本', '网站开发'].map((tag) => (
                <Link
                  key={tag}
                  to={`/tasks?search=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 cursor-pointer transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <Link to="/register" className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
                立即加入
              </Link>
              <Link to="/tasks" className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                浏览任务
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsDisplay.map((stat) => (
            <div key={stat.label} className="card p-6 text-center hover:shadow-md transition-shadow">
              <stat.icon className="w-10 h-10 text-primary-600 mx-auto mb-3" />
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">服务分类</h2>
            <p className="text-gray-500 mt-2">选择您需要的创意服务类别</p>
          </div>
          <Link to="/tasks" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/tasks?category=${cat.category}`}
              className="card p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <cat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
              <p className="text-xs text-gray-500">查看相关任务</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">热门技能标签</h2>
              <p className="text-gray-500 mt-2">查看各领域专业技能及供需情况</p>
            </div>
            <Link to="/skills" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {loading ? (
              Array(12).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-2.5 bg-white rounded-full border border-gray-200 animate-pulse">
                  <div className="h-5 w-20 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : (
              skills.map((skill) => (
                <Link
                  key={skill.id}
                  to={`/tasks?skillId=${skill.id}`}
                  className="px-5 py-2.5 bg-white rounded-full hover:bg-primary-50 hover:text-primary-600 border border-gray-200 hover:border-primary-300 transition-all text-sm font-medium text-gray-700 shadow-sm"
                >
                  {skill.name}
                  <span className="ml-2 text-xs text-gray-400">{skill.demandCount} 需求</span>
                  {skill.gapPercentage > 0 && (
                    <span className="ml-1.5 text-xs text-orange-500">↑{skill.gapPercentage}%</span>
                  )}
                  {skill.gapPercentage < 0 && (
                    <span className="ml-1.5 text-xs text-green-500">↓{Math.abs(skill.gapPercentage)}%</span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">最新任务</h2>
            <p className="text-gray-500 mt-2">浏览最新发布的创意需求</p>
          </div>
          <Link to="/tasks" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))
          ) : (
            tasks.map((task) => {
              const statusInfo = getStatusLabel(task.status, task.daysLeft)
              return (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="card p-5 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                    <span className="text-amber-600 font-bold">
                      ¥{task.budgetMin?.toLocaleString()}~{task.budgetMax?.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {task.skills?.slice(0, 3).map((skill) => (
                      <span key={skill.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <img
                        src={task.employer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.employerId}`}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-gray-500">{task.employer?.username}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>{task._count?.bids || 0} 人投标</span>
                      <span>
                        {task.daysLeft !== undefined && task.daysLeft > 0 ? `剩余${task.daysLeft}天` : '已截止'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">有专业技能？成为服务商</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            加入平台，展示您的专业能力，承接高质量项目，实现技能变现
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
              立即加入
            </Link>
            <Link to="/tasks" className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              浏览任务
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
