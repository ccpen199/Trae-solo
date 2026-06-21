<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'
import {
  Sparkles,
  User,
  GraduationCap,
  Briefcase,
  Wallet,
  Shield,
  Home,
  HeartHandshake,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  TrendingUp,
  Star,
  History,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { mockPolicies } from '@/mock/data/policies'
import type { Policy } from '@/types'
import { ElMessage } from 'element-plus'
import { storage } from '@/utils/storage'

const router = useRouter()
const matched = ref(false)
const matching = ref(false)
const expandedPolicyId = ref<string | null>(null)

const profileForm = reactive({
  ageRange: '25-35',
  education: 'bachelor',
  occupation: '企业员工',
  marital: 'single',
  household: 'local',
  incomeRange: '5000-10000',
  housing: 'rental',
  socialSecurity: 'normal',
  specialTags: [] as string[],
})

const ageRangeOptions = [
  { value: '16-25', label: '16-25岁' },
  { value: '25-35', label: '25-35岁' },
  { value: '35-45', label: '35-45岁' },
  { value: '45-55', label: '45-55岁' },
  { value: '55-65', label: '55-65岁' },
  { value: '65+', label: '65岁以上' },
]

const educationOptions = [
  { value: 'junior', label: '初中及以下' },
  { value: 'senior', label: '高中/中专' },
  { value: 'college', label: '大专' },
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
]

const occupationOptions = [
  { value: '企业员工', label: '企业员工' },
  { value: '公务员', label: '公务员/事业单位' },
  { value: '个体工商户', label: '个体工商户' },
  { value: '自由职业', label: '自由职业' },
  { value: '学生', label: '学生' },
  { value: '退休', label: '退休人员' },
  { value: '失业', label: '失业人员' },
]

const maritalOptions = [
  { value: 'single', label: '未婚' },
  { value: 'married', label: '已婚' },
  { value: 'divorced', label: '离异' },
  { value: 'widowed', label: '丧偶' },
]

const householdOptions = [
  { value: 'local', label: '本地户籍' },
  { value: 'migrant', label: '外地户籍' },
  { value: 'collective', label: '集体户口' },
]

const incomeRangeOptions = [
  { value: '3000以下', label: '3000元以下' },
  { value: '3000-5000', label: '3000-5000元' },
  { value: '5000-10000', label: '5000-10000元' },
  { value: '10000-20000', label: '10000-20000元' },
  { value: '20000以上', label: '20000元以上' },
]

const socialSecurityOptions = [
  { value: 'normal', label: '正常缴纳' },
  { value: 'suspended', label: '断缴' },
  { value: 'none', label: '未缴纳' },
]

const housingOptions = [
  { value: 'owned', label: '自有住房' },
  { value: 'rental', label: '租房' },
  { value: 'mortgage', label: '贷款购房' },
  { value: 'family', label: '与家人同住' },
  { value: 'none', label: '无房' },
]

const specialTagOptions = [
  { value: 'veteran', label: '退役军人', icon: 'medal' },
  { value: 'disabled', label: '残疾人', icon: 'accessibility' },
  { value: 'high_level_talent', label: '高层次人才', icon: 'award' },
  { value: 'fresh_grad', label: '应届毕业生', icon: 'graduation' },
  { value: 'low_income', label: '低保户', icon: 'heart' },
]

interface MatchedPolicy {
  policy: Policy
  matchScore: number
  matchReasons: string[]
  unmatchReasons: string[]
}

const matchedPolicies = ref<MatchedPolicy[]>([])
const favoritePolicies = ref<string[]>([])
const matchHistory = ref<Array<{ id: string; time: string; score: number; count: number; profile: typeof profileForm }>>([])

function getAgeMin(range: string): number {
  if (range === '65+') return 65
  return parseInt(range.split('-')[0])
}

function getAgeMax(range: string): number {
  if (range === '65+') return 100
  return parseInt(range.split('-')[1])
}

function getIncomeMin(range: string): number {
  if (range === '3000以下') return 0
  if (range === '20000以上') return 20000
  return parseInt(range.split('-')[0])
}

function calculateMatch(policy: Policy): MatchedPolicy {
  let score = 0
  const matchReasons: string[] = []
  const unmatchReasons: string[] = []

  if (profileForm.socialSecurity === 'normal') {
    if (policy.tags.some((t) => ['职工医保', '门诊共济', '医保报销', '养老保险', '参保缴费'].includes(t))) {
      score += 20
      matchReasons.push('您正常缴纳社保，符合社保类政策条件')
    }
  } else {
    if (policy.tags.some((t) => ['职工医保', '养老保险'].includes(t))) {
      unmatchReasons.push('社保缴纳状态可能影响该政策享受')
    }
  }

  if (profileForm.housing === 'rental' || profileForm.housing === 'none') {
    if (policy.tags.some((t) => ['公积金提取', '租房提取'].includes(t))) {
      score += 25
      matchReasons.push('您目前租房，可申请公积金租房提取')
    }
  } else if (profileForm.housing === 'mortgage') {
    if (policy.tags.some((t) => ['公积金提取', '还贷提取'].includes(t))) {
      score += 25
      matchReasons.push('您有住房贷款，可申请公积金还贷提取')
    }
  } else if (profileForm.housing === 'owned') {
    if (policy.tags.includes('租房提取')) {
      unmatchReasons.push('您已有自有住房，不符合租房提取条件')
    }
  }

  if (profileForm.occupation === '学生') {
    if (policy.tags.some((t) => ['义务教育', '入学报名', '招生政策'].includes(t))) {
      score += 25
      matchReasons.push('您是学生身份，符合教育类政策条件')
    }
  }

  if (profileForm.occupation === '个体工商户') {
    if (policy.tags.some((t) => ['个体工商户', '注册登记'].includes(t))) {
      score += 30
      matchReasons.push('您是个体工商户，可享受相关扶持政策')
    }
  }

  if (profileForm.occupation === '退休') {
    if (policy.tags.some((t) => ['养老金认证', '养老补贴', '高龄津贴'].includes(t))) {
      score += 25
      matchReasons.push('您已退休，可享受养老相关政策')
    }
  }

  const ageMin = getAgeMin(profileForm.ageRange)
  const ageMax = getAgeMax(profileForm.ageRange)
  if (ageMin >= 60 && policy.tags.some((t) => ['高龄津贴', '养老补贴'].includes(t))) {
    score += 15
    matchReasons.push('您的年龄符合高龄补贴条件')
  }
  if (ageMax < 16 && policy.tags.includes('养老保险')) {
    unmatchReasons.push('年龄未满16岁，暂不符合参保条件')
  }

  const incomeMin = getIncomeMin(profileForm.incomeRange)
  if (incomeMin < 5000) {
    if (policy.category === '社会保障') {
      score += 10
      matchReasons.push('收入水平符合部分保障类政策条件')
    }
  }

  if (profileForm.specialTags.includes('veteran')) {
    if (policy.category === '社会保障') {
      score += 15
      matchReasons.push('退役军人可享受优先优惠政策')
    }
  }

  if (profileForm.specialTags.includes('disabled')) {
    if (policy.category === '社会保障') {
      score += 15
      matchReasons.push('残疾人可享受相关扶助政策')
    }
  }

  if (profileForm.specialTags.includes('fresh_grad')) {
    if (policy.tags.some((t) => ['就业', '创业'].includes(t))) {
      score += 20
      matchReasons.push('应届毕业生可享受就业创业扶持政策')
    }
  }

  if (profileForm.specialTags.includes('low_income')) {
    if (policy.category === '社会保障') {
      score += 20
      matchReasons.push('低保户可享受最低生活保障政策')
    }
  }

  if (profileForm.household === 'local') {
    if (policy.tags.includes('城乡居民')) {
      score += 10
      matchReasons.push('本地户籍可参加城乡居民保险')
    }
  }

  if (profileForm.education === 'phd' || profileForm.education === 'master') {
    if (profileForm.specialTags.includes('high_level_talent')) {
      score += 15
      matchReasons.push('高学历人才可享受人才引进政策')
    }
  }

  if (policy.status === 'effective') {
    score += 10
    matchReasons.push('政策当前有效')
  } else if (policy.status === 'expired') {
    unmatchReasons.push('该政策已过期')
    score = Math.max(score - 20, 0)
  } else if (policy.status === 'draft') {
    unmatchReasons.push('该政策处于征求意见阶段')
    score = Math.max(score - 10, 0)
  }

  score = Math.min(score, 98)
  if (matchReasons.length === 0) {
    matchReasons.push('政策类别与您的情况有一定关联')
    score = Math.max(score, 35)
  }

  while (unmatchReasons.length < 2 && matchReasons.length > 3) {
    unmatchReasons.push('建议详细了解政策具体要求')
  }

  return {
    policy,
    matchScore: Math.round(score),
    matchReasons: matchReasons.slice(0, 3),
    unmatchReasons: unmatchReasons.slice(0, 2),
  }
}

function startMatch() {
  matching.value = true
  setTimeout(() => {
    matchedPolicies.value = mockPolicies.map(calculateMatch).sort((a, b) => b.matchScore - a.matchScore)
    matched.value = true
    matching.value = false

    const historyEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleString('zh-CN'),
      score: overallScore.value,
      count: matchedPolicies.value.length,
      profile: { ...profileForm, specialTags: [...profileForm.specialTags] },
    }
    const history = storage.get('policy_match_history', []) as typeof matchHistory.value
    history.unshift(historyEntry)
    const newHistory = history.slice(0, 10)
    storage.set('policy_match_history', newHistory)
    matchHistory.value = newHistory

    ElMessage.success('匹配完成！为您找到 ' + matchedPolicies.value.length + ' 条相关政策')
  }, 1200)
}

