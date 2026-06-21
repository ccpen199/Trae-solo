<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import {
  Star,
  ShieldCheck,
  CreditCard,
  Heart,
  GraduationCap,
  Building2,
  Mail,
  Phone,
  MapPin,
  IdCard,
  ChevronRight,
  FileText,
  BadgeCheck,
  TrendingUp,
  Calendar,
  Circle,
  Home,
  ArrowLeft,
  Building,
  ExternalLink,
  Printer,
  FileCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { mockUserProfile } from '@/mock/data/profile'
import type { UserProfile, ScoreRecord } from '@/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('social')
const ssoLoading = ref(false)
const ssoSystemName = ref('')
const ssoDialogVisible = ref(false)
const ssoDialogTitle = ref('')
const ssoIcon = ref(Building2)

const expandedRecords = ref<string[]>([])

onMounted(() => {
  const tab = route.query.tab as string
  if (tab) {
    activeTab.value = tab
  }
})

const userProfile = ref<UserProfile>(mockUserProfile)

const userInfo = computed(() => ({
  name: userStore.userInfo?.realName || '用户',
  avatar: userStore.userInfo?.realName?.charAt(0) || 'U',
  gender: userStore.userInfo?.gender === 'male' ? '男' : '女',
  idCard: maskIdCard(userStore.userInfo?.idCard || ''),
  phone: maskPhone(userStore.userInfo?.phone || ''),
  email: userStore.userInfo?.email || '-',
  address: '江西省抚州市临川区',
  authLevel: userStore.userInfo?.verified ? 'L4 实名认证' : 'L2 基础认证',
  authLevelColor: userStore.userInfo?.verified ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500',
  memberLevel: '黄金会员',
  joinDate: '2019-03-15',
}))

function maskIdCard(idCard: string) {
  if (!idCard || idCard.length < 10) return idCard || '-'
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4)
}

