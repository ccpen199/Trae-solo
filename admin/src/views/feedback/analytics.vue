<template>
  <div class="analytics-container">
    <div class="page-header">
      <div>
        <h2>满意度分析</h2>
        <p class="header-sub">
          全维度满意度监控 · 数据驱动改进 · {{ currentTime }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时更新
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
          <el-radio-button label="90d">近90天</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button :icon="Download" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <div class="card-wrapper satisfaction-hero">
      <div class="hero-left">
        <div class="hero-label">综合满意度</div>
        <div class="hero-score">
          <span class="score-num">{{ overallSatisfaction }}</span>
          <span class="score-unit">分</span>
        </div>
        <div class="hero-change" :class="{ 'change-up': satisfactionChange >= 0, 'change-down': satisfactionChange < 0 }">
          <el-icon v-if="satisfactionChange >= 0"><Top /></el-icon>
          <el-icon v-else><Bottom /></el-icon>
          环比{{ satisfactionChange >= 0 ? '上升' : '下降' }} {{ Math.abs(satisfactionChange) }}%
          <span class="change-period">较上一周期</span>
        </div>
        <div class="hero-meta">
          <div class="meta-item">
            <span class="meta-label">评价总数</span>
            <span class="meta-value">{{ formatNum(totalReviews) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">好评率</span>
            <span class="meta-value" style="color: #27AE60;">{{ goodRate }}%</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">差评率</span>
            <span class="meta-value" style="color: #E74C3C;">{{ badRate }}%</span>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <v-chart :option="gaugeOption" style="height: 180px; width: 240px;" autoresize />
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">满意度趋势（近30天）</div>
            <el-tag type="info" round size="small">日均 {{ avgDailyScore }} 分</el-tag>
          </div>
          <v-chart :option="trendLineOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">各服务类别满意度雷达图</div>
          </div>
          <v-chart :option="radarOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">差评原因分布</div>
          </div>
          <v-chart :option="badReasonPieOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">各部门满意度排行</div>
          </div>
          <v-chart :option="deptRankOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">满意度明细</div>
        <div class="header-right">
          <el-input
            v-model="tableSearch"
            placeholder="搜索服务名称"
            :prefix-icon="Search"
            clearable
            style="width: 220px; margin-right: 12px;"
            size="default"
          />
          <el-select v-model="deptFilter" placeholder="委办局" clearable size="default" style="width: 150px; margin-right: 12px;">
            <el-option v-for="d in deptList" :key="d" :label="d" :value="d" />
          </el-select>
        </div>
      </div>
      <el-table :data="pagedTableData" size="default" stripe class="satisfaction-table">
        <el-table-column type="index" label="排名" width="55" align="center">
          <template #default="{ $index }">
            <el-tag
              v-if="$index < 3"
              :type="rankTagType($index)"
              effect="dark"
              round
              size="small"
            >{{ (pagination.current - 1) * pagination.size + $index + 1 }}</el-tag>
            <span v-else>{{ (pagination.current - 1) * pagination.size + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="服务名称" min-width="180" />
        <el-table-column prop="department" label="委办局" width="110">
          <template #default="{ row }">
            <span class="dept-tag">{{ row.department }}</span>
          </template>
        </el-table-column>
        <el-table-column label="评价数" width="90" align="center" prop="reviewCount" />
        <el-table-column label="好评率" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.goodRate >= 90 ? '#27AE60' : row.goodRate >= 80 ? '#F39C12' : '#E74C3C', fontWeight: 600 }">
              {{ row.goodRate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="中评率" width="80" align="center" prop="neutralRate">
          <template #default="{ row }">
            <span>{{ row.neutralRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="差评率" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.badRate <= 5 ? '#27AE60' : row.badRate <= 10 ? '#F39C12' : '#E74C3C', fontWeight: 600 }">
              {{ row.badRate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="平均评分" width="100" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.avgStar" disabled :colors="['#F39C12', '#F39C12', '#1E4FA5']" size="small" allow-half />
          </template>
        </el-table-column>
        <el-table-column label="趋势" width="80" align="center">
          <template #default="{ row }">
            <span :class="{ 'trend-up': row.trend > 0, 'trend-down': row.trend < 0, 'trend-stable': row.trend === 0 }">
              <el-icon v-if="row.trend > 0"><Top /></el-icon>
              <el-icon v-else-if="row.trend < 0"><Bottom /></el-icon>
              <el-icon v-else><Minus /></el-icon>
              {{ row.trend > 0 ? '+' : '' }}{{ row.trend }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="viewBadReviews(row)">差评</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 30]"
          :total="filteredTableData.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">差评关键词 TOP20</div>
        <el-tag type="danger" effect="plain" round size="small">基于近30天差评文本分析</el-tag>
      </div>
      <div class="keyword-rank">
        <div
          v-for="(kw, idx) in topKeywords"
          :key="kw.word"
          class="keyword-item"
        >
          <div class="keyword-rank-num" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</div>
          <div class="keyword-info">
            <div class="keyword-word">{{ kw.word }}</div>
            <div class="keyword-bar-wrapper">
              <div class="keyword-bar" :style="{ width: kw.percentage + '%' }"></div>
            </div>
          </div>
          <div class="keyword-stats">
            <span class="keyword-count">{{ kw.count }}次</span>
            <span class="keyword-pct">{{ kw.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart, RadarChart, GaugeChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import {
  Refresh, Download, Odometer, Search, Top, Bottom, Minus
} from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, PieChart, BarChart, RadarChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const currentTime = ref('')
const timeRange = ref('30d')
const tableSearch = ref('')
const deptFilter = ref('')
const pagination = reactive({ current: 1, size: 10 })

const overallSatisfaction = 94.6
const satisfactionChange = 1.2
const totalReviews = 68934
const goodRate = 87.3
const badRate = 4.8

const avgDailyScore = computed(() => {
  return (trendData.reduce((s, d) => s + d.score, 0) / trendData.length).toFixed(1)
})

const gaugeOption = computed(() => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    radius: '95%',
    progress: { show: true, width: 14, itemStyle: { color: '#1E4FA5' } },
    axisLine: { lineStyle: { width: 14, color: [[1, '#EBEEF5']] } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    pointer: { show: false },
    title: { show: false },
    detail: {
      valueAnimation: true, fontSize: 22, fontWeight: 700, color: '#1E4FA5',
      offsetCenter: [0, '0%'], formatter: '{value}'
    },
    data: [{ value: overallSatisfaction }]
  }]
}))

const trendData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    score: Math.round((91.5 + Math.random() * 5) * 10) / 10,
    goodRate: Math.round((82 + Math.random() * 10) * 10) / 10,
    badRate: Math.round((3 + Math.random() * 5) * 10) / 10
  }
})

const trendLineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['满意度评分', '好评率', '差评率'], right: 10, top: 0 },
  grid: { left: 50, right: 40, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: trendData.map(d => d.date), boundaryGap: false, axisLine: { lineStyle: { color: '#E4E7ED' } } },
  yAxis: [
    { type: 'value', min: 80, max: 100, name: '评分', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
    { type: 'value', min: 0, max: 100, name: '率(%)', splitLine: { show: false } }
  ],
  series: [
    {
      name: '满意度评分', type: 'line', smooth: true, data: trendData.map(d => d.score),
      lineStyle: { color: '#1E4FA5', width: 3 }, itemStyle: { color: '#1E4FA5' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.35)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }]
        }
      }
    },
    {
      name: '好评率', type: 'line', smooth: true, yAxisIndex: 1, data: trendData.map(d => d.goodRate),
      lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' }
    },
    {
      name: '差评率', type: 'line', smooth: true, yAxisIndex: 1, data: trendData.map(d => d.badRate),
      lineStyle: { color: '#E74C3C', width: 2 }, itemStyle: { color: '#E74C3C' }
    }
  ]
}))

