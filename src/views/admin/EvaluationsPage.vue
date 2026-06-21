<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-1">评价管理</h1>
      <p class="text-neutral-400 text-sm">满意度分析，差评整改闭环跟踪</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <div class="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-6 border border-neutral-800">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-neutral-400 text-sm">总体满意度</p>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-5xl font-bold text-yellow-400">{{ overallScore.toFixed(1) }}</span>
              <span class="text-neutral-500 text-sm">/ 5.0</span>
            </div>
          </div>
          <div class="w-20 h-20 rounded-full border-4 border-yellow-500/30 flex items-center justify-center">
            <Star class="w-10 h-10 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div class="flex items-center gap-1">
          <Star v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= Math.round(overallScore) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'" />
          <span class="text-sm text-neutral-400 ml-2">{{ totalCount }} 条评价</span>
        </div>
        <div class="grid grid-cols-5 gap-1 mt-4">
          <div v-for="i in [5, 4, 3, 2, 1]" :key="i" class="text-center">
            <div class="text-xs text-neutral-500 mb-1">{{ i }}星</div>
            <div class="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
              <div class="h-full bg-yellow-400 rounded-full" :style="{ width: (starCounts[i] / totalCount * 100) + '%' }"></div>
            </div>
            <div class="text-xs text-neutral-400 mt-1">{{ starCounts[i] }}</div>
          </div>
        </div>
      </div>

      <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity class="w-4 h-4 text-blue-400" /> 各维度评分
        </h3>
        <v-chart :option="radarOption" autoresize class="w-full h-64" />
      </div>

      <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
        <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-green-400" /> 满意度趋势
        </h3>
        <v-chart :option="trendOption" autoresize class="w-full h-64" />
      </div>
    </div>

    <div v-if="badReviews.length > 0" class="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-5 border border-red-500/30 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-semibold flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-red-400" />
          差评预警
          <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/30 text-red-300">{{ badReviews.length }} 条待处理</span>
        </h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="item in badReviews" :key="item.id" class="bg-neutral-800/80 rounded-lg p-4 border border-red-500/20">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-1">
              <Star v-for="i in item.overallRating" :key="i" class="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <Star v-for="i in (5 - item.overallRating)" :key="'e' + i" class="w-3.5 h-3.5 text-neutral-600" />
            </div>
            <span class="text-xs text-neutral-500">{{ item.createTime }}</span>
          </div>
          <p class="text-sm text-neutral-300 line-clamp-2 mb-2">{{ item.content }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-500">{{ item.userName }} · {{ item.sourceName || item.sourceNo }}</span>
            <button @click="openRectify(item)" class="text-xs text-red-400 hover:text-red-300">发起整改</button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 mb-5">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="text-sm text-neutral-400 block mb-1.5">搜索</label>
          <el-input v-model="filters.keyword" placeholder="搜索评价内容、用户、工单号..." clearable />
        </div>
        <div class="w-32">
          <label class="text-sm text-neutral-400 block mb-1.5">评分</label>
          <el-select v-model="filters.rating" placeholder="全部评分" clearable class="!w-full">
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>
        </div>
        <div class="w-40">
          <label class="text-sm text-neutral-400 block mb-1.5">整改状态</label>
          <el-select v-model="filters.rectificationStatus" placeholder="全部" clearable class="!w-full">
            <el-option label="无需整改" value="none" />
            <el-option label="待整改" value="pending" />
            <el-option label="整改中" value="processing" />
            <el-option label="已完成" value="verified" />
          </el-select>
        </div>
        <div class="flex gap-2">
          <button @click="loadData" class="btn-primary !px-5">查询</button>
          <button @click="resetFilters" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">重置</button>
        </div>
      </div>
    </div>

    <div class="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden">
      <el-table :data="filteredEvaluations" class="!bg-transparent" row-key="id"
        :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
        :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
        <el-table-column label="关联对象" width="200">
          <template #default="{ row }">
            <div>
              <div class="text-sm text-white">{{ row.sourceName || '工单 ' + row.sourceNo }}</div>
              <div class="text-xs text-neutral-500">{{ row.departmentName?.replace('抚州市', '') }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="100">
          <template #default="{ row }">
            <span class="text-sm">{{ row.userName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="110" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-0.5">
              <Star v-for="i in row.overallRating" :key="i" class="w-3.5 h-3.5" :class="row.overallRating <= 2 ? 'text-red-400 fill-red-400' : 'text-yellow-400 fill-yellow-400'" />
              <Star v-for="i in (5 - row.overallRating)" :key="'e' + i" class="w-3.5 h-3.5 text-neutral-600" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评价标签" width="140">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <span v-for="t in row.tags" :key="t" class="text-xs px-1.5 py-0.5 rounded bg-neutral-700/50 text-neutral-400">
                {{ t }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="260">
          <template #default="{ row }">
            <p class="text-sm text-neutral-300 line-clamp-2">{{ row.content }}</p>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            <span class="text-sm text-neutral-400">{{ row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="整改状态" width="120" align="center">
          <template #default="{ row }">
            <span v-if="!row.isRectified && !row.rectificationStatus" class="text-xs px-2 py-0.5 rounded-full bg-neutral-500/20 text-neutral-400">无需整改</span>
            <span v-else-if="row.rectificationStatus === 'pending'" class="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">待整改</span>
            <span v-else-if="row.rectificationStatus === 'processing'" class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">整改中</span>
            <span v-else-if="row.rectificationStatus === 'verified' || row.isRectified" class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">已完成</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <button v-if="row.overallRating <= 2 && !row.isRectified && !row.rectificationStatus" @click="openRectify(row)" class="text-red-400 hover:text-red-300 text-sm mr-3">发起整改</button>
            <button v-if="row.isRectified || row.rectificationStatus" @click="openRectify(row)" class="text-blue-400 hover:text-blue-300 text-sm">查看整改</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="rectifyDialog" :title="currentRectify ? ((currentRectify.isRectified || currentRectify.rectificationStatus) ? '整改跟踪' : '发起整改') : ''" width="560px"
      class="!bg-neutral-900" :close-on-click-modal="false">
      <div v-if="currentRectify" class="space-y-4">
        <div class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div class="flex items-center gap-2 mb-2">
            <Star v-for="i in currentRectify.overallRating" :key="i" class="w-4 h-4 text-red-400 fill-red-400" />
            <Star v-for="i in (5 - currentRectify.overallRating)" :key="'e' + i" class="w-4 h-4 text-neutral-600" />
            <span class="text-xs text-neutral-500 ml-2">{{ currentRectify.userName }}</span>
          </div>
          <p class="text-sm text-neutral-300">{{ currentRectify.content }}</p>
        </div>
        <div>
          <label class="text-sm text-neutral-400 block mb-1.5">整改措施 <span class="text-red-400">*</span></label>
          <el-input v-model="rectifyForm.measures" type="textarea" :rows="3" placeholder="请输入整改措施..." />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-neutral-400 block mb-1.5">责任人 <span class="text-red-400">*</span></label>
            <el-input v-model="rectifyForm.responsible" placeholder="请输入责任人姓名" />
          </div>
          <div>
            <label class="text-sm text-neutral-400 block mb-1.5">整改时限 <span class="text-red-400">*</span></label>
            <el-date-picker v-model="rectifyForm.deadline" type="date" placeholder="选择时限" class="!w-full" />
          </div>
        </div>
        <div v-if="currentRectify.rectificationStatus === 'verified' || currentRectify.isRectified">
          <label class="text-sm text-neutral-400 block mb-1.5">验证结果</label>
          <el-input v-model="rectifyForm.verification" type="textarea" :rows="3" placeholder="请输入整改验证结果..." />
        </div>
      </div>
      <template #footer>
        <button @click="rectifyDialog = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">取消</button>
        <button @click="submitRectify" class="btn-primary !px-5">{{ (currentRectify?.rectificationStatus === 'verified' || currentRectify?.isRectified) ? '关闭' : '提交' }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Star, Activity, TrendingUp, AlertTriangle
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { Evaluation } from '@/types'
import { mockEvaluations } from '@/mock/data/evaluations'
import type { EChartsOption } from 'echarts'
import { use } from 'echarts/core'
import { RadarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([
  RadarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent, CanvasRenderer
])

const evaluations = ref<Evaluation[]>(mockEvaluations)
const filters = reactive({
  keyword: '',
  rating: null as number | null,
  rectificationStatus: '' as '' | 'pending' | 'processing' | 'verified' | 'failed' | 'none'
})

const rectifyDialog = ref(false)
const currentRectify = ref<Evaluation | null>(null)
const rectifyForm = reactive({
  measures: '',
  responsible: '',
  deadline: null as any,
  verification: ''
})

const totalCount = computed(() => evaluations.value.length)
const overallScore = computed(() => {
  if (evaluations.value.length === 0) return 0
  return evaluations.value.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.value.length
})

const starCounts = computed(() => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  evaluations.value.forEach(e => { counts[e.overallRating]++ })
  return counts
})

const badReviews = computed(() => evaluations.value.filter(e => e.overallRating <= 2 && !(e.isRectified || e.rectificationStatus === 'verified')))

const filteredEvaluations = computed(() => {
  return evaluations.value.filter(e => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      if (!e.content.toLowerCase().includes(kw) &&
          !e.userName.toLowerCase().includes(kw) &&
          !(e.sourceNo || '').toLowerCase().includes(kw)) return false
    }
    if (filters.rating !== null && e.overallRating !== filters.rating) return false
    if (filters.rectificationStatus) {
      if (filters.rectificationStatus === 'none') {
        if (e.isRectified || e.rectificationStatus) return false
      } else {
        if (e.rectificationStatus !== filters.rectificationStatus) return false
      }
    }
    return true
  })
})

const radarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    indicator: [
      { name: '服务态度', max: 5 },
      { name: '办事效率', max: 5 },
      { name: '流程便捷', max: 5 },
      { name: '办理结果', max: 5 },
      { name: '环境设施', max: 5 }
    ],
    axisName: { color: '#9CA3AF', fontSize: 11 },
    splitLine: { lineStyle: { color: '#374151' } },
    splitArea: { areaStyle: { color: ['rgba(55,65,81,0.2)', 'rgba(55,65,81,0.1)'] } },
    axisLine: { lineStyle: { color: '#374151' } }
  },
  series: [{
    type: 'radar',
    data: [{
      value: [4.6, 4.2, 4.1, 4.4, 4.3],
      name: '综合评分',
      areaStyle: { color: 'rgba(30,90,168,0.3)' },
      lineStyle: { color: '#1E5AA8', width: 2 },
      itemStyle: { color: '#1E5AA8' }
    }]
  }]
}))

const trendOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(26,31,41,0.95)',
    borderColor: '#374151',
    textStyle: { color: '#D1D5DB' }
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6B7280' }
  },
  yAxis: {
    type: 'value',
    min: 3,
    max: 5,
    axisLine: { show: false },
    axisLabel: { color: '#6B7280' },
    splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }
  },
  series: [{
    data: [4.1, 4.2, 4.0, 4.3, 4.4, 4.5, 4.6],
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    itemStyle: { color: '#22C55E' },
    lineStyle: { color: '#22C55E', width: 2 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(34,197,94,0.3)' },
          { offset: 1, color: 'rgba(34,197,94,0.02)' }
        ]
      }
    }
  }]
}))

