import { useState } from 'react'
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Eye,
  Play,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Shield,
  Link2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeftRight,
  Copy,
  Download,
  Zap,
  Target,
  Layers,
  GitMerge,
  FileCheck,
  Lock,
  Users,
  Building2,
  Hash,
  Calendar,
  Activity,
  Gauge,
  ScanEye,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCheck,
  X,
  Plus,
  History,
  Globe,
  Banknote,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
} from 'lucide-react'

type TabKey = 'datasource' | 'monitor' | 'conflict' | 'material'

type SourceStatus = '在线' | '离线' | '同步中'
type SysType = '部级' | '市级' | '外部委办局' | '金融机构'

interface DataSource {
  id: string
  name: string
  status: SourceStatus
  lastSync: string
  records: string
  errorRate: string
  syncPct: number
  sysType: SysType
}

interface SyncLog {
  time: string
  source: string
  direction: '读取' | '写入'
  dataSize: string
  status: '成功' | '失败' | '警告'
  duration: string
  operator: string
}

interface ScheduledTask {
  name: string
  cron: string
  lastRun: string
  nextRun: string
  enabled: boolean
}

interface ConflictItem {
  id: string
  type: '数据不一致' | '重复数据' | '格式冲突' | '缺失数据'
  sourceA: string
  sourceB: string
  field: string
  valueA: string
  valueB: string
  person: string
  idCard: string
  time: string
  status: '待处理' | '处理中' | '已解决' | '已忽略'
  method: '自动' | '人工'
  confidence: number
  suggestion: string
}

interface MaterialItem {
  name: string
  count: number
  maxCount: number
}

interface ReuseRule {
  id: number
  rule: string
  description: string
  enabled: boolean
}

const dataSources: DataSource[] = [
  { id: '1', name: '部级社保核心数据库', status: '在线', lastSync: '2026-06-10 10:30', records: '1,234万条', errorRate: '0.01%', syncPct: 100, sysType: '部级' },
  { id: '2', name: '市公积金中心', status: '在线', lastSync: '2026-06-10 10:25', records: '567万条', errorRate: '0.02%', syncPct: 100, sysType: '市级' },
  { id: '3', name: '就业登记系统', status: '在线', lastSync: '2026-06-10 10:28', records: '890万条', errorRate: '0.03%', syncPct: 95, sysType: '市级' },
  { id: '4', name: '人才信息库', status: '同步中', lastSync: '进行中', records: '345万条', errorRate: '0.05%', syncPct: 68, sysType: '市级' },
  { id: '5', name: '劳动仲裁系统', status: '在线', lastSync: '2026-06-10 10:20', records: '123万条', errorRate: '0.01%', syncPct: 100, sysType: '市级' },
  { id: '6', name: '职称评审数据库', status: '在线', lastSync: '2026-06-10 10:15', records: '234万条', errorRate: '0.02%', syncPct: 90, sysType: '市级' },
  { id: '7', name: '医保结算系统', status: '在线', lastSync: '2026-06-10 10:30', records: '2,345万条', errorRate: '0.01%', syncPct: 100, sysType: '外部委办局' },
  { id: '8', name: '工伤认定系统', status: '在线', lastSync: '2026-06-10 10:22', records: '78万条', errorRate: '0.04%', syncPct: 98, sysType: '市级' },
  { id: '9', name: '教育学历认证', status: '离线', lastSync: '2026-06-10 08:00', records: '456万条', errorRate: '0.15%', syncPct: 0, sysType: '外部委办局' },
  { id: '10', name: '民政婚姻登记', status: '在线', lastSync: '2026-06-10 10:18', records: '678万条', errorRate: '0.02%', syncPct: 100, sysType: '外部委办局' },
  { id: '11', name: '公安户籍系统', status: '在线', lastSync: '2026-06-10 10:25', records: '3,456万条', errorRate: '0.00%', syncPct: 100, sysType: '外部委办局' },
  { id: '12', name: '银行代发系统', status: '离线', lastSync: '2026-06-10 09:30', records: '1,890万条', errorRate: '0.08%', syncPct: 0, sysType: '金融机构' },
]

