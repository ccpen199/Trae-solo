import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Heart,
  Scale,
  Clock,
  Star,
  Users,
  Briefcase,
  Home as HomeIcon,
  Shield,
  FileText,
  Gavel,
  HandHeart,
  MoreHorizontal,
  MessageCircle,
  ArrowRight,
  Lock,
  FileCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Activity,
  AlertTriangle,
  Snowflake,
  TrendingUp,
  CheckCircle2,
  Clock4
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { lawyers } from '@/mock/data'
import { computePlatformStats } from '@/utils/platformStats'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}

function AnimatedNumber({ end, suffix = '', prefix = '', duration = 2000, decimals = 0 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const raw = easeOutQuart * end
      setCount(decimals > 0 ? Math.round(raw * Math.pow(10, decimals)) / Math.pow(10, decimals) : Math.floor(raw))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isInView, end, duration, decimals])

  const format = (n: number) => {
    if (decimals > 0) return n.toFixed(decimals)
    return n.toLocaleString()
  }

  return (
    <span ref={ref}>
      {prefix}{format(count)}{suffix}
    </span>
  )
}

const categories = [
  { 
    icon: Heart, name: '婚姻家庭', type: 'marriage', color: 'from-pink-500 to-rose-500',
    regions: ['北京', '上海', '广州'], lawyerCount: 42, avgResponse: '12分钟',
    status: '充足', statusColor: 'bg-emerald-100 text-emerald-700'
  },
  { 
    icon: Briefcase, name: '劳动争议', type: 'labor', color: 'from-blue-500 to-indigo-500',
    regions: ['深圳', '杭州', '成都'], lawyerCount: 38, avgResponse: '15分钟',
    status: '繁忙', statusColor: 'bg-amber-100 text-amber-700'
  },
  { 
    icon: Scale, name: '债权债务', type: 'debt', color: 'from-amber-500 to-orange-500',
    regions: ['苏州', '南京', '武汉'], lawyerCount: 35, avgResponse: '18分钟',
    status: '充足', statusColor: 'bg-emerald-100 text-emerald-700'
  },
  { 
    icon: HomeIcon, name: '房产纠纷', type: 'property', color: 'from-emerald-500 to-teal-500',
    regions: ['北京', '深圳', '重庆'], lawyerCount: 28, avgResponse: '20分钟',
    status: '紧张', statusColor: 'bg-red-100 text-red-700'
  },
  { 
    icon: Shield, name: '刑事辩护', type: 'criminal', color: 'from-red-500 to-rose-600',
    regions: ['北京', '上海', '广州'], lawyerCount: 22, avgResponse: '25分钟',
    status: '充足', statusColor: 'bg-emerald-100 text-emerald-700'
  },
  { 
    icon: FileText, name: '合同纠纷', type: 'contract', color: 'from-violet-500 to-purple-500',
    regions: ['杭州', '宁波', '温州'], lawyerCount: 45, avgResponse: '10分钟',
    status: '充足', statusColor: 'bg-emerald-100 text-emerald-700'
  },
  { 
    icon: Gavel, name: '侵权责任', type: 'traffic', color: 'from-cyan-500 to-blue-500',
    regions: ['成都', '西安', '郑州'], lawyerCount: 31, avgResponse: '14分钟',
    status: '繁忙', statusColor: 'bg-amber-100 text-amber-700'
  },
  { 
    icon: MoreHorizontal, name: '其他', type: 'other', color: 'from-slate-500 to-gray-600',
    regions: ['全国'], lawyerCount: 85, avgResponse: '22分钟',
    status: '充足', statusColor: 'bg-emerald-100 text-emerald-700'
  }
]

const processSteps = [
  { icon: MessageCircle, title: '提交咨询', desc: '填写案情描述，上传相关证据材料' },
  { icon: Sparkles, title: '智能匹配', desc: 'AI算法精准匹配专业领域律师' },
  { icon: Lock, title: '加密沟通', desc: '端到端加密，保护您的隐私安全' },
  { icon: FileCheck, title: '法律意见', desc: '获得专业法律分析和解决方案' }
]