function maskPhone(phone: string) {
  if (!phone || phone.length < 11) return phone || '-'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

const socialSecurity = computed(() => ({
  status: userProfile.value.socialSecurity?.status === 'normal' ? '正常缴费' : '已暂停',
  statusColor: userProfile.value.socialSecurity?.status === 'normal' ? 'text-accent-green' : 'text-neutral-500',
  totalMonths: userProfile.value.socialSecurity?.cumulativeMonths || 0,
  totalAmount: userProfile.value.socialSecurity?.pensionBalance || 0,
  base: 5800,
  personal: 464,
  company: 1160,
  insuranceNo: userProfile.value.socialSecurity?.insuranceNo || '',
  unitName: '抚州科技有限公司',
  participateDate: userProfile.value.socialSecurity?.participateDate || '',
}))

const paymentRecords = computed(() => {
  const records = userProfile.value.socialSecurity?.records || []
  return records
    .filter(r => r.type === 'pension')
    .slice(0, 6)
    .map(r => ({
      id: r.id,
      month: r.period,
      status: r.status === 'paid' ? '已缴' : '未缴',
      amount: r.personalPayment + r.companyPayment,
      company: '抚州科技有限公司',
      personal: r.personalPayment,
      companyPay: r.companyPayment,
      base: r.base,
      payTime: r.payTime,
    }))
})

const medicalInsurance = computed(() => ({
  personalBalance: userProfile.value.medicalInsurance?.personalAccountBalance || 0,
  overallBalance: userProfile.value.medicalInsurance?.overallAccountBalance || 0,
  thisYearReimburse: userProfile.value.medicalInsurance?.thisYearReimbursement || 0,
  totalReimburse: userProfile.value.medicalInsurance?.totalReimbursement || 0,
  cardNo: userProfile.value.medicalInsurance?.cardNo || '',
  insuredType: '城镇职工医疗保险',
  status: userProfile.value.medicalInsurance?.status === 'normal' ? '正常' : '已暂停',
}))

const medicalRecords = computed(() => [
  { date: '2026-06-12', hospital: '抚州市第一人民医院', type: '门诊', amount: 328.5, reimburse: 210.0, ratio: '64%' },
  { date: '2026-05-28', hospital: '临川区中医院', type: '门诊', amount: 156.0, reimburse: 98.0, ratio: '63%' },
  { date: '2026-04-15', hospital: '抚州市妇幼保健院', type: '体检', amount: 580.0, reimburse: 0, ratio: '0%' },
  { date: '2026-03-22', hospital: '抚州市第一人民医院', type: '住院', amount: 6850.0, reimburse: 4800.0, ratio: '70%' },
])

const education = computed(() => {
  const edu = userProfile.value.education
  return {
    school: edu?.currentSchool || '东华理工大学',
    college: '信息工程学院',
    major: '软件工程',
    grade: edu?.currentGrade || '硕士研究生二年级',
    className: '软件工程2班',
    studentNo: edu?.studentId || '',
    status: edu?.status === 'studying' ? '在籍在读' : '已毕业',
    statusColor: edu?.status === 'studying' ? 'text-accent-green' : 'text-neutral-500',
    enrollmentDate: edu?.enrollmentDate || '',
    expectedGraduation: edu?.expectedGraduationDate || '',
    eduLevel: '硕士研究生',
    counselor: '李老师',
    counselorPhone: '139****6666',
    studySystem: '3年制',
  }
})

const scores = computed<ScoreRecord[]>(() => userProfile.value.education?.scores || [])

const housingFund = computed(() => ({
  balance: userProfile.value.housingFund?.balance || 0,
  monthlyDeposit: userProfile.value.housingFund?.monthlyDeposit || 0,
  personalDeposit: Math.round((userProfile.value.housingFund?.monthlyDeposit || 0) / 2),
  companyDeposit: Math.round((userProfile.value.housingFund?.monthlyDeposit || 0) / 2),
  base: 7000,
  ratio: '12%',
  lastDepositDate: userProfile.value.housingFund?.lastDepositDate || '',
  status: userProfile.value.housingFund?.status === 'normal' ? '正常缴存' : '已封存',
  statusColor: userProfile.value.housingFund?.status === 'normal' ? 'text-accent-green' : 'text-neutral-500',
  unitName: userProfile.value.housingFund?.unitName || '',
  accountNo: userProfile.value.housingFund?.accountNo || '',
}))

const fundRecords = computed(() => {
  const records = userProfile.value.housingFund?.records || []
  return records
    .filter(r => r.type === 'deposit')
    .slice(0, 6)
    .map(r => ({
      month: r.period,
      date: r.time,
      amount: r.amount,
      type: r.type === 'deposit' ? '汇缴' : r.type,
      company: r.operator,
      balance: r.balance,
    }))
})

const socialChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: '#E5E7EB' } },
    axisLabel: { color: '#6B7280', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F3F4F6' } },
    axisLabel: { color: '#6B7280', fontSize: 11 },
  },
  series: [
    {
      type: 'bar',
      barWidth: '55%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#93C5FD' },
          ],
        },
      },
      data: [1580, 1580, 1600, 1600, 1624, 1624, 1624, 1624, 1624, 1624, 1624, 1624],
    },
  ],
}))

const medicalChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['医疗费用', '报销金额'], right: 0, top: 0, textStyle: { fontSize: 11, color: '#6B7280' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: '#E5E7EB' } },
    axisLabel: { color: '#6B7280', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F3F4F6' } },
    axisLabel: { color: '#6B7280', fontSize: 11 },
  },
  series: [
    {
      name: '医疗费用',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#E74C3C' },
      itemStyle: { color: '#E74C3C' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(231, 76, 60, 0.2)' },
            { offset: 1, color: 'rgba(231, 76, 60, 0.02)' },
          ],
        },
      },
      data: [680, 520, 7350, 580, 156, 328],
    },
    {
      name: '报销金额',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#2ECC71' },
      itemStyle: { color: '#2ECC71' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(46, 204, 113, 0.2)' },
            { offset: 1, color: 'rgba(46, 204, 113, 0.02)' },
          ],
        },
      },
      data: [420, 310, 5100, 0, 98, 210],
    },
  ],
}))

function toggleRecord(id: string) {
  const idx = expandedRecords.value.indexOf(id)
  if (idx > -1) {
    expandedRecords.value.splice(idx, 1)
  } else {
    expandedRecords.value.push(id)
  }
}

function isExpanded(id: string) {
  return expandedRecords.value.includes(id)
}

function goBack() {
  router.back()
}

function goToApplications() {
  router.push('/profile/applications')
}

function goToLicenses() {
  router.push('/profile/licenses')
}

function goToSocialCertPrint() {
  ElMessage.info('正在跳转到参保证明打印页面...')
}

function goToMedicalRecord() {
  ElMessage.info('正在跳转到异地就医备案页面...')
}

