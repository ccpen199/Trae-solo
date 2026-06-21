<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import {
  Search,
  Users,
  FileCheck,
  ThumbsUp,
  Activity,
  Building2,
  Stethoscope,
  GraduationCap,
  Bus,
  Landmark,
  Shield,
  HeartHandshake,
  Home,
  Receipt,
  Store,
  Baby,
  Briefcase,
  ClipboardList,
  Hotel,
  Car,
  School,
  Flower2,
  Bell,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  LogIn,
  ShieldCheck,
  IdCard,
  Wallet,
  Calculator,
  Ticket,
  Flame,
  MapPin,
  Lightbulb,
  AlertTriangle,
  BarChart3,
  Zap,
  Sparkles,
  FileText,
  CreditCard,
  BookOpen,
  RefreshCw,
  Settings,
} from 'lucide-vue-next'
import type { EChartsOption } from 'echarts'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { mockUserProfile } from '@/mock/data/profile'

const router = useRouter()
const userStore = useUserStore()

const todoCount = ref(3)
const doingCount = ref(5)
const searchValue = ref('')
const activeNoticeIndex = ref(0)
const dataUpdateTime = '2026-06-20 10:30:00'

const profileData = computed(() => {
  if (userStore.userProfile) {
    return userStore.userProfile
  }
  return mockUserProfile
})

const isAdminRole = computed(() => {
  const role = userStore.userInfo?.role
  return role === 'platform_admin' || role === 'department_admin' || role === 'platform_operate' || role === 'department_staff'
})

const verifiedLevel = computed(() => {
  if (!userStore.userInfo?.verified) return 0
  return 3
})

interface StatItem {
  label: string
  value: number
  suffix?: string
  icon: any
  color: string
  bgGradient: string
}

const stats = reactive<StatItem[]>([
  { label: '今日办件量', value: 12856, icon: FileCheck, color: '#3B82F6', bgGradient: 'from-blue-500 to-blue-600' },
  { label: '办结率', value: 96.8, suffix: '%', icon: CheckCircle, color: '#2ECC71', bgGradient: 'from-green-500 to-green-600' },
  { label: '群众满意度', value: 98.5, suffix: '%', icon: ThumbsUp, color: '#F39C12', bgGradient: 'from-yellow-500 to-yellow-600' },
  { label: '在线人数', value: 3428, icon: Users, color: '#9B59B6', bgGradient: 'from-purple-500 to-purple-600' },
])

const targetStats = [12856, 96.8, 98.5, 3428]

