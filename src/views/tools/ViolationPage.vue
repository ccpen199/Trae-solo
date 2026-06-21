<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'
import {
  Car,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  History,
  Camera,
  Building,
  FileSignature,
  X,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storage } from '@/utils/storage'

const router = useRouter()
const loading = ref(false)
const queried = ref(false)
const expandedId = ref<string | null>(null)
const showHistory = ref(false)

const provinces = ['赣', '京', '沪', '粤', '浙', '苏', '闽', '皖', '湘', '鄂', '川', '渝', '鲁', '晋', '冀', '豫']

const queryForm = reactive({
  province: '赣',
  plateNo: '',
  vehicleType: '小型汽车',
  engineNo: '',
  captcha: '',
})

const captchaCode = ref('')

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode.value = code
}
generateCaptcha()

interface ViolationRecord {
  id: string
  time: string
  location: string
  behavior: string
  points: number
  fine: number
  status: 'processed' | 'unprocessed' | 'pending'
  photoUrl?: string
  collectOrg?: string
  documentNo?: string
  type?: string
}

const mockViolations: ViolationRecord[] = [
  {
    id: 'v1',
    time: '2026-05-28 14:32:00',
    location: '赣东大道与临川大道交叉口',
    behavior: '机动车通过有灯控路口时，不按所需行进方向驶入导向车道',
    points: 2,
    fine: 100,
    status: 'unprocessed',
    photoUrl: '',
    collectOrg: '抚州市公安局交通警察支队直属一大队',
    documentNo: '赣公交决字[2026]第361000100123456号',
    type: '不按导向车道行驶',
  },
  {
    id: 'v2',
    time: '2026-05-15 08:45:00',
    location: '文昌大道168号路段',
    behavior: '机动车违反规定停放、临时停车且驾驶人不在现场',
    points: 0,
    fine: 150,
    status: 'processed',
    photoUrl: '',
    collectOrg: '抚州市公安局交通警察支队直属二大队',
    documentNo: '赣公交决字[2026]第361000100123457号',
    type: '违法停车',
  },
  {
    id: 'v3',
    time: '2026-04-20 16:20:00',
    location: '迎宾大道与玉茗大道交叉口',
    behavior: '驾驶机动车违反道路交通信号灯通行',
    points: 6,
    fine: 200,
    status: 'unprocessed',
    photoUrl: '',
    collectOrg: '抚州市公安局交通警察支队直属一大队',
    documentNo: '赣公交决字[2026]第361000100123458号',
    type: '闯红灯',
  },
  {
    id: 'v4',
    time: '2026-03-10 19:08:00',
    location: '钟岭大道88号路段',
    behavior: '在禁止鸣喇叭的区域或者路段鸣喇叭',
    points: 0,
    fine: 50,
    status: 'processed',
    photoUrl: '',
    collectOrg: '抚州市公安局交通警察支队直属三大队',
    documentNo: '赣公交决字[2026]第361000100123459号',
    type: '违规鸣笛',
  },
  {
    id: 'v5',
    time: '2026-02-05 11:30:00',
    location: '抚河大桥北段',
    behavior: '驾驶中型以上载客载货汽车、校车、危险物品运输车辆以外的其他机动车行驶超过规定时速10%未达20%',
    points: 3,
    fine: 100,
    status: 'processed',
    photoUrl: '',
    collectOrg: '抚州市公安局交通警察支队直属一大队',
    documentNo: '赣公交决字[2026]第361000100123460号',
    type: '超速行驶',
  },
  {
    id: 'v6',
    time: '2026-01-18 09:15:00',
    location: '王安石大道与金巢大道交叉口',
    behavior: '机动车逆向行驶',
    points: 3,
    fine: 200,
    status: 'unprocessed',
    photoUrl: '',
    collectOrg: '抚州市公安局交通警察支队直属二大队',
    documentNo: '赣公交决字[2026]第361000100123461号',
    type: '逆向行驶',
  },
]

const violations = ref<ViolationRecord[]>([])
const historyRecords = ref<any[]>([])

const statistics = computed(() => {
  const total = violations.value.length
  const totalPoints = violations.value.reduce((s, v) => s + v.points, 0)
  const totalFine = violations.value.reduce((s, v) => s + v.fine, 0)
  const unprocessed = violations.value.filter((v) => v.status === 'unprocessed').length
  return { total, totalPoints, totalFine, unprocessed }
})