const syncLogs: SyncLog[] = [
  { time: '10:30:15', source: '部级社保核心数据库', direction: '读取', dataSize: '2,345条', status: '成功', duration: '3.2s', operator: '系统' },
  { time: '10:28:42', source: '就业登记系统', direction: '写入', dataSize: '156条', status: '成功', duration: '1.5s', operator: '系统' },
  { time: '10:25:08', source: '公安户籍系统', direction: '读取', dataSize: '5,678条', status: '成功', duration: '5.8s', operator: '系统' },
  { time: '10:22:33', source: '工伤认定系统', direction: '读取', dataSize: '89条', status: '警告', duration: '12.3s', operator: '系统' },
  { time: '10:20:10', source: '劳动仲裁系统', direction: '读取', dataSize: '45条', status: '成功', duration: '0.9s', operator: '系统' },
  { time: '10:18:55', source: '民政婚姻登记', direction: '读取', dataSize: '234条', status: '成功', duration: '2.1s', operator: '系统' },
  { time: '10:15:27', source: '职称评审数据库', direction: '写入', dataSize: '67条', status: '成功', duration: '1.8s', operator: '管理员' },
  { time: '10:10:42', source: '市公积金中心', direction: '读取', dataSize: '1,234条', status: '成功', duration: '4.2s', operator: '系统' },
  { time: '10:05:18', source: '人才信息库', direction: '读取', dataSize: '3,456条', status: '失败', duration: '15.6s', operator: '系统' },
  { time: '10:00:03', source: '医保结算系统', direction: '读取', dataSize: '8,901条', status: '成功', duration: '7.5s', operator: '系统' },
]

const scheduledTasks: ScheduledTask[] = [
  { name: '社保核心库同步', cron: '0 */5 * * *', lastRun: '2026-06-10 10:30', nextRun: '2026-06-10 10:35', enabled: true },
  { name: '公积金中心同步', cron: '0 */10 * * *', lastRun: '2026-06-10 10:20', nextRun: '2026-06-10 10:30', enabled: true },
  { name: '公安户籍同步', cron: '0 */30 * * *', lastRun: '2026-06-10 10:00', nextRun: '2026-06-10 10:30', enabled: true },
  { name: '医保结算同步', cron: '0 0 * * *', lastRun: '2026-06-10 00:00', nextRun: '2026-06-11 00:00', enabled: true },
  { name: '学历认证同步', cron: '0 0 * * *', lastRun: '2026-06-10 00:00', nextRun: '2026-06-11 00:00', enabled: false },
]

