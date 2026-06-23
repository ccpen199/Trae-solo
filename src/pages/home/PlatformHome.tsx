import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Briefcase,
  Sparkles,
  CalendarCheck,
  PenTool,
  Archive,
  EyeOff,
  Target,
  Send,
  Clock,
  KeyRound,
  Scale,
  BarChart3,
  Building2,
  Users,
  TrendingUp,
  FileCheck,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useStore } from '@/store'
import {
  mockJobs,
  mockVerificationRecords,
  mockAnalyticsData,
  mockContracts,
  mockSignRecords,
} from '@/mock/data'
import JobCard from '@/components/business/JobCard'
import type { Job, VerificationRecord, VerificationStatus } from '../../../shared/types'

interface WorkflowStep {
  id: number
  title: string
  sub: string
  status: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  role: 'employer' | 'jobseeker'
}

interface CompanyVerificationSummary {
  status: VerificationStatus
  riskLevel?: 'none' | 'low' | 'medium' | 'high'
}

const employerSteps: WorkflowStep[] = [
  {
    id: 1,
    title: '资质核验',
    sub: 'OCR+风险扫描',
    status: '今日通过+42',
    icon: ShieldCheck,
    route: '/employer/verification',
    role: 'employer',
  },
  {
    id: 2,
    title: '发布岗位',
    sub: 'JD模板+复审',
    status: '待审57项',
    icon: Briefcase,
    route: '/employer/jobs',
    role: 'employer',
  },
  {
    id: 3,
    title: '智能匹配',
    sub: '标签+时段匹配',
    status: '匹配率87%',
    icon: Sparkles,
    route: '/employer/talent',
    role: 'employer',
  },
  {
    id: 4,
    title: '面试邀约',
    sub: '时效管理',
    status: '响应率91%',
    icon: CalendarCheck,
    route: '/employer/interview',
    role: 'employer',
  },
  {
    id: 5,
    title: '电子签约',
    sub: '区块链存证',
    status: '签约率89%',
    icon: PenTool,
    route: '/contract/templates',
    role: 'employer',
  },
  {
    id: 6,
    title: '备案归档',
    sub: '人社系统对接',
    status: '已备案142份',
    icon: Archive,
    route: '/contract/records',
    role: 'employer',
  },
]

const jobseekerSteps: WorkflowStep[] = [
  {
    id: 1,
    title: '简历脱敏',
    sub: '手机号隐藏',
    status: '隐私保障100%',
    icon: EyeOff,
    route: '/jobseeker/resume',
    role: 'jobseeker',
  },
  {
    id: 2,
    title: '智能匹配',
    sub: '通勤+时段多维',
    status: '推荐99+',
    icon: Target,
    route: '/jobseeker/home',
    role: 'jobseeker',
  },
  {
    id: 3,
    title: '一键投递',
    sub: '脱敏简历发送',
    status: '响应率88%',
    icon: Send,
    route: '/jobseeker/home',
    role: 'jobseeker',
  },
  {
    id: 4,
    title: '面试确认',
    sub: '24h时效管理',
    status: '超时自动失效',
    icon: Clock,
    route: '/jobseeker/interview',
    role: 'jobseeker',
  },
  {
    id: 5,
    title: '背景调查授权',
    sub: '区块链可追溯',
    status: '授权链存证',
    icon: KeyRound,
    route: '/jobseeker/authorization',
    role: 'jobseeker',
  },
  {
    id: 6,
    title: '签约+权益保障',
    sub: '争议调解入口',
    status: '98%解决率',
    icon: Scale,
    route: '/contract/dispute',
    role: 'jobseeker',
  },
]

const verificationFunnelData = [
  { name: '提交资料', value: 100, pct: '100%' },
  { name: 'OCR通过', value: 96, pct: '96%' },
  { name: '风险扫描通过', value: 89, pct: '89%' },
  { name: '人工审核通过', value: 87, pct: '87%' },
]

const satisfactionTrendData = [
  { date: '06-14', value: 95.2 },
  { date: '06-15', value: 95.8 },
  { date: '06-16', value: 96.1 },
  { date: '06-17', value: 96.5 },
  { date: '06-18', value: 96.3 },
  { date: '06-19', value: 96.7 },
  { date: '06-20', value: 96.8 },
]

const filingDonutData = [
  { name: '已备案', value: 88 },
  { name: '备案中', value: 6 },
  { name: '备案失败', value: 3 },
  { name: '未备案', value: 3 },
]

const FILING_COLORS = ['#10B981', '#3B82F6', '#EF4444', '#9CA3AF']

