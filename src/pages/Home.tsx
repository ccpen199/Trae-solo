import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, Scissors, Baby, HeartPulse, Siren, Pill, Scan, Microscope, MapPin, Building2, Users, ArrowRight, TrendingUp, Eye, Stethoscope, ShieldCheck, FileCheck, ShieldAlert, BarChart3, MessageCircle, FileText, LockKeyhole, BookOpen, BadgeCheck, Clock, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store'

const hotDepartments = [
  { id: '1', name: '内科', icon: Heart, count: 128 },
  { id: '2', name: '外科', icon: Scissors, count: 96 },
  { id: '3', name: '儿科', icon: Baby, count: 72 },
  { id: '4', name: '妇产科', icon: HeartPulse, count: 64 },
  { id: '5', name: '急诊科', icon: Siren, count: 85 },
  { id: '6', name: '药学', icon: Pill, count: 53 },
  { id: '7', name: '影像科', icon: Scan, count: 41 },
  { id: '8', name: '检验科', icon: Microscope, count: 37 },
]

const quickEntries = [
  { icon: BadgeCheck, title: '执业资质认证', desc: '持证医疗人才专属认证通道', path: '/register', role: 'talent' },
  { icon: FileCheck, title: '机构资质年审', desc: '医疗机构执业许可年度审核', path: '/admin/institutions', role: 'admin' },
  { icon: FileText, title: '智能简历解析', desc: 'AI自动解析结构化存储', path: '/resume', role: 'talent' },
  { icon: LockKeyhole, title: '隐私字段授权', desc: '联系方式分级授权保护', path: '/resume', role: 'talent' },
  { icon: ShieldAlert, title: '虚假岗位复核', desc: 'AI识别+人工双重审核', path: '/admin/jobs-review', role: 'admin' },
  { icon: BarChart3, title: '热度数据看板', desc: '区域/科室/岗位多维统计', path: '/admin/dashboard', role: 'all' },
]

const platformAnnouncements = [
  { id: 1, type: 'policy', title: '卫健委发布2026年医师资格考试报名通知', tag: '政策解读', date: '2026-06-10' },
  { id: 2, type: 'notice', title: '本月经32家机构资质审核通过，12家待复核', tag: '平台公告', date: '2026-06-08' },
  { id: 3, type: 'education', title: '国家级继续医学教育项目申报开始', tag: '继续教育', date: '2026-06-05' },
]

interface JobItem {
  id: string
  title: string
  department: string
  institution_name: string
  institution_type: string
  location: string
  salary_min: number
  salary_max: number
  required_title: string
  status: string
  ai_risk_score: number
}

interface PostItem {
  id: string
  title: string
  category: string
  tags: string
  likes: number
  comments: number
  author_name: string
}

interface OverviewStats {
  totalJobs?: number
  totalInstitutions?: number
  totalTalents?: number
  totalApplications?: number
  [key: string]: any
}

interface VerificationStatus {
  id: string
  user_name: string
  role: string
  review_status: string
  review_note?: string
  submitted_at: string
}