const conflicts: ConflictItem[] = [
  {
    id: 'CF-CQ-2026-0689',
    type: '数据不一致',
    sourceA: '部级社保核心库',
    sourceB: '就业登记系统',
    field: '就业状态',
    valueA: '停缴',
    valueB: '在职',
    person: '张三',
    idCard: '500112199005151234',
    time: '2026-06-10 08:30',
    status: '待处理',
    method: '自动',
    confidence: 95,
    suggestion: '以就业登记系统为准，发起社保数据核验',
  },
  {
    id: 'CF-CQ-2026-0688',
    type: '重复数据',
    sourceA: '公安户籍系统',
    sourceB: '社保核心库',
    field: '身份信息',
    valueA: '李四 500103198512205678',
    valueB: '李四 500103198512205678',
    person: '李四',
    idCard: '500103198512205678',
    time: '2026-06-10 07:45',
    status: '处理中',
    method: '人工',
    confidence: 88,
    suggestion: '两条记录身份信息一致，建议合并去重',
  },
  {
    id: 'CF-CQ-2026-0687',
    type: '格式冲突',
    sourceA: '教育学历认证',
    sourceB: '人才信息库',
    field: '学历',
    valueA: '本科（全日制）',
    valueB: '大学本科',
    person: '王五',
    idCard: '500233199203108765',
    time: '2026-06-10 06:20',
    status: '待处理',
    method: '自动',
    confidence: 92,
    suggestion: '学历表述不一致，建议标准化处理',
  },
  {
    id: 'CF-CQ-2026-0686',
    type: '缺失数据',
    sourceA: '医保结算系统',
    sourceB: '社保核心库',
    field: '联系电话',
    valueA: '-',
    valueB: '13800138000',
    person: '赵六',
    idCard: '500105198808082345',
    time: '2026-06-09 22:15',
    status: '已解决',
    method: '自动',
    confidence: 96,
    suggestion: '已从社保核心库补全医保系统联系电话',
  },
  {
    id: 'CF-CQ-2026-0685',
    type: '数据不一致',
    sourceA: '公积金中心',
    sourceB: '社保核心库',
    field: '缴费基数',
    valueA: '¥5,000',
    valueB: '¥4,562',
    person: '孙七',
    idCard: '500108199505053456',
    time: '2026-06-09 18:30',
    status: '已解决',
    method: '人工',
    confidence: 75,
    suggestion: '人工核实后以社保缴费基数为准',
  },
  {
    id: 'CF-CQ-2026-0684',
    type: '重复数据',
    sourceA: '就业登记系统',
    sourceB: '人才信息库',
    field: '工作经历',
    valueA: '重庆XX科技 2020-至今',
    valueB: '重庆XX科技公司 2020-2023',
    person: '周八',
    idCard: '500112199310104567',
    time: '2026-06-09 15:20',
    status: '已忽略',
    method: '人工',
    confidence: 60,
    suggestion: '工作经历时间范围不一致，暂不处理',
  },
  {
    id: 'CF-CQ-2026-0683',
    type: '格式冲突',
    sourceA: '民政婚姻登记',
    sourceB: '公安户籍系统',
    field: '婚姻状况',
    valueA: '已婚',
    valueB: '有配偶',
    person: '吴九',
    idCard: '500231198707075678',
    time: '2026-06-09 12:00',
    status: '已解决',
    method: '自动',
    confidence: 98,
    suggestion: '已自动映射为标准编码',
  },
  {
    id: 'CF-CQ-2026-0682',
    type: '缺失数据',
    sourceA: '工伤认定系统',
    sourceB: '社保核心库',
    field: '工伤认定编号',
    valueA: 'GS-2026-0123',
    valueB: '-',
    person: '郑十',
    idCard: '500106199001016789',
    time: '2026-06-09 09:45',
    status: '处理中',
    method: '人工',
    confidence: 85,
    suggestion: '工伤认定信息待同步至社保核心库',
  },
  {
    id: 'CF-CQ-2026-0681',
    type: '数据不一致',
    sourceA: '劳动仲裁系统',
    sourceB: '就业登记系统',
    field: '就业状态',
    valueA: '仲裁中',
    valueB: '在职',
    person: '冯十一',
    idCard: '500104199102027890',
    time: '2026-06-09 08:30',
    status: '待处理',
    method: '自动',
    confidence: 90,
    suggestion: '仲裁期间就业状态需人工核实',
  },
  {
    id: 'CF-CQ-2026-0680',
    type: '重复数据',
    sourceA: '职称评审数据库',
    sourceB: '人才信息库',
    field: '职称信息',
    valueA: '高级工程师 2022',
    valueB: '高级工程师 2023',
    person: '陈十二',
    idCard: '500107198503038901',
    time: '2026-06-08 16:20',
    status: '已解决',
    method: '人工',
    confidence: 70,
    suggestion: '职称取得时间不一致，已核实为2022年',
  },
]

const conflictTypeDistribution = [
  { type: '数据不一致', percent: 45, color: 'from-amber-400 to-orange-500' },
  { type: '重复数据', percent: 25, color: 'from-cyan-400 to-blue-500' },
  { type: '格式冲突', percent: 20, color: 'from-violet-400 to-purple-500' },
  { type: '缺失数据', percent: 10, color: 'from-emerald-400 to-green-500' },
]

const conflictRules: ReuseRule[] = [
  { id: 1, rule: '身份信息以公安户籍为准', description: '姓名、身份证号、户籍地址等基础身份信息', enabled: true },
  { id: 2, rule: '参保状态以社保核心库为准', description: '养老保险、医疗保险、失业保险等参保状态', enabled: true },
  { id: 3, rule: '就业状态以就业登记为准', description: '就业、失业、灵活就业等状态信息', enabled: true },
  { id: 4, rule: '学历信息以教育学历认证为准', description: '学历、学位、毕业院校等教育信息', enabled: true },
  { id: 5, rule: '婚姻状况以民政登记为准', description: '婚姻状态、配偶信息等', enabled: false },
  { id: 6, rule: '工资基数以社保申报为准', description: '缴费工资、缴费基数等薪酬信息', enabled: true },
]

const topMaterials: MaterialItem[] = [
  { name: '身份证', count: 1856, maxCount: 2000 },
  { name: '户口本', count: 1234, maxCount: 2000 },
  { name: '学历证书', count: 986, maxCount: 2000 },
  { name: '劳动合同', count: 782, maxCount: 2000 },
  { name: '社保证明', count: 654, maxCount: 2000 },
  { name: '收入证明', count: 543, maxCount: 2000 },
  { name: '婚姻证明', count: 432, maxCount: 2000 },
  { name: '职称证书', count: 321, maxCount: 2000 },
  { name: '离职证明', count: 256, maxCount: 2000 },
  { name: '体检报告', count: 198, maxCount: 2000 },
]