function buildVerificationMap(): Map<string, CompanyVerificationSummary> {
  const map = new Map<string, CompanyVerificationSummary>()
  mockVerificationRecords.forEach((record: VerificationRecord) => {
    map.set(record.companyId, {
      status: record.status,
      riskLevel: record.riskData?.level,
    })
  })
  return map
}

function getMatchReasonsForJob(job: Job): string[] {
  const industryMatchMap: Record<string, string> = {
    restaurant: '餐饮行业经验与您背景高度匹配',
    retail: '零售收银经验符合岗位要求',
    housekeeping: '家政保洁技能匹配',
    logistics: '物流分拣/配送经验符合要求',
    security: '安保工作经验匹配',
    other: '综合技能与岗位要求匹配',
  }
  const commuteOptions = [
    '通勤1.8km在您10km半径内',
    '通勤2.3km在您8km半径内',
    '通勤3.5km在您10km半径内',
    '通勤4.2km直达公交',
    '通勤1.2km步行可达',
  ]
  const scheduleOptions = [
    '夜间时段覆盖宝妈18-22点排班',
    '早班时段符合您朝九晚五偏好',
    '弹性排班匹配兼职时段需求',
    '周末班符合您空闲时间',
    '午晚班覆盖饭点高峰',
  ]
  const certOptions = [
    '健康证要求与您证书匹配',
    '育婴师证与持证要求匹配',
    '食品安全管理员证符合要求',
    '无需持证门槛低',
  ]
  const salaryOptions = [
    '薪资5-7k在您4-8k期望内',
    '时薪22-28元符合您20-30元期望',
    '日结200-350元高于期望',
    '月薪6-9k超过您期望上限',
  ]
  const hashIdx = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h
  }
  const idx = hashIdx(job.id)
  return [
    commuteOptions[idx % commuteOptions.length],
    scheduleOptions[(idx + 1) % scheduleOptions.length],
    certOptions[(idx + 2) % certOptions.length],
    salaryOptions[(idx + 3) % salaryOptions.length],
    industryMatchMap[job.industry] || industryMatchMap.other,
  ]
}

function computeMatchScore(job: Job): number {
  const seed = job.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const base = 75 + (seed % 22)
  const bonus = job.reviewStatus === 'approved' ? 3 : 0
  return Math.min(99, base + bonus)
}