function goToEducationCert() {
  ElMessage.info('正在跳转到在读证明打印页面...')
}

function goToDegreeCert() {
  ElMessage.info('正在跳转到学历认证页面...')
}

function goToFundCalculator() {
  router.push('/tools/calculator')
}

function goToFundWithdraw() {
  ElMessage.info('正在跳转到公积金提取申请页面...')
}

function goToFundLoan() {
  ElMessage.info('正在跳转到公积金贷款申请页面...')
}

const ssoSystemMap: Record<string, { name: string; title: string; icon: any }> = {
  social: { name: '人社系统', title: '社保服务平台', icon: ShieldCheck },
  medical: { name: '医保系统', title: '医保服务平台', icon: Heart },
  fund: { name: '公积金系统', title: '住房公积金管理中心', icon: Building },
  education: { name: '教育学籍系统', title: '教育服务平台', icon: GraduationCap },
}

function handleSsoJump(type: string) {
  const sysInfo = ssoSystemMap[type]
  if (!sysInfo) return

  ssoSystemName.value = sysInfo.name
  ssoDialogTitle.value = sysInfo.title
  ssoIcon.value = sysInfo.icon
  ssoLoading.value = true
  ssoDialogVisible.value = true

  setTimeout(() => {
    ssoLoading.value = false
  }, 2000)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div class="container h-16 flex items-center gap-4">
        <button @click="goBack" class="p-2 -ml-2 text-neutral-500 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold text-neutral-800">个人中心</h1>
        <nav class="ml-auto flex items-center gap-1 text-sm">
          <button class="px-4 py-2 text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
            我的信息
          </button>
          <button @click="goToApplications" class="px-4 py-2 text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
            我的办件
          </button>
          <button @click="goToLicenses" class="px-4 py-2 text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
            电子证照
          </button>
          <button class="px-4 py-2 text-neutral-600 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
            消息中心
          </button>
        </nav>
      </div>
    </header>

    <div class="container py-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-4 space-y-5">
          <div class="card relative overflow-hidden">
            <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            <div class="relative flex items-start gap-4">
              <div class="relative">
                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {{ userInfo.avatar }}
                </div>
                <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center shadow-md" :class="userInfo.authLevelColor">
                  <BadgeCheck class="w-4 h-4 text-white" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-bold text-neutral-800">{{ userInfo.name }}</h2>
                  <span class="tag tag-primary">{{ userInfo.memberLevel }}</span>
                </div>
                <p class="text-sm text-neutral-500 mt-1">
                  <ShieldCheck class="w-3.5 h-3.5 inline mr-1" />
                  {{ userInfo.authLevel }}
                </p>
                <p class="text-xs text-neutral-400 mt-2">注册时间：{{ userInfo.joinDate }}</p>
              </div>
            </div>
            <div class="divider"></div>
            <div class="space-y-3">
              <div class="flex items-center gap-3 text-sm">
                <IdCard class="w-4 h-4 text-neutral-400" />
                <span class="text-neutral-500 w-16">身份证</span>
                <span class="text-neutral-700">{{ userInfo.idCard }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <Phone class="w-4 h-4 text-neutral-400" />
                <span class="text-neutral-500 w-16">手机号</span>
                <span class="text-neutral-700">{{ userInfo.phone }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <Mail class="w-4 h-4 text-neutral-400" />
                <span class="text-neutral-500 w-16">邮箱</span>
                <span class="text-neutral-700">{{ userInfo.email }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <MapPin class="w-4 h-4 text-neutral-400" />
                <span class="text-neutral-500 w-16">所在地</span>
                <span class="text-neutral-700">{{ userInfo.address }}</span>
              </div>
            </div>
            <button class="w-full mt-5 py-2.5 border border-gov-blue/20 text-gov-blue rounded-lg hover:bg-gov-blue/5 transition-colors text-sm font-medium">
              完善个人信息
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button @click="goToApplications" class="card card-hover text-center p-4">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <FileText class="w-5 h-5 text-blue-600" />
              </div>
              <p class="text-sm font-medium text-neutral-800">我的办件</p>
              <p class="text-xs text-neutral-500 mt-0.5"><span class="text-gov-blue font-semibold">8</span> 件进行中</p>
            </button>
            <button @click="goToLicenses" class="card card-hover text-center p-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <CreditCard class="w-5 h-5 text-emerald-600" />
              </div>
              <p class="text-sm font-medium text-neutral-800">电子证照</p>
              <p class="text-xs text-neutral-500 mt-0.5"><span class="text-gov-blue font-semibold">6</span> 张已授权</p>
            </button>
            <button class="card card-hover text-center p-4">
              <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <Star class="w-5 h-5 text-amber-600" />
              </div>
              <p class="text-sm font-medium text-neutral-800">我的收藏</p>
              <p class="text-xs text-neutral-500 mt-0.5"><span class="text-gov-blue font-semibold">12</span> 个服务</p>
            </button>
            <button class="card card-hover text-center p-4">
              <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mx-auto mb-2">
                <Heart class="w-5 h-5 text-rose-600" />
              </div>
              <p class="text-sm font-medium text-neutral-800">我的评价</p>
              <p class="text-xs text-neutral-500 mt-0.5"><span class="text-gov-blue font-semibold">5</span> 条已评价</p>
            </button>
          </div>
        </div>

        <div class="lg:col-span-8">
          <div class="card">
            <div class="border-b border-neutral-100 -mx-6 -mt-6 mb-5 px-6">
              <div class="flex gap-1">
                <button
                  v-for="tab in [
                    { key: 'social', label: '社保', icon: ShieldCheck },
                    { key: 'medical', label: '医保', icon: Heart },
                    { key: 'education', label: '学籍', icon: GraduationCap },
                    { key: 'fund', label: '公积金', icon: Building2 },
                  ]"
                  :key="tab.key"
                  :class="[
                    'px-5 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
                    activeTab === tab.key
                      ? 'border-gov-blue text-gov-blue'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  ]"
                  @click="activeTab = tab.key"
                >
                  <component :is="tab.icon" class="w-4 h-4" />
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <div v-show="activeTab === 'social'" class="animate-fade-in">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <p class="text-xs text-neutral-500">缴费状态</p>
                  <p class="text-lg font-bold mt-1" :class="socialSecurity.statusColor">{{ socialSecurity.status }}</p>
                </div>
                <div class="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                  <p class="text-xs text-neutral-500">累计缴费月数</p>
                  <p class="text-lg font-bold mt-1 text-neutral-800">{{ socialSecurity.totalMonths }}<span class="text-sm font-normal text-neutral-500 ml-1">个月</span></p>
                </div>
                <div class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50">
                  <p class="text-xs text-neutral-500">养老账户余额</p>
                  <p class="text-lg font-bold mt-1 text-neutral-800">¥{{ socialSecurity.totalAmount.toLocaleString() }}</p>
                </div>
                <div class="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50">
                  <p class="text-xs text-neutral-500">当前缴费基数</p>
                  <p class="text-lg font-bold mt-1 text-neutral-800">¥{{ socialSecurity.base }}</p>
                </div>
              </div>

              <div class="bg-neutral-50 rounded-xl p-5 mb-6">
                <h3 class="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                  <Building class="w-4 h-4 text-gov-blue" />
                  基本信息
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span class="text-neutral-500">参保单位</span>
                    <p class="text-neutral-800 font-medium mt-0.5">{{ socialSecurity.unitName }}</p>
                  </div>
                  <div>
                    <span class="text-neutral-500">社保编号</span>
                    <p class="text-neutral-800 font-medium mt-0.5">{{ socialSecurity.insuranceNo }}</p>
                  </div>
                  <div>
                    <span class="text-neutral-500">参保日期</span>
                    <p class="text-neutral-800 font-medium mt-0.5">{{ socialSecurity.participateDate }}</p>
                  </div>
                  <div>
                    <span class="text-neutral-500">个人月缴</span>
                    <p class="text-neutral-800 font-medium mt-0.5">¥{{ socialSecurity.personal }}</p>
                  </div>
                  <div>
                    <span class="text-neutral-500">单位月缴</span>
                    <p class="text-neutral-800 font-medium mt-0.5">¥{{ socialSecurity.company }}</p>
                  </div>
                  <div>
                    <span class="text-neutral-500">月缴合计</span>
                    <p class="text-gov-blue font-medium mt-0.5">¥{{ socialSecurity.personal + socialSecurity.company }}</p>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-neutral-700">近12个月缴费记录</h3>
                <span class="text-xs text-neutral-400 flex items-center gap-1">
                  <TrendingUp class="w-3.5 h-3.5 text-accent-green" />
                  月缴 ¥{{ socialSecurity.personal + socialSecurity.company }}
                </span>
              </div>
              <v-chart class="h-52 mb-6" :option="socialChartOption" autoresize />

              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-neutral-700">缴费明细时间轴</h3>
                <button class="text-xs text-gov-blue hover:underline">查看全部</button>
              </div>
              <div class="relative">
                <div class="absolute left-4 top-2 bottom-2 w-px bg-neutral-200"></div>
                <div class="space-y-0">
                  <div v-for="(record, index) in paymentRecords" :key="record.id" class="relative">
                    <div class="flex items-start gap-4 py-3">
                      <div :class="[
                        'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer',
                        index === 0 ? 'bg-gov-gradient shadow-md' : 'bg-white border-2 border-neutral-200'
                      ]" @click="toggleRecord(record.id)">
                        <Circle :class="['w-2.5 h-2.5', index === 0 ? 'text-white' : 'text-neutral-300']" :fill="index === 0 ? 'white' : '#D1D5DB'" />
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between cursor-pointer" @click="toggleRecord(record.id)">
                          <div class="flex items-center gap-2">
                            <Calendar class="w-4 h-4 text-neutral-400" />
                            <span class="text-sm font-medium text-neutral-800">{{ record.month }}</span>
                            <span class="tag tag-success">{{ record.status }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold text-gov-blue">+¥{{ record.amount }}</span>
                            <component :is="isExpanded(record.id) ? ChevronUp : ChevronDown" class="w-4 h-4 text-neutral-400" />
                          </div>
                        </div>
                        <p class="text-xs text-neutral-500 mt-1.5 ml-6">{{ record.company }}</p>
                        
                        <div v-if="isExpanded(record.id)" class="mt-3 ml-6 p-4 bg-white rounded-xl border border-neutral-100 animate-fade-in">
                          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span class="text-neutral-500 text-xs">缴费基数</span>
                              <p class="text-neutral-800 font-medium mt-0.5">¥{{ record.base }}</p>
                            </div>
                            <div>
                              <span class="text-neutral-500 text-xs">个人缴费</span>
                              <p class="text-neutral-800 font-medium mt-0.5">¥{{ record.personal }}</p>
                            </div>
                            <div>
                              <span class="text-neutral-500 text-xs">单位缴费</span>
                              <p class="text-neutral-800 font-medium mt-0.5">¥{{ record.companyPay }}</p>
                            </div>
                            <div>
                              <span class="text-neutral-500 text-xs">到账时间</span>
                              <p class="text-neutral-800 font-medium mt-0.5">{{ record.payTime?.slice(5, 10) }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex items-center gap-3">
                <button @click="goToSocialCertPrint" class="btn-primary flex items-center gap-2">
                  <Printer class="w-4 h-4" />
                  打印参保证明
                </button>
                <button @click="handleSsoJump('social')" class="btn-secondary flex items-center gap-2">
                  <ExternalLink class="w-4 h-4" />
                  进入社保系统
                </button>
              </div>
            </div>

            <div v-show="activeTab === 'medical'" class="animate-fade-in">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="p-5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                  <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                  <p class="text-sm text-emerald-100">医保账户余额</p>
                  <p class="text-3xl font-bold mt-2">¥{{ medicalInsurance.personalBalance.toLocaleString() }}</p>
                  <p class="text-xs text-emerald-200 mt-2">卡号：{{ medicalInsurance.cardNo.slice(0, 4) }}****{{ medicalInsurance.cardNo.slice(-4) }}</p>
                </div>
                <div class="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <p class="text-xs text-neutral-500">参保类型</p>
                  <p class="text-base font-semibold mt-1 text-neutral-800">{{ medicalInsurance.insuredType }}</p>
                  <div class="divider !my-3"></div>
                  <p class="text-xs text-neutral-500">本年度已报销</p>
                  <p class="text-base font-semibold mt-1 text-accent-green">¥{{ medicalInsurance.thisYearReimburse.toLocaleString() }}</p>
                </div>
                <div class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50">
                  <p class="text-xs text-neutral-500">累计报销金额</p>
                  <p class="text-base font-semibold mt-1 text-neutral-800">¥{{ medicalInsurance.totalReimburse.toLocaleString() }}</p>
                  <div class="divider !my-3"></div>
                  <p class="text-xs text-neutral-500">统筹基金</p>
                  <p class="text-base font-semibold mt-1 text-gov-blue">¥{{ medicalInsurance.overallBalance.toLocaleString() }}</p>
                </div>
              </div>

              <h3 class="text-sm font-semibold text-neutral-700 mb-3">近6个月报销趋势</h3>
              <v-chart class="h-52 mb-6" :option="medicalChartOption" autoresize />

              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-neutral-700">最近报销记录</h3>
                <button class="text-xs text-gov-blue hover:underline">查看全部</button>
              </div>
              <div class="overflow-hidden rounded-xl border border-neutral-100">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-neutral-50 text-neutral-500 text-xs">
                      <th class="text-left px-4 py-3 font-medium">日期</th>
                      <th class="text-left px-4 py-3 font-medium">医院</th>
                      <th class="text-left px-4 py-3 font-medium">类型</th>
                      <th class="text-right px-4 py-3 font-medium">费用(元)</th>
                      <th class="text-right px-4 py-3 font-medium">报销(元)</th>
                      <th class="text-right px-4 py-3 font-medium">报销比例</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="record in medicalRecords" :key="record.date" class="border-t border-neutral-50 hover:bg-neutral-50/50">
                      <td class="px-4 py-3 text-neutral-700">{{ record.date }}</td>
                      <td class="px-4 py-3 text-neutral-700">{{ record.hospital }}</td>
                      <td class="px-4 py-3">
                        <span class="tag tag-primary">{{ record.type }}</span>
                      </td>
                      <td class="px-4 py-3 text-right text-neutral-800 font-medium">{{ record.amount.toFixed(2) }}</td>
                      <td class="px-4 py-3 text-right text-accent-green font-medium">{{ record.reimburse.toFixed(2) }}</td>
                      <td class="px-4 py-3 text-right text-gov-blue font-medium">{{ record.ratio }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-6 flex items-center gap-3">
                <button @click="goToMedicalRecord" class="btn-primary flex items-center gap-2">
                  <FileCheck class="w-4 h-4" />
                  异地就医备案
                </button>
                <button @click="handleSsoJump('medical')" class="btn-secondary flex items-center gap-2">
                  <ExternalLink class="w-4 h-4" />
                  进入医保系统
                </button>
              </div>
            </div>

            <div v-show="activeTab === 'education'" class="animate-fade-in">
              <div class="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden mb-6">
                <div class="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
                <div class="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full"></div>
                <div class="relative flex items-center gap-5">
                  <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <GraduationCap class="w-9 h-9 text-white" />
                  </div>
                  <div class="flex-1">
                    <h3 class="text-xl font-bold">{{ education.school }}</h3>
                    <p class="text-purple-100 mt-1">{{ education.college }} · {{ education.major }}</p>
                    <div class="flex items-center gap-3 mt-2">
                      <span class="text-xs px-2.5 py-1 bg-white/20 rounded-full">{{ education.grade }}</span>
                      <span class="text-xs px-2.5 py-1 bg-white/20 rounded-full">{{ education.eduLevel }}</span>
                      <span class="text-xs px-2.5 py-1 bg-white/20 rounded-full">{{ education.studySystem }}</span>
                      <span :class="['text-xs px-2.5 py-1 rounded-full', education.statusColor === 'text-accent-green' ? 'bg-emerald-400/30' : 'bg-white/20']">{{ education.status }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="card !p-5">
                  <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <IdCard class="w-4 h-4 text-violet-600" />
                    </div>
                    <h4 class="font-semibold text-neutral-800">基本信息</h4>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between py-2 border-b border-neutral-50">
                      <span class="text-neutral-500">学号</span>
                      <span class="text-neutral-800 font-medium">{{ education.studentNo }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-50">
                      <span class="text-neutral-500">班级</span>
                      <span class="text-neutral-800 font-medium">{{ education.className }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-50">
                      <span class="text-neutral-500">专业</span>
                      <span class="text-neutral-800 font-medium">{{ education.major }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-neutral-500">学籍状态</span>
                      <span :class="['font-medium', education.statusColor]">{{ education.status }}</span>
                    </div>
                  </div>
                </div>

                <div class="card !p-5">
                  <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar class="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 class="font-semibold text-neutral-800">入学信息</h4>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between py-2 border-b border-neutral-50">
                      <span class="text-neutral-500">入学日期</span>
                      <span class="text-neutral-800 font-medium">{{ education.enrollmentDate }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-50">
                      <span class="text-neutral-500">预计毕业</span>
                      <span class="text-neutral-800 font-medium">{{ education.expectedGraduation }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-50">
                      <span class="text-neutral-500">辅导员</span>
                      <span class="text-neutral-800 font-medium">{{ education.counselor }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-neutral-500">联系电话</span>
                      <span class="text-neutral-800 font-medium">{{ education.counselorPhone }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <FileText class="w-4 h-4 text-gov-blue" />
                    成绩单
                  </h3>
                  <span class="text-xs text-neutral-400">最近 5 条记录</span>
                </div>
                <div class="overflow-hidden rounded-xl border border-neutral-100">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-neutral-50 text-neutral-500 text-xs">
                        <th class="text-left px-4 py-3 font-medium">学年学期</th>
                        <th class="text-left px-4 py-3 font-medium">课程</th>
                        <th class="text-right px-4 py-3 font-medium">成绩</th>
                        <th class="text-center px-4 py-3 font-medium">等级</th>
                        <th class="text-right px-4 py-3 font-medium">班级排名</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="score in scores" :key="score.id" class="border-t border-neutral-50 hover:bg-neutral-50/50">
                        <td class="px-4 py-3 text-neutral-700">{{ score.semester }}</td>
                        <td class="px-4 py-3 text-neutral-800 font-medium">{{ score.subject }}</td>
                        <td class="px-4 py-3 text-right text-neutral-800 font-semibold">{{ score.score }}</td>
                        <td class="px-4 py-3 text-center">
                          <span :class="[
                            'tag',
                            score.level === 'excellent' ? 'tag-success' :
                            score.level === 'good' ? 'tag-primary' :
                            score.level === 'pass' ? 'tag-warning' : 'tag-danger'
                          ]">
                            {{ score.level === 'excellent' ? '优秀' : score.level === 'good' ? '良好' : score.level === 'pass' ? '及格' : '不及格' }}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right text-neutral-600">{{ score.classRank }} / 30</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button @click="goToEducationCert" class="card card-hover !p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText class="w-5 h-5 text-blue-600" />
                  </div>
                  <div class="text-left flex-1">
                    <p class="text-sm font-medium text-neutral-800">在读证明</p>
                    <p class="text-xs text-neutral-500">在线申请开具</p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-neutral-300" />
                </button>
                <button @click="goToDegreeCert" class="card card-hover !p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileCheck class="w-5 h-5 text-emerald-600" />
                  </div>
                  <div class="text-left flex-1">
                    <p class="text-sm font-medium text-neutral-800">学历认证</p>
                    <p class="text-xs text-neutral-500">学籍学历验证</p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-neutral-300" />
                </button>
                <button @click="handleSsoJump('education')" class="card card-hover !p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink class="w-5 h-5 text-amber-600" />
                  </div>
                  <div class="text-left flex-1">
                    <p class="text-sm font-medium text-neutral-800">进入学籍系统</p>
                    <p class="text-xs text-neutral-500">SSO 单点登录</p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-neutral-300" />
                </button>
              </div>
            </div>

            <div v-show="activeTab === 'fund'" class="animate-fade-in">
              <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden mb-6">
                <div class="absolute -top-16 -right-8 w-56 h-56 bg-white/10 rounded-full"></div>
                <div class="absolute bottom-0 right-24 w-24 h-24 bg-white/5 rounded-full"></div>
                <div class="relative">
                  <p class="text-sm text-amber-100">公积金账户余额</p>
                  <p class="text-4xl font-bold mt-2">¥{{ housingFund.balance.toLocaleString() }}</p>
                  <div class="flex items-center gap-6 mt-4">
                    <div>
                      <p class="text-xs text-amber-200">月缴存额</p>
                      <p class="text-lg font-semibold mt-0.5">¥{{ housingFund.monthlyDeposit }}</p>
                    </div>
                    <div class="w-px h-8 bg-white/20"></div>
                    <div>
                      <p class="text-xs text-amber-200">缴存状态</p>
                      <p class="text-lg font-semibold mt-0.5">{{ housingFund.status }}</p>
                    </div>
                    <div class="w-px h-8 bg-white/20"></div>
                    <div>
                      <p class="text-xs text-amber-200">缴存比例</p>
                      <p class="text-lg font-semibold mt-0.5">{{ housingFund.ratio }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="p-4 rounded-xl bg-amber-50">
                  <p class="text-xs text-neutral-500">个人月缴</p>
                  <p class="text-lg font-bold mt-1 text-amber-600">¥{{ housingFund.personalDeposit }}</p>
                </div>
                <div class="p-4 rounded-xl bg-orange-50">
                  <p class="text-xs text-neutral-500">单位月缴</p>
                  <p class="text-lg font-bold mt-1 text-orange-600">¥{{ housingFund.companyDeposit }}</p>
                </div>
                <div class="p-4 rounded-xl bg-blue-50">
                  <p class="text-xs text-neutral-500">缴存基数</p>
                  <p class="text-lg font-bold mt-1 text-blue-600">¥{{ housingFund.base }}</p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50">
                  <p class="text-xs text-neutral-500">最近缴存</p>
                  <p class="text-lg font-bold mt-1 text-emerald-600">{{ housingFund.lastDepositDate?.slice(5) }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-neutral-700">近6个月缴存记录</h3>
                <button class="text-xs text-gov-blue hover:underline">查看全部</button>
              </div>
              <div class="overflow-hidden rounded-xl border border-neutral-100 mb-6">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-neutral-50 text-neutral-500 text-xs">
                      <th class="text-left px-4 py-3 font-medium">月份</th>
                      <th class="text-left px-4 py-3 font-medium">到账日期</th>
                      <th class="text-left px-4 py-3 font-medium">类型</th>
                      <th class="text-left px-4 py-3 font-medium">缴存单位</th>
                      <th class="text-right px-4 py-3 font-medium">金额(元)</th>
                      <th class="text-right px-4 py-3 font-medium">余额(元)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="record in fundRecords" :key="record.month" class="border-t border-neutral-50 hover:bg-neutral-50/50">
                      <td class="px-4 py-3 text-neutral-800 font-medium">{{ record.month }}</td>
                      <td class="px-4 py-3 text-neutral-600">{{ record.date?.slice(0, 10) }}</td>
                      <td class="px-4 py-3">
                        <span class="tag tag-success">{{ record.type }}</span>
                      </td>
                      <td class="px-4 py-3 text-neutral-600">{{ record.company }}</td>
                      <td class="px-4 py-3 text-right text-accent-green font-semibold">+{{ record.amount }}</td>
                      <td class="px-4 py-3 text-right text-neutral-700">{{ record.balance.toLocaleString() }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button @click="goToFundWithdraw" class="card card-hover !p-4 text-center">
                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <Download class="w-5 h-5 text-blue-600" />
                  </div>
                  <p class="text-sm font-medium text-neutral-800">提取申请</p>
                </button>
                <button @click="goToFundLoan" class="card card-hover !p-4 text-center">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <FileText class="w-5 h-5 text-emerald-600" />
                  </div>
                  <p class="text-sm font-medium text-neutral-800">贷款申请</p>
                </button>
                <button @click="goToFundCalculator" class="card card-hover !p-4 text-center">
                  <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
                    <Calculator class="w-5 h-5 text-amber-600" />
                  </div>
                  <p class="text-sm font-medium text-neutral-800">贷款计算器</p>
                </button>
                <button @click="handleSsoJump('fund')" class="card card-hover !p-4 text-center">
                  <div class="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-2">
                    <ExternalLink class="w-5 h-5 text-violet-600" />
                  </div>
                  <p class="text-sm font-medium text-neutral-800">进入系统</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="ssoDialogVisible"
      :title="ssoDialogTitle"
      width="480px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="py-8 text-center">
        <div v-if="ssoLoading" class="mb-6">
          <div class="w-20 h-20 mx-auto mb-4 relative">
            <div class="absolute inset-0 rounded-full border-4 border-gov-blue/20"></div>
            <div class="absolute inset-0 rounded-full border-4 border-gov-blue border-t-transparent animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <component :is="ssoIcon" class="w-8 h-8 text-gov-blue" />
            </div>
          </div>
          <p class="text-lg font-medium text-neutral-800 mb-2">正在跳转至{{ ssoSystemName }}...</p>
          <p class="text-sm text-neutral-500">正在为您建立安全连接，请稍候</p>
        </div>
        <div v-else class="mb-6">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <FileCheck class="w-10 h-10 text-green-500" />
          </div>
          <p class="text-lg font-medium text-neutral-800 mb-2">跳转成功</p>
          <p class="text-sm text-neutral-500">您已成功登录{{ ssoSystemName }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-center gap-3">
          <el-button v-if="!ssoLoading" @click="ssoDialogVisible = false">
            我知道了
          </el-button>
          <el-button v-if="!ssoLoading" type="primary">
            前往系统
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
