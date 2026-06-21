import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Shield, Building2, Bell, MessageSquare,
  ChevronRight, Clock, AlertTriangle, Users, Bus,
  Stethoscope, Mountain, Home as HomeIcon,
  TrendingDown, CheckCircle, FileCheck,
  Star, PieChart, BellRing, QrCode, HeartHandshake,
  Mic, Settings2, UserPlus, ListTodo, FileText,
  Zap, Radio, BookOpen, Target, RotateCcw,
  Eye, TrendingUp, BarChart2, Layers, Award,
  Volume2, Maximize2, BookmarkPlus, Megaphone,
  AlertCircle, MapPin, Phone, CreditCard,
} from 'lucide-react'
import { hotServices, mockAnnouncements, mockEfficiencyMetrics, mockCertificates } from '@/data/mockData'
import { useStore } from '@/store/useStore'

const iconMap: Record<string, React.ElementType> = {
  Shield, Bus, HomeIcon, Stethoscope, Users, Mountain, CreditCard,
}

const typeBadgeStyle: Record<string, string> = {
  '政策公告': 'bg-primary-50 text-primary-500',
  '应急通知': 'bg-emergency-light text-emergency',
  '社区活动': 'bg-success-light text-success',
  '服务通知': 'bg-gold-50 text-gold-600',
}

const statusBadgeStyle: Record<string, string> = {
  '审核中': 'bg-primary-50 text-primary-500',
  '补正中': 'bg-gold-50 text-gold-600',
}

const quickEntries = [
  { label: '政务办事', icon: Shield, to: '/government', desc: '社保·公积金·户籍' },
  { label: '城市服务', icon: Building2, to: '/city-service', desc: '乘车·挂号·预约' },
  { label: '公共服务', icon: Bell, to: '/public-service', desc: '政策·公告·活动' },
]

const elderlyQuickServices = [
  { label: '社保查询', icon: Shield, to: '/government/s001', color: 'bg-blue-500' },
  { label: '公积金提取', icon: HomeIcon, to: '/government/s002', color: 'bg-amber-500' },
  { label: '扫码乘车', icon: Bus, to: '/city-service/transport', color: 'bg-green-500' },
  { label: '医院挂号', icon: Stethoscope, to: '/city-service/hospital', color: 'bg-red-500' },
  { label: '户籍登记', icon: Users, to: '/government/s003', color: 'bg-purple-500' },
  { label: '景点预约', icon: Mountain, to: '/city-service/scenic', color: 'bg-teal-500' },
]

const guideFeatures = [
  { icon: MessageSquare, label: '智能问答', desc: '自然语言咨询', color: 'bg-blue-500' },
  { icon: ListTodo, label: '流程图解', desc: '办事步骤可视化', color: 'bg-green-500' },
  { icon: FileCheck, label: '材料预审', desc: 'AI智能校验', color: 'bg-gold-500' },
  { icon: Mic, label: '语音导航', desc: '全程语音引导', color: 'bg-purple-500' },
]

const publicCategories = [
  { key: '政策公告', icon: BookOpen, color: 'bg-blue-50 text-blue-600', count: 12 },
  { key: '应急通知', icon: AlertTriangle, color: 'bg-red-50 text-red-600', count: 3 },
  { key: '社区活动', icon: Users, color: 'bg-green-50 text-green-600', count: 8 },
  { key: '广播触达', icon: Radio, color: 'bg-purple-50 text-purple-600', count: 5 },
]

const deptRank = [
  { dept: '人社局', rate: 96.5, change: '+1.2%', up: true },
  { dept: '公积金中心', rate: 97.2, change: '+0.8%', up: true },
  { dept: '公安局', rate: 93.8, change: '-0.3%', up: false },
  { dept: '自然资源局', rate: 89.5, change: '+2.1%', up: true },
]

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const getDaysRemaining = (d: string) => Math.ceil((new Date(d).getTime() - new Date().getTime()) / 86400000)