const typeChartOption = computed<EChartsOption>(() => {
  const typeMap = new Map<string, number>()
  violations.value.forEach((v) => {
    const type = v.type || '其他'
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })
  const types = Array.from(typeMap.keys())
  const counts = types.map((t) => typeMap.get(t) || 0)
  const colors = ['#E74C3C', '#F39C12', '#3498DB', '#2ECC71', '#9B59B6', '#1ABC9C']

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}条 ({d}%)' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: types.map((t, i) => ({
          value: counts[i],
          name: t,
          itemStyle: { color: colors[i % colors.length] },
        })),
      },
    ],
  }
})

const monthlyChartOption = computed<EChartsOption>(() => {
  const monthMap = new Map<string, number>()
  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
  months.forEach((m) => monthMap.set(m, 0))

  violations.value.forEach((v) => {
    const month = v.time.substring(0, 7)
    if (monthMap.has(month)) {
      monthMap.set(month, (monthMap.get(month) || 0) + 1)
    }
  })

  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月']
  const counts = months.map((m) => monthMap.get(m) || 0)

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E5E7EB',
      textStyle: { color: '#374151' },
      formatter: (params: any) => `${params[0].name}: ${params[0].value}条`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280' },
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
              { offset: 0, color: '#1E5AA8' },
              { offset: 1, color: '#2B7CD3' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: 40,
      },
    ],
  }
})

function handleQuery() {
  const fullPlateNo = queryForm.province + queryForm.plateNo
  if (!queryForm.plateNo.trim()) {
    ElMessage.warning('请输入车牌号')
    return
  }
  if (!queryForm.engineNo.trim() || queryForm.engineNo.trim().length < 6) {
    ElMessage.warning('请输入发动机号后6位')
    return
  }
  if (queryForm.captcha.toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误')
    generateCaptcha()
    return
  }

  loading.value = true
  setTimeout(() => {
    const savedResults = storage.get('violation_results_' + fullPlateNo, null) as ViolationRecord[] | null
    violations.value = savedResults || mockViolations
    queried.value = true
    loading.value = false

    if (!savedResults) {
      storage.set('violation_results_' + fullPlateNo, mockViolations)
    }

    const history = storage.get('violation_history', []) as any[]
    const newRecord = {
      plateNo: fullPlateNo,
      vehicleType: queryForm.vehicleType,
      queryTime: new Date().toLocaleString('zh-CN'),
    }
    const newHistory = [newRecord, ...history.filter((h) => h.plateNo !== fullPlateNo)].slice(0, 5)
    storage.set('violation_history', newHistory)
    historyRecords.value = newHistory

    ElMessage.success('查询成功')
  }, 800)
}

function selectHistory(record: any) {
  queryForm.province = record.plateNo.charAt(0)
  queryForm.plateNo = record.plateNo.slice(1)
  queryForm.vehicleType = record.vehicleType
  showHistory.value = false
}