export default function PlatformHomePage() {
  const navigate = useNavigate()
  const { setActiveRole, setCurrentUser } = useStore()

  const verificationMap = useMemo(() => buildVerificationMap(), [])
  const publishedJobs = useMemo(
    () =>
      mockJobs.filter(
        (job) => job.status === 'published' && job.reviewStatus === 'approved',
      ),
    [],
  )

  const topChannelData = useMemo(() => {
    const sorted = [...mockAnalyticsData.channelData].sort(
      (a, b) => b.hires - a.hires,
    )
    return sorted.slice(0, 5).map((c) => ({
      channel: c.channel,
      hires: c.hires,
    }))
  }, [])

  const handleRoleSelect = (
    role: 'employer' | 'jobseeker',
    route?: string,
  ) => {
    setActiveRole(role)
    setCurrentUser({
      id: `user-${Date.now()}`,
      phone: '13800000000',
      role,
      name: role === 'employer' ? '雇主用户' : '求职者用户',
      createdAt: new Date().toISOString(),
    })
    if (route) {
      navigate(route)
    } else {
      navigate(role === 'employer' ? '/employer/dashboard' : '/jobseeker/home')
    }
  }

  const handleWorkflowStepClick = (step: WorkflowStep) => {
    handleRoleSelect(step.role, step.route)
  }

  const handleDashboardNavigate = (route: string, role?: 'employer' | 'admin' | 'jobseeker') => {
    if (role) {
      setActiveRole(role)
      setCurrentUser({
        id: `user-${Date.now()}`,
        phone: '13800000000',
        role,
        name: role === 'employer' ? '雇主用户' : role === 'admin' ? '管理员' : '求职者用户',
        createdAt: new Date().toISOString(),
      })
    }
    navigate(route)
  }

  const handleApply = (job: Job) => {
    handleRoleSelect('jobseeker', '/jobseeker/home')
    void job
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2d4a6f 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              城市服务业人力资源匹配平台
            </h1>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              AI智能风控 · 求职者权益保障 · 高效用工匹配
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="rounded-3xl border-4 border-[#FF6B35]/30 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#FF6B35]/60 hover:bg-white/15 md:p-8">
              <button
                onClick={() => handleRoleSelect('employer')}
                className="group flex w-full items-center justify-between rounded-2xl bg-[#FF6B35] px-6 py-4 text-left transition-all duration-300 hover:bg-[#FF5A20] hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-serif text-xl font-bold text-white md:text-2xl">
                      我是雇主
                    </div>
                    <div className="text-xs text-white/80 md:text-sm">
                      资质核验 → 智能匹配 → 高效签约
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" />
              </button>

              <div className="mt-6 overflow-x-auto pb-2">
                <div className="flex min-w-max items-stretch gap-2 md:gap-3">
                  {employerSteps.map((step, idx) => {
                    const Icon = step.icon
                    return (
                      <div key={step.id} className="flex items-center">
                        <div
                          onClick={() => handleWorkflowStepClick(step)}
                          className="group w-28 cursor-pointer rounded-xl border border-white/20 bg-white/10 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF6B35]/60 hover:bg-[#FF6B35]/20 hover:shadow-lg md:w-32 md:p-4"
                        >
                          <div className="text-xs font-bold text-[#FF8C5A] md:text-sm">
                            {String(step.id).padStart(2, '0')}
                          </div>
                          <div className="mx-auto mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/20 md:h-10 md:w-10">
                            <Icon className="h-4 w-4 text-[#FFB08A] md:h-5 md:w-5" />
                          </div>
                          <div className="mt-2 text-xs font-bold text-white md:text-sm">
                            {step.title}
                          </div>
                          <div className="mt-1 text-[10px] text-white/60 md:text-xs">
                            {step.sub}
                          </div>
                          <div className="mt-1.5 inline-block rounded bg-[#FF6B35]/30 px-2 py-0.5 text-[10px] font-medium text-[#FFD4BD] md:text-xs">
                            {step.status}
                          </div>
                        </div>
                        {idx < employerSteps.length - 1 && (
                          <div className="px-0.5 md:px-1">
                            <ChevronRight className="h-4 w-4 text-white/40 md:h-5 md:w-5" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border-4 border-[#3B82F6]/30 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#3B82F6]/60 hover:bg-white/15 md:p-8">
              <button
                onClick={() => handleRoleSelect('jobseeker')}
                className="group flex w-full items-center justify-between rounded-2xl bg-[#1E3A5F] px-6 py-4 text-left transition-all duration-300 hover:bg-[#1a3352] hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-serif text-xl font-bold text-white md:text-2xl">
                      我是求职者
                    </div>
                    <div className="text-xs text-white/80 md:text-sm">
                      简历脱敏 → 多维匹配 → 权益保障
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" />
              </button>

              <div className="mt-6 overflow-x-auto pb-2">
                <div className="flex min-w-max items-stretch gap-2 md:gap-3">
                  {jobseekerSteps.map((step, idx) => {
                    const Icon = step.icon
                    return (
                      <div key={step.id} className="flex items-center">
                        <div
                          onClick={() => handleWorkflowStepClick(step)}
                          className="group w-28 cursor-pointer rounded-xl border border-white/20 bg-white/10 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3B82F6]/60 hover:bg-[#3B82F6]/20 hover:shadow-lg md:w-32 md:p-4"
                        >
                          <div className="text-xs font-bold text-[#60A5FA] md:text-sm">
                            {String(step.id).padStart(2, '0')}
                          </div>
                          <div className="mx-auto mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/20 md:h-10 md:w-10">
                            <Icon className="h-4 w-4 text-[#93C5FD] md:h-5 md:w-5" />
                          </div>
                          <div className="mt-2 text-xs font-bold text-white md:text-sm">
                            {step.title}
                          </div>
                          <div className="mt-1 text-[10px] text-white/60 md:text-xs">
                            {step.sub}
                          </div>
                          <div className="mt-1.5 inline-block rounded bg-[#3B82F6]/30 px-2 py-0.5 text-[10px] font-medium text-[#BFDBFE] md:text-xs">
                            {step.status}
                          </div>
                        </div>
                        {idx < jobseekerSteps.length - 1 && (
                          <div className="px-0.5 md:px-1">
                            <ChevronRight className="h-4 w-4 text-white/40 md:h-5 md:w-5" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            <div
              onClick={() => handleDashboardNavigate('/employer/analytics', 'employer')}
              className="cursor-pointer rounded-2xl border border-white/15 bg-white/8 p-4 text-center backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg md:p-5"
            >
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]/20 md:h-10 md:w-10">
                <BarChart3 className="h-4 w-4 text-[#FF8C5A] md:h-5 md:w-5" />
              </div>
              <div className="mt-2 font-serif text-xl font-bold text-white md:text-2xl lg:text-3xl">
                128,456+
              </div>
              <div className="mt-1 text-[11px] text-white/70 md:text-sm">
                累计匹配
              </div>
              <div className="mt-1 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topChannelData}>
                    <Bar
                      dataKey="hires"
                      fill="#FF6B35"
                      radius={[2, 2, 0, 0]}
                      barSize={8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              onClick={() => handleDashboardNavigate('/admin/review', 'admin')}
              className="cursor-pointer rounded-2xl border border-white/15 bg-white/8 p-4 text-center backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg md:p-5"
            >
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981]/20 md:h-10 md:w-10">
                <Building2 className="h-4 w-4 text-[#34D399] md:h-5 md:w-5" />
              </div>
              <div className="mt-2 font-serif text-xl font-bold text-white md:text-2xl lg:text-3xl">
                8,234+
              </div>
              <div className="mt-1 text-[11px] text-white/70 md:text-sm">
                入驻企业
              </div>
              <div className="mt-1 h-8 flex items-end justify-between gap-1 px-1">
                {verificationFunnelData.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex-1 rounded-t bg-gradient-to-t from-[#10B981]/80 to-[#34D399]"
                    style={{ height: `${item.value}%` }}
                    title={`${item.name}: ${item.pct}`}
                  />
                ))}
              </div>
            </div>

            <div
              onClick={() => handleDashboardNavigate('/contract/dispute', 'jobseeker')}
              className="cursor-pointer rounded-2xl border border-white/15 bg-white/8 p-4 text-center backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg md:p-5"
            >
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/20 md:h-10 md:w-10">
                <TrendingUp className="h-4 w-4 text-[#A78BFA] md:h-5 md:w-5" />
              </div>
              <div className="mt-2 font-serif text-xl font-bold text-white md:text-2xl lg:text-3xl">
                96.8%
              </div>
              <div className="mt-1 text-[11px] text-white/70 md:text-sm">
                求职者满意度
              </div>
              <div className="mt-1 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionTrendData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#A78BFA"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              onClick={() => handleDashboardNavigate('/contract/records', 'employer')}
              className="cursor-pointer rounded-2xl border border-white/15 bg-white/8 p-4 text-center backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg md:p-5"
            >
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/20 md:h-10 md:w-10">
                <FileCheck className="h-4 w-4 text-[#60A5FA] md:h-5 md:w-5" />
              </div>
              <div className="mt-2 font-serif text-xl font-bold text-white md:text-2xl lg:text-3xl">
                89.2%
              </div>
              <div className="mt-1 text-[11px] text-white/70 md:text-sm">
                合同签约成功率
              </div>
              <div className="mt-1 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filingDonutData}
                      dataKey="value"
                      innerRadius={10}
                      outerRadius={14}
                      stroke="none"
                    >
                      {filingDonutData.map((_, idx) => (
                        <Cell key={idx} fill={FILING_COLORS[idx]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-primary md:text-3xl lg:text-4xl">
              📊 平台数据透明化看板 · 可追溯可复查
            </h2>
            <p className="mt-3 text-sm text-gray-600 md:text-base">
              每一项数据均来源于真实业务记录，区块链存证可追溯、可验证
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div
              onClick={() => handleDashboardNavigate('/employer/analytics', 'employer')}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B35]/30 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">累计匹配</p>
                  <p className="mt-1 font-serif text-3xl font-bold text-gray-900 md:text-4xl">
                    128,456+
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] transition-transform group-hover:scale-110">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topChannelData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="channel"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [`${val}人入职`, '录用数']}
                    />
                    <Bar
                      dataKey="hires"
                      fill="#FF6B35"
                      radius={[4, 4, 0, 0]}
                      name="录用数"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>到面率89% · 入职率62%</span>
                <span className="inline-flex items-center gap-0.5 font-medium text-[#FF6B35] transition-transform group-hover:translate-x-0.5">
                  📈查看招聘归因分析 <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            <div
              onClick={() => handleDashboardNavigate('/admin/review', 'admin')}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#10B981]/30 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">入驻企业</p>
                  <p className="mt-1 font-serif text-3xl font-bold text-gray-900 md:text-4xl">
                    8,234+
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981] transition-transform group-hover:scale-110">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {verificationFunnelData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span
                      className="w-20 shrink-0 text-xs text-gray-600"
                    >
                      {item.name}
                    </span>
                    <div className="relative flex-1 h-5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-500"
                        style={{
                          width: `${(item.value / 100) * 100}%`,
                          opacity: 1 - idx * 0.15,
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-semibold text-gray-800">
                      {item.pct}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>本月新增 186 家</span>
                <span className="inline-flex items-center gap-0.5 font-medium text-[#10B981] transition-transform group-hover:translate-x-0.5">
                  🛡查看风控审核后台 <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            <div
              onClick={() => handleDashboardNavigate('/contract/dispute', 'jobseeker')}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6]/30 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">求职者满意度</p>
                  <p className="mt-1 font-serif text-3xl font-bold text-gray-900 md:text-4xl">
                    96.8%
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] transition-transform group-hover:scale-110">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[93, 98]}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [`${val}%`, '满意度']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8B5CF6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#8B5CF6' }}
                      activeDot={{ r: 5 }}
                      name="满意度"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>争议调解成功率98% · 平均处理2.3天</span>
                <span className="inline-flex items-center gap-0.5 font-medium text-[#8B5CF6] transition-transform group-hover:translate-x-0.5">
                  ⚖️查看争议调解 <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            <div
              onClick={() => handleDashboardNavigate('/contract/records', 'employer')}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/30 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">合同签约成功率</p>
                  <p className="mt-1 font-serif text-3xl font-bold text-gray-900 md:text-4xl">
                    89.2%
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[#3B82F6] transition-transform group-hover:scale-110">
                  <FileCheck className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 h-28 flex items-center gap-4">
                <div className="h-full flex-shrink-0">
                  <ResponsiveContainer width={96} height="100%">
                    <PieChart>
                      <Pie
                        data={filingDonutData}
                        dataKey="value"
                        innerRadius={24}
                        outerRadius={42}
                        stroke="none"
                        paddingAngle={2}
                      >
                        {filingDonutData.map((_, idx) => (
                          <Cell key={idx} fill={FILING_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #E5E7EB',
                          fontSize: 12,
                        }}
                        formatter={(val: number) => [`${val}%`, '占比']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 text-xs">
                  {filingDonutData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: FILING_COLORS[idx] }}
                      />
                      <span className="text-gray-600 flex-1">{item.name}</span>
                      <span className="font-semibold text-gray-800">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>区块链存证 {mockSignRecords.length} 笔 · 人社备案 {mockContracts.filter(c => c.filingStatus === 'filed').length} 份</span>
                <span className="inline-flex items-center gap-0.5 font-medium text-[#3B82F6] transition-transform group-hover:translate-x-0.5">
                  📋查看备案记录 <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-primary md:text-3xl lg:text-4xl">
              🔍 权益透明化岗位推荐 · 每项都可验证
            </h2>
            <p className="mt-3 text-sm text-gray-600 md:text-base">
              以下岗位均已通过企业资质核验 + 岗位内容人工复审，求职者权益全程保障
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publishedJobs.map((job) => {
              const verification = verificationMap.get(job.companyId)
              const matchScore = computeMatchScore(job)
              const matchReasons = getMatchReasonsForJob(job)
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  companyVerification={
                    verification
                      ? {
                          status: verification.status,
                          riskLevel: verification.riskLevel,
                        }
                      : undefined
                  }
                  matchScore={matchScore}
                  matchReasons={matchReasons}
                  showApplyButton
                  showMatchDetails
                  onApply={() => handleApply(job)}
                />
              )
            })}
          </div>

          <div
            className="mt-12 overflow-hidden rounded-2xl p-6 md:p-8"
            style={{
              background:
                'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 50%, #F5F3FF 100%)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  <h3 className="font-serif text-xl font-bold text-primary md:text-2xl">
                    平台服务承诺
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981]">✅</span>
                    <span>企业100%营业执照核验</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981]">✅</span>
                    <span>岗位100%人工复审</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981]">✅</span>
                    <span>简历默认脱敏</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981]">✅</span>
                    <span>面试邀约24h超时失效</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981]">✅</span>
                    <span>合同区块链存证</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#10B981]">✅</span>
                    <span>免费争议调解入口</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 lg:flex-shrink-0">
                <button
                  onClick={() => handleDashboardNavigate('/admin/review', 'admin')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-md"
                >
                  📄 查看完整合规报告
                </button>
                <button
                  onClick={() => handleDashboardNavigate('/contract/dispute')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-white px-5 py-3 text-sm font-medium text-primary transition-all hover:bg-primary/5 hover:shadow-md"
                >
                  📞 联系平台审核员
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-serif text-lg font-bold text-white">
                匹
              </div>
              <span className="font-serif text-xl font-bold tracking-wide text-primary">
                智聘匹配
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <a href="#" className="transition-colors hover:text-primary">
                关于我们
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                风控合规
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                备案查询入口
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                隐私保护白皮书
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                人社数据对接说明
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                使用条款
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                隐私政策
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                联系客服
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
            © 2026 智聘匹配 · 城市服务业人力资源匹配平台 · 沪ICP备XXXXXXXX号
          </div>
        </div>
      </footer>
    </div>
  )
}