const reuseMatrixData = {
  rows: ['社保业务', '就业服务', '人才服务', '劳动关系', '工伤认定'],
  cols: ['身份证', '户口本', '学历证书', '劳动合同', '社保证明'],
  data: [
    [100, 85, 60, 45, 95],
    [90, 70, 80, 100, 50],
    [85, 65, 100, 75, 60],
    [70, 50, 40, 100, 55],
    [95, 80, 30, 20, 100],
  ],
}

const crossDeptReuse = [
  { from: '社保', to: '就业', count: 256 },
  { from: '社保', to: '人才', count: 189 },
  { from: '就业', to: '人才', count: 145 },
  { from: '社保', to: '劳动关系', count: 120 },
  { from: '就业', to: '劳动关系', count: 98 },
  { from: '人才', to: '劳动关系', count: 76 },
]

const failReasons = [
  { reason: '材料过期', count: 10, percent: 36 },
  { reason: '清晰度不足', count: 8, percent: 29 },
  { reason: '字段缺失', count: 6, percent: 21 },
  { reason: '格式不兼容', count: 4, percent: 14 },
]

const dataQualityMetrics = [
  { name: '完整性', value: 98.5, color: 'from-cyan-500 to-blue-500' },
  { name: '准确性', value: 99.2, color: 'from-emerald-500 to-green-500' },
  { name: '一致性', value: 97.8, color: 'from-violet-500 to-purple-500' },
  { name: '及时性', value: 98.0, color: 'from-amber-500 to-orange-500' },
]

const hourlySyncData = [
  { hour: '00', success: 45, fail: 2 },
  { hour: '01', success: 38, fail: 1 },
  { hour: '02', success: 32, fail: 0 },
  { hour: '03', success: 28, fail: 1 },
  { hour: '04', success: 25, fail: 0 },
  { hour: '05', success: 30, fail: 1 },
  { hour: '06', success: 55, fail: 2 },
  { hour: '07', success: 78, fail: 3 },
  { hour: '08', success: 95, fail: 2 },
  { hour: '09', success: 110, fail: 4 },
  { hour: '10', success: 125, fail: 3 },
  { hour: '11', success: 105, fail: 2 },
  { hour: '12', success: 85, fail: 1 },
  { hour: '13', success: 92, fail: 2 },
  { hour: '14', success: 108, fail: 3 },
  { hour: '15', success: 115, fail: 2 },
  { hour: '16', success: 102, fail: 1 },
  { hour: '17', success: 88, fail: 2 },
  { hour: '18', success: 65, fail: 1 },
  { hour: '19', success: 52, fail: 0 },
  { hour: '20', success: 48, fail: 1 },
  { hour: '21', success: 42, fail: 0 },
  { hour: '22', success: 35, fail: 1 },
  { hour: '23', success: 30, fail: 0 },
]

function StatusBadge({ status, type = 'default' }: { status: string; type?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const typeMap: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-cyan-100 text-cyan-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${typeMap[type]}`}>
      {status}
    </span>
  )
}

function StatusDot({ status }: { status: SourceStatus }) {
  const dotColor: Record<SourceStatus, string> = {
    '在线': 'bg-emerald-500',
    '离线': 'bg-rose-500',
    '同步中': 'bg-cyan-500 animate-pulse',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs`}>
      <span className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
      <span className={status === '在线' ? 'text-emerald-600' : status === '离线' ? 'text-rose-600' : 'text-cyan-600'}>
        {status}
      </span>
    </span>
  )
}