export default function Home() {
  const toggleElderlyMode = useStore((s) => s.toggleElderlyMode)
  const elderlyMode = useStore((s) => s.elderlyMode)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  const applications = useStore((s) => s.applications)
  const certificates = useStore((s) => s.certificates)
  const loginWithSSO = useStore((s) => s.loginWithSSO)

  const [activePublicTab, setActivePublicTab] = useState('政策公告')

  const announcements = mockAnnouncements.filter(a => a.type === activePublicTab).slice(0, 3)
  const allAnnouncements = mockAnnouncements.slice(0, 4)

  const inProgressCount = applications.filter(a => a.status !== '已办结').length
  const completedCount = applications.filter(a => a.status === '已办结').length
  const proxyCount = user?.proxyBindings?.length ?? 0
  const todoItems = applications.filter(a => a.status === '补正中' || a.status === '审核中')

  const totalApps = mockEfficiencyMetrics.reduce((sum, m) => sum + m.totalApplications, 0)
  const totalAbnormal = mockEfficiencyMetrics.reduce((sum, m) => sum + m.abnormalInterruptions.length, 0)
  const abnormalRate = ((totalAbnormal / totalApps) * 100).toFixed(1)
  const avgDays = (mockEfficiencyMetrics.reduce((sum, m) => sum + m.avgProcessingDays, 0) / mockEfficiencyMetrics.length).toFixed(1)
  const avgSatisfaction = (mockEfficiencyMetrics.reduce((sum, m) => sum + m.satisfactionAvg, 0) / mockEfficiencyMetrics.length).toFixed(1)

  const dashboardCards = [
    { label: '办件中', value: inProgressCount, icon: FileCheck, color: 'bg-primary-500', bg: 'bg-primary-50', link: '/government' },
    { label: '已办结', value: completedCount, icon: CheckCircle, color: 'bg-success', bg: 'bg-success-light', link: '/government' },
    { label: '证照数', value: certificates.length || 6, icon: Shield, color: 'bg-gold-500', bg: 'bg-gold-50', link: '/profile' },
    { label: '代办绑定', value: proxyCount || 2, icon: Users, color: 'bg-purple-500', bg: 'bg-purple-50', link: '/profile' },
  ]

  const efficiencyCards = [
    { label: '平均办结时效', value: `${avgDays}天`, icon: TrendingDown, trend: '较上月↓0.3天', trendColor: 'text-success', sub: '按事项部门双维度' },
    { label: '群众满意度', value: `${avgSatisfaction}/5`, icon: Star, trend: '好评率96.2%', trendColor: 'text-gold-500', sub: '含评价复查机制' },
    { label: '异常中断率', value: `${abnormalRate}%`, icon: AlertTriangle, trend: '较上月↓0.5%', trendColor: 'text-success', sub: '含归因跟踪闭环' },
  ]

  const previewCerts = mockCertificates.slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="gradient-hero relative overflow-hidden py-16 pb-24 px-4">
        <motion.div className="container mx-auto text-center" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" variants={itemVariants}>
            无锡市政务民生融合服务平台
          </motion.h1>
          <motion.p className="text-gold-300 text-lg md:text-xl mb-8 tracking-widest" variants={itemVariants}>
            一网通办 · 一码通行 · 一键直达
          </motion.p>
          <motion.div className="max-w-xl mx-auto relative mb-10" variants={itemVariants}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="搜索服务事项、政策、办事指南..." className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/95 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-lg text-base" />
          </motion.div>
          <motion.div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto" variants={containerVariants}>
            {quickEntries.map(({ label, icon: Icon, to, desc }) => (
              <motion.div key={to} variants={itemVariants}>
                <Link to={to} className="glass-card flex flex-col items-center gap-1.5 py-5 px-3 rounded-xl card-hover group">
                  <Icon className="w-7 h-7 text-gold-400 group-hover:text-gold-300 transition-colors" />
                  <span className="text-white text-sm font-medium">{label}</span>
                  <span className="text-white/60 text-xs">{desc}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {!isAuthenticated && (
        <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-3 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">统一身份认证 · 单点登录</h2>
                    <p className="text-gray-500">基于无锡市人口库与电子证照库，一次认证全网通办</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-primary-50 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center mb-2">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">表单预填</p>
                    <p className="text-xs text-gray-400 mt-0.5">6类证照自动带入</p>
                  </div>
                  <div className="bg-gold-50 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center mb-2">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">角色分流</p>
                    <p className="text-xs text-gray-400 mt-0.5">个人/企业/事业</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mb-2">
                      <HeartHandshake className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">家属代办</p>
                    <p className="text-xs text-gray-400 mt-0.5">远程绑定授权</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center mb-2">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">续办承接</p>
                    <p className="text-xs text-gray-400 mt-0.5">断点继续办理</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-6">
                  {previewCerts.map(cert => (
                    <span key={cert.id} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      {cert.type}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={loginWithSSO} className="px-8 py-3 rounded-full gradient-gold text-primary-900 font-semibold shadow-lg card-hover flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    立即登录认证
                  </button>
                  <Link to="/login" className="px-6 py-3 rounded-full border-2 border-primary-200 text-primary-600 font-medium hover:bg-primary-50 transition-colors">
                    查看登录说明
                  </Link>
                </div>
              </div>

              <div className="md:col-span-2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 text-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-gold-300" />
                  您可能需要办理
                </h3>
                <div className="space-y-3">
                  {hotServices.slice(0, 4).map(svc => {
                    const Icon = iconMap[svc.iconName] ?? Shield
                    return (
                      <button key={svc.id} onClick={loginWithSSO} className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                        <Icon className="w-5 h-5 text-gold-300 flex-shrink-0" />
                        <span className="text-sm">{svc.name}</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-white/50" />
                      </button>
                    )
                  })}
                </div>
                {todoItems.length > 0 && (
                  <div className="mt-6 p-4 bg-gold-400/20 rounded-xl border border-gold-400/30">
                    <p className="text-sm font-medium text-gold-200 mb-2">⏰ 检测到 {todoItems.length} 项未完成办件</p>
                    <button onClick={loginWithSSO} className="text-sm text-gold-300 hover:text-gold-200 flex items-center gap-1">
                      登录后继续办理 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {isAuthenticated && user && (
        <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary-900">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-800">您好，{user.name}</h3>
                  {user.verified && (
                    <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      已实名
                    </span>
                  )}
                  <span className="text-xs bg-gold-50 text-gold-600 px-2 py-0.5 rounded-full">
                    {user.type === 'personal' ? '个人用户' : user.type === 'enterprise' ? '企业法人' : '事业单位'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {certificates.length} 份证照可用 · {todoItems.length} 项待办 · {proxyCount} 位代办绑定
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/profile" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-lg">
                  个人中心 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <h2 className="section-title mb-4">我的工作台</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {dashboardCards.map(({ label, value, icon: Icon, color, bg, link }) => (
                <Link key={label} to={link} className="block">
                  <div className={`${bg} rounded-xl p-4 card-hover`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-sm text-gray-500 mt-1">{label}</p>
                  </div>
                </Link>
              ))}
            </div>

            {todoItems.length > 0 && (
              <div className="bg-gold-50 rounded-xl p-5 mb-4 border border-gold-200">
                <h3 className="font-semibold text-gold-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  待办提醒 · {todoItems.length} 项需要您处理
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {todoItems.map((item) => {
                    const days = getDaysRemaining(item.estimatedCompletion)
                    return (
                      <Link key={item.id} to={`/government/${item.serviceId}`} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gold-100 transition-colors">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.status === '补正中' ? 'bg-gold-500 animate-pulse' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{item.serviceName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.status === '补正中' ? '需补正材料' : '审核中'} · 剩余 {days} 天
                          </p>
                        </div>
                        <span className="text-xs text-gold-600 font-medium flex-shrink-0">
                          {item.status === '补正中' ? '立即补正 →' : '查看进度 →'}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5">
                <h3 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  我的证照
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {previewCerts.map(cert => (
                    <div key={cert.id} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate">{cert.type}</span>
                    </div>
                  ))}
                </div>
                <Link to="/profile" className="text-xs text-primary-500 mt-3 flex items-center gap-1">
                  查看全部 {certificates.length} 份证照 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
                <h3 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5" />
                  家属代办绑定
                </h3>
                <div className="space-y-2 mb-3">
                  {['父亲 · 张建国', '母亲 · 李美华'].map((name, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-xs text-gray-700">{name}</span>
                      <span className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">已授权</span>
                    </div>
                  ))}
                </div>
                <Link to="/profile" className="text-xs text-purple-500 flex items-center gap-1">
                  管理代办绑定 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <Link to="/admin/monitor" className="block mb-6">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 card-hover text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <PieChart className="w-6 h-6 text-gold-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">管理后台入口</h3>
                  <p className="text-gray-400 text-sm mt-1">效能监测 · 事项部门双维度归因 · 复查跟踪闭环</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">服务效能</h2>
          <div className="flex items-center gap-2">
            <Link to="/admin/monitor" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              查看详情 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {efficiencyCards.map(({ label, value, icon: Icon, trend, trendColor, sub }) => (
            <Link key={label} to="/admin/monitor" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-right">
                  <span className={`text-xs ${trendColor}`}>{trend}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link to="/admin/monitor" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover block">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-500" />
              事项维度异常归因 TOP3
            </h3>
            <div className="space-y-2">
              {mockEfficiencyMetrics.slice(0, 3).map((m, i) => {
                const rate = ((m.abnormalInterruptions.length / m.totalApplications) * 100).toFixed(1)
                return (
                  <div key={m.serviceId} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>{i + 1}</span>
                    <span className="text-sm flex-1">{m.serviceName}</span>
                    <span className="text-xs text-gray-400">{m.abnormalInterruptions.length} 件</span>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${Number(rate) > 2 ? 'bg-red-400' : 'bg-yellow-400'}`} style={{ width: `${Math.min(Number(rate) * 10, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${Number(rate) > 2 ? 'text-red-500' : 'text-yellow-600'}`}>{rate}%</span>
                  </div>
                )
              })}
            </div>
          </Link>

          <Link to="/admin/monitor" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover block">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gold-500" />
              部门维度办结率排名
            </h3>
            <div className="space-y-2">
              {deptRank.map((d, i) => (
                <div key={d.dept} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-gold-100 text-gold-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-600'
                  }`}>{i + 1}</span>
                  <span className="text-sm flex-1">{d.dept}</span>
                  <span className={`text-xs ${d.up ? 'text-green-500' : 'text-red-500'}`}>{d.change}</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${d.rate}%` }} />
                  </div>
                  <span className="text-sm font-bold text-primary-600">{d.rate}%</span>
                </div>
              ))}
            </div>
          </Link>
        </div>

        <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-500" />
              异常中断持续跟踪
            </h3>
            <Link to="/admin/monitor" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              查看全部跟踪记录 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { type: '材料不全', count: 12, status: '待补正', priority: '中' },
              { type: '系统超时', count: 3, status: '排查中', priority: '高' },
              { type: '用户放弃', count: 8, status: '分析中', priority: '低' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.priority === '高' ? 'bg-red-100' : item.priority === '中' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <AlertCircle className={`w-5 h-5 ${
                    item.priority === '高' ? 'text-red-500' : item.priority === '中' ? 'text-yellow-500' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{item.type}</p>
                  <p className="text-xs text-gray-400">{item.count} 件 · {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">热门服务</h2>
          <Link to="/government" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
            全部服务 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotServices.map((svc) => {
            const Icon = iconMap[svc.iconName] ?? Shield
            const myRecord = applications.find(a => a.serviceId === svc.id)
            return (
              <div key={svc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover">
                <Link to={svc.category === '政务办事' ? `/government/${svc.id}` : svc.category === '城市服务' ? `/city-service/${svc.id.replace('cs-', '')}` : '/public-service'} className="block p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 truncate">{svc.name}</p>
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">{svc.dailyCount.toLocaleString()}/日</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{svc.category}</p>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-1">{svc.description}</p>
                    </div>
                  </div>
                </Link>
                {isAuthenticated && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex items-center justify-between">
                    {myRecord ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            myRecord.status === '已办结' ? 'bg-success' :
                            myRecord.status === '补正中' ? 'bg-gold-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-xs text-gray-500">我的记录：{myRecord.status}</span>
                        </div>
                        <Link to={`/government/${svc.id}`} className="text-xs text-primary-500 font-medium flex items-center gap-0.5">
                          {myRecord.status === '补正中' ? '继续补正' : myRecord.status === '已办结' ? '再次办理' : '继续办理'} →
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-gold-500" />
                          证照自动填充
                        </span>
                        <Link to={svc.category === '政务办事' ? `/government/${svc.id}` : `/city-service/${svc.id.replace('cs-', '')}`} className="text-xs text-primary-500 font-medium">
                          立即办理 →
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">公共服务</h2>
          <Link to="/public-service" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
            查看更多 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {publicCategories.map(({ key, icon: Icon, color, count }) => (
            <button
              key={key}
              onClick={() => setActivePublicTab(key)}
              className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                activePublicTab === key
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                activePublicTab === key ? 'bg-white/20' : color
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activePublicTab === key ? 'text-white' : 'text-gray-800'}`}>{key}</p>
                <p className={`text-xs ${activePublicTab === key ? 'text-white/70' : 'text-gray-400'}`}>{count} 条</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700">{activePublicTab} · 最新发布</span>
            <div className="flex items-center gap-2">
              <button className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1">
                <BookmarkPlus className="w-3 h-3" /> 订阅推送
              </button>
              {activePublicTab === '应急通知' && (
                <button className="text-xs text-emergency hover:text-red-600 flex items-center gap-1">
                  <Megaphone className="w-3 h-3" /> 广播触达
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {announcements.length > 0 ? announcements.map((ann) => {
              const isEmergency = ann.type === '应急通知'
              return (
                <Link key={ann.id} to="/public-service" className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${isEmergency ? 'border-l-4 border-l-emergency' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge mt-0.5 flex-shrink-0 ${typeBadgeStyle[ann.type] ?? 'badge-info'}`}>
                        {isEmergency && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {ann.type}
                      </span>
                      <p className={`text-sm font-medium truncate ${isEmergency ? 'text-emergency animate-pulse-slow' : 'text-gray-800'}`}>{ann.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">{ann.summary}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400">{ann.date}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              )
            }) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">暂无{activePublicTab}数据</div>
            )}
          </div>
        </div>

        {activePublicTab === '应急通知' && (
          <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 border border-red-200">
            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              应急求助热线
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: '报警电话', number: '110', color: 'bg-blue-500' },
                { name: '急救电话', number: '120', color: 'bg-red-500' },
                { name: '政务服务', number: '12345', color: 'bg-gold-500' },
              ].map((hotline) => (
                <button key={hotline.number} className={`${hotline.color} text-white rounded-xl p-4 flex flex-col items-center gap-1 card-hover`}>
                  <span className="text-2xl font-bold">{hotline.number}</span>
                  <span className="text-xs opacity-90">{hotline.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">智能导办</h2>
          <Link to="/smart-guide" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
            开始导办 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <Link to="/smart-guide" className="lg:col-span-2 block">
            <div className="gradient-primary rounded-xl p-6 h-full card-hover text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-gold-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">智能导办助手</h3>
                  <p className="text-gold-200 text-sm">有问题？随时问我！</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {['我要查社保缴费记录', '公积金提取需要什么材料', '户籍迁移怎么办理'].map((q, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-3 text-sm flex items-center gap-2">
                    <span className="text-gold-300">Q:</span>
                    <span className="truncate">{q}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-white/60">支持自然语言问答 · 办事流程图解 · 材料AI预审</div>
            </div>
          </Link>

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {guideFeatures.map(({ icon: Icon, label, desc, color }) => (
              <Link key={label} to="/smart-guide" className="bg-white rounded-xl p-4 card-hover shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </Link>
            ))}

            <Link to="/smart-guide" className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 card-hover shadow-sm border border-blue-200 flex flex-col items-center justify-center text-center">
              <Zap className="w-8 h-8 text-blue-500 mb-2" />
              <p className="font-semibold text-blue-800 text-sm">高频事项</p>
              <p className="text-xs text-blue-500 mt-1">直达办理</p>
            </Link>

            <Link to="/smart-guide" className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 card-hover shadow-sm border border-green-200 flex flex-col items-center justify-center text-center">
              <FileText className="w-8 h-8 text-green-500 mb-2" />
              <p className="font-semibold text-green-800 text-sm">办事指南</p>
              <p className="text-xs text-green-500 mt-1">查看详情</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0 flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-500" />
            长辈模式
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={toggleElderlyMode} className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
              elderlyMode ? 'bg-gold-500 text-primary-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
              {elderlyMode ? '已开启' : '立即开启'}
            </button>
            <Link to="/elderly" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              长辈专区 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gold-50 via-white to-primary-50 rounded-2xl p-6 border border-gold-200">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mb-3">
                <Maximize2 className="w-7 h-7 text-gold-600" />
              </div>
              <p className="font-semibold text-gray-800">字体无级缩放</p>
              <p className="text-xs text-gray-400 mt-1">18px ~ 28px 任意调节</p>
              <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gold-500 rounded-full" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Volume2 className="w-7 h-7 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-800">语音导航</p>
              <p className="text-xs text-gray-400 mt-1">全程语音播报引导</p>
              <button className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium flex items-center gap-1">
                <Mic className="w-3 h-3" /> 语音输入
              </button>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <HeartHandshake className="w-7 h-7 text-purple-600" />
              </div>
              <p className="font-semibold text-gray-800">家属代办</p>
              <p className="text-xs text-gray-400 mt-1">远程绑定授权办理</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-purple-600">
                <UserPlus className="w-3 h-3" /> 已绑定 2 人
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Zap className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-gray-800">一键直达</p>
              <p className="text-xs text-gray-400 mt-1">高频事项一键办理</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                6 项常用服务
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            高频事项直达
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {elderlyQuickServices.map(({ label, icon: Icon, to, color }) => (
              <Link key={label} to={to} className="bg-white rounded-xl p-4 card-hover shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-2`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {elderlyMode && (
          <Link to="/elderly" className="fixed bottom-24 right-6 z-40">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-r from-gold-500 to-gold-600 text-primary-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm"
            >
              <Maximize2 className="w-4 h-4" />
              长辈模式已开启 · 点击进入专区
            </motion.div>
          </Link>
        )}
      </AnimatePresence>

      <button onClick={toggleElderlyMode} className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full gradient-gold flex flex-col items-center justify-center shadow-lg animate-bounce-gentle card-hover">
        <span className="text-primary-900 text-xs font-bold leading-tight text-center">长辈模式</span>
      </button>
    </div>
  )
}