const resetFilters = () => {
  filters.keyword = ''
  filters.rating = null
  filters.rectificationStatus = ''
}

const loadData = () => {}

const openRectify = (e: Evaluation) => {
  currentRectify.value = e
  rectifyForm.measures = e.rectifyMeasures || ''
  rectifyForm.responsible = e.rectifyResponsible || ''
  rectifyForm.deadline = e.rectifyDeadline || null
  rectifyForm.verification = e.verificationResult || ''
  rectifyDialog.value = true
}

const submitRectify = () => {
  if (currentRectify.value?.rectificationStatus === 'verified' || currentRectify.value?.isRectified) {
    rectifyDialog.value = false
    return
  }
  if (!rectifyForm.measures || !rectifyForm.responsible || !rectifyForm.deadline) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  ElMessage.success('整改已提交')
  if (currentRectify.value) {
    currentRectify.value.rectificationStatus = currentRectify.value.rectificationStatus === 'processing' ? 'verified' : 'processing'
    currentRectify.value.isRectified = currentRectify.value.rectificationStatus === 'verified'
    currentRectify.value.rectifyMeasures = rectifyForm.measures
    currentRectify.value.rectifyResponsible = rectifyForm.responsible
    currentRectify.value.rectifyDeadline = rectifyForm.deadline
  }
  rectifyDialog.value = false
}

onMounted(() => {})
</script>