function resetForm() {
  matched.value = false
  matchedPolicies.value = []
  expandedPolicyId.value = null
}

const overallScore = computed(() => {
  if (matchedPolicies.value.length === 0) return 0
  const total = matchedPolicies.value.reduce((s, p) => s + p.matchScore, 0)
  return Math.round(total / matchedPolicies.value.length)
})

const scoreGaugeOption = computed<EChartsOption>(() => ({
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
            { offset: 1, color: '#1E5AA8' },
          ],
        },
      },
      progress: { show: true, width: 20 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 20, color: [[1, '#E5E7EB']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '10%'],
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1E5AA8',
        formatter: '{value}%',
      },
      data: [{ value: overallScore.value }],
    },
  ],
}))

const categoryChartOption = computed<EChartsOption>(() => {
  const categoryMap = new Map<string, number>()
  matchedPolicies.value.forEach((p) => {
    const cat = p.policy.category
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  })
  const categories = Array.from(categoryMap.keys())
  const counts = categories.map((c) => categoryMap.get(c) || 0)

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E5E7EB',
      textStyle: { color: '#374151' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
      axisLabel: { color: '#6B7280' },
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#2B7CD3' },
              { offset: 1, color: '#1E5AA8' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: 36,
      },
    ],
  }
})

function getScoreColor(score: number) {
  if (score >= 80) return 'text-accent-green'
  if (score >= 60) return 'text-gov-blue'
  if (score >= 40) return 'text-accent-yellow'
  return 'text-neutral-500'
}

