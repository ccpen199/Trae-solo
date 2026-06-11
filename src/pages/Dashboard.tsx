import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CreditCard, MessageSquare, Users, Droplets, Zap, Flame, Building2,
  ArrowUpRight, ArrowDownRight, ChevronRight, Clock, CheckCircle2, CircleAlert, Search, Sparkles,
  Shield, Home, MapPin, Phone, Star, ThumbsUp, AlertTriangle, Eye, EyeOff, Link as Link2, Plug, Network,
  XCircle, TrendingUp, TrendingDown, Minus,
  Compass, FileSpreadsheet, Cable, Radio, ChevronRight as Chevron
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import Layout from '@/components/Layout'
import { apiFetch, mapService } from '@/utils/api'
import type { ServiceItem } from '@/types'

const regionOptions = ['全市', '市本级', '东区', '西区', '南区', '北区']
const categoryOptions = ['全部', '政务服务', '便民服务']
const statusConfig = {
  online: { label: '已上架', cls: 'bg-green-100 text-green-700' },
  offline: { label: '已下架', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: '待审核', cls: 'bg-blue-100 text-blue-700' },
  degraded: { label: '降级', cls: 'bg-amber-100 text-amber-700' },
}

const fromIconSet: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, CreditCard, Shield, Droplets, Zap, Flame, Building2, Users,
  MessageSquare, Home, MapPin, Phone, Search, Clock, LayoutDashboard,
}

const quickServicesPreset = [
  { label: '社保缴纳', icon: Shield, color: 'bg-[#1A5FB4]', to: '/services/svc-001' },
  { label: '税务预约', icon: CreditCard, color: 'bg-[#4787DF]', to: '/services/svc-002' },
  { label: '水费缴纳', icon: Droplets, color: 'bg-[#2EC4B6]', to: '/services/svc-007' },
  { label: '电费缴纳', icon: Zap, color: 'bg-[#2EC4B6]', to: '/services/svc-008' },
  { label: '燃气费缴纳', icon: Flame, color: 'bg-[#E76F51]', to: '/services/svc-009' },
  { label: '不动产查询', icon: Building2, color: 'bg-[#1A5FB4]', to: '/services/svc-010' },
  { label: '违章处理', icon: AlertTriangle, color: 'bg-[#E76F51]', to: '/services/svc-011' },
  { label: '投诉反馈', icon: MessageSquare, color: 'bg-[#4787DF]', to: '/services/svc-003' },
]

const defaultAnnouncements = [
  { id: '1', title: '关于优化政务服务流程的通知', date: '2026-06-09', type: 'important' as const },
  { id: '2', title: '2026年度社保缴费基数调整政策', date: '2026-06-08', type: 'important' as const },
  { id: '3', title: '电子证照系统升级更新公告', date: '2026-06-07', type: 'normal' as const },
  { id: '4', title: '公积金提取新规实施细则发布', date: '2026-06-06', type: 'normal' as const },
  { id: '5', title: '全市通办服务范围扩大通知', date: '2026-06-05', type: 'normal' as const },
]

const dimMap = {
  cases: { label: '今日办件', unit: '件', key: 'todayCases' as const, color: '#1A5FB4' },
  services: { label: '在线服务', unit: '项', key: 'todayServices' as const, color: '#4787DF' },
  rate: { label: '满意度', unit: '%', key: 'satisfaction' as const, color: '#2EC4B6' },
  time: { label: '平均时长', unit: 'h', key: 'avgHours' as const, color: '#E76F51' },
}