function animateNumber(index: number, target: number, duration = 1500) {
  const start = performance.now()
  const isDecimal = target % 1 !== 0
  const step = (timestamp: number) => {
    const progress = Math.min((timestamp - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    stats[index].value = isDecimal
      ? Math.round(target * eased * 10) / 10
      : Math.floor(target * eased)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

interface ServiceItem {
  name: string
  icon: any
  gradient: string
}

const quickServices: ServiceItem[] = [
  { name: '人社', icon: Briefcase, gradient: 'from-blue-500 to-indigo-600' },
  { name: '医保', icon: Stethoscope, gradient: 'from-emerald-500 to-teal-600' },
  { name: '教育', icon: GraduationCap, gradient: 'from-orange-500 to-amber-600' },
  { name: '交通', icon: Bus, gradient: 'from-cyan-500 to-blue-600' },
  { name: '文旅', icon: Landmark, gradient: 'from-rose-500 to-pink-600' },
  { name: '公积金', icon: Building2, gradient: 'from-amber-500 to-orange-600' },
  { name: '公安', icon: Shield, gradient: 'from-slate-600 to-slate-800' },
  { name: '民政', icon: HeartHandshake, gradient: 'from-red-500 to-rose-600' },
  { name: '住建', icon: Home, gradient: 'from-yellow-500 to-amber-600' },
  { name: '税务', icon: Receipt, gradient: 'from-sky-500 to-blue-600' },
  { name: '市场监管', icon: Store, gradient: 'from-lime-500 to-green-600' },
  { name: '卫健', icon: Activity, gradient: 'from-green-500 to-emerald-600' },
]

interface HotService {
  rank: number
  name: string
  count: number
  dept: string
  serviceId: string
  onlineApply: boolean
}

const hotServices: HotService[] = [
  { rank: 1, name: '社保卡申领', count: 3256, dept: '人社局', serviceId: 's_002', onlineApply: true },
  { rank: 2, name: '医保报销查询', count: 2891, dept: '医保局', serviceId: 's_004', onlineApply: true },
  { rank: 3, name: '公积金提取', count: 2456, dept: '公积金中心', serviceId: 's_006', onlineApply: true },
  { rank: 4, name: '机动车违章查询', count: 2134, dept: '公安局', serviceId: 's_008', onlineApply: true },
  { rank: 5, name: '户籍迁移办理', count: 1890, dept: '公安局', serviceId: 's_011', onlineApply: true },
  { rank: 6, name: '不动产登记', count: 1678, dept: '自然资源局', serviceId: 's_007', onlineApply: true },
  { rank: 7, name: '营业执照办理', count: 1543, dept: '市场监管局', serviceId: 's_010', onlineApply: true },
  { rank: 8, name: '社保缴费证明', count: 1321, dept: '人社局', serviceId: 's_001', onlineApply: true },
  { rank: 9, name: '子女入学登记', count: 1156, dept: '教育局', serviceId: 's_005', onlineApply: true },
  { rank: 10, name: '驾驶证换证', count: 987, dept: '公安局', serviceId: 's_008', onlineApply: true },
]

const notices = [
  { id: 1, title: '关于2026年度城乡居民基本医疗保险参保缴费的通告', date: '2026-06-18', type: 'important' },
  { id: 2, title: '抚州市政务服务中心端午节放假安排通知', date: '2026-06-15', type: 'normal' },
  { id: 3, title: '新版电子证照系统上线公告', date: '2026-06-12', type: 'normal' },
  { id: 4, title: '关于优化营商环境若干措施的实施意见', date: '2026-06-10', type: 'important' },
  { id: 5, title: '2026年高校毕业生就业创业政策解读', date: '2026-06-08', type: 'normal' },
]

interface ScenarioService {
  name: string
  serviceId?: string
}

interface ScenarioPackage {
  title: string
  desc: string
  icon: any
  gradient: string
  services: ScenarioService[]
  keyword: string
}

const scenarioPackages: ScenarioPackage[] = [
  { 
    title: '新生儿出生', 
    desc: '出生登记、医保参保等8项服务', 
    icon: Baby, 
    gradient: 'from-pink-400 to-rose-500', 
    keyword: '出生',
    services: [
      { name: '出生医学证明', serviceId: 's_003' },
      { name: '户口登记', serviceId: 's_011' },
      { name: '医保参保', serviceId: 's_003' },
      { name: '社保申领', serviceId: 's_001' }
    ] 
  },
  { 
    title: '就业创业', 
    desc: '求职登记、补贴申领等12项服务', 
    icon: Briefcase, 
    gradient: 'from-blue-400 to-indigo-500',
    keyword: '就业',
    services: [
      { name: '求职登记', serviceId: 's_001' },
      { name: '创业补贴', serviceId: 's_010' },
      { name: '社保补贴', serviceId: 's_001' },
      { name: '技能培训', serviceId: 's_001' }
    ] 
  },
  { 
    title: '社保服务', 
    desc: '参保登记、待遇领取等15项服务', 
    icon: ClipboardList, 
    gradient: 'from-emerald-400 to-teal-500',
    keyword: '社保',
    services: [
      { name: '参保登记', serviceId: 's_001' },
      { name: '待遇认证', serviceId: 's_002' },
      { name: '关系转移', serviceId: 's_001' },
      { name: '缴费查询', serviceId: 's_001' }
    ] 
  },
  { 
    title: '就医服务', 
    desc: '预约挂号、报销结算等10项服务', 
    icon: Stethoscope, 
    gradient: 'from-red-400 to-rose-500',
    keyword: '医保',
    services: [
      { name: '预约挂号', serviceId: 's_004' },
      { name: '医保报销', serviceId: 's_004' },
      { name: '异地就医', serviceId: 's_004' },
      { name: '体检预约', serviceId: 's_003' }
    ] 
  },
  { 
    title: '住房服务', 
    desc: '不动产登记、公积金等12项服务', 
    icon: Hotel, 
    gradient: 'from-amber-400 to-orange-500',
    keyword: '公积金',
    services: [
      { name: '不动产登记', serviceId: 's_007' },
      { name: '公积金提取', serviceId: 's_006' },
      { name: '购房补贴', serviceId: 's_006' },
      { name: '租赁备案', serviceId: 's_006' }
    ] 
  },
  { 
    title: '交通出行', 
    desc: '驾照办理、车辆登记等8项服务', 
    icon: Car, 
    gradient: 'from-cyan-400 to-blue-500',
    keyword: '交通',
    services: [
      { name: '驾驶证换证', serviceId: 's_008' },
      { name: '车辆年检', serviceId: 's_008' },
      { name: '违章处理', serviceId: 's_008' },
      { name: '出行补贴', serviceId: 's_008' }
    ] 
  },
  { 
    title: '教育服务', 
    desc: '入学报名、学籍管理等9项服务', 
    icon: School, 
    gradient: 'from-violet-400 to-purple-500',
    keyword: '教育',
    services: [
      { name: '入学报名', serviceId: 's_005' },
      { name: '学籍查询', serviceId: 's_005' },
      { name: '资助申请', serviceId: 's_005' },
      { name: '学历认证', serviceId: 's_005' }
    ] 
  },
  { 
    title: '养老服务', 
    desc: '养老金认证、优待证等10项服务', 
    icon: Flower2, 
    gradient: 'from-orange-400 to-red-500',
    keyword: '养老',
    services: [
      { name: '养老金认证', serviceId: 's_001' },
      { name: '优待证办理', serviceId: 's_007' },
      { name: '养老补贴', serviceId: 's_001' },
      { name: '高龄津贴', serviceId: 's_001' }
    ] 
  },
]

const gaugeOption = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#2ECC71' },
            { offset: 1, color: '#27AE60' },
          ],
        },
      },
      progress: { show: true, width: 18 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 18, color: [[1, '#E5E7EB']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '10%'],
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2ECC71',
        formatter: '{value}%',
      },
      data: [{ value: 96.8 }],
    },
  ],
}))

const trendOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#E5E7EB',
    textStyle: { color: '#374151' },
  },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['6/14', '6/15', '6/16', '6/17', '6/18', '6/19', '6/20'],
    axisLine: { lineStyle: { color: '#E5E7EB' } },
    axisLabel: { color: '#6B7280' },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F3F4F6' } },
    axisLabel: { color: '#6B7280' },
  },
  series: [
    {
      name: '办件量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: [9860, 10234, 11567, 12089, 11234, 13567, 12856],
      lineStyle: { width: 3, color: '#3B82F6' },
      itemStyle: { color: '#3B82F6', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
          ],
        },
      },
    },
  ],
}))

const satisfactionOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
  series: [
    {
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      data: [
        { value: 82.5, name: '非常满意', itemStyle: { color: '#2ECC71' } },
        { value: 16.0, name: '满意', itemStyle: { color: '#3B82F6' } },
        { value: 1.2, name: '一般', itemStyle: { color: '#F39C12' } },
        { value: 0.3, name: '不满意', itemStyle: { color: '#E74C3C' } },
      ],
    },
  ],
}))

function handleSearch() {
  const keyword = searchValue.value.trim()
  if (keyword) {
    router.push({ path: '/services', query: { keyword } })
  }
}

interface HotSearchItem {
  keyword: string
  quickApply?: boolean
  serviceId?: string
  toolPath?: string
}

const hotSearchTags: HotSearchItem[] = [
  { keyword: '社保卡', quickApply: true, serviceId: 's_002' },
  { keyword: '公积金提取', quickApply: true, serviceId: 's_006' },
  { keyword: '医保报销', quickApply: true, serviceId: 's_004' },
  { keyword: '营业执照', quickApply: true, serviceId: 's_010' },
  { keyword: '违章查询', quickApply: true, toolPath: '/tools/violation' },
]

function handleHotSearch(tag: string, quickApply?: boolean) {
  const tagItem = hotSearchTags.find(t => t.keyword === tag)
  if (quickApply && tagItem) {
    if (tagItem.toolPath) {
      router.push(tagItem.toolPath)
    } else if (tagItem.serviceId) {
      router.push(`/apply/${tagItem.serviceId}`)
    }
    return
  }
  if (tag === '违章查询') {
    router.push('/tools/violation')
  } else {
    router.push({ path: '/services', query: { keyword: tag } })
  }
}

function handleQuickService(name: string) {
  const deptMap: Record<string, string> = {
    '人社': 'd_001',
    '医保': 'd_002',
    '教育': 'd_003',
    '交通': 'd_005',
    '文旅': 'd_006',
    '公积金': 'd_004',
    '公安': 'd_010',
    '民政': 'd_007',
    '住建': 'd_001',
    '税务': 'd_008',
    '市场监管': 'd_009',
    '卫健': 'd_012'
  }
  const categoryMap: Record<string, string> = {
    '人社': 'social_security',
    '医保': 'medical_insurance',
    '教育': 'education',
    '交通': 'traffic',
    '文旅': 'culture_tourism',
    '公积金': 'housing_fund',
    '公安': 'public_security',
    '民政': 'civil_affairs',
    '住建': 'housing_fund',
    '税务': 'taxation',
    '市场监管': 'industry_commerce',
    '卫健': 'health'
  }
  router.push({ 
    path: '/services', 
    query: { 
      departmentId: deptMap[name] || '',
      category: categoryMap[name] || ''
    } 
  })
}

function handleHotService(name: string) {
  const service = hotServices.find(s => s.name === name)
  if (service?.serviceId) {
    router.push(`/services/${service.serviceId}`)
  } else {
    router.push({ path: '/services', query: { keyword: name } })
  }
}

function handleHotServiceApply(serviceId: string, onlineApply: boolean) {
  if (onlineApply) {
    router.push(`/apply/${serviceId}`)
  } else {
    router.push(`/services/${serviceId}`)
  }
}

function handleScenarioPackage(title: string) {
  const pkg = scenarioPackages.find(p => p.title === title)
  if (pkg) {
    router.push({ path: '/services', query: { keyword: pkg.keyword } })
  } else {
    router.push({ path: '/services', query: { keyword: title } })
  }
}

function handleScenarioViewAll(pkg: ScenarioPackage) {
  router.push({ path: '/services', query: { keyword: pkg.keyword } })
}

function handleScenarioQuickApply(pkg: ScenarioPackage) {
  const firstService = pkg.services.find(s => s.serviceId)
  if (firstService?.serviceId) {
    router.push(`/apply/${firstService.serviceId}`)
  } else {
    handleScenarioViewAll(pkg)
  }
}

function goToProfile() {
  router.push('/profile')
}

interface WorkbenchCard {
  key: string
  title: string
  status: string
  subInfo: string
  icon: any
  gradient: string
  path: string
  quickButton?: { text: string; path: string }
}