const radarOption = computed(() => {
  const categories = ['社会保障', '医疗保障', '户籍证件', '住房公积金', '不动产登记', '教育入学', '交通出行', '婚姻登记']
  const scores = [93.2, 95.1, 89.6, 91.8, 88.4, 92.5, 90.7, 96.3]
  return {
    tooltip: {},
    radar: {
      indicator: categories.map((name) => ({ name, max: 100 })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: { color: '#606266', fontSize: 11 },
      splitArea: { areaStyle: { color: ['rgba(30,79,165,0.02)', 'rgba(30,79,165,0.05)'] } },
      splitLine: { lineStyle: { color: '#EBEEF5' } },
      axisLine: { lineStyle: { color: '#E4E7ED' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: scores,
        name: '满意度评分',
        lineStyle: { color: '#1E4FA5', width: 2 },
        itemStyle: { color: '#1E4FA5' },
        areaStyle: { color: 'rgba(30,79,165,0.2)' }
      }]
    }]
  }
})

const badReasonData = [
  { value: 342, name: '系统响应慢', color: '#E74C3C' },
  { value: 287, name: '材料清单不清晰', color: '#1E4FA5' },
  { value: 256, name: '窗口态度差', color: '#F39C12' },
  { value: 231, name: '流程复杂', color: '#8E44AD' },
  { value: 198, name: '功能故障', color: '#27AE60' },
  { value: 176, name: '数据不同步', color: '#2980B9' },
  { value: 165, name: '验证码问题', color: '#16A085' },
  { value: 143, name: '支付失败', color: '#E67E22' },
  { value: 132, name: '预约无效', color: '#9B59B6' },
  { value: 121, name: '信息不准确', color: '#95A5A6' }
]

const badReasonPieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}<br/>差评数：{c} ({d}%)' },
  legend: { orient: 'vertical', right: 5, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '65%'], center: ['38%', '50%'], avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
    data: badReasonData.map(d => ({ ...d, itemStyle: { color: d.color } }))
  }]
}))

const deptRankData = [
  { name: '民政局', score: 96.3 },
  { name: '医保局', score: 95.1 },
  { name: '税务局', score: 94.8 },
  { name: '公积金中心', score: 93.6 },
  { name: '人社局', score: 92.1 },
  { name: '教育局', score: 91.5 },
  { name: '交警支队', score: 90.7 },
  { name: '自然资源局', score: 89.4 },
  { name: '公安局', score: 88.2 },
  { name: '住建局', score: 87.6 },
  { name: '卫健委', score: 86.9 },
  { name: '市场监管局', score: 85.3 }
]

const deptRankOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 90, right: 50, top: 10, bottom: 30 },
  xAxis: { type: 'value', min: 80, max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
  yAxis: { type: 'category', data: deptRankData.map(d => d.name).reverse() },
  series: [{
    type: 'bar', barWidth: 16,
    data: deptRankData.map(d => d.score).reverse(),
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: (params: any) => {
        const s = params.data
        if (s >= 95) return '#27AE60'
        if (s >= 90) return '#1E4FA5'
        if (s >= 85) return '#F39C12'
        return '#E74C3C'
      }
    },
    label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#606266' }
  }]
}))

interface ServiceItem {
  name: string
  department: string
  reviewCount: number
  goodRate: number
  neutralRate: number
  badRate: number
  avgScore: number
  avgStar: number
  trend: number
}