export default function Dashboard() {
  const navigate = useNavigate()

  interface StatCard { value: number; trend: number; total?: number; rate?: number }
  interface OverviewResp {
    todayCases: StatCard; onlineServices: StatCard; satisfactionRate: StatCard; avgProcessTime: StatCard;
    funnels: { label: string; value: number }[];
    categoryStats: { category?: string | null; count: number }[];
    serviceStats: { id: string; name: string; status: string; department_name?: string; count: number; access_type: string }[];
    regionCases: { region: string; todayCases: number; todayServices: number; satisfaction: number; avgHours: number }[];
    todayTimeline: { id: string; time: string; status: string; service: string; department: string }[];
    healthAlerts: { department: string; status: string; avgResponseTime: number; failureRate: number; timeoutCount: number; lastCheck: string }[];
  }

  const [overview, setOverview] = useState<OverviewResp | null>(null)
  const [hotServices, setHotServices] = useState<ServiceItem[]>([])
  const [announcements] = useState(defaultAnnouncements)
  const [activeRegion, setActiveRegion] = useState('全市')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [activeDim, setActiveDim] = useState<'cases' | 'services' | 'rate' | 'time'>('cases')
  const [activeMetricCard, setActiveMetricCard] = useState(0)
  const [confirmedAlerts, setConfirmedAlerts] = useState<Set<number>>(new Set())

  useEffect(() => {
    apiFetch<OverviewResp>('/api/services/stats/overview')
      .then((d) => {
        if (d && d.todayCases) {
          setOverview(d)
        }
      })
      .catch(() => {
        const fallbackCases = 1286
        setOverview({
          todayCases: { value: fallbackCases, trend: 12.5 },
          onlineServices: { value: 156, trend: 5.2 },
          satisfactionRate: { value: 98.6, trend: 0.8, rate: 98.6 },
          avgProcessTime: { value: 2.3, trend: -3.1 },
          funnels: [
            { label: '提交申请', value: fallbackCases },
            { label: '窗口受理', value: 1180 },
            { label: '部门审核', value: 1055 },
            { label: '审批决定', value: 995 },
            { label: '办结送达', value: 965 },
          ],
          categoryStats: [
            { category: 'government', count: 520 },
            { category: 'convenience', count: 680 },
            { category: null, count: 86 },
          ],
          serviceStats: [
            { id: 's1', name: '社保缴纳', status: 'online', department_name: '人社局', count: 15280, access_type: 'http' },
            { id: 's2', name: '水费缴纳', status: 'online', department_name: '水务局', count: 34560, access_type: 'webhook' },
            { id: 's3', name: '电费缴纳', status: 'online', department_name: '供电公司', count: 45230, access_type: 'api-gateway' },
            { id: 's4', name: '燃气费缴纳', status: 'degraded', department_name: '燃气公司', count: 28910, access_type: 'http' },
            { id: 's5', name: '不动产查询', status: 'online', department_name: '自然资源局', count: 9870, access_type: 'api-gateway' },
            { id: 's6', name: '税务预约', status: 'offline', department_name: '税务局', count: 8930, access_type: 'webhook' },
          ],
          regionCases: [
            { region: '市本级', todayCases: 580, todayServices: 42, satisfaction: 99.1, avgHours: 2.1 },
            { region: '东区', todayCases: 210, todayServices: 28, satisfaction: 98.5, avgHours: 2.4 },
            { region: '西区', todayCases: 180, todayServices: 26, satisfaction: 98.2, avgHours: 2.5 },
            { region: '南区', todayCases: 165, todayServices: 22, satisfaction: 98.0, avgHours: 2.6 },
            { region: '北区', todayCases: 151, todayServices: 20, satisfaction: 97.8, avgHours: 2.7 },
          ],
          todayTimeline: [
            { id: 't1', time: '09:12', status: 'completed', service: '社保缴纳', department: '人社局' },
            { id: 't2', time: '09:08', status: 'processing', service: '不动产查询', department: '自然资源局' },
            { id: 't3', time: '09:05', status: 'submitted', service: '税务预约', department: '税务局' },
            { id: 't4', time: '08:58', status: 'completed', service: '水费缴纳', department: '水务局' },
            { id: 't5', time: '08:52', status: 'rejected', service: '公积金提取', department: '住建局' },
            { id: 't6', time: '08:45', status: 'processing', service: '营业执照办理', department: '市场监管局' },
            { id: 't7', time: '08:38', status: 'completed', service: '电费缴纳', department: '供电公司' },
          ],
          healthAlerts: [
            { department: '自然资源局', status: 'critical', avgResponseTime: 892, failureRate: 3.2, timeoutCount: 12, lastCheck: '09:10' },
            { department: '税务局', status: 'warning', avgResponseTime: 456, failureRate: 1.2, timeoutCount: 3, lastCheck: '09:08' },
            { department: '水务局', status: 'degraded', avgResponseTime: 312, failureRate: 0.5, timeoutCount: 1, lastCheck: '09:05' },
            { department: '燃气公司', status: 'warning', avgResponseTime: 528, failureRate: 1.8, timeoutCount: 5, lastCheck: '09:02' },
            { department: '人社局', status: 'healthy', avgResponseTime: 128, failureRate: 0.1, timeoutCount: 0, lastCheck: '09:00' },
            { department: '住建局', status: 'down', avgResponseTime: 2150, failureRate: 12.5, timeoutCount: 28, lastCheck: '08:58' },
          ],
        })
      })

    apiFetch<Array<Record<string, unknown>>>('/api/services/hot')
      .then((d) => {
        if (Array.isArray(d)) {
          setHotServices(d.map(mapService))
        }
      })
      .catch(() => {
        const fallback: ServiceItem[] = [
          {
            id: 'svc-001', name: '社保缴纳', category: 'government', subCategory: '社会保障',
            description: '社会保险费用缴纳服务', icon: 'Shield', applicantCount: 15280,
            accessType: 'http', accessConfig: {}, status: 'online', department: '人社局',
            departmentName: '人力资源和社会保障局', departmentId: 'dept-hr', serviceCode: 'SB-2024-001',
            processingTime: 1, satisfaction: 98.5, rating: 4.8, reviewCount: 2345,
            requiredMaterials: [], processSteps: [],
          },
          {
            id: 'svc-007', name: '水费缴纳', category: 'convenience', subCategory: '生活缴费',
            description: '居民用水费用缴纳', icon: 'Droplets', applicantCount: 34560,
            accessType: 'webhook', accessConfig: {}, status: 'online', department: '水务局',
            departmentName: '市水务局', departmentId: 'dept-water', serviceCode: 'SF-2024-007',
            processingTime: 0.5, satisfaction: 99.2, rating: 4.9, reviewCount: 5678,
            requiredMaterials: [], processSteps: [],
          },
          {
            id: 'svc-008', name: '电费缴纳', category: 'convenience', subCategory: '生活缴费',
            description: '居民用电费用缴纳', icon: 'Zap', applicantCount: 45230,
            accessType: 'api-gateway', accessConfig: {}, status: 'online', department: '供电公司',
            departmentName: '市供电公司', departmentId: 'dept-power', serviceCode: 'DF-2024-008',
            processingTime: 0.5, satisfaction: 99.0, rating: 4.9, reviewCount: 8901,
            requiredMaterials: [], processSteps: [],
          },
          {
            id: 'svc-009', name: '燃气费缴纳', category: 'convenience', subCategory: '生活缴费',
            description: '居民燃气费用缴纳', icon: 'Flame', applicantCount: 28910,
            accessType: 'http', accessConfig: {}, status: 'degraded', department: '燃气公司',
            departmentName: '市燃气集团', departmentId: 'dept-gas', serviceCode: 'RF-2024-009',
            processingTime: 0.5, satisfaction: 97.8, rating: 4.6, reviewCount: 3456,
            requiredMaterials: [], processSteps: [],
          },
          {
            id: 'svc-010', name: '不动产信息查询', category: 'government', subCategory: '住房建设',
            description: '不动产登记信息查询服务', icon: 'Building2', applicantCount: 9870,
            accessType: 'api-gateway', accessConfig: {}, status: 'online', department: '自然资源局',
            departmentName: '自然资源和规划局', departmentId: 'dept-land', serviceCode: 'BDC-2024-010',
            processingTime: 2, satisfaction: 98.0, rating: 4.7, reviewCount: 1234,
            requiredMaterials: [], processSteps: [],
          },
          {
            id: 'svc-002', name: '税务预约', category: 'government', subCategory: '税务财务',
            description: '税务办理预约服务', icon: 'CreditCard', applicantCount: 8930,
            accessType: 'webhook', accessConfig: {}, status: 'offline', department: '税务局',
            departmentName: '市税务局', departmentId: 'dept-tax', serviceCode: 'SW-2024-002',
            processingTime: 3, satisfaction: 96.5, rating: 4.5, reviewCount: 987,
            requiredMaterials: [], processSteps: [],
          },
        ]
        setHotServices(fallback)
      })
  }, [])

  const todayCasesVal = overview?.todayCases.value ?? 1286

  const weeklyTrend = useMemo(() => {
    const base = todayCasesVal / 7
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const factors = [0.85, 1.02, 0.95, 1.15, 1.28, 0.45, 0.30]
    return days.map((day, i) => ({
      day,
      submitted: Math.round(base * factors[i]),
      completed: Math.round(base * factors[i] * (0.9 + Math.random() * 0.08)),
    }))
  }, [todayCasesVal])

  const funnelData = useMemo(() => {
    const colors = ['#2EC4B6', '#2A9D8F', '#4787DF', '#1A5FB4', '#E76F51']
    return (overview?.funnels ?? [
      { label: '提交申请', value: 1286 },
      { label: '窗口受理', value: 1180 },
      { label: '部门审核', value: 1055 },
      { label: '审批决定', value: 995 },
      { label: '办结送达', value: 965 },
    ]).map((f, i) => ({ ...f, fill: colors[i % colors.length] }))
  }, [overview?.funnels])

  const pieData = useMemo(() => {
    const catStats = overview?.categoryStats ?? [
      { category: 'government', count: 520 },
      { category: 'convenience', count: 680 },
      { category: null, count: 86 },
    ]
    const colors = ['#1A5FB4', '#2EC4B6', '#75A5E7']
    return catStats.map((c, i) => ({
      name: c.category === 'government' ? '政务服务' : c.category === 'convenience' ? '便民服务' : '其他',
      value: c.count,
      color: colors[i % colors.length],
    }))
  }, [overview?.categoryStats])

  const filteredRegionData = useMemo(() => {
    const data = overview?.regionCases ?? [
      { region: '市本级', todayCases: 580, todayServices: 42, satisfaction: 99.1, avgHours: 2.1 },
      { region: '东区', todayCases: 210, todayServices: 28, satisfaction: 98.5, avgHours: 2.4 },
      { region: '西区', todayCases: 180, todayServices: 26, satisfaction: 98.2, avgHours: 2.5 },
      { region: '南区', todayCases: 165, todayServices: 22, satisfaction: 98.0, avgHours: 2.6 },
      { region: '北区', todayCases: 151, todayServices: 20, satisfaction: 97.8, avgHours: 2.7 },
    ]
    return activeRegion === '全市' ? data : data.filter((r) => r.region === activeRegion)
  }, [overview?.regionCases, activeRegion])

  const timelineData = overview?.todayTimeline ?? [
    { id: 't1', time: '09:12', status: 'completed', service: '社保缴纳', department: '人社局' },
    { id: 't2', time: '09:08', status: 'processing', service: '不动产查询', department: '自然资源局' },
    { id: 't3', time: '09:05', status: 'submitted', service: '税务预约', department: '税务局' },
    { id: 't4', time: '08:58', status: 'completed', service: '水费缴纳', department: '水务局' },
    { id: 't5', time: '08:52', status: 'rejected', service: '公积金提取', department: '住建局' },
    { id: 't6', time: '08:45', status: 'processing', service: '营业执照办理', department: '市场监管局' },
    { id: 't7', time: '08:38', status: 'completed', service: '电费缴纳', department: '供电公司' },
  ]

  const healthAlerts = overview?.healthAlerts ?? [
    { department: '自然资源局', status: 'critical', avgResponseTime: 892, failureRate: 3.2, timeoutCount: 12, lastCheck: '09:10' },
    { department: '税务局', status: 'warning', avgResponseTime: 456, failureRate: 1.2, timeoutCount: 3, lastCheck: '09:08' },
    { department: '水务局', status: 'degraded', avgResponseTime: 312, failureRate: 0.5, timeoutCount: 1, lastCheck: '09:05' },
    { department: '燃气公司', status: 'warning', avgResponseTime: 528, failureRate: 1.8, timeoutCount: 5, lastCheck: '09:02' },
    { department: '人社局', status: 'healthy', avgResponseTime: 128, failureRate: 0.1, timeoutCount: 0, lastCheck: '09:00' },
    { department: '住建局', status: 'down', avgResponseTime: 2150, failureRate: 12.5, timeoutCount: 28, lastCheck: '08:58' },
  ]

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
      submitted: { label: '已提交', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
      processing: { label: '审核中', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
      completed: { label: '已办结', cls: 'bg-green-100 text-green-700 border border-green-200' },
      rejected: { label: '已退回', cls: 'bg-red-100 text-red-700 border border-red-200' },
      approved: { label: '已批准', cls: 'bg-green-100 text-green-700 border border-green-200' },
    }
    return map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' }
  }

  function getTimelineDot(status: string) {
    const map: Record<string, string> = {
      completed: 'bg-green-500',
      processing: 'bg-blue-500',
      submitted: 'bg-yellow-500',
      rejected: 'bg-red-500',
      approved: 'bg-green-500',
    }
    return map[status] ?? 'bg-gray-400'
  }

  function getHealthColor(status: string) {
    const map: Record<string, { border: string; dot: string; text: string; statusText: string }> = {
      down: { border: 'bg-red-600', dot: 'bg-red-500', text: 'text-red-700', statusText: '故障' },
      critical: { border: 'bg-red-500', dot: 'bg-red-400', text: 'text-red-600', statusText: '异常' },
      warning: { border: 'bg-amber-500', dot: 'bg-amber-400', text: 'text-amber-700', statusText: '异常' },
      degraded: { border: 'bg-yellow-400', dot: 'bg-yellow-300', text: 'text-yellow-700', statusText: '降级' },
      healthy: { border: 'bg-green-500', dot: 'bg-green-400', text: 'text-green-700', statusText: '正常' },
    }
    return map[status] ?? map.healthy
  }

  function getAccessBadge(type: string) {
    const map: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
      http: { label: 'HTTP', cls: 'bg-blue-50 text-blue-600 border-blue-200', Icon: Link2 },
      webhook: { label: 'Webhook', cls: 'bg-teal-50 text-teal-600 border-teal-200', Icon: Plug },
      'api-gateway': { label: 'API网关', cls: 'bg-purple-50 text-purple-600 border-purple-200', Icon: Network },
    }
    return map[type] ?? map.http
  }

  function getServiceStatusBadge(status: string) {
    const map: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
      online: { label: '已上架', cls: 'bg-green-50 text-green-600 border-green-200', Icon: Eye },
      offline: { label: '已下架', cls: 'bg-gray-100 text-gray-500 border-gray-200', Icon: EyeOff },
      pending: { label: '待审核', cls: 'bg-blue-50 text-blue-600 border-blue-200', Icon: Clock },
      degraded: { label: '降级', cls: 'bg-amber-50 text-amber-600 border-amber-200', Icon: AlertTriangle },
    }
    return map[status] ?? map.online
  }

  function AnnouncementBadge({ type }: { type: 'important' | 'normal' | string }) {
    const map = {
      important: { label: '重要', cls: 'bg-red-100 text-red-700 border border-red-200' },
      normal: { label: '普通', cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
      policy: { label: '政策', cls: 'bg-[#1A5FB4]/10 text-[#1A5FB4] border border-[#1A5FB4]/20' },
      notice: { label: '通知', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
      update: { label: '更新', cls: 'bg-green-100 text-green-700 border border-green-200' },
    }
    const entry = (map as Record<string, { label: string; cls: string }>)[type] ?? map.normal
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${entry.cls}`}>{entry.label}</span>
  }

  function MetricCard({ idx, title, value, unit, trend, Icon }: {
    idx: number; title: string; value: string | number; unit?: string; trend: number;
    Icon: React.ComponentType<{ className?: string }>
  }) {
    const isUp = trend > 0
    const isActive = activeMetricCard === idx
    return (
      <div
        onClick={() => setActiveMetricCard(idx)}
        className={`relative rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
          ${isActive ? 'bg-gradient-to-br from-[#1A5FB4] to-[#4787DF] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-800'}`}
      >
        {isActive && <div className="absolute bottom-0 left-4 right-4 h-1 bg-white/80 rounded-t" />}
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{title}</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-3xl font-bold">{value}</span>
              {unit && <span className={`text-sm mb-1 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>{unit}</span>}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center
            ${isActive ? 'bg-white/20 text-white' : 'bg-[#1A5FB4]/10 text-[#1A5FB4]'}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs">
          {isUp
            ? <ArrowUpRight className={`w-3.5 h-3.5 ${isActive ? 'text-green-300' : 'text-green-500'}`} />
            : <ArrowDownRight className={`w-3.5 h-3.5 ${isActive ? 'text-red-300' : 'text-red-500'}`} />}
          <span className={isUp ? (isActive ? 'text-green-300' : 'text-green-600') : (isActive ? 'text-red-300' : 'text-red-600')}>
            {Math.abs(trend)}%
          </span>
          <span className={`ml-1 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>较昨日</span>
        </div>
      </div>
    )
  }

  function QuickEntryCard({ title, desc, icon: Icon, onClick, btnText, previewLines, ocrHint }: {
    title: string; desc: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; btnText: string;
    previewLines?: string[]; ocrHint?: string
  }) {
    return (
      <div
        onClick={onClick}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
          bg-gradient-to-br from-[#1A5FB4] via-[#2A6FC4] to-[#4787DF] text-white"
      >
        <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
        <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative flex flex-col h-full justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold">{title}</p>
              <p className="text-xs text-blue-100 mt-0.5">{desc}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-5 h-5" />
            </div>
          </div>
          {previewLines && previewLines.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {previewLines.map((line, li) => (
                <p key={li} className="text-[10px] text-blue-100 leading-tight">{line}</p>
              ))}
            </div>
          )}
          {ocrHint && (
            <p className="mt-1 text-[10px] text-blue-200/80">{ocrHint}</p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="mt-2 self-start inline-flex items-center gap-1 text-xs bg-white/25 hover:bg-white/35 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
          >
            {btnText} <Chevron className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  function HotServiceCard({ s }: { s: ServiceItem }) {
    const Icon = fromIconSet[s.icon] ?? FileText
    const accessBadge = getAccessBadge(s.accessType)
    const statusBadge = getServiceStatusBadge(s.status)
    const isAccessValid = s.status === 'online' || s.status === 'degraded'
    const accessValidationMsgs: Record<string, { pass: string; fail: string }> = {
      http: { pass: '端点可达', fail: '连接超时' },
      webhook: { pass: '回调正常', fail: '回调失败' },
      'api-gateway': { pass: '网关注册', fail: '证书过期' },
    }
    const validationMsg = accessValidationMsgs[s.accessType] ?? accessValidationMsgs.http
    const reviewRecord: Record<string, string> = {
      online: '上架于2026-06-01 · 复核人：张审核 · 复核周期：30天',
      offline: '下架于2026-06-05 · 原因：服务维护 · 复核人：李审核',
      degraded: '降级于2026-06-08 · 原因：服务过载 · 复核人：王审核',
      pending: '待审核 · 预计2026-06-15上架 · 复核人：赵审核',
    }
    return (
      <div className="bg-gray-50/80 hover:bg-white border border-gray-100 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1A5FB4]/15 to-[#2EC4B6]/15 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#1A5FB4]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-800 text-sm truncate">{s.name}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.serviceCode || `编码: ${s.id}`}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${accessBadge.cls}`}>
                <accessBadge.Icon className="w-3 h-3" /> {accessBadge.label}
              </span>
              {isAccessValid ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600" title={validationMsg.pass}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500" title={validationMsg.fail}>
                  <XCircle className="w-3.5 h-3.5" />
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusBadge.cls}`}>
                <statusBadge.Icon className="w-3 h-3" /> {statusBadge.label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-gray-600 font-medium">{(s.rating ?? 4.7).toFixed(1)}</span>
              <span className="text-gray-300">|</span>
              <span className="text-[#2EC4B6] font-medium">{(s.satisfaction ?? 98).toFixed(0)}%满意</span>
            </div>
            <div className="text-[10px] text-gray-400">
              好评率{s.satisfaction ?? 98}% · 均时{s.processingTime ?? 1}h · 评价{(s.reviewCount ?? 0).toLocaleString()}条
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{s.departmentName}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium text-[#1A5FB4]">{(s.applicantCount ?? 0).toLocaleString()}</span>
            <span>人办过</span>
          </div>
        </div>

        <div className="mt-1.5 text-[10px] text-gray-300">
          {reviewRecord[s.status] ?? reviewRecord.online}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => navigate(`/services/${s.id}`)}
            className="flex-1 py-2 text-xs font-medium text-white bg-gradient-to-r from-[#1A5FB4] to-[#4787DF] rounded-lg hover:shadow-md transition-all"
          >
            办理
          </button>
          <button
            onClick={() => navigate('/guide')}
            className="flex-1 py-2 text-xs font-medium text-[#1A5FB4] bg-[#1A5FB4]/8 border border-[#1A5FB4]/20 rounded-lg hover:bg-[#1A5FB4]/15 transition-all"
          >
            反馈
          </button>
        </div>
      </div>
    )
  }

  const currentDim = dimMap[activeDim]
  const regionMax = Math.max(...filteredRegionData.map((r) => Number(r[currentDim.key]) || 0), 1)

  return (
      <div className="space-y-5 p-5 lg:p-6">
        {/* 1. 顶部双筛选条 + 面包屑 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1.5 shadow-sm">
              <MapPin className="w-4 h-4 text-gray-400 ml-2" />
              {regionOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium ${
                    activeRegion === r ? 'bg-[#1A5FB4] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1.5 shadow-sm">
              <FileText className="w-4 h-4 text-gray-400 ml-2" />
              {categoryOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium ${
                    activeCategory === c ? 'bg-[#2EC4B6] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <Chevron className="w-3 h-3 text-gray-300" />
              <span className="text-gray-500">工作台</span>
              <Chevron className="w-3 h-3 text-gray-300" />
              <span className="text-gray-700 font-medium">数据总览</span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-gray-600">{new Date().toLocaleTimeString().slice(0, 5)}</span>
            </div>
          </div>
        </div>

        {/* 2. 4指标卡片 + 4快捷业务入口 (2:1) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard idx={0} title="今日办件" value={overview?.todayCases.value ?? 1286} trend={overview?.todayCases.trend ?? 12.5} Icon={FileText} />
            <MetricCard idx={1} title="在线服务" value={overview?.onlineServices.value ?? 156} unit="项" trend={overview?.onlineServices.trend ?? 5.2} Icon={Link2} />
            <MetricCard idx={2} title="好评率" value={overview?.satisfactionRate.value ?? 98.6} unit="%" trend={overview?.satisfactionRate.trend ?? 0.8} Icon={ThumbsUp} />
            <MetricCard idx={3} title="平均时长" value={overview?.avgProcessTime.value ?? 2.3} unit="h" trend={overview?.avgProcessTime.trend ?? -3.1} Icon={Clock} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <QuickEntryCard title="智能导办" desc="AI办事指引" icon={Compass} btnText="开始导办 →"
              previewLines={['▸ 社保缴纳 → 2.3h · 98%满意', '▸ 公积金提取 → 1.5h · 97%满意']}
              ocrHint="3份材料可OCR识别预填"
              onClick={() => navigate('/guide')} />
            <QuickEntryCard title="材料减免" desc="字段合并优化" icon={FileSpreadsheet} btnText="查看合并建议 →"
              previewLines={['发现12组重复字段 · 已合并8组', '身份证号跨5服务重复 · 建议合并']}
              onClick={() => navigate('/admin/materials')} />
            <QuickEntryCard title="服务接入" desc="规范上架管理" icon={Cable} btnText="审核管理 →"
              previewLines={['已上架10/12服务 · 上架率83%', '2项待审核：营业执照/户籍迁移']}
              onClick={() => navigate('/services')} />
            <QuickEntryCard title="省级回传" desc="数据互联互通" icon={Radio} btnText="查看回传 →"
              previewLines={['今日回传342条 · 成功率96.8%', '省→市下载128条待处理']}
              onClick={() => navigate('/admin/relay')} />
          </div>
        </div>

        {/* 3. 漏斗图 + 饼图 + 趋势线 (1:1:1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#2EC4B6] to-[#1A5FB4]" />
                办件状态闭环漏斗
              </h3>
              <span className="text-xs text-gray-400">办结率 {Math.round(((funnelData[4]?.value ?? 0) / (funnelData[0]?.value || 1)) * 100)}%</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={72} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {funnelData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-[11px] text-gray-500 leading-relaxed">
              {funnelData.map((f, i) => (
                <span key={i}>
                  {i > 0 && ' → '}
                  {f.label.slice(0, 2)}{f.value}
                  {i > 0 && `(${((funnelData[i].value / funnelData[i - 1].value) * 100).toFixed(0)}%)`}
                </span>
              ))}
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              近7日办结率{Math.round(((funnelData[4]?.value ?? 0) / (funnelData[0]?.value || 1)) * 100)}%，环比+{(overview?.satisfactionRate?.trend ?? 0.8).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#1A5FB4] to-[#2EC4B6]" />
                事项类别分布
              </h3>
              <span className="text-xs text-gray-400">共{pieData.reduce((a, b) => a + b.value, 0)}件</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                  fontSize={11}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#4787DF] to-[#E76F51]" />
                近7天办件趋势
              </h3>
              <span className="text-xs text-gray-400">单位：件</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyTrend} margin={{ left: 5, right: 15, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Line type="monotone" dataKey="submitted" stroke="#1A5FB4" strokeWidth={2.5} dot={{ r: 3.5, fill: '#1A5FB4', strokeWidth: 2, stroke: '#fff' }} name="提交数" />
                <Line type="monotone" dataKey="completed" stroke="#2EC4B6" strokeWidth={2.5} dot={{ r: 3.5, fill: '#2EC4B6', strokeWidth: 2, stroke: '#fff' }} name="办结数" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. 热门服务详情卡 + 8快捷服务 (2:1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                热门服务 TOP6
              </h3>
              <Link to="/services" className="text-xs text-[#1A5FB4] hover:underline font-medium inline-flex items-center gap-1">
                全部 <Chevron className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {hotServices.slice(0, 6).map((s) => (
                <HotServiceCard key={s.id} s={s} />
              ))}
              {hotServices.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#E76F51]" />
                快捷服务
              </h3>
              <span className="text-xs text-gray-400">常用推荐</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {quickServicesPreset.map((s) => (
                <div
                  key={s.label}
                  onClick={() => navigate(s.to)}
                  className="flex flex-col items-center gap-2 cursor-pointer group p-2 rounded-xl transition-all hover:bg-gray-50"
                >
                  <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] text-gray-600 group-hover:text-[#1A5FB4] text-center font-medium leading-tight">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. 区县指标进度条 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1A5FB4]" />
              区县指标排行
            </h3>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
              {(Object.keys(dimMap) as Array<keyof typeof dimMap>).map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveDim(k)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                    activeDim === k ? 'bg-white text-[#1A5FB4] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {dimMap[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 px-3 py-2 bg-blue-50/60 rounded-lg flex items-center gap-4 text-xs">
            <span className="font-medium text-[#1A5FB4]">全市合计：</span>
            <span>{filteredRegionData.reduce((s, r) => s + r.todayCases, 0)}件</span>
            <span>/ {filteredRegionData.reduce((s, r) => s + r.todayServices, 0)}项</span>
            <span>/ {filteredRegionData.length > 0 ? (filteredRegionData.reduce((s, r) => s + r.satisfaction, 0) / filteredRegionData.length).toFixed(1) : '0.0'}%</span>
            <span>/ {filteredRegionData.length > 0 ? (filteredRegionData.reduce((s, r) => s + r.avgHours, 0) / filteredRegionData.length).toFixed(1) : '0.0'}h</span>
          </div>
          <div className="space-y-3.5">
            {filteredRegionData.map((r, ri) => {
              const val = Number(r[currentDim.key]) || 0
              const pct = (val / regionMax) * 100
              return (
                <div key={r.region} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-28 flex-shrink-0">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                      ri < 3 ? 'bg-gradient-to-br from-[#E76F51] to-[#FF8A65] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{ri + 1}</span>
                    <span className="text-sm font-medium text-gray-700">{r.region}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    {(['todayCases', 'todayServices', 'satisfaction', 'avgHours'] as const).map((k) => {
                      const label = k === 'todayCases' ? '今日办件' : k === 'todayServices' ? '在线服务' : k === 'satisfaction' ? '满意度' : '平均时长'
                      const unit = k === 'satisfaction' ? '%' : k === 'avgHours' ? 'h' : k === 'todayServices' ? '项' : '件'
                      const v = Number(r[k]) || 0
                      const isActive = k === currentDim.key
                      const localPct = isActive ? pct : (v / (Math.max(...filteredRegionData.map((x) => Number(x[k]) || 0)) || 1)) * 100
                      return (
                        <div key={k} className="min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] ${isActive ? 'text-[#1A5FB4] font-medium' : 'text-gray-400'}`}>{label}</span>
                            <span className={`text-xs font-semibold ${isActive ? 'text-[#1A5FB4]' : 'text-gray-600'}`}>
                              {k === 'satisfaction' ? v.toFixed(1) : v}{unit}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isActive ? 'bg-gradient-to-r from-[#1A5FB4] to-[#4787DF]' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                              }`}
                              style={{ width: `${Math.min(localPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 6. 办件时间线 + 健康告警 (2:1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1A5FB4]" />
                今日办件流转追踪
              </h3>
              <Link to="/cases" className="text-xs text-[#1A5FB4] hover:underline font-medium inline-flex items-center gap-1">
                全部 <Chevron className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-[62px] top-2 bottom-2 w-px bg-gradient-to-b from-[#1A5FB4]/30 via-[#2EC4B6]/30 to-transparent" />
              <div className="space-y-1">
                {timelineData.map((t) => {
                  const badge = getStatusBadge(t.status)
                  const dotCls = getTimelineDot(t.status)
                  return (
                    <div key={t.id} className="flex items-start gap-4 py-3 px-2 rounded-lg hover:bg-gray-50/80 transition-colors group">
                      <div className="w-14 flex-shrink-0 text-right">
                        <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{t.time}</span>
                      </div>
                      <div className="relative w-5 flex-shrink-0 flex justify-center pt-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full ${dotCls} ring-4 ring-white shadow-sm z-10`} />
                      </div>
                      <div className="flex-1 flex items-center justify-between min-w-0 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`text-sm font-medium text-gray-800 truncate`}>{t.service}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${badge.cls} flex-shrink-0`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 truncate flex-shrink-0">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{t.department}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/cases/${t.id}`)}
                          className="text-xs font-medium text-[#1A5FB4] hover:text-[#4787DF] inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-md hover:bg-[#1A5FB4]/8 transition-all flex-shrink-0 opacity-60 group-hover:opacity-100"
                        >
                          详情 <Chevron className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E76F51]" />
                服务健康告警
              </h3>
              <Link to="/admin/monitor" className="text-xs text-[#1A5FB4] hover:underline font-medium inline-flex items-center gap-1">
                全部 <Chevron className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {healthAlerts.slice(0, 6).map((h, i) => {
                const hc = getHealthColor(h.status)
                const isConfirmed = confirmedAlerts.has(i)
                let trendIcon: React.ReactNode
                let trendLabel: string
                let trendColor: string
                if (h.failureRate > 2) {
                  trendIcon = <TrendingUp className="w-3 h-3" />
                  trendLabel = '上升'
                  trendColor = 'text-red-600'
                } else if (h.failureRate >= 0.5) {
                  trendIcon = <Minus className="w-3 h-3" />
                  trendLabel = '持平'
                  trendColor = 'text-amber-600'
                } else {
                  trendIcon = <TrendingDown className="w-3 h-3" />
                  trendLabel = '下降'
                  trendColor = 'text-green-600'
                }
                return (
                  <div
                    key={i}
                    className="relative bg-gray-50/80 rounded-xl overflow-hidden transition-all hover:bg-white hover:shadow-sm border border-gray-100"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${hc.border}`} />
                    <div className="pl-4 pr-3 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${hc.dot} animate-pulse`} />
                          <span className="text-sm font-semibold text-gray-800 truncate">{h.department}</span>
                          <span className={`text-[11px] font-medium ${hc.text}`}>{hc.statusText}</span>
                        </div>
                      </div>
                      <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                        <div className="bg-white rounded-lg px-2 py-1.5 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400">响应</p>
                          <p className="text-xs font-semibold text-gray-700">{h.avgResponseTime}<span className="text-[10px] text-gray-400 ml-0.5">ms</span></p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400">失败率</p>
                          <p className={`text-xs font-semibold ${h.failureRate > 2 ? 'text-red-600' : h.failureRate > 0.5 ? 'text-amber-600' : 'text-gray-700'}`}>
                            {h.failureRate}<span className="text-[10px] ml-0.5">%</span>
                          </p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400">超时</p>
                          <p className={`text-xs font-semibold ${h.timeoutCount > 5 ? 'text-red-600' : h.timeoutCount > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                            {h.timeoutCount}<span className="text-[10px] text-gray-400 ml-0.5">次</span>
                          </p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400">检测</p>
                          <p className="text-xs font-semibold text-gray-700">{h.lastCheck}</p>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400">趋势</p>
                          <p className={`text-xs font-semibold ${trendColor} inline-flex items-center gap-0.5`}>
                            {trendIcon} {trendLabel}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            setConfirmedAlerts((prev) => {
                              const next = new Set(prev)
                              next.add(i)
                              return next
                            })
                          }}
                          disabled={isConfirmed}
                          className={`py-1.5 text-[11px] font-medium rounded-lg transition-all inline-flex items-center justify-center gap-0.5 ${
                            isConfirmed
                              ? 'text-gray-400 bg-gray-50 border border-gray-100 cursor-default'
                              : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                          }`}
                        >
                          {isConfirmed ? '已确认' : '确认告警'}
                        </button>
                        <button
                          onClick={() => navigate('/admin/monitor')}
                          className="py-1.5 text-[11px] font-medium text-[#1A5FB4] bg-[#1A5FB4]/8 border border-[#1A5FB4]/15 rounded-lg hover:bg-[#1A5FB4]/15 transition-all inline-flex items-center justify-center gap-0.5"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => navigate('/admin/heatmap')}
                          className="py-1.5 text-[11px] font-medium text-[#E76F51] bg-[#E76F51]/8 border border-[#E76F51]/15 rounded-lg hover:bg-[#E76F51]/15 transition-all inline-flex items-center justify-center gap-0.5"
                        >
                          热力钻取
                        </button>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-300">
                        上次复核：2026-06-09 王管理 → 复核结论：需关注
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 7. 公告列表 + 管理侧操作提示卡 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1A5FB4]" />
                公告通知
              </h3>
              <span className="text-xs text-gray-400">共{announcements.length}条</span>
            </div>
            <div className="space-y-1">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50/80 transition-colors cursor-pointer group border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AnnouncementBadge type={a.type} />
                    <span className="text-sm text-gray-700 group-hover:text-[#1A5FB4] transition-colors truncate font-medium">
                      {a.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs text-gray-400">{a.date}</span>
                    <Chevron className="w-4 h-4 text-gray-300 group-hover:text-[#1A5FB4] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A5FB4] via-[#2A6FC4] to-[#2EC4B6] rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-20 -bottom-20 w-52 h-52 rounded-full bg-white/5" />
            <div className="absolute left-6 bottom-6 w-20 h-20 rounded-full bg-white/8" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-semibold">复核决策入口</h3>
              </div>
              <p className="text-xs text-blue-100 mb-4">管理侧快捷操作 · 全局调度中心</p>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/admin/heatmap"
                  className="bg-white/18 hover:bg-white/28 backdrop-blur-sm rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg border border-white/15"
                >
                  <Flame className="w-5 h-5 mb-1.5 text-orange-200" />
                  <p className="text-sm font-semibold">资源调度</p>
                  <p className="text-[10px] text-blue-100 mt-0.5">热力图分析</p>
                </Link>
                <Link
                  to="/admin/materials"
                  className="bg-white/18 hover:bg-white/28 backdrop-blur-sm rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg border border-white/15"
                >
                  <Building2 className="w-5 h-5 mb-1.5 text-cyan-200" />
                  <p className="text-sm font-semibold">窗口扩容</p>
                  <p className="text-[10px] text-blue-100 mt-0.5">资源优化</p>
                </Link>
                <Link
                  to="/admin/heatmap"
                  className="bg-white/18 hover:bg-white/28 backdrop-blur-sm rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg border border-white/15"
                >
                  <Users className="w-5 h-5 mb-1.5 text-green-200" />
                  <p className="text-sm font-semibold">预约分流</p>
                  <p className="text-[10px] text-blue-100 mt-0.5">错峰办理</p>
                </Link>
                <Link
                  to="/admin/materials"
                  className="bg-white/18 hover:bg-white/28 backdrop-blur-sm rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg border border-white/15"
                >
                  <FileSpreadsheet className="w-5 h-5 mb-1.5 text-yellow-200" />
                  <p className="text-sm font-semibold">合并办理</p>
                  <p className="text-[10px] text-blue-100 mt-0.5">一窗通办</p>
                </Link>
                <Link
                  to="/admin/monitor"
                  className="bg-white/18 hover:bg-white/28 backdrop-blur-sm rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg border border-white/15"
                >
                  <Zap className="w-5 h-5 mb-1.5 text-pink-200" />
                  <p className="text-sm font-semibold">设备调配</p>
                  <p className="text-[10px] text-blue-100 mt-0.5">运维监控</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}