const workbenchCards: WorkbenchCard[] = [
  {
    key: 'social',
    title: '社保',
    status: '正常',
    subInfo: '累计缴186月',
    icon: ShieldCheck,
    gradient: 'from-blue-500 to-blue-600',
    path: '/profile?tab=social'
  },
  {
    key: 'medical',
    title: '医保',
    status: '正常',
    subInfo: '账户余额3.2万',
    icon: Stethoscope,
    gradient: 'from-emerald-500 to-teal-600',
    path: '/profile?tab=medical'
  },
  {
    key: 'fund',
    title: '公积金',
    status: '12.8万',
    subInfo: '月缴存额2400元',
    icon: Wallet,
    gradient: 'from-amber-500 to-orange-600',
    path: '/profile?tab=fund',
    quickButton: { text: '贷款计算器', path: '/tools/calculator' }
  },
  {
    key: 'education',
    title: '学籍',
    status: '在籍',
    subInfo: '抚州一中高二',
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    path: '/profile?tab=education'
  },
  {
    key: 'driving',
    title: '驾照',
    status: '有效',
    subInfo: '下次验证日期',
    icon: Car,
    gradient: 'from-cyan-500 to-blue-600',
    path: '/services?keyword=驾驶证'
  },
  {
    key: 'licenses',
    title: '证照',
    status: '8张',
    subInfo: '即将到期1张',
    icon: CreditCard,
    gradient: 'from-rose-500 to-pink-600',
    path: '/profile?tab=licenses'
  },
  {
    key: 'applications',
    title: '我的办件',
    status: '在办5 待评3',
    subInfo: '',
    icon: ClipboardList,
    gradient: 'from-indigo-500 to-purple-600',
    path: '/my-applications'
  }
]

function handleWorkbenchClick(card: WorkbenchCard) {
  router.push(card.path)
}

function handleQuickButton(path: string, event: Event) {
  event.stopPropagation()
  router.push(path)
}

interface HighFreqService {
  key: string
  title: string
  desc: string
  icon: any
  gradient: string
  applyPath: string
  detailPath: string
}

const highFreqServices: HighFreqService[] = [
  {
    key: 's_001',
    title: '社保证明开具',
    desc: '一键生成PDF，可下载打印',
    icon: FileText,
    gradient: 'from-blue-500 to-indigo-600',
    applyPath: '/apply/s_001',
    detailPath: '/services/s_001'
  },
  {
    key: 's_013',
    title: '公交卡年审',
    desc: '老年卡学生卡年度审验',
    icon: Bus,
    gradient: 'from-cyan-500 to-blue-600',
    applyPath: '/apply/s_013',
    detailPath: '/services/s_013'
  },
  {
    key: 'venue',
    title: '景区预约',
    desc: '热门景区线上预约免排队',
    icon: Ticket,
    gradient: 'from-rose-500 to-pink-600',
    applyPath: '/tools/venue',
    detailPath: '/tools/venue'
  },
  {
    key: 's_006',
    title: '公积金提取',
    desc: '购房租房等提取业务',
    icon: Wallet,
    gradient: 'from-amber-500 to-orange-600',
    applyPath: '/apply/s_006',
    detailPath: '/services/s_006'
  },
  {
    key: 's_004',
    title: '医保异地备案',
    desc: '跨省异地就医直接结算',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-600',
    applyPath: '/apply/s_004',
    detailPath: '/services/s_004'
  },
  {
    key: 's_005',
    title: '入学报名',
    desc: '小学初中新生入学报名',
    icon: School,
    gradient: 'from-purple-500 to-violet-600',
    applyPath: '/apply/s_005',
    detailPath: '/services/s_005'
  }
]

function handleApply(service: HighFreqService) {
  router.push(service.applyPath)
}

function handleViewDetail(service: HighFreqService) {
  router.push(service.detailPath)
}

interface ConvenienceTool {
  key: string
  title: string
  desc: string
  usedCount: string
  icon: any
  gradient: string
  path: string
}

const convenienceTools: ConvenienceTool[] = [
  {
    key: 'calculator',
    title: '公积金贷款计算器',
    desc: '计算月供、还款计划、对比分析',
    usedCount: '12,856人已使用',
    icon: Calculator,
    gradient: 'from-blue-500 to-cyan-600',
    path: '/tools/calculator'
  },
  {
    key: 'venue',
    title: '场馆预约',
    desc: '图书馆博物馆体育馆预约',
    usedCount: '8,234人已使用',
    icon: Landmark,
    gradient: 'from-emerald-500 to-teal-600',
    path: '/tools/venue'
  },
  {
    key: 'policy-match',
    title: '政策匹配测试',
    desc: '智能匹配适合您的政策',
    usedCount: '5,678人已使用',
    icon: Lightbulb,
    gradient: 'from-amber-500 to-orange-600',
    path: '/tools/policy-match'
  },
  {
    key: 'violation',
    title: '违章查询',
    desc: '机动车违章记录查询处理',
    usedCount: '15,432人已使用',
    icon: Car,
    gradient: 'from-rose-500 to-pink-600',
    path: '/tools/violation'
  },
  {
    key: 'bus',
    title: '公交查询',
    desc: '实时公交到站时间查询',
    usedCount: '23,567人已使用',
    icon: Bus,
    gradient: 'from-cyan-500 to-blue-600',
    path: '/tools/bus'
  },
  {
    key: 'scenic',
    title: '景区客流',
    desc: '景区实时客流拥挤度查询',
    usedCount: '9,876人已使用',
    icon: MapPin,
    gradient: 'from-green-500 to-emerald-600',
    path: '/tools/scenic'
  }
]