const serviceData = ref<ServiceItem[]>([
  { name: '结婚登记预约', department: '民政局', reviewCount: 3286, goodRate: 96.2, neutralRate: 2.8, badRate: 1.0, avgScore: 4.8, avgStar: 4.8, trend: 1.5 },
  { name: '医保电子凭证激活', department: '医保局', reviewCount: 28432, goodRate: 95.8, neutralRate: 3.0, badRate: 1.2, avgScore: 4.7, avgStar: 4.7, trend: 0.8 },
  { name: '个税纳税记录开具', department: '税务局', reviewCount: 9876, goodRate: 95.3, neutralRate: 3.2, badRate: 1.5, avgScore: 4.7, avgStar: 4.7, trend: 1.2 },
  { name: '公积金账户余额查询', department: '公积金中心', reviewCount: 24198, goodRate: 94.6, neutralRate: 3.8, badRate: 1.6, avgScore: 4.6, avgStar: 4.6, trend: 0.5 },
  { name: '机动车六年免检', department: '交警支队', reviewCount: 14321, goodRate: 94.2, neutralRate: 4.0, badRate: 1.8, avgScore: 4.6, avgStar: 4.6, trend: -0.3 },
  { name: '社保参保证明打印', department: '人社局', reviewCount: 38241, goodRate: 93.8, neutralRate: 4.2, badRate: 2.0, avgScore: 4.5, avgStar: 4.5, trend: 1.8 },
  { name: '新生儿落户登记', department: '公安局', reviewCount: 11234, goodRate: 93.5, neutralRate: 4.5, badRate: 2.0, avgScore: 4.5, avgStar: 4.5, trend: 0.6 },
  { name: '驾驶证补换领', department: '交警支队', reviewCount: 8765, goodRate: 93.1, neutralRate: 4.8, badRate: 2.1, avgScore: 4.5, avgStar: 4.5, trend: -0.2 },
  { name: '义务教育入学报名', department: '教育局', reviewCount: 18923, goodRate: 92.8, neutralRate: 4.5, badRate: 2.7, avgScore: 4.4, avgStar: 4.4, trend: 2.1 },
  { name: '不动产登记查询', department: '自然资源局', reviewCount: 15876, goodRate: 92.1, neutralRate: 5.2, badRate: 2.7, avgScore: 4.4, avgStar: 4.4, trend: 0.9 },
  { name: '住房公积金提取', department: '公积金中心', reviewCount: 12345, goodRate: 91.6, neutralRate: 5.5, badRate: 2.9, avgScore: 4.3, avgStar: 4.3, trend: 1.0 },
  { name: '营业执照变更', department: '市场监管局', reviewCount: 6543, goodRate: 91.2, neutralRate: 5.8, badRate: 3.0, avgScore: 4.3, avgStar: 4.3, trend: -1.2 },
  { name: '交通违法查询处理', department: '交警支队', reviewCount: 21567, goodRate: 90.8, neutralRate: 5.5, badRate: 3.7, avgScore: 4.2, avgStar: 4.2, trend: 0.4 },
  { name: '户籍迁移办理', department: '公安局', reviewCount: 8654, goodRate: 90.2, neutralRate: 6.0, badRate: 3.8, avgScore: 4.2, avgStar: 4.2, trend: -0.8 },
  { name: '医疗机构执业许可', department: '卫健委', reviewCount: 3287, goodRate: 89.6, neutralRate: 6.5, badRate: 3.9, avgScore: 4.1, avgStar: 4.1, trend: 1.5 },
  { name: '建设工程规划许可', department: '住建局', reviewCount: 4532, goodRate: 89.1, neutralRate: 7.0, badRate: 3.9, avgScore: 4.1, avgStar: 4.1, trend: -1.5 },
  { name: '社保缴费查询', department: '人社局', reviewCount: 15678, goodRate: 88.6, neutralRate: 7.2, badRate: 4.2, avgScore: 4.0, avgStar: 4.0, trend: 0.7 },
  { name: '医保异地就医备案', department: '医保局', reviewCount: 6234, goodRate: 87.8, neutralRate: 7.5, badRate: 4.7, avgScore: 3.9, avgStar: 3.9, trend: -2.1 },
  { name: '食品经营许可证', department: '市场监管局', reviewCount: 5432, goodRate: 87.2, neutralRate: 7.8, badRate: 5.0, avgScore: 3.9, avgStar: 3.9, trend: 0.3 },
  { name: '低保申请', department: '民政局', reviewCount: 4321, goodRate: 86.5, neutralRate: 8.0, badRate: 5.5, avgScore: 3.8, avgStar: 3.8, trend: -0.5 },
  { name: '居住证办理', department: '公安局', reviewCount: 7654, goodRate: 85.8, neutralRate: 8.5, badRate: 5.7, avgScore: 3.7, avgStar: 3.7, trend: 1.1 },
  { name: '社保卡补换卡', department: '人社局', reviewCount: 9876, goodRate: 85.2, neutralRate: 8.8, badRate: 6.0, avgScore: 3.7, avgStar: 3.7, trend: -1.8 },
  { name: '公积金贷款申请', department: '公积金中心', reviewCount: 11234, goodRate: 84.6, neutralRate: 9.0, badRate: 6.4, avgScore: 3.6, avgStar: 3.6, trend: 0.2 },
  { name: '出入境证件办理', department: '公安局', reviewCount: 8765, goodRate: 84.1, neutralRate: 9.5, badRate: 6.4, avgScore: 3.5, avgStar: 3.5, trend: -2.5 },
  { name: '企业开办一窗通', department: '市场监管局', reviewCount: 7654, goodRate: 83.5, neutralRate: 10.0, badRate: 6.5, avgScore: 3.5, avgStar: 3.5, trend: 1.8 },
  { name: '环保审批', department: '住建局', reviewCount: 2345, goodRate: 82.8, neutralRate: 10.5, badRate: 6.7, avgScore: 3.4, avgStar: 3.4, trend: -0.9 },
  { name: '医保报销结算', department: '医保局', reviewCount: 13456, goodRate: 81.5, neutralRate: 11.0, badRate: 7.5, avgScore: 3.3, avgStar: 3.3, trend: -3.2 },
  { name: '不动产抵押登记', department: '自然资源局', reviewCount: 5432, goodRate: 80.2, neutralRate: 12.0, badRate: 7.8, avgScore: 3.2, avgStar: 3.2, trend: 0.5 },
  { name: '医保定点机构查询', department: '卫健委', reviewCount: 6543, goodRate: 78.6, neutralRate: 13.2, badRate: 8.2, avgScore: 3.1, avgStar: 3.1, trend: -1.6 },
  { name: '建设项目施工许可', department: '住建局', reviewCount: 3456, goodRate: 76.8, neutralRate: 14.5, badRate: 8.7, avgScore: 3.0, avgStar: 3.0, trend: -2.8 }
])