function getScoreBgColor(score: number) {
  if (score >= 80) return 'bg-accent-green/10'
  if (score >= 60) return 'bg-gov-blue/10'
  if (score >= 40) return 'bg-accent-yellow/10'
  return 'bg-neutral-100'
}

function toggleFavorite(policyId: string) {
  const index = favoritePolicies.value.indexOf(policyId)
  if (index > -1) {
    favoritePolicies.value.splice(index, 1)
    ElMessage.info('已取消收藏')
  } else {
    favoritePolicies.value.push(policyId)
    ElMessage.success('收藏成功')
  }
  storage.set('favorite_policies', favoritePolicies.value)
}

function isFavorite(policyId: string) {
  return favoritePolicies.value.includes(policyId)
}

function toggleExpand(policyId: string) {
  expandedPolicyId.value = expandedPolicyId.value === policyId ? null : policyId
}

function loadHistory() {
  matchHistory.value = storage.get('policy_match_history', []) as typeof matchHistory.value
  favoritePolicies.value = storage.get('favorite_policies', []) as string[]
}

function useHistoryProfile(profile: typeof profileForm) {
  Object.assign(profileForm, profile)
  profileForm.specialTags = [...profile.specialTags]
  matched.value = false
  matchedPolicies.value = []
  ElMessage.success('已加载历史条件')
}