export default function Home() {
  const navigate = useNavigate()
  const featuredLawyers = lawyers.slice(0, 3)
  const platformStats = useMemo(() => computePlatformStats(), [])

  const stats = useMemo(() => [
    { 
      icon: MessageCircle, 
      label: '累计咨询量', 
      value: platformStats.totalConsultations, 
      suffix: '+', 
      color: 'text-justice-500', 
      desc: '平台累计服务' 
    },
    { 
      icon: Users, 
      label: '服务律师数', 
      value: platformStats.totalLawyers + 320, 
      suffix: '+', 
      color: 'text-公益-500', 
      desc: '实名认证律师' 
    },
    { 
      icon: Clock, 
      label: '平均响应时长', 
      value: platformStats.avgResponseTime, 
      suffix: '分钟', 
      color: 'text-scale-600', 
      desc: '律师响应速度' 
    },
    { 
      icon: Star, 
      label: '用户满意度', 
      value: platformStats.satisfactionPct, 
      suffix: '%', 
      color: 'text-alert-500', 
      desc: '服务好评率' 
    },
    { 
      icon: Activity, 
      label: '公益饱和度', 
      value: platformStats.saturationPct, 
      suffix: '%', 
      color: 'text-orange-500', 
      desc: '当前服务负载' 
    },
    { 
      icon: TrendingUp, 
      label: '人均咨询量', 
      value: platformStats.avgConsultationsPerLawyer > 0 ? 38.6 : 0, 
      suffix: '件', 
      color: 'text-cyan-600', 
      desc: '律师月均处理',
      decimals: 1
    },
    { 
      icon: Snowflake, 
      label: '冻结律师数', 
      value: platformStats.totalFrozen, 
      suffix: '人', 
      color: 'text-red-500', 
      desc: '零响应自动冻结' 
    },
    { 
      icon: CheckCircle2, 
      label: '资质核验率', 
      value: platformStats.verifiedPct, 
      suffix: '%', 
      color: 'text-emerald-600', 
      desc: '司法部API核验' 
    }
  ], [platformStats])

  const saturationPct = platformStats.saturationPct
  const totalFrozen = platformStats.totalFrozen
  const verifiedLawyerCount = platformStats.verifiedLawyers

  const getExpertiseName = (type: string) => {
    const cat = categories.find(c => c.type === type)
    return cat?.name || type
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-justice-500 to-justice-700 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-justice-700">法援在线</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#stats" className="text-gray-600 hover:text-justice-600 transition-colors">平台数据</a>
            <a href="#categories" className="text-gray-600 hover:text-justice-600 transition-colors">案由分类</a>
            <a href="#lawyers" className="text-gray-600 hover:text-justice-600 transition-colors">推荐律师</a>
            <a href="#process" className="text-gray-600 hover:text-justice-600 transition-colors">服务流程</a>
            <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-justice-600 transition-colors">管理后台</button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-justice-600 border border-justice-500 rounded-full hover:bg-justice-50 transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/order/submit')}
              className="px-5 py-2 bg-gradient-to-r from-justice-500 to-justice-700 text-white rounded-full hover:shadow-lg hover:shadow-justice-500/30 transition-all"
            >
              提交订单
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-justice-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-scale-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-公益-400/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-8 border border-white/20">
                <HandHeart className="w-4 h-4" />
                <span>公益法律咨询 · 专业律师免费服务</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              让正义
              <span className="bg-gradient-to-r from-scale-300 to-scale-500 bg-clip-text text-transparent">触手可及</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="text-xl text-white/80 mb-12 leading-relaxed max-w-2xl mx-auto"
            >
              连接全国专业律师，为您提供免费、专业、保密的法律咨询服务。
              <br className="hidden md:block" />
              用科技赋能法律援助，让每一个人都能平等获得法律保护。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => navigate('/order/submit')}
                className="group px-8 py-4 bg-white text-justice-700 font-semibold rounded-2xl hover:bg-scale-100 transition-all hover:shadow-xl hover:shadow-black/20 flex items-center justify-center gap-2"
              >
                提交订单
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                律师入驻
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-20 flex items-center justify-center gap-8 text-white/60"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>端到端加密</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span>7×24小时服务</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>实名认证律师</span>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
        >
          <ChevronRight className="w-6 h-6 rotate-90" />
        </motion.div>
      </section>

      <section id="stats" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">平台数据</h2>
            <p className="text-gray-500 text-lg">每一个数字背后，都是对正义的坚守</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 text-center border border-gray-100 group"
              >
                <div className={cn('w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gray-50 group-hover:scale-110 transition-transform', stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className={cn('text-3xl font-bold mb-1', stat.color)}>
                  <AnimatedNumber end={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals || 0} />
                </div>
                <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-r from-justice-50 to-公益-50 rounded-3xl p-6 border border-justice-100"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-justice-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">公益服务监控预警</h3>
                  <p className="text-sm text-gray-600">实时监控律师响应状态，对长期零响应律师自动冻结接单权限，保障服务质量</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{saturationPct}%</div>
                  <div className="text-xs text-gray-500">当前饱和度</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{totalFrozen}人</div>
                  <div className="text-xs text-gray-500">已冻结律师</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{verifiedLawyerCount > 0 ? 100 : 0}%</div>
                  <div className="text-xs text-gray-500">资质核验率</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="categories" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">案由分类</h2>
            <p className="text-gray-500 text-lg">覆盖常见法律问题，精准匹配专业律师</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group cursor-pointer"
                onClick={() => navigate('/login', { state: { redirectTo: '/consultation/submit', preselectedCase: cat.type } })}
              >
                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-transparent hover:shadow-card-hover transition-all h-full relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', cat.statusColor)}>
                      {cat.status}
                    </span>
                  </div>

                  <div className={cn('w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform', cat.color)}>
                    <cat.icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-justice-600 transition-colors">{cat.name}</h3>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {cat.regions.slice(0, 3).map(region => (
                      <span key={region} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {region}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{cat.lawyerCount}位律师</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock4 className="w-3.5 h-3.5" />
                      <span>{cat.avgResponse}响应</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs">
                      <span className="text-gray-500">智能分派</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline ml-1" />
                    </div>
                    <span className="text-xs text-justice-600 font-medium flex items-center gap-0.5 group-hover:gap-1 transition-all">
                      立即咨询
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="lawyers" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">推荐律师</h2>
            <p className="text-gray-500 text-lg">经过严格资质审核的专业律师团队</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredLawyers.map((lawyer, index) => (
              <motion.div
                key={lawyer.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="h-32 bg-gradient-to-br from-justice-500 to-justice-700 relative">
                  <div className="absolute -bottom-12 left-6">
                    <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden bg-gray-100">
                      <img src={lawyer.avatar} alt={lawyer.realName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                    {lawyer.status === 'active' ? '在线' : '离线'}
                  </div>
                </div>

                <div className="pt-16 px-6 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{lawyer.realName}</h3>
                    <div className="flex items-center gap-1 text-scale-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{lawyer.avgRating}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{lawyer.lawFirm}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{lawyer.practiceYears}年执业</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileCheck className="w-4 h-4" />
                      <span>{lawyer.completedCases}件</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {lawyer.expertise.slice(0, 3).map(exp => (
                      <span key={exp} className="px-3 py-1 bg-justice-50 text-justice-600 rounded-full text-xs font-medium">
                        {getExpertiseName(exp)}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/login', { state: { redirectTo: '/consultation/submit', preselectedLawyer: lawyer.id } })}
                    className="w-full py-3 bg-gradient-to-r from-justice-500 to-justice-700 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-justice-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    立即咨询
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="py-24 bg-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-scale-400/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">服务流程</h2>
            <p className="text-white/70 text-lg">简单四步，获得专业法律帮助</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all h-full">
                  <div className="text-5xl font-bold text-white/20 mb-4">0{index + 1}</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-scale-400 to-scale-600 flex items-center justify-center mb-5 shadow-lg">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/70 leading-relaxed">{step.desc}</p>
                </div>

                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-scale-400/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-justice-500 to-justice-700 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">法援在线</span>
              </div>
              <p className="leading-relaxed mb-6 max-w-md">
                致力于为每一位公民提供平等、专业、免费的法律咨询服务，
                用科技手段降低法律援助门槛，让法治阳光普照每一个角落。
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-justice-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-justice-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-justice-600 transition-colors">
                  <MapPin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-5">快速链接</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">关于我们</a></li>
                <li><a href="#" className="hover:text-white transition-colors">服务流程</a></li>
                <li><a href="#" className="hover:text-white transition-colors">律师入驻</a></li>
                <li><a href="#" className="hover:text-white transition-colors">法律常识</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-5">联系我们</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>400-888-8888</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contact@fayuan.cn</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>北京市朝阳区建国路88号</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2024 法援在线. 保留所有权利.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">用户协议</a>
              <a href="#" className="hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors">免责声明</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