const deptList = computed(() => [...new Set(serviceData.value.map(s => s.department))])

const filteredTableData = computed(() => {
  let list = [...serviceData.value]
  if (tableSearch.value) {
    const kw = tableSearch.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw))
  }
  if (deptFilter.value) {
    list = list.filter(s => s.department === deptFilter.value)
  }
  return list.sort((a, b) => b.avgScore - a.avgScore)
})

const pagedTableData = computed(() => {
  const start = (pagination.current - 1) * pagination.size
  return filteredTableData.value.slice(start, start + pagination.size)
})

const rankTagType = (idx: number) => (['danger', 'warning', 'success'] as const)[idx] || 'info'

const topKeywords = [
  { word: '响应慢', count: 892, percentage: 100 },
  { word: '态度差', count: 756, percentage: 85 },
  { word: '材料不全', count: 689, percentage: 77 },
  { word: '流程繁琐', count: 634, percentage: 71 },
  { word: '超时', count: 578, percentage: 65 },
  { word: '白跑', count: 523, percentage: 59 },
  { word: '重复填写', count: 487, percentage: 55 },
  { word: '卡顿', count: 456, percentage: 51 },
  { word: '提交失败', count: 423, percentage: 47 },
  { word: '不耐烦', count: 398, percentage: 45 },
  { word: '验证码', count: 376, percentage: 42 },
  { word: '不同步', count: 345, percentage: 39 },
  { word: '数据对不上', count: 312, percentage: 35 },
  { word: '支付失败', count: 289, percentage: 32 },
  { word: '预约无效', count: 267, percentage: 30 },
  { word: '白屏', count: 245, percentage: 27 },
  { word: '崩溃', count: 223, percentage: 25 },
  { word: '重复扣款', count: 198, percentage: 22 },
  { word: '信息不准', count: 176, percentage: 20 },
  { word: '推送过多', count: 156, percentage: 17 }
]