function handleToolClick(tool: ConvenienceTool) {
  router.push(tool.path)
}

interface AdminEntry {
  key: string
  title: string
  stats: { label: string; value: string }[]
  todayTip: string
  icon: any
  gradient: string
  path: string
}

const adminEntries: AdminEntry[] = [
  {
    key: 'tickets',
    title: '工单分拨',
    stats: [
      { label: '待分配', value: '12' },
      { label: '处理中', value: '35' }
    ],
    todayTip: '今日新增 8 条',
    icon: ClipboardList,
    gradient: 'from-blue-500 to-indigo-600',
    path: '/admin/tickets'
  },
  {
    key: 'evaluations',
    title: '差评整改跟踪',
    stats: [
      { label: '待整改', value: '5' },
      { label: '整改中', value: '8' }
    ],
    todayTip: '本周差评 3 条待处理',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-pink-600',
    path: '/admin/evaluations'
  },
  {
    key: 'monitor',
    title: '服务健康监控',
    stats: [
      { label: '正常服务', value: '42' },
      { label: '异常服务', value: '2' }
    ],
    todayTip: '系统运行正常',
    icon: Activity,
    gradient: 'from-emerald-500 to-teal-600',
    path: '/admin/monitor'
  },
  {
    key: 'reports',
    title: '月度效能分析',
    stats: [
      { label: '办件总量', value: '3.2万' },
      { label: '满意度', value: '98.5%' }
    ],
    todayTip: '6月报告已生成',
    icon: BarChart3,
    gradient: 'from-amber-500 to-orange-600',
    path: '/admin/reports'
  }
]

function handleAdminEntry(entry: AdminEntry) {
  router.push(entry.path)
}

let noticeTimer: number | null = null