function SysTypeTag({ type }: { type: SysType }) {
  const typeMap: Record<SysType, string> = {
    '部级': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '市级': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    '外部委办局': 'bg-violet-100 text-violet-700 border-violet-200',
    '金融机构': 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${typeMap[type]}`}>
      {type}
    </span>
  )
}

function SectionTitle({ icon: Icon, title, subtitle, iconColor = 'from-indigo-500 to-cyan-500' }: {
  icon: any
  title: string
  subtitle?: string
  iconColor?: string
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subValue, trend, color = 'from-indigo-500 to-cyan-500', valueColor = 'text-slate-800' }: {
  icon: any
  label: string
  value: string
  subValue?: string
  trend?: string
  color?: string
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}

function RingProgress({ value, label, color, size = 100, strokeWidth = 10 }: {
  value: number
  label: string
  color: string
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${label})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color.split(' ')[0]?.replace('from-', '') ? '' : ''} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800">{value}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700 mt-2">{label}</p>
    </div>
  )
}

function TabDataSource() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Database} label="在线数据源" value="10 / 12" subValue="共12个数据源" color="from-emerald-500 to-green-600" valueColor="text-emerald-600" />
        <StatCard icon={RefreshCw} label="今日同步次数" value="1,256" subValue="次" trend="较昨日 +8.5%" color="from-cyan-500 to-blue-600" valueColor="text-cyan-600" />
        <StatCard icon={AlertTriangle} label="数据冲突待处理" value="3" subValue="条" trend="较昨日 -2条" color="from-amber-500 to-orange-600" valueColor="text-amber-600" />
        <StatCard icon={CheckCircle2} label="同步成功率" value="99.2%" subValue="近7天平均" trend="提升 0.3%" color="from-violet-500 to-purple-600" valueColor="text-violet-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={Layers} title="数据源管理" subtitle="12个异构数据源统一接入管理" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dataSources.map((src) => (
            <div
              key={src.id}
              className={`rounded-xl border p-4 hover:shadow-md transition-all ${
                src.status === '离线'
                  ? 'bg-slate-50 border-slate-200'
                  : src.status === '同步中'
                  ? 'bg-cyan-50/50 border-cyan-200'
                  : 'bg-white border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{src.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusDot status={src.status} />
                    <SysTypeTag type={src.sysType} />
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center flex-shrink-0 ml-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">最后同步</span>
                  <span className="text-slate-700 font-medium">{src.lastSync}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">数据量</span>
                  <span className="text-slate-700 font-medium">{src.records}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">错误率</span>
                  <span className={`font-medium ${parseFloat(src.errorRate) > 0.05 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {src.errorRate}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">同步进度</span>
                  <span className="text-slate-600 font-medium">{src.syncPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      src.status === '离线'
                        ? 'bg-slate-300'
                        : src.status === '同步中'
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        : 'bg-gradient-to-r from-emerald-400 to-green-500'
                    }`}
                    style={{ width: `${src.syncPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  详情
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors">
                  <Play className="w-3.5 h-3.5" />
                  同步
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  配置
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={Gauge} title="数据质量评估" subtitle="多维数据质量指标监控" iconColor="from-cyan-500 to-blue-500" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
          {dataQualityMetrics.map((metric) => (
            <div key={metric.name} className="flex flex-col items-center">
              <div className="relative w-28 h-28">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="url(#quality-gradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 - (metric.value / 100) * 301.6}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{
                      stroke: metric.value > 98 ? '#10b981' : metric.value > 95 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{metric.value}%</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-3">{metric.name}</p>
              <p className="text-xs text-emerald-600 mt-1">优秀</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabMonitor() {
  const maxSyncValue = Math.max(...hourlySyncData.map(d => d.success + d.fail))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="今日同步总量" value="1,256" subValue="次" color="from-indigo-500 to-cyan-500" valueColor="text-indigo-600" />
        <StatCard icon={CheckCircle2} label="成功" value="1,246" subValue="次" color="from-emerald-500 to-green-600" valueColor="text-emerald-600" />
        <StatCard icon={XCircle} label="失败" value="10" subValue="次" color="from-rose-500 to-red-600" valueColor="text-rose-600" />
        <StatCard icon={Clock} label="平均同步耗时" value="8.5" subValue="秒" color="from-amber-500 to-orange-600" valueColor="text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={BarChart3} title="近24小时同步趋势" subtitle="每小时同步量统计" iconColor="from-cyan-500 to-blue-500" />
        <div className="h-64 flex items-end justify-between gap-1 mt-4">
          {hourlySyncData.map((item) => {
            const total = item.success + item.fail
            const height = (total / maxSyncValue) * 100
            const failHeight = (item.fail / maxSyncValue) * 100
            return (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative w-full flex flex-col justify-end h-48">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm transition-all duration-300 group-hover:from-emerald-600 group-hover:to-emerald-500"
                    style={{ height: `${height - failHeight}%` }}
                  />
                  <div
                    className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-sm transition-all duration-300"
                    style={{ height: `${failHeight}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{item.hour}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400" />
            <span className="text-xs text-slate-600">成功</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-rose-500 to-rose-400" />
            <span className="text-xs text-slate-600">失败</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle icon={History} title="实时同步日志" subtitle="最近同步记录" iconColor="from-indigo-500 to-cyan-500" />
          <button className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-700">
            <Download className="w-3.5 h-3.5" />
            导出日志
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">时间</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">数据源</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">方向</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">数据量</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">状态</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">耗时</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">操作人</th>
                <th className="text-left text-xs font-medium text-slate-500 py-3 px-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.map((log, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 text-xs font-mono text-slate-600">{log.time}</td>
                  <td className="py-3 px-3 text-xs font-medium text-slate-800">{log.source}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      log.direction === '读取' ? 'text-cyan-600' : 'text-amber-600'
                    }`}>
                      {log.direction === '读取' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeftRight className="w-3 h-3" />}
                      {log.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-700">{log.dataSize}</td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={log.status}
                      type={log.status === '成功' ? 'success' : log.status === '失败' ? 'danger' : 'warning'}
                    />
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600">{log.duration}</td>
                  <td className="py-3 px-3 text-xs text-slate-600">{log.operator}</td>
                  <td className="py-3 px-3">
                    <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">查看</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={Settings} title="同步任务调度配置" subtitle="定时同步任务管理" iconColor="from-violet-500 to-purple-500" />
        <div className="space-y-3">
          {scheduledTasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  task.enabled ? 'bg-gradient-to-br from-indigo-500 to-cyan-500' : 'bg-slate-200'
                }`}>
                  <RefreshCw className={`w-5 h-5 ${task.enabled ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{task.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 font-mono">{task.cron}</span>
                    <span className="text-xs text-slate-400">上次：{task.lastRun}</span>
                    <span className="text-xs text-slate-400">下次：{task.nextRun}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={task.enabled ? '运行中' : '已停用'} type={task.enabled ? 'success' : 'default'} />
                <button
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    task.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      task.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabConflict() {
  const [expandedId, setExpandedId] = useState<string | null>('CF-CQ-2026-0689')

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case '数据不一致': return 'text-amber-600 bg-amber-100'
      case '重复数据': return 'text-cyan-600 bg-cyan-100'
      case '格式冲突': return 'text-violet-600 bg-violet-100'
      case '缺失数据': return 'text-rose-600 bg-rose-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  const getStatusType = (status: string) => {
    switch (status) {
      case '待处理': return 'warning'
      case '处理中': return 'info'
      case '已解决': return 'success'
      case '已忽略': return 'default'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="待处理冲突" value="3" subValue="条" color="from-amber-500 to-orange-600" valueColor="text-amber-600" />
        <StatCard icon={Plus} label="今日新增" value="5" subValue="条" color="from-cyan-500 to-blue-600" valueColor="text-cyan-600" />
        <StatCard icon={CheckCircle2} label="已处理" value="12" subValue="条" color="from-emerald-500 to-green-600" valueColor="text-emerald-600" />
        <StatCard icon={Zap} label="自动消解率" value="85%" subValue="本月累计" color="from-violet-500 to-purple-600" valueColor="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <SectionTitle icon={GitMerge} title="冲突列表" subtitle="共 10 条冲突记录" iconColor="from-amber-500 to-orange-500" />
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  expandedId === conflict.id
                    ? 'border-amber-200 bg-amber-50/30 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setExpandedId(expandedId === conflict.id ? null : conflict.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getConflictTypeColor(conflict.type)}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{conflict.id}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getConflictTypeColor(conflict.type)}`}>
                          {conflict.type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {conflict.sourceA} vs {conflict.sourceB}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        冲突字段：{conflict.field} · {conflict.person}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={conflict.status} type={getStatusType(conflict.status) as any} />
                    {expandedId === conflict.id ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedId === conflict.id && (
                  <div className="px-4 pb-4 border-t border-amber-100">
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">数据源 A：{conflict.sourceA}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800">{conflict.valueA}</p>
                      </div>
                      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-violet-600" />
                          <span className="text-xs font-semibold text-violet-700">数据源 B：{conflict.sourceB}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800">{conflict.valueB}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">涉及人员</p>
                          <p className="font-medium text-slate-800">{conflict.person}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">身份证号</p>
                          <p className="font-mono text-slate-700 text-xs">{conflict.idCard}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">发现时间</p>
                          <p className="font-medium text-slate-800">{conflict.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">置信度</p>
                          <p className="font-bold text-amber-600">{conflict.confidence}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-700 mb-1">系统建议</p>
                          <p className="text-sm text-amber-800">{conflict.suggestion}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button className="flex-1 min-w-[120px] py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm">
                        以 A 为准
                      </button>
                      <button className="flex-1 min-w-[120px] py-2 px-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all shadow-sm">
                        以 B 为准
                      </button>
                      <button className="flex-1 min-w-[120px] py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm">
                        人工核验
                      </button>
                      <button className="flex-1 min-w-[120px] py-2 px-4 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors">
                        忽略
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <SectionTitle icon={PieChart} title="冲突类型分布" subtitle="本月冲突统计" iconColor="from-violet-500 to-purple-500" />
            <div className="relative h-48 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {conflictTypeDistribution.reduce((acc, item, index) => {
                    const prevOffset = acc.offset
                    acc.offset += item.percent
                    const dashArray = `${item.percent} ${100 - item.percent}`
                    const colors = [
                      { from: '#f59e0b', to: '#f97316' },
                      { from: '#06b6d4', to: '#3b82f6' },
                      { from: '#8b5cf6', to: '#a855f7' },
                      { from: '#10b981', to: '#22c55e' },
                    ]
                    acc.elements.push(
                      <circle
                        key={index}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[index]?.from || '#ccc'}
                        strokeWidth="3"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-prevOffset}
                      />
                    )
                    return acc
                  }, { elements: [] as any[], offset: 0 }).elements}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-slate-800">20</p>
                  <p className="text-xs text-slate-500">本月冲突</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              {conflictTypeDistribution.map((item, index) => {
                const colors = ['bg-amber-500', 'bg-cyan-500', 'bg-violet-500', 'bg-emerald-500']
                return (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${colors[index]}`} />
                      <span className="text-xs text-slate-600">{item.type}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{item.percent}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <SectionTitle icon={ShieldCheck} title="冲突消解规则" subtitle="6条自动消解规则" iconColor="from-emerald-500 to-green-500" />
            <div className="space-y-2">
              {conflictRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      rule.enabled ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}>
                      <CheckCheck className={`w-3.5 h-3.5 ${rule.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${rule.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                        规则{rule.id}：{rule.rule}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{rule.description}</p>
                    </div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
                      rule.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabMaterial() {
  const maxCount = Math.max(...topMaterials.map(m => m.count))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="累计复用材料" value="3,256" subValue="份" trend="较上月 +12%" color="from-indigo-500 to-cyan-500" valueColor="text-indigo-600" />
        <StatCard icon={Calendar} label="本月复用" value="568" subValue="份" color="from-emerald-500 to-green-600" valueColor="text-emerald-600" />
        <StatCard icon={Target} label="复用率" value="68%" subValue="材料复用比例" color="from-amber-500 to-orange-600" valueColor="text-amber-600" />
        <StatCard icon={Clock} label="节省时间" value="约 520" subValue="小时" trend="效率提升显著" color="from-violet-500 to-purple-600" valueColor="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <SectionTitle icon={BarChart3} title="材料复用排行 Top 10" subtitle="累计复用次数统计" iconColor="from-cyan-500 to-blue-500" />
          <div className="space-y-3">
            {topMaterials.map((material, index) => (
              <div key={material.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-100'
                }`}>
                  <span className={`text-xs font-bold ${index < 3 ? 'text-white' : 'text-slate-500'}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{material.name}</span>
                    <span className="text-xs font-semibold text-slate-600">{material.count}次</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        index < 3 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'
                      }`}
                      style={{ width: `${(material.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <SectionTitle icon={Link2} title="复用事项关联矩阵" subtitle="事项与材料复用关系" iconColor="from-violet-500 to-purple-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-500 font-medium">事项 / 材料</th>
                  {reuseMatrixData.cols.map((col) => (
                    <th key={col} className="p-2 text-center text-slate-500 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reuseMatrixData.rows.map((row, rowIndex) => (
                  <tr key={row}>
                    <td className="p-2 text-slate-700 font-medium">{row}</td>
                    {reuseMatrixData.data[rowIndex]?.map((value, colIndex) => {
                      const intensity = value / 100
                      return (
                        <td key={colIndex} className="p-2 text-center">
                          <div
                            className="w-full h-6 rounded flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: `rgba(6, 182, 212, ${intensity * 0.6 + 0.1})`,
                              color: intensity > 0.5 ? 'white' : '#0891b2',
                            }}
                          >
                            {value}%
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <SectionTitle icon={ArrowLeftRight} title="跨部门复用统计" subtitle="部门间材料复用频次" iconColor="from-emerald-500 to-green-500" />
          <div className="space-y-3">
            {crossDeptReuse.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 flex-1">
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-medium rounded-lg">
                    {item.from}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium rounded-lg">
                    {item.to}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{item.count}</p>
                  <p className="text-[10px] text-slate-500">次</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <SectionTitle icon={AlertCircle} title="复用失败分析" subtitle="本月失败原因统计" iconColor="from-rose-500 to-red-500" />
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">本月复用失败</span>
              <span className="text-lg font-bold text-rose-600">28次</span>
            </div>
          </div>
          <div className="space-y-3">
            {failReasons.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{item.reason}</span>
                  <span className="text-xs font-medium text-slate-700">{item.count}次 ({item.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-gradient-to-r from-rose-400 to-red-500' :
                      index === 1 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                      index === 2 ? 'bg-gradient-to-r from-violet-400 to-purple-500' :
                      'bg-gradient-to-r from-cyan-400 to-blue-500'
                    }`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs font-semibold text-amber-700 mb-1">改进建议</p>
            <p className="text-xs text-amber-600">
              建议优化材料有效期提醒机制，提升OCR识别精度，规范数据格式标准。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <SectionTitle icon={Shield} title="数据安全与授权" subtitle="材料复用安全保障" iconColor="from-indigo-500 to-cyan-500" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">23</p>
                <p className="text-xs text-slate-500">授权事项数</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">长期</p>
                <p className="text-xs text-slate-500">授权有效期</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-violet-600">8项</p>
                <p className="text-xs text-slate-500">脱敏规则</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">脱敏规则配置</h4>
            <div className="space-y-2">
              {[
                { name: '身份证号', rule: '保留前6后4位', enabled: true },
                { name: '手机号码', rule: '保留前3后4位', enabled: true },
                { name: '家庭住址', rule: '隐去详细门牌号', enabled: true },
                { name: '银行账号', rule: '保留前4后4位', enabled: false },
                { name: '医疗记录', rule: '全字段脱敏', enabled: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.rule}</p>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative ${item.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">用户授权记录</h4>
            <div className="space-y-2">
              {[
                { user: '张三', item: '社保查询业务', time: '2026-06-10', status: '已授权' },
                { user: '李四', item: '就业登记服务', time: '2026-06-09', status: '已授权' },
                { user: '王五', item: '职称评审申报', time: '2026-06-08', status: '已授权' },
                { user: '赵六', item: '公积金提取', time: '2026-06-07', status: '已撤回' },
                { user: '孙七', item: '劳动仲裁申请', time: '2026-06-06', status: '已授权' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{item.user[0]}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{item.user}</p>
                      <p className="text-[10px] text-slate-500">{item.item}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      item.status === '已授权' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DataIntegration() {
  const [activeTab, setActiveTab] = useState<TabKey>('datasource')

  const tabs = [
    { key: 'datasource' as const, label: '数据源管理', icon: Database, desc: '12大异构源' },
    { key: 'monitor' as const, label: '同步监控', icon: Activity, desc: '实时同步' },
    { key: 'conflict' as const, label: '冲突处理', icon: GitMerge, desc: '冲突消解' },
    { key: 'material' as const, label: '材料复用', icon: FileText, desc: '材料共享' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur rounded-full border border-cyan-100 mb-4 shadow-sm">
            <span className="text-xs text-cyan-600 font-medium">重庆市人力资源和社会保障局</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center gap-3">
            <span className="text-4xl md:text-5xl">🔗</span>
            <span className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              数据集成
            </span>
          </h1>
          <p className="mt-3 text-slate-500 text-base md:text-lg">
            12大异构源 · 双向同步 · 冲突消解 · 材料复用
          </p>
        </header>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg shadow-indigo-100/50 border border-slate-200/60 p-2 mb-6 sticky top-4 z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {tab.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <main className="pb-8">
          {activeTab === 'datasource' && <TabDataSource />}
          {activeTab === 'monitor' && <TabMonitor />}
          {activeTab === 'conflict' && <TabConflict />}
          {activeTab === 'material' && <TabMaterial />}
        </main>

        <footer className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            重庆市人力资源和社会保障局 · 数字服务中台 · 数据集成平台
          </p>
          <p className="text-xs text-slate-300 mt-1">
            技术支持：重庆人社数据交换与共享平台
          </p>
        </footer>
      </div>
    </div>
  )
}