function viewDetail(row: ServiceItem) {
  ElMessage.info(`查看「${row.name}」满意度详情`)
}

function viewBadReviews(row: ServiceItem) {
  ElMessage.info(`查看「${row.name}」差评列表（${Math.round(row.reviewCount * row.badRate / 100)}条）`)
}

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

function refreshData() {
  ElMessage.success('满意度数据已刷新')
}

function handleExport() {
  ElMessage.info('正在导出满意度分析报表...')
}

let timer: any
onMounted(() => {
  timer = setInterval(() => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.analytics-container { padding: 0; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; display: flex; align-items: center; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.card-wrapper {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 18px;
  border: 1px solid $border-lighter;
  box-shadow: $shadow-sm;
  margin-bottom: 20px;
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid $border-lighter;
  .card-title { font-size: 15px; font-weight: 600; color: $text-primary; display: flex; align-items: center; gap: 8px; }
  .header-right { display: flex; align-items: center; }
}

.satisfaction-hero {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(135deg, #f0f5ff 0%, #ffffff 50%, #f0f7ff 100%);
  border-left: 5px solid #1E4FA5;

  .hero-left {
    .hero-label { font-size: 13px; color: $text-secondary; margin-bottom: 8px; }
    .hero-score { margin-bottom: 8px;
      .score-num { font-size: 52px; font-weight: 800; color: #1E4FA5; line-height: 1; }
      .score-unit { font-size: 16px; color: $text-secondary; margin-left: 4px; }
    }
    .hero-change { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-bottom: 16px;
      &.change-up { color: $success-color; }
      &.change-down { color: $danger-color; }
      .change-period { font-size: 12px; color: $text-secondary; font-weight: 400; margin-left: 8px; }
    }
    .hero-meta { display: flex; gap: 24px; }
    .meta-item {
      .meta-label { display: block; font-size: 11px; color: $text-secondary; margin-bottom: 2px; }
      .meta-value { font-size: 16px; font-weight: 700; color: $text-primary; }
    }
  }
  .hero-right { flex-shrink: 0; }
}

.satisfaction-table {
  :deep(.el-table__cell) { padding: 10px 8px; font-size: 13px; }
  .dept-tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    background: $primary-color; color: #fff; font-size: 11px; font-weight: 500;
    opacity: 0.9;
  }
  .trend-up { color: $success-color; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px; }
  .trend-down { color: $danger-color; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px; }
  .trend-stable { color: $text-secondary; display: flex; align-items: center; justify-content: center; gap: 2px; }
}

.pagination-wrapper { display: flex; justify-content: flex-end; padding-top: 16px; }

.keyword-rank {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;

  .keyword-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 8px;
    transition: all 0.2s;
    &:hover { background: $border-extra-light; }

    .keyword-rank-num {
      width: 24px; height: 24px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: $text-secondary;
      background: $border-extra-light; flex-shrink: 0;
      &.rank-top { background: $primary-color; color: #fff; }
    }
    .keyword-info { flex: 1; min-width: 0;
      .keyword-word { font-size: 13px; font-weight: 500; color: $text-primary; margin-bottom: 4px; }
      .keyword-bar-wrapper { height: 4px; background: $border-lighter; border-radius: 2px; overflow: hidden;
        .keyword-bar { height: 100%; border-radius: 2px; transition: width 0.6s ease;
          background: linear-gradient(90deg, #79BBFF, #1E4FA5); }
      }
    }
    .keyword-stats { flex-shrink: 0; text-align: right;
      .keyword-count { display: block; font-size: 13px; font-weight: 600; color: $text-primary; }
      .keyword-pct { font-size: 11px; color: $text-secondary; }
    }
  }
}
</style>