function formatSalary(min: number, max: number) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${fmt(min)}-${fmt(max)}`
}

function formatNumber(n: number) {
  return n.toLocaleString()
}

const categoryMap: Record<string, string> = {
  policy: '政策解读',
  education: '继续教育',
  news: '行业动态',
}

const statusMap: Record<string, string> = {
  pending: '待审核',
  active: '已上架',
  rejected: '已驳回',
  closed: '已下架',
}

const statusColorMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-stone-100 text-stone-600',
}

const verifyStatusMap: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

export default function Home() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [latestJobs, setLatestJobs] = useState<JobItem[]>([])
  const [communityPosts, setCommunityPosts] = useState<PostItem[]>([])
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const promises: Promise<any>[] = [
          apiFetch('/jobs?page=1&pageSize=6'),
          apiFetch('/community/posts?page=1&pageSize=3'),
          apiFetch('/admin/dashboard'),
        ]
        if (user && user.role !== 'admin') {
          promises.push(apiFetch(`/auth/profile`))
        }
        const results = await Promise.allSettled(promises)
        if (results[0].status === 'fulfilled' && results[0].value.success) {
          setLatestJobs(results[0].value.data.items || [])
        }
        if (results[1].status === 'fulfilled' && results[1].value.success) {
          setCommunityPosts(results[1].value.data.items || [])
        }
        if (results[2].status === 'fulfilled' && results[2].value.success) {
          setOverview(results[2].value.data.overview || {})
        }
        if (user && user.role !== 'admin' && results[3]) {
          const profileRes = results[3] as any
          if (profileRes.status === 'fulfilled' && profileRes.value.success) {
            const p = profileRes.value.data
            setVerifyStatus({
              id: String(p.id),
              user_name: p.name || user.name,
              role: p.role || user.role,
              review_status: p.review_status || (p.verified ? 'approved' : 'pending'),
              review_note: p.review_note,
              submitted_at: p.created_at || p.submitted_at || new Date().toISOString(),
            })
          }
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const handleSearch = () => {
    navigate(`/jobs?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleRegister = (role: string) => {
    navigate(`/register?role=${role}`)
  }

  const parseTags = (tagsStr: string) => {
    try {
      return JSON.parse(tagsStr)
    } catch {
      return []
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl font-bold mb-4">医疗人才 · 精准匹配</h1>
          <p className="text-teal-100 text-lg mb-8">连接优质医疗机构与持证医疗人才，让招聘更专业</p>
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索职位、科室、机构..."
              className="w-full h-14 pl-5 pr-14 rounded-xl text-stone-800 text-lg focus:ring-4 focus:ring-teal-300/50"
            />
            <button onClick={handleSearch} className="absolute right-2 top-2 h-10 w-10 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            {['内科', '外科', '北京', '上海', '主治医师', '副主任医师'].map((tag) => (
              <button key={tag} onClick={() => navigate(`/jobs?q=${tag}`)} className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-sm transition-colors">
                {tag}
              </button>
            ))}
          </div>

          {!user && (
            <div className="flex justify-center gap-4 mt-10">
              <button onClick={() => handleRegister('talent')} className="px-6 py-3 bg-white text-teal-700 rounded-xl font-medium hover:bg-teal-50 transition-colors flex items-center gap-2 shadow-lg">
                <Stethoscope className="w-5 h-5" /> 医疗人才注册
              </button>
              <button onClick={() => handleRegister('institution')} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center gap-2 shadow-lg">
                <Building2 className="w-5 h-5" /> 医疗机构入驻
              </button>
            </div>
          )}
        </div>
      </section>

      {user && verifyStatus && verifyStatus.review_status !== 'approved' && (
        <section className="container mx-auto px-4 -mt-6 relative z-10">
          <div className={`rounded-xl p-5 shadow-lg ${verifyStatus.review_status === 'pending' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${verifyStatus.review_status === 'pending' ? 'bg-amber-100' : 'bg-red-100'}`}>
                  {verifyStatus.review_status === 'pending' ? <Clock className="w-6 h-6 text-amber-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
                </div>
                <div>
                  <div className="font-medium text-stone-800 flex items-center gap-2">
                    {user.role === 'talent' ? '执业资质' : '机构资质'}审核状态
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${verifyStatus.review_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {verifyStatusMap[verifyStatus.review_status] || verifyStatus.review_status}
                    </span>
                  </div>
                  <div className="text-sm text-stone-500 mt-0.5">
                    {verifyStatus.review_status === 'pending'
                      ? '您的资质认证正在审核中，预计1-3个工作日完成'
                      : `审核未通过：${verifyStatus.review_note || '请补充完整材料后重新提交'}`}
                  </div>
                </div>
              </div>
              <Link to="/register" className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-1">
                {verifyStatus.review_status === 'pending' ? '查看进度' : '重新提交'} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">热门科室</h2>
          <Link to="/jobs" className="text-teal-700 hover:text-teal-800 text-sm font-medium flex items-center gap-1">
            全部科室 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {hotDepartments.map((dept) => {
            const Icon = dept.icon
            return (
              <Link
                key={dept.id}
                to={`/jobs?department=${dept.name}`}
                className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-6 h-6 text-teal-700" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-stone-800">{dept.name}</div>
                  <div className="text-sm text-stone-500">{dept.count}个在招</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-700 transition-colors" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">最新职位</h2>
            <div className="flex items-center gap-3">
              {user?.role === 'institution' && (
                <Link to="/job/post" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors flex items-center gap-1">
                  <FileCheck className="w-4 h-4" /> 发布职位
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin/jobs-review" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> 岗位复核
                </Link>
              )}
              <Link to="/jobs" className="text-teal-700 hover:text-teal-800 text-sm font-medium flex items-center gap-1">
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="text-center text-stone-500 py-8">加载中...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {latestJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-stone-800">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{job.department}</span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded">{job.required_title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColorMap[job.status] || 'bg-stone-100 text-stone-600'}`}>{statusMap[job.status] || job.status}</span>
                        {job.ai_risk_score > 50 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 高风险
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-amber-600 font-bold text-lg whitespace-nowrap">{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.institution_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                  </div>
                  {user?.role === 'institution' && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={(e) => { e.preventDefault(); navigate(`/admin/jobs-review`) }} className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs hover:bg-stone-200 transition-colors">管理</button>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold mb-6">业务功能入口</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickEntries.filter(e => e.role === 'all' || e.role === user?.role || (!user && (e.role === 'talent' || e.role === 'all'))).map((entry, idx) => {
            const Icon = entry.icon
            return (
              <Link key={idx} to={entry.path} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-teal-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
                    <Icon className="w-6 h-6 text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-stone-800 group-hover:text-teal-700 transition-colors">{entry.title}</h3>
                    <p className="text-sm text-stone-500 mt-1">{entry.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-700 transition-colors shrink-0" />
                </div>
              </Link>
            )
          })}
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/data-masking" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-teal-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
                    <ShieldCheck className="w-6 h-6 text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-stone-800 group-hover:text-teal-700 transition-colors">数据脱敏归档</h3>
                    <p className="text-sm text-stone-500 mt-1">简历敏感字段脱敏处理与归档</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-700 transition-colors shrink-0" />
                </div>
              </Link>
            </>
          )}
          {user?.role === 'talent' && (
            <>
              <Link to="/messages" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-teal-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
                    <MessageCircle className="w-6 h-6 text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-stone-800 group-hover:text-teal-700 transition-colors">在线沟通</h3>
                    <p className="text-sm text-stone-500 mt-1">与招聘机构实时沟通交流</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-700 transition-colors shrink-0" />
                </div>
              </Link>
              <Link to="/resume/preview" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-teal-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
                    <FileText className="w-6 h-6 text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-stone-800 group-hover:text-teal-700 transition-colors">简历导出PDF</h3>
                    <p className="text-sm text-stone-500 mt-1">一键导出标准格式PDF简历</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-700 transition-colors shrink-0" />
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">平台数据概览</h2>
            <Link to="/admin/dashboard" className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
              <BarChart3 className="w-4 h-4" /> 查看完整数据看板 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalJobs || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" /> 在招岗位
              </div>
              <div className="text-teal-300 text-sm mt-1">本月新增 {overview ? Math.round((overview.totalJobs || 0) * 0.12) : 0}+</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalInstitutions || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <Building2 className="w-5 h-5" /> 注册机构
              </div>
              <div className="text-teal-300 text-sm mt-1">三甲医院占比 62%</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalTalents || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" /> 医疗人才
              </div>
              <div className="text-teal-300 text-sm mt-1">中高级职称占比 78%</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalApplications || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" /> 成功匹配
              </div>
              <div className="text-teal-300 text-sm mt-1">面试邀约率 68%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">平台公告</h2>
          </div>
          <div className="space-y-3">
            {platformAnnouncements.map((ann) => (
              <div key={ann.id} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer group">
                <div className={`w-2 h-2 rounded-full ${ann.type === 'policy' ? 'bg-red-500' : ann.type === 'education' ? 'bg-teal-500' : 'bg-amber-500'}`} />
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium shrink-0">#{ann.tag}</span>
                <span className="flex-1 text-stone-700 group-hover:text-teal-700 transition-colors">{ann.title}</span>
                <span className="text-sm text-stone-400 shrink-0">{ann.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">行业资讯</h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {['全部', '政策解读', '继续教育', '行业动态'].map((cat) => (
                <Link key={cat} to={`/community?category=${cat === '全部' ? '' : cat}`} className="px-3 py-1 text-sm text-stone-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors">
                  {cat}
                </Link>
              ))}
            </div>
            <Link to="/community" className="text-teal-700 hover:text-teal-800 text-sm font-medium flex items-center gap-1">
              更多资讯 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-stone-500 py-8">加载中...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {communityPosts.map((post) => {
              const tags = parseTags(post.tags)
              return (
                <Link key={post.id} to={`/community/${post.id}`} className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-stone-200 hover:border-teal-200 group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">#{categoryMap[post.category] || post.category}</span>
                    {tags.slice(0, 1).map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs">#{tag}</span>
                    ))}
                  </div>
                  <h3 className="font-medium mt-2 text-stone-800 line-clamp-2 group-hover:text-teal-700 transition-colors">{post.title}</h3>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-stone-400">作者：{post.author_name}</span>
                    <div className="flex items-center gap-4 text-stone-400">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.likes}</span>
                      <span>{post.comments} 评论</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <footer className="bg-stone-800 text-stone-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-6 h-6 text-teal-500" />
                <span className="font-heading text-xl font-bold text-white">医聘通</span>
              </div>
              <p className="text-sm leading-relaxed">连接优质医疗机构与持证医疗人才，让医疗招聘更专业、更合规、更高效。</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">医疗人才</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register?role=talent" className="hover:text-teal-500 transition-colors">人才注册</Link></li>
                <li><Link to="/resume" className="hover:text-teal-500 transition-colors">简历管理</Link></li>
                <li><Link to="/jobs" className="hover:text-teal-500 transition-colors">浏览职位</Link></li>
                <li><Link to="/matches" className="hover:text-teal-500 transition-colors">智能匹配</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">医疗机构</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register?role=institution" className="hover:text-teal-500 transition-colors">机构入驻</Link></li>
                <li><Link to="/job/post" className="hover:text-teal-500 transition-colors">发布职位</Link></li>
                <li><Link to="/admin/institutions" className="hover:text-teal-500 transition-colors">资质年审</Link></li>
                <li><Link to="/messages" className="hover:text-teal-500 transition-colors">人才沟通</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">平台管理</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/admin/dashboard" className="hover:text-teal-500 transition-colors">数据看板</Link></li>
                <li><Link to="/admin/jobs-review" className="hover:text-teal-500 transition-colors">岗位审核</Link></li>
                <li><Link to="/admin/data-masking" className="hover:text-teal-500 transition-colors">数据脱敏</Link></li>
                <li><Link to="/community" className="hover:text-teal-500 transition-colors">医疗社区</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-700 mt-8 pt-8 text-sm flex items-center justify-between">
            <div>© 2026 医聘通 医疗行业垂直招聘平台</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> ICP备案：京ICP备2026XXXX号</span>
              <span className="flex items-center gap-1"><LockKeyhole className="w-4 h-4" /> 网络安全等级保护三级</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