function clearHistory() {
  storage.remove('violation_history')
  historyRecords.value = []
  ElMessage.success('历史记录已清空')
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function getStatusBadge(status: ViolationRecord['status']) {
  switch (status) {
    case 'processed':
      return { text: '已处理', class: 'tag-success' }
    case 'unprocessed':
      return { text: '未处理', class: 'tag-danger' }
    case 'pending':
      return { text: '待确认', class: 'tag-warning' }
  }
}

function handleBatchProcess() {
  const unprocessedCount = violations.value.filter((v) => v.status === 'unprocessed').length
  if (unprocessedCount === 0) {
    ElMessage.info('暂无未处理的违章记录')
    return
  }
  router.push('/services?keyword=违章')
}

function exportViolations() {
  let csv = '时间,地点,违章行为,扣分,罚款,状态,采集机关,文书编号\n'
  violations.value.forEach((v) => {
    const status = v.status === 'processed' ? '已处理' : v.status === 'unprocessed' ? '未处理' : '待确认'
    csv += `${v.time},"${v.location}","${v.behavior}",${v.points},${v.fine},${status},"${v.collectOrg || ''}","${v.documentNo || ''}"\n`
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `违章记录_${queryForm.province}${queryForm.plateNo}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function goBack() {
  router.push('/tools')
}

onMounted(() => {
  historyRecords.value = storage.get('violation_history', []) as any[]
  if (historyRecords.value.length > 0) {
    const lastPlateNo = historyRecords.value[0].plateNo
    const savedResults = storage.get('violation_results_' + lastPlateNo, null) as ViolationRecord[] | null
    if (savedResults) {
      violations.value = savedResults
      queried.value = true
      queryForm.province = lastPlateNo.charAt(0)
      queryForm.plateNo = lastPlateNo.slice(1)
      queryForm.vehicleType = historyRecords.value[0].vehicleType || '小型汽车'
    }
  }
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
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
          <Car class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-800">违章查询</h1>
      </div>
      <p class="text-neutral-500 ml-13">快速查询机动车违章记录，支持在线处理</p>
    </div>

    <div class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="section-title">查询条件</h3>
        <button
          @click="showHistory = !showHistory"
          class="text-sm text-gov-blue hover:underline flex items-center gap-1"
        >
          <History class="w-4 h-4" />
          查询历史
          <span v-if="historyRecords.length > 0" class="text-xs text-neutral-400">({{ historyRecords.length }}条)</span>
        </button>
      </div>

      <div v-if="showHistory" class="mb-4 p-4 bg-neutral-50 rounded-xl">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-neutral-700">最近查询记录</span>
          <button v-if="historyRecords.length > 0" @click="clearHistory" class="text-xs text-neutral-400 hover:text-accent-red">清空记录</button>
        </div>
        <div v-if="historyRecords.length > 0" class="space-y-2">
          <div
            v-for="(record, index) in historyRecords"
            :key="index"
            @click="selectHistory(record)"
            class="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gov-blue/5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gov-blue/10 flex items-center justify-center">
                <Car class="w-4 h-4 text-gov-blue" />
              </div>
              <div>
                <p class="font-medium text-neutral-800">{{ record.plateNo }}</p>
                <p class="text-xs text-neutral-400">{{ record.vehicleType }} · {{ record.queryTime }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gov-blue">点击填充</span>
              <ChevronRight class="w-4 h-4 text-neutral-300" />
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6">
          <History class="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p class="text-sm text-neutral-400">暂无查询历史</p>
          <p class="text-xs text-neutral-300 mt-1">查询后记录将自动保存，方便下次快速查询</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">车牌号</label>
          <div class="flex gap-2">
            <div class="relative">
              <el-select v-model="queryForm.province" class="w-16">
                <el-option v-for="p in provinces" :key="p" :label="p" :value="p" />
              </el-select>
            </div>
            <el-input
              v-model="queryForm.plateNo"
              placeholder="请输入车牌号"
              maxlength="6"
              class="flex-1"
            >
              <template #prefix>
                <FileText class="w-4 h-4 text-neutral-400" />
              </template>
            </el-input>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">车辆类型</label>
          <el-select v-model="queryForm.vehicleType" class="w-full">
            <el-option label="小型汽车" value="小型汽车" />
            <el-option label="大型汽车" value="大型汽车" />
            <el-option label="摩托车" value="摩托车" />
            <el-option label="挂车" value="挂车" />
          </el-select>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">发动机号后6位</label>
          <el-input v-model="queryForm.engineNo" placeholder="请输入发动机号后6位" maxlength="6">
            <template #prefix>
              <Car class="w-4 h-4 text-neutral-400" />
            </template>
          </el-input>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">验证码</label>
          <div class="flex gap-2">
            <el-input v-model="queryForm.captcha" placeholder="请输入验证码" maxlength="4" class="flex-1">
              <template #prefix>
                <Search class="w-4 h-4 text-neutral-400" />
              </template>
            </el-input>
            <button
              @click="generateCaptcha"
              class="h-10 px-4 bg-neutral-100 border border-neutral-200 rounded-lg font-mono text-lg font-bold text-gov-blue tracking-widest hover:bg-neutral-200 transition-colors select-none"
              :title="'点击刷新'"
            >
              {{ captchaCode }}
            </button>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3 mt-6">
        <button @click="handleQuery" :disabled="loading" class="btn-primary flex items-center gap-2 min-w-32">
          <Search v-if="!loading" class="w-4 h-4" />
          <RefreshCw v-else class="w-4 h-4 animate-spin" />
          {{ loading ? '查询中...' : '立即查询' }}
        </button>
        <button
          @click="generateCaptcha(); (queryForm.plateNo = ''); (queryForm.engineNo = ''); (queryForm.captcha = '')"
          class="btn-secondary flex items-center gap-2"
        >
          <RefreshCw class="w-4 h-4" />
          重置
        </button>
      </div>
    </div>

    <template v-if="queried">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card border-l-4 border-gov-blue">
          <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <FileText class="w-4 h-4" />
            违章总数
          </div>
          <p class="text-3xl font-bold text-gov-blue">{{ statistics.total }}</p>
          <p class="text-xs text-neutral-400 mt-1">条记录</p>
        </div>
        <div class="card border-l-4 border-accent-orange">
          <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <AlertTriangle class="w-4 h-4" />
            累计扣分
          </div>
          <p class="text-3xl font-bold text-accent-orange">{{ statistics.totalPoints }}</p>
          <p class="text-xs text-neutral-400 mt-1">分</p>
        </div>
        <div class="card border-l-4 border-accent-red">
          <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <XCircle class="w-4 h-4" />
            累计罚款
          </div>
          <p class="text-3xl font-bold text-accent-red">¥ {{ statistics.totalFine }}</p>
          <p class="text-xs text-neutral-400 mt-1">元</p>
        </div>
        <div class="card border-l-4 border-accent-yellow">
          <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Clock class="w-4 h-4" />
            待处理
          </div>
          <p class="text-3xl font-bold text-accent-yellow">{{ statistics.unprocessed }}</p>
          <p class="text-xs text-neutral-400 mt-1">条</p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 mb-4">
        <button
          @click="exportViolations"
          class="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download class="w-4 h-4" />
          导出违章记录
        </button>
        <button
          @click="handleBatchProcess"
          class="btn-primary flex items-center gap-2 text-sm"
        >
          <ExternalLink class="w-4 h-4" />
          一键处理
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="section-title">违章类型分布</h3>
          <v-chart class="h-56" :option="typeChartOption" autoresize />
        </div>
        <div class="card">
          <h3 class="section-title">近6个月违章趋势</h3>
          <v-chart class="h-56" :option="monthlyChartOption" autoresize />
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="section-title mb-0">违章记录</h3>
          <span class="text-sm text-neutral-500">共 {{ violations.length }} 条记录</span>
        </div>

        <div v-if="violations.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle class="w-8 h-8 text-accent-green" />
          </div>
          <p class="text-neutral-600 font-medium">恭喜，暂无违章记录</p>
          <p class="text-sm text-neutral-400 mt-1">请继续保持良好的驾驶习惯</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="v in violations"
            :key="v.id"
            class="border border-neutral-100 rounded-xl overflow-hidden hover:border-gov-blue/30 transition-all"
          >
            <div class="p-4 cursor-pointer" @click="toggleExpand(v.id)">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="['tag', getStatusBadge(v.status).class]">{{ getStatusBadge(v.status).text }}</span>
                    <span class="text-sm text-neutral-500 flex items-center gap-1">
                      <Clock class="w-3.5 h-3.5" />
                      {{ v.time }}
                    </span>
                  </div>
                  <p class="text-sm text-neutral-700 font-medium mb-1">{{ v.behavior }}</p>
                  <p class="text-xs text-neutral-500 flex items-center gap-1">
                    <MapPin class="w-3.5 h-3.5" />
                    {{ v.location }}
                  </p>
                </div>
                <div class="text-right ml-4 flex-shrink-0">
                  <div class="flex items-center gap-4">
                    <div>
                      <p class="text-xs text-neutral-500">扣分</p>
                      <p :class="['text-xl font-bold', v.points > 0 ? 'text-accent-orange' : 'text-neutral-400']">
                        {{ v.points }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-neutral-500">罚款</p>
                      <p :class="['text-xl font-bold', v.fine > 0 ? 'text-accent-red' : 'text-neutral-400']">
                        ¥{{ v.fine }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-2">
                    <component
                      :is="expandedId === v.id ? ChevronUp : ChevronDown"
                      class="w-4 h-4 text-neutral-400 inline"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="expandedId === v.id" class="px-4 pb-4 border-t border-neutral-100 pt-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-3 bg-neutral-50 rounded-lg">
                  <p class="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                    <Camera class="w-3.5 h-3.5" />
                    违章照片
                  </p>
                  <div class="w-full h-24 bg-neutral-200 rounded-lg flex items-center justify-center">
                    <Camera class="w-8 h-8 text-neutral-400" />
                  </div>
                </div>
                <div class="space-y-3">
                  <div>
                    <p class="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <Building class="w-3.5 h-3.5" />
                      采集机关
                    </p>
                    <p class="text-sm text-neutral-700">{{ v.collectOrg }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                      <FileSignature class="w-3.5 h-3.5" />
                      文书编号
                    </p>
                    <p class="text-sm text-neutral-700 font-mono">{{ v.documentNo }}</p>
                  </div>
                  <div class="pt-2">
                    <button
                      v-if="v.status === 'unprocessed'"
                      @click.stop="router.push('/services?keyword=违章')"
                      class="w-full py-2 bg-gov-blue text-white text-sm rounded-lg hover:bg-gov-blue-light transition-colors"
                    >
                      在线处理
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