onMounted(() => {
  targetStats.forEach((target, index) => {
    setTimeout(() => animateNumber(index, target), index * 200)
  })
  noticeTimer = window.setInterval(() => {
    activeNoticeIndex.value = (activeNoticeIndex.value + 1) % notices.length
  }, 3500)
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div class="container h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gov-gradient flex items-center justify-center">
            <Building2 class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-neutral-800">抚州市政务服务门户</h1>
            <p class="text-xs text-neutral-500">Fuzhou Government Service Portal</p>
          </div>
        </div>
        <nav class="hidden md:flex items-center gap-1">
          <button class="px-4 py-2 text-sm font-medium text-gov-blue bg-gov-blue/10 rounded-lg">首页</button>
          <button class="px-4 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">办事服务</button>
          <button class="px-4 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">政务公开</button>
          <button class="px-4 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">互动交流</button>
          <button class="px-4 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">数据开放</button>
        </nav>
        <div class="flex items-center gap-3">
          <button class="p-2 text-neutral-500 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
            <Bell class="w-5 h-5" />
          </button>
          <template v-if="userStore.isLoggedIn">
            <button 
              @click="router.push('/my-applications')" 
              class="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue/10 text-gov-blue rounded-lg hover:bg-gov-blue/20 transition-colors"
            >
              <ClipboardList class="w-4 h-4" />
              <span class="text-sm font-medium">我的工作台</span>
              <span class="text-xs bg-gov-blue text-white px-1.5 py-0.5 rounded-full">{{ todoCount + doingCount }}</span>
            </button>
            <button @click="goToProfile" class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 hover:border-gov-blue hover:bg-gov-blue-50 transition-all">
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {{ userStore.userInfo?.realName?.charAt(0) || 'U' }}
              </div>
              <span class="text-sm text-neutral-700 hidden sm:inline">{{ userStore.userInfo?.realName || '用户' }}</span>
            </button>
          </template>
          <template v-else>
            <button 
              @click="router.push('/login')" 
              class="flex items-center gap-2 px-4 py-2 bg-gov-gradient text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              <LogIn class="w-4 h-4" />
              <span>登录/注册</span>
            </button>
          </template>
        </div>
      </div>
    </header>

    <section class="relative bg-hero-pattern overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>
      <div class="container relative py-16 md:py-24">
        <div class="text-center text-white max-w-3xl mx-auto animate-fade-in">
          <p class="text-blue-200 mb-3 tracking-wider">您好，欢迎来到</p>
          <h2 class="text-4xl md:text-5xl font-bold mb-4">抚州市政务服务门户</h2>
          <p class="text-lg text-blue-100 mb-10">让数据多跑路，让群众少跑腿 · 一网通办，便民利民</p>
          <div class="relative max-w-2xl mx-auto">
            <div class="absolute inset-0 bg-white/10 rounded-2xl blur-xl"></div>
            <div class="relative flex items-center bg-white rounded-2xl shadow-2xl p-1.5">
              <Search class="w-5 h-5 text-neutral-400 ml-4" />
              <input
                v-model="searchValue"
                type="text"
                placeholder="搜索服务事项、办事指南、政策文件..."
                class="flex-1 px-3 py-3 bg-transparent outline-none text-neutral-700 placeholder:text-neutral-400"
                @keyup.enter="handleSearch"
              />
              <button
                @click="handleSearch"
                class="px-8 py-3 bg-gov-gradient text-white font-medium rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                搜索
              </button>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-2 mt-5">
            <span class="text-blue-200 text-sm">热门搜索：</span>
            <div 
              v-for="tag in hotSearchTags" 
              :key="tag.keyword"
              class="flex items-center overflow-hidden rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
            >
              <button 
                class="text-sm text-white/90 hover:text-white px-3 py-1 transition-colors"
                @click="handleHotSearch(tag.keyword)"
              >
                {{ tag.keyword }}
              </button>
              <button 
                v-if="tag.quickApply"
                class="text-xs text-gov-blue bg-white/90 hover:bg-white px-2.5 py-1 ml-0.5 font-medium transition-colors"
                @click.stop="handleHotSearch(tag.keyword, true)"
              >
                快捷办理
              </button>
            </div>
          </div>
        </div>
        </div>
      </section>

    <section v-if="userStore.isLoggedIn" class="container -mt-10 relative z-20">
      <div class="card card-hover mb-6">
        <div class="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-neutral-800">
                👋 早上好，{{ userStore.userInfo?.realName || '先生' }}</h3>
              <p class="text-sm text-neutral-500">
                <span class="inline-flex items-center gap-1">
                  <ShieldCheck class="w-3.5 h-3.5 text-accent-green" />
                  已实名认证 Lv.{{ verifiedLevel }}
                </span>
              </p>
            </div>
          </div>
          <button 
            @click="router.push('/dashboard')"
            class="text-sm text-gov-blue hover:bg-gov-blue/10 px-4 py-2 rounded-lg hover:bg-gov-blue/20 transition-colors flex items-center gap-1"
          >
            我的工作台 <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div
            v-for="card in workbenchCards"
            :key="card.key"
            class="group rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-neutral-100 hover:border-blue-200"
            @click="handleWorkbenchClick(card)"
          >
            <div class="flex items-center gap-2 mb-2">
              <div :class="['w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', card.gradient]">
                <component :is="card.icon" class="w-4.5 h-4.5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors">{{ card.title }}</p>
              </div>
            </div>
            <p class="text-base font-bold text-neutral-800 mb-1">{{ card.status }}</p>
            <p v-if="card.subInfo" class="text-xs text-neutral-500">{{ card.subInfo }}</p>
            <div v-if="card.title === '我的办件'" class="flex flex-wrap gap-1 mt-2">
              <span class="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">社保证明开</span>
              <span class="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">公交卡年审</span>
            </div>
            <button
              v-if="card.quickButton"
              class="mt-2 w-full text-xs text-white rounded-lg py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-md transition-all"
              @click.stop="handleQuickButton(card.quickButton.path, $event)"
            >
              {{ card.quickButton.text }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="container relative z-10">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="(stat, index) in stats"
          :key="stat.label"
          class="stat-card card-hover animate-slide-up"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-neutral-500 mb-1">{{ stat.label }}</p>
              <p class="text-3xl font-bold" :style="{ color: stat.color }">
                {{ stat.suffix === '%' ? stat.value.toFixed(1) : stat.value.toLocaleString() }}<span class="text-lg font-medium ml-0.5">{{ stat.suffix }}</span>
              </p>
            </div>
            <div :class="['w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.bgGradient]">
              <component :is="stat.icon" class="w-6 h-6 text-white" />
            </div>
          </div>
          <div class="flex items-center gap-1 mt-3 text-xs text-neutral-500">
            <TrendingUp class="w-3.5 h-3.5 text-accent-green" />
            <span class="text-accent-green">较昨日 +12.5%</span>
          </div>
        </div>
      </div>
      </div>
      <div class="flex justify-end mt-3">
        <p class="text-xs text-neutral-400">数据更新时间：{{ dataUpdateTime }}</p>
      </div>
    </section>

    <section class="container py-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">办结率</h3>
            <span class="tag tag-success">优秀</span>
          </div>
          <v-chart class="h-44" :option="gaugeOption" autoresize />
          <div class="grid grid-cols-3 gap-2 mt-2 text-center">
            <div class="p-2 bg-neutral-50 rounded-lg">
              <p class="text-xs text-neutral-500">受理中</p>
              <p class="text-lg font-semibold text-gov-blue">328</p>
            </div>
            <div class="p-2 bg-neutral-50 rounded-lg">
              <p class="text-xs text-neutral-500">已办结</p>
              <p class="text-lg font-semibold text-accent-green">12,456</p>
            </div>
            <div class="p-2 bg-neutral-50 rounded-lg">
              <p class="text-xs text-neutral-500">超时</p>
              <p class="text-lg font-semibold text-accent-red">72</p>
            </div>
          </div>
        </div>

        <div class="card lg:col-span-1">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">近7日办件趋势</h3>
            <select class="text-sm border border-neutral-200 rounded-lg px-2 py-1 text-neutral-600 outline-none">
              <option>近7天</option>
              <option>近30天</option>
            </select>
          </div>
          <v-chart class="h-64" :option="trendOption" autoresize />
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">满意度分布</h3>
            <span class="text-sm text-neutral-500">样本 8,562</span>
          </div>
          <div class="flex items-center">
            <v-chart class="w-36 h-36 flex-shrink-0" :option="satisfactionOption" autoresize />
            <div class="flex-1 space-y-2 ml-3">
              <div v-for="item in [
                { name: '非常满意', color: 'bg-accent-green', value: '82.5%' },
                { name: '满意', color: 'bg-blue-500', value: '16.0%' },
                { name: '一般', color: 'bg-accent-yellow', value: '1.2%' },
                { name: '不满意', color: 'bg-accent-red', value: '0.3%' },
              ]" :key="item.name" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span :class="['w-2.5 h-2.5 rounded-full', item.color]"></span>
                  <span class="text-sm text-neutral-600">{{ item.name }}</span>
                </div>
                <span class="text-sm font-medium text-neutral-800">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container pb-10">
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="section-title mb-0">快捷服务入口</h3>
          <button class="text-sm text-gov-blue hover:underline flex items-center gap-1">
            全部服务 <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4">
          <button
            v-for="service in quickServices"
            :key="service.name"
            class="flex flex-col items-center gap-2 group"
            @click="handleQuickService(service.name)"
          >
            <div :class="['w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300', service.gradient]">
              <component :is="service.icon" class="w-7 h-7 text-white" />
            </div>
            <span class="text-sm text-neutral-700 group-hover:text-gov-blue font-medium transition-colors">{{ service.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="container pb-10">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Zap class="w-4 h-4 text-white" />
          </div>
          <h3 class="section-title mb-0">高频事项一键直达</h3>
        </div>
        <span class="text-sm text-neutral-500">常用事项快速办理</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="service in highFreqServices"
          :key="service.key"
          class="card card-hover group overflow-hidden relative"
        >
          <div :class="['absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity', service.gradient]"></div>
          <div class="relative">
            <div class="flex items-start gap-4 mb-4">
              <div :class="['w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md cursor-pointer', service.gradient]">
                <component :is="service.icon" class="w-7 h-7 text-white" />
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors cursor-pointer" @click="handleViewDetail(service)">
                  {{ service.title }}
                </h4>
                <p class="text-sm text-neutral-500 mt-1">{{ service.desc }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button
                class="flex-1 text-sm font-medium text-white rounded-lg py-2.5 transition-all shadow-sm hover:shadow-md"
                :class="`bg-gradient-to-r ${service.gradient}`"
                @click="handleApply(service)"
              >
                立即办理
              </button>
              <button
                class="flex-1 text-sm font-medium text-gov-blue bg-gov-blue/10 rounded-lg py-2.5 hover:bg-gov-blue/20 transition-colors"
                @click="handleViewDetail(service)"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container pb-10">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Lightbulb class="w-4 h-4 text-white" />
          </div>
          <h3 class="section-title mb-0">便民工具集</h3>
        </div>
        <span class="text-sm text-neutral-500">生活服务便民利民</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="tool in convenienceTools"
          :key="tool.key"
          class="card card-hover group cursor-pointer overflow-hidden relative"
          @click="handleToolClick(tool)"
        >
          <div :class="['absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity', tool.gradient]"></div>
          <div class="relative flex items-start gap-4">
            <div :class="['w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md', tool.gradient]">
              <component :is="tool.icon" class="w-7 h-7 text-white" />
            </div>
            <div class="flex-1">
              <h4 class="text-base font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors">
                {{ tool.title }}
              </h4>
              <p class="text-sm text-neutral-500 mt-1">{{ tool.desc }}</p>
              <div class="flex items-center justify-between mt-3">
                <span class="text-xs text-neutral-400">{{ tool.usedCount }}</span>
                <span class="text-sm text-gov-blue flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  立即使用 <ChevronRight class="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container pb-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="card lg:col-span-2">
          <div class="flex items-center justify-between mb-5">
            <h3 class="section-title mb-0">热门服务排行</h3>
            <span class="text-sm text-neutral-500 flex items-center gap-1">
              <Clock class="w-4 h-4" />
              实时更新
            </span>
          </div>
          <div class="divide-y divide-neutral-100">
            <div
              v-for="item in hotServices"
              :key="item.rank"
              class="flex items-center gap-3 py-3 hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition-colors group"
            >
              <span
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                  item.rank <= 3
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                ]"
              >
                {{ item.rank }}
              </span>
              <div class="flex-1 min-w-0 cursor-pointer" @click="handleHotService(item.name)">
                <p class="text-sm font-medium text-neutral-800 group-hover:text-gov-blue transition-colors">{{ item.name }}</p>
                <p class="text-xs text-neutral-400 mt-0.5">{{ item.dept }}</p>
              </div>
              <div class="text-right flex-shrink-0 hidden sm:block">
                <p class="text-sm font-semibold text-gov-blue">{{ item.count.toLocaleString() }}</p>
                <p class="text-xs text-neutral-400">本月办件</p>
              </div>
              <button
                v-if="item.onlineApply"
                class="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gov-blue bg-gov-blue/10 rounded-lg hover:bg-gov-blue/20 hover:text-gov-blue-dark transition-colors"
                @click.stop="handleHotServiceApply(item.serviceId, item.onlineApply)"
              >
                立即办理
              </button>
              <button
                v-else
                class="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-neutral-400 bg-neutral-100 rounded-lg cursor-not-allowed"
                disabled
              >
                仅窗口
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <h3 class="section-title mb-0">通知公告</h3>
            <button class="text-sm text-gov-blue hover:underline flex items-center gap-1">
              更多 <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          <div class="h-72 overflow-hidden relative">
            <div
              class="transition-transform duration-500"
              :style="{ transform: `translateY(-${activeNoticeIndex * 100}%)` }"
            >
              <div
                v-for="notice in notices"
                :key="notice.id"
                class="h-72 flex flex-col"
              >
                <div class="flex items-start gap-2">
                  <span
                    :class="[
                      'tag flex-shrink-0 mt-0.5',
                      notice.type === 'important' ? 'tag-danger' : 'tag-primary'
                    ]"
                  >
                    {{ notice.type === 'important' ? '重要' : '通知' }}
                  </span>
                  <p class="text-sm font-medium text-neutral-800 hover:text-gov-blue cursor-pointer transition-colors leading-relaxed flex-1">
                    {{ notice.title }}
                  </p>
                </div>
                <p class="text-xs text-neutral-400 mt-2 ml-16">{{ notice.date }}</p>
                <div class="flex-1 mt-4 p-4 bg-neutral-50 rounded-xl text-sm text-neutral-600 leading-relaxed">
                  为进一步优化政务服务，提升办事效率，根据相关规定...
                  <span class="text-gov-blue cursor-pointer hover:underline">查看详情</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-center gap-1.5 mt-4">
            <button
              v-for="(_, index) in notices"
              :key="index"
              :class="[
                'h-1.5 rounded-full transition-all',
                activeNoticeIndex === index ? 'w-6 bg-gov-blue' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
              ]"
              @click="activeNoticeIndex = index"
            />
          </div>
        </div>
      </div>
      </div>
    </section>

    <section class="container pb-16">
      <div class="flex items-center justify-between mb-6">
        <h3 class="section-title mb-0">场景化服务套餐</h3>
        <p class="text-sm text-neutral-500">一件事一次办</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="pkg in scenarioPackages"
          :key="pkg.title"
          class="card card-hover group overflow-hidden relative"
        >
          <div :class="['absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity', pkg.gradient]"></div>
          <div class="relative">
            <div class="flex items-start justify-between mb-3">
              <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md cursor-pointer', pkg.gradient]" @click="handleScenarioViewAll(pkg)">
                <component :is="pkg.icon" class="w-6 h-6 text-white" />
              </div>
            </div>
            <h4 class="text-base font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors mb-1 cursor-pointer" @click="handleScenarioViewAll(pkg)">
              {{ pkg.title }}
            </h4>
            <p class="text-xs text-neutral-500 mb-3">{{ pkg.desc }}</p>
            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                v-for="svc in pkg.services"
                :key="svc.name"
                class="text-xs px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 group-hover:bg-gov-blue/10 group-hover:text-gov-blue transition-colors"
              >
                {{ svc.name }}
              </span>
            </div>
            <div class="flex items-center gap-2 pt-3 border-t border-neutral-100">
              <button
                class="flex-1 text-xs font-medium text-gov-blue bg-gov-blue/10 rounded-lg py-2 hover:bg-gov-blue/20 transition-colors"
                @click="handleScenarioViewAll(pkg)"
              >
                查看全部服务
              </button>
              <button
                class="flex-1 text-xs font-medium text-white rounded-lg py-2 transition-all shadow-sm hover:shadow-md"
                :class="`bg-gradient-to-r ${pkg.gradient}`"
                @click="handleScenarioQuickApply(pkg)"
              >
                立即办理第一个
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="isAdminRole" class="container pb-16">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <Settings class="w-4 h-4 text-white" />
          </div>
          <h3 class="section-title mb-0">业务管理快捷入口</h3>
        </div>
        <span class="text-sm text-neutral-500">管理后台快捷访问</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div
          v-for="entry in adminEntries"
          :key="entry.key"
          class="card card-hover group cursor-pointer overflow-hidden relative"
          @click="handleAdminEntry(entry)"
        >
          <div :class="['absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity', entry.gradient]"></div>
          <div class="relative">
            <div class="flex items-start gap-4 mb-4">
              <div :class="['w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md', entry.gradient]">
                <component :is="entry.icon" class="w-7 h-7 text-white" />
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors">
                  {{ entry.title }}
                </h4>
                <div class="flex items-center gap-4 mt-2">
                  <div v-for="stat in entry.stats" :key="stat.label" class="flex items-center gap-2">
                    <span class="text-sm text-neutral-500">{{ stat.label }}</span>
                    <span class="text-lg font-bold text-neutral-800">{{ stat.value }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                  <span class="text-xs text-neutral-400">{{ entry.todayTip }}</span>
                  <span class="text-sm text-gov-blue flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    进入管理 <ChevronRight class="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="bg-white border-t border-neutral-200 py-8">
      <div class="container">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-sm text-neutral-500">
            主办单位：抚州市人民政府办公室  |  承办单位：抚州市政务服务中心
          </div>
          <div class="flex items-center gap-4 text-sm text-neutral-500">
            <span>联系电话：12345</span>
            <span>工作时间：周一至周五 9:00-17:00</span>
          </div>
        </div>
        <div class="text-center text-xs text-neutral-400 mt-4">
          © 2026 抚州市政务服务门户  赣ICP备XXXXXXXX号
        </div>
      </div>
    </footer>
  </div>
</template>