function goBack() {
  router.push('/tools')
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="container py-8">
    <button @click="goBack" class="flex items-center gap-2 text-neutral-500 hover:text-gov-blue mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4" />
      <span>返回工具列表</span>
    </button>

    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-800">政策智能匹配</h1>
      </div>
      <p class="text-neutral-500 ml-13">填写个人信息，智能匹配适合您的政策</p>
    </div>

    <div v-if="!matched" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 space-y-6">
        <div class="card">
          <h3 class="section-title flex items-center gap-2">
            <User class="w-4 h-4 text-gov-blue" />
            基本信息
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">年龄区间</label>
              <el-select v-model="profileForm.ageRange" class="w-full" placeholder="请选择">
                <el-option v-for="opt in ageRangeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                <GraduationCap class="w-4 h-4 inline mr-1" />
                学历
              </label>
              <el-select v-model="profileForm.education" class="w-full">
                <el-option v-for="opt in educationOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                <Briefcase class="w-4 h-4 inline mr-1" />
                职业
              </label>
              <el-select v-model="profileForm.occupation" class="w-full">
                <el-option v-for="opt in occupationOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                <HeartHandshake class="w-4 h-4 inline mr-1" />
                婚姻状况
              </label>
              <el-select v-model="profileForm.marital" class="w-full">
                <el-option v-for="opt in maritalOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                <MapPin class="w-4 h-4 inline mr-1" />
                户籍状态
              </label>
              <el-select v-model="profileForm.household" class="w-full">
                <el-option v-for="opt in householdOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title flex items-center gap-2">
            <Wallet class="w-4 h-4 text-gov-blue" />
            经济状况
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">月收入区间</label>
              <el-select v-model="profileForm.incomeRange" class="w-full">
                <el-option v-for="opt in incomeRangeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                <Home class="w-4 h-4 inline mr-1" />
                住房情况
              </label>
              <el-select v-model="profileForm.housing" class="w-full">
                <el-option v-for="opt in housingOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                <Shield class="w-4 h-4 inline mr-1" />
                社保状态
              </label>
              <el-select v-model="profileForm.socialSecurity" class="w-full">
                <el-option v-for="opt in socialSecurityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title flex items-center gap-2">
            <Tag class="w-4 h-4 text-gov-blue" />
            特殊标签
            <span class="text-xs text-neutral-400 font-normal ml-2">（可多选，符合条件可享受更多政策）</span>
          </h3>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="tag in specialTagOptions"
              :key="tag.value"
              @click="() => {
                const idx = profileForm.specialTags.indexOf(tag.value)
                if (idx > -1) profileForm.specialTags.splice(idx, 1)
                else profileForm.specialTags.push(tag.value)
              }"
              :class="[
                'px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2',
                profileForm.specialTags.includes(tag.value)
                  ? 'border-gov-blue bg-gov-blue/5 text-gov-blue'
                  : 'border-neutral-200 hover:border-gov-blue/50 text-neutral-600',
              ]"
            >
              <Star v-if="profileForm.specialTags.includes(tag.value)" class="w-4 h-4" />
              <span>{{ tag.label }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-3">
          <button @click="startMatch" :disabled="matching" class="btn-primary flex items-center gap-2 min-w-48 text-base py-3">
            <Sparkles v-if="!matching" class="w-5 h-5" />
            <Search v-else class="w-5 h-5 animate-spin" />
            {{ matching ? '智能匹配中...' : '开始智能匹配' }}
          </button>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <h3 class="section-title flex items-center gap-2 text-sm">
            <History class="w-4 h-4 text-gov-blue" />
            匹配历史
          </h3>
          <div v-if="matchHistory.length === 0" class="text-center py-8 text-neutral-400 text-sm">
            暂无匹配记录
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in matchHistory.slice(0, 5)"
              :key="item.id"
              @click="useHistoryProfile(item.profile)"
              class="p-3 rounded-lg bg-neutral-50 hover:bg-gov-blue/5 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-neutral-700">{{ item.count }} 条政策</span>
                <span :class="['text-sm font-bold', getScoreColor(item.score)]">{{ item.score }}%</span>
              </div>
              <div class="text-xs text-neutral-400">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="card">
          <div class="text-center">
            <h3 class="section-title justify-center mb-4">整体匹配度</h3>
            <v-chart class="h-40" :option="scoreGaugeOption" autoresize />
            <div class="flex items-center justify-center gap-1 text-sm text-neutral-500 mt-2">
              <TrendingUp class="w-4 h-4 text-accent-green" />
              <span>共匹配到 <strong class="text-gov-blue">{{ matchedPolicies.length }}</strong> 条政策</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 card">
          <h3 class="section-title">匹配政策分类</h3>
          <v-chart class="h-56" :option="categoryChartOption" autoresize />
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-5">
          <h3 class="section-title mb-0">匹配结果</h3>
          <button @click="resetForm" class="text-sm text-gov-blue hover:underline flex items-center gap-1">
            <ArrowLeft class="w-4 h-4" />
            重新测试
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in matchedPolicies"
            :key="item.policy.id"
            class="border border-neutral-100 rounded-xl hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all overflow-hidden"
          >
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="tag tag-primary">{{ item.policy.category }}</span>
                    <span v-if="item.policy.status === 'draft'" class="tag bg-amber-100 text-amber-600">征求意见</span>
                    <span v-else-if="item.policy.status === 'expired'" class="tag bg-neutral-100 text-neutral-500">已过期</span>
                    <span class="text-xs text-neutral-400 flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ item.policy.issueDate }}
                    </span>
                  </div>
                  <h4 class="text-base font-semibold text-neutral-800 mb-1.5">{{ item.policy.title }}</h4>
                  <p class="text-sm text-neutral-500 text-ellipsis-2">{{ item.policy.summary }}</p>
                </div>
                <div class="text-center ml-4 flex-shrink-0">
                  <div :class="['w-16 h-16 rounded-full flex items-center justify-center', getScoreBgColor(item.matchScore)]">
                    <p :class="['text-xl font-bold', getScoreColor(item.matchScore)]">
                      {{ item.matchScore }}%
                    </p>
                  </div>
                  <p class="text-xs text-neutral-400 mt-1">匹配度</p>
                </div>
              </div>

              <div class="mb-3">
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="reason in item.matchReasons"
                    :key="'m-' + reason"
                    class="text-xs px-2.5 py-1 bg-accent-green/10 text-accent-green rounded-md flex items-center gap-1"
                  >
                    <CheckCircle class="w-3 h-3" />
                    {{ reason }}
                  </span>
                </div>
                <div v-if="item.unmatchReasons.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="reason in item.unmatchReasons"
                    :key="'u-' + reason"
                    class="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-500 rounded-md flex items-center gap-1"
                  >
                    <XCircle class="w-3 h-3" />
                    {{ reason }}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5 mb-3">
                <span v-for="tag in item.policy.tags.slice(0, 5)" :key="tag" class="text-xs px-2 py-0.5 bg-gov-blue/5 text-gov-blue rounded">
                  #{{ tag }}
                </span>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div class="flex items-center gap-3">
                  <Building2 class="w-4 h-4 text-neutral-400" />
                  <span class="text-sm text-neutral-500">{{ item.policy.departmentName }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click.stop="toggleFavorite(item.policy.id)"
                    :class="[
                      'text-sm transition-colors flex items-center gap-1 p-1.5 rounded-lg',
                      isFavorite(item.policy.id) ? 'text-amber-500 bg-amber-50' : 'text-neutral-400 hover:text-amber-500',
                    ]"
                  >
                    <Star class="w-4 h-4" :fill="isFavorite(item.policy.id) ? 'currentColor' : 'none'" />
                  </button>
                  <button
                    @click="toggleExpand(item.policy.id)"
                    class="text-sm text-neutral-500 hover:text-gov-blue transition-colors flex items-center gap-1"
                  >
                    <FileText class="w-4 h-4" />
                    {{ expandedPolicyId === item.policy.id ? '收起' : '查看全文' }}
                    <ChevronDown v-if="expandedPolicyId !== item.policy.id" class="w-4 h-4" />
                    <ChevronUp v-else class="w-4 h-4" />
                  </button>
                  <button class="px-4 py-1.5 bg-gov-gradient text-white text-xs rounded-lg hover:shadow-md transition-all flex items-center gap-1">
                    立即申请
                    <ArrowRight class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="expandedPolicyId === item.policy.id" class="border-t border-neutral-100 bg-neutral-50/50 p-5">
              <div class="prose prose-sm max-w-none text-neutral-600">
                <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{{ item.policy.content }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
