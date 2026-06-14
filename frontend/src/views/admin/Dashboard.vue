<template>
  <div class="admin-dashboard">
    <div class="page-header mb-24">
      <div class="flex justify-between items-start flex-wrap gap-16">
        <div>
          <h2 class="page-title">管理工作台</h2>
          <p class="text-gray-500 mt-8">欢迎回来，今天是 {{ dayjs().format('YYYY年MM月DD日 dddd') }}</p>
        </div>
        <div class="flex gap-12 flex-wrap">
          <el-select v-model="quickFilter.region" placeholder="选择区域" clearable size="default" style="width: 160px" @change="applyQuickFilter">
            <el-option label="四川省" value="510000" />
            <el-option label="成都市" value="510100" />
            <el-option label="绵阳市" value="510700" />
            <el-option label="德阳市" value="510600" />
            <el-option label="宜宾市" value="511500" />
            <el-option label="南充市" value="511300" />
          </el-select>
          <el-select v-model="quickFilter.department" placeholder="选择部门" clearable size="default" style="width: 200px" @change="applyQuickFilter">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
          <el-select v-model="quickFilter.level" placeholder="办理层级" clearable size="default" style="width: 140px" @change="applyQuickFilter">
            <el-option label="省级" value="province" />
            <el-option label="市级" value="city" />
            <el-option label="区县级" value="county" />
          </el-select>
          <el-button type="primary" size="default" @click="goToServiceItems">
            <el-icon><Plus /></el-icon>发布事项
          </el-button>
        </div>
      </div>
    </div>

    <div class="card p-24 mb-24">
      <div class="flex justify-between items-center mb-20">
        <h3 class="text-18 font-semibold">事项接入统计</h3>
        <div class="flex gap-16">
          <div class="flex items-center gap-8">
            <span class="w-12 h-12 rounded-full bg-blue-500"></span>
            <span class="text-14 text-gray-600">省级事项</span>
          </div>
          <div class="flex items-center gap-8">
            <span class="w-12 h-12 rounded-full bg-green-500"></span>
            <span class="text-14 text-gray-600">市级事项</span>
          </div>
          <div class="flex items-center gap-8">
            <span class="w-12 h-12 rounded-full bg-orange-500"></span>
            <span class="text-14 text-gray-600">区县级事项</span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-20 mb-20">
        <div class="item-access-card p-20 border border-blue-100 rounded-lg bg-blue-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-14 text-gray-600">省级事项</div>
              <div class="text-32 font-bold mt-12 text-blue-600">{{ itemAccessStats.province.total }}</div>
              <div class="text-12 text-gray-500 mt-8">已发布 {{ itemAccessStats.province.published }} 项</div>
            </div>
            <div class="flex flex-col gap-8">
              <el-tag size="small" type="success">接入率 {{ itemAccessStats.province.rate }}%</el-tag>
              <div class="text-12 text-gray-500">较上月 +{{ itemAccessStats.province.increased }}</div>
            </div>
          </div>
        </div>
        <div class="item-access-card p-20 border border-green-100 rounded-lg bg-green-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-14 text-gray-600">市级事项</div>
              <div class="text-32 font-bold mt-12 text-green-600">{{ itemAccessStats.city.total }}</div>
              <div class="text-12 text-gray-500 mt-8">已发布 {{ itemAccessStats.city.published }} 项</div>
            </div>
            <div class="flex flex-col gap-8">
              <el-tag size="small" type="success">接入率 {{ itemAccessStats.city.rate }}%</el-tag>
              <div class="text-12 text-gray-500">较上月 +{{ itemAccessStats.city.increased }}</div>
            </div>
          </div>
        </div>
        <div class="item-access-card p-20 border border-orange-100 rounded-lg bg-orange-50">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-14 text-gray-600">区县级事项</div>
              <div class="text-32 font-bold mt-12 text-orange-600">{{ itemAccessStats.county.total }}</div>
              <div class="text-12 text-gray-500 mt-8">已发布 {{ itemAccessStats.county.published }} 项</div>
            </div>
            <div class="flex flex-col gap-8">
              <el-tag size="small" type="success">接入率 {{ itemAccessStats.county.rate }}%</el-tag>
              <div class="text-12 text-gray-500">较上月 +{{ itemAccessStats.county.increased }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center pt-16 border-t border-gray-100">
        <div class="flex gap-32">
          <div>
            <span class="text-14 text-gray-600">多源接入模式：</span>
            <span class="text-14 font-medium ml-8">反向链接 {{ itemAccessStats.accessMode.reverse }} 项</span>
            <span class="text-gray-300 mx-12">|</span>
            <span class="text-14 font-medium">API 推送 {{ itemAccessStats.accessMode.api }} 项</span>
            <span class="text-gray-300 mx-12">|</span>
            <span class="text-14 font-medium">联合共建 {{ itemAccessStats.accessMode.joint }} 项</span>
          </div>
          <el-button link type="primary" size="small" @click="goToServiceItems">
            查看接入详情 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div class="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-20 mb-24">
      <div v-for="(stat, index) in statsCards" :key="index" class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">{{ stat.title }}</div>
            <div class="text-28 font-bold mt-12" :class="stat.color">{{ stat.value }}</div>
            <div class="flex items-center gap-8 mt-12 text-13">
              <el-icon :color="stat.trend > 0 ? '#67c23a' : '#f56c6c'">
                <component :is="stat.trend > 0 ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
              <span :class="stat.trend > 0 ? 'text-green-500' : 'text-red-500'">
                {{ Math.abs(stat.trend) }}%
              </span>
              <span class="text-gray-400">较上周</span>
            </div>
          </div>
          <div class="stat-icon" :class="stat.bgClass">
            <el-icon :size="28" color="#fff"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
      <div class="card p-24 lg:col-span-2">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-18 font-semibold">办件趋势</h3>
          <el-radio-group v-model="trendPeriod" size="small" @change="fetchTrendData">
            <el-radio-button value="week">近7天</el-radio-button>
            <el-radio-button value="month">近30天</el-radio-button>
            <el-radio-button value="quarter">近90天</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-container" style="height: 320px">
          <v-chart :option="trendChartOption" autoresize />
        </div>
      </div>

      <div class="card p-24">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-18 font-semibold">事项类型分布</h3>
          <el-button link type="primary" size="small">查看详情</el-button>
        </div>
        <div class="chart-container" style="height: 320px">
          <v-chart :option="distributionChartOption" autoresize />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
      <div class="card p-24">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-18 font-semibold">待办预警</h3>
          <el-badge :value="pendingCount" class="item">
            <el-button link type="primary" size="small" @click="goToAlerts">处理</el-button>
          </el-badge>
        </div>
        <div class="alert-list">
          <div v-for="(alert, index) in alertList" :key="index" class="alert-item flex items-start gap-12 p-12 mb-8 rounded-lg" :class="getAlertBgClass(alert.level)">
            <el-icon :size="20" :color="getAlertColor(alert.level)">
              <component :is="alert.level === 'high' ? 'Warning' : 'InfoFilled'" />
            </el-icon>
            <div class="flex-1 min-w-0">
              <div class="text-14 font-medium truncate">{{ alert.title }}</div>
              <div class="text-12 text-gray-500 mt-2">{{ alert.content }}</div>
              <div class="text-12 text-gray-400 mt-4">{{ alert.time }}</div>
            </div>
            <el-tag :type="getAlertTagType(alert.level)" size="small">{{ alert.level === 'high' ? '紧急' : '提醒' }}</el-tag>
          </div>
        </div>
        <el-empty v-if="alertList.length === 0" description="暂无预警信息" :image-size="80" />
      </div>

      <div class="card p-24 lg:col-span-2">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-18 font-semibold">区域办件排行</h3>
          <el-button link type="primary" size="small">查看全部</el-button>
        </div>
        <div class="chart-container" style="height: 320px">
          <v-chart :option="regionChartOption" autoresize />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-20">
      <div class="card p-24">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-18 font-semibold">最新办件</h3>
          <el-button link type="primary" size="small" @click="goToApplications">查看全部</el-button>
        </div>
        <el-table :data="recentApplications" size="small">
          <el-table-column prop="application_no" label="申请编号" width="160" />
          <el-table-column prop="service_item_name" label="事项名称" min-width="180" />
          <el-table-column prop="applicant_name" label="申请人" width="100" />
          <el-table-column prop="submit_time" label="提交时间" width="160">
            <template #default="{ row }">
              {{ dayjs(row.submit_time).format('YYYY-MM-DD HH:mm') }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewApplication(row)">
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card p-24">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-18 font-semibold">最新评价</h3>
          <el-button link type="primary" size="small" @click="goToEvaluations">查看全部</el-button>
        </div>
        <div class="evaluation-list">
          <div v-for="(evalItem, index) in recentEvaluations" :key="index" class="eval-item p-12 mb-8 rounded-lg bg-gray-50">
            <div class="flex justify-between items-center mb-8">
              <div class="flex items-center gap-8">
                <el-avatar :size="28" :src="evalItem.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="text-14 font-medium">{{ evalItem.applicant_name }}</span>
              </div>
              <el-rate v-model="evalItem.rating" disabled :max="5" size="small" />
            </div>
            <div class="text-13 text-gray-600 mb-8">{{ evalItem.service_item_name }}</div>
            <div class="text-13 text-gray-700">{{ evalItem.content }}</div>
            <div class="text-12 text-gray-400 mt-8">{{ dayjs(evalItem.created_at).format('YYYY-MM-DD HH:mm') }}</div>
          </div>
        </div>
        <el-empty v-if="recentEvaluations.length === 0" description="暂无评价信息" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { statisticsApi, applicationApi, alertApi, evaluationApi, departmentApi, serviceItemApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
])

const router = useRouter()

const loading = ref(false)
const trendPeriod = ref('week')
const pendingCount = ref(12)
const departments = ref([])

const quickFilter = reactive({
  region: '',
  department: '',
  level: ''
})

const itemAccessStats = reactive({
  province: { total: 486, published: 458, rate: 94.2, increased: 28 },
  city: { total: 1256, published: 1185, rate: 94.3, increased: 86 },
  county: { total: 3528, published: 3256, rate: 92.3, increased: 156 },
  accessMode: { reverse: 2856, api: 1865, joint: 549 }
})

const overviewData = ref({
  today_applications: 0,
  pending_applications: 0,
  processing_applications: 0,
  completed_applications: 0,
  completion_rate: 0,
  satisfaction: 0
})

const statsCards = computed(() => [
  {
    title: '今日办件',
    value: overviewData.value.today_applications || 128,
    trend: 12.5,
    color: 'text-blue-500',
    bgClass: 'bg-blue-500',
    icon: 'Document'
  },
  {
    title: '待受理',
    value: overviewData.value.pending_applications || 36,
    trend: -8.3,
    color: 'text-orange-500',
    bgClass: 'bg-orange-500',
    icon: 'Clock'
  },
  {
    title: '办理中',
    value: overviewData.value.processing_applications || 58,
    trend: 5.2,
    color: 'text-warning-500',
    bgClass: 'bg-yellow-500',
    icon: 'Loading'
  },
  {
    title: '已完成',
    value: overviewData.value.completed_applications || 1256,
    trend: 15.8,
    color: 'text-green-500',
    bgClass: 'bg-green-500',
    icon: 'CircleCheck'
  },
  {
    title: '办结率',
    value: (overviewData.value.completion_rate || 94.2) + '%',
    trend: 2.1,
    color: 'text-purple-500',
    bgClass: 'bg-purple-500',
    icon: 'TrendCharts'
  },
  {
    title: '满意度',
    value: (overviewData.value.satisfaction || 96.8) + '%',
    trend: 1.5,
    color: 'text-pink-500',
    bgClass: 'bg-pink-500',
    icon: 'Star'
  }
])

const trendChartOption = ref({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#ebeef5',
    borderWidth: 1,
    textStyle: { color: '#303133' }
  },
  legend: {
    data: ['办件量', '办结量'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['01-14', '01-15', '01-16', '01-17', '01-18', '01-19', '01-20']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '办件量',
      type: 'line',
      smooth: true,
      data: [120, 132, 101, 134, 90, 230, 210],
      lineStyle: { color: '#1e88e5', width: 3 },
      itemStyle: { color: '#1e88e5' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 136, 229, 0.3)' },
          { offset: 1, color: 'rgba(30, 136, 229, 0.05)' }
        ])
      }
    },
    {
      name: '办结量',
      type: 'line',
      smooth: true,
      data: [100, 120, 98, 125, 85, 210, 195],
      lineStyle: { color: '#67c23a', width: 3 },
      itemStyle: { color: '#67c23a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
      }
    }
  ]
})

const distributionChartOption = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: '5%',
    top: 'center',
    itemWidth: 12,
    itemHeight: 12,
    textStyle: { fontSize: 12 }
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: 335, name: '行政许可', itemStyle: { color: '#1e88e5' } },
        { value: 310, name: '公共服务', itemStyle: { color: '#67c23a' } },
        { value: 234, name: '行政确认', itemStyle: { color: '#e6a23c' } },
        { value: 135, name: '行政给付', itemStyle: { color: '#909399' } },
        { value: 148, name: '其他', itemStyle: { color: '#9c27b0' } }
      ]
    }
  ]
})

const regionChartOption = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'value'
  },
  yAxis: {
    type: 'category',
    data: ['成都市', '绵阳市', '德阳市', '宜宾市', '南充市', '泸州市', '达州市', '乐山市']
  },
  series: [
    {
      type: 'bar',
      data: [856, 623, 458, 385, 342, 298, 265, 234],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1e88e5' },
          { offset: 1, color: '#64b5f6' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: 20
    }
  ]
})

const alertList = ref([
  {
    id: 1,
    level: 'high',
    title: '办件超时预警',
    content: '办件 SL202401150001 已超过办理时限1个工作日',
    time: '10分钟前'
  },
  {
    id: 2,
    level: 'high',
    title: '差评预警',
    content: '今日收到2条差评，需要及时处理整改',
    time: '30分钟前'
  },
  {
    id: 3,
    level: 'medium',
    title: '积压办件预警',
    content: '市场监管局窗口当前待办件数已超过20件',
    time: '1小时前'
  },
  {
    id: 4,
    level: 'medium',
    title: '系统异常',
    content: '数据同步服务出现异常，已自动重试3次',
    time: '2小时前'
  },
  {
    id: 5,
    level: 'low',
    title: '待办提醒',
    content: '您有5个待办事项即将到期，请及时处理',
    time: '3小时前'
  }
])

const recentApplications = ref([])
const recentEvaluations = ref([])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    accepted: 'primary',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待受理',
    accepted: '已受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  }
  return texts[status] || status
}

const getAlertBgClass = (level) => {
  const classes = {
    high: 'bg-red-50',
    medium: 'bg-yellow-50',
    low: 'bg-blue-50'
  }
  return classes[level] || 'bg-gray-50'
}

const getAlertColor = (level) => {
  const colors = {
    high: '#f56c6c',
    medium: '#e6a23c',
    low: '#1e88e5'
  }
  return colors[level] || '#909399'
}

const getAlertTagType = (level) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'primary'
  }
  return types[level] || 'info'
}

const fetchOverview = async () => {
  try {
    const res = await statisticsApi.overview()
    if (res.code === 200) {
      overviewData.value = res.data || {}
    }
  } catch (e) {}
}

const fetchTrendData = async () => {
  try {
    const res = await statisticsApi.trend({ period: trendPeriod.value })
    if (res.code === 200 && res.data) {
      const data = res.data
      trendChartOption.value.xAxis.data = data.dates
      trendChartOption.value.series[0].data = data.applications
      trendChartOption.value.series[1].data = data.completed
    }
  } catch (e) {}
}

const fetchRegionData = async () => {
  try {
    const res = await statisticsApi.byRegion()
    if (res.code === 200 && res.data) {
      const data = res.data
      regionChartOption.value.yAxis.data = data.regions.map(r => r.name)
      regionChartOption.value.series[0].data = data.regions.map(r => r.value)
    }
  } catch (e) {}
}

const fetchRecentApplications = async () => {
  try {
    const res = await applicationApi.list({ page: 1, pageSize: 5 })
    if (res.code === 200) {
      recentApplications.value = res.data?.list || res.data || mockApplications
    } else {
      recentApplications.value = mockApplications
    }
  } catch (e) {
    recentApplications.value = mockApplications
  }
}

const fetchRecentAlerts = async () => {
  try {
    const res = await alertApi.list({ page: 1, pageSize: 5, status: 'pending' })
    if (res.code === 200) {
      alertList.value = res.data?.list || res.data || alertList.value
      pendingCount.value = res.data?.total || 12
    }
  } catch (e) {}
}

const fetchRecentEvaluations = async () => {
  try {
    const res = await evaluationApi.list({ page: 1, pageSize: 3 })
    if (res.code === 200) {
      recentEvaluations.value = res.data?.list || res.data || mockEvaluations
    } else {
      recentEvaluations.value = mockEvaluations
    }
  } catch (e) {
    recentEvaluations.value = mockEvaluations
  }
}

const applyQuickFilter = () => {
  ElMessage.success('筛选条件已应用')
  fetchOverview()
  fetchTrendData()
  fetchRecentApplications()
}

const goToServiceItems = () => {
  const params = {}
  if (quickFilter.region) params.region_code = quickFilter.region
  if (quickFilter.department) params.department_id = quickFilter.department
  if (quickFilter.level) params.region_level = quickFilter.level
  router.push({ path: '/admin/service-items', query: params })
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {
    departments.value = [
      { id: 1, name: '市场监督管理局' },
      { id: 2, name: '人力资源和社会保障厅' },
      { id: 3, name: '公安厅' },
      { id: 4, name: '自然资源厅' },
      { id: 5, name: '住房和城乡建设厅' }
    ]
  }
}

const fetchItemAccessStats = async () => {
  try {
    const res = await serviceItemApi.list({ page: 1, pageSize: 1 })
    if (res.code === 200) {
      const total = res.data?.total || 5270
      itemAccessStats.province.total = Math.floor(total * 0.09)
      itemAccessStats.city.total = Math.floor(total * 0.24)
      itemAccessStats.county.total = total - itemAccessStats.province.total - itemAccessStats.city.total
    }
  } catch (e) {}
}

const goToApplications = () => {
  router.push('/admin/applications')
}

const goToAlerts = () => {
  router.push('/admin/alerts')
}

const goToEvaluations = () => {
  router.push('/admin/evaluations')
}

const handleViewApplication = (row) => {
  router.push(`/admin/applications/${row.id}`)
}

const mockApplications = [
  {
    id: 1,
    application_no: 'SL202401200001',
    service_item_name: '个体工商户营业执照办理',
    applicant_name: '张三',
    submit_time: '2024-01-20 10:30:00',
    status: 'pending'
  },
  {
    id: 2,
    application_no: 'SL202401200002',
    service_item_name: '社保卡申领',
    applicant_name: '李四',
    submit_time: '2024-01-20 09:45:00',
    status: 'processing'
  },
  {
    id: 3,
    application_no: 'SL202401190003',
    service_item_name: '身份证补办',
    applicant_name: '王五',
    submit_time: '2024-01-19 16:20:00',
    status: 'completed'
  },
  {
    id: 4,
    application_no: 'SL202401190004',
    service_item_name: '不动产权证办理',
    applicant_name: '赵六',
    submit_time: '2024-01-19 14:10:00',
    status: 'accepted'
  },
  {
    id: 5,
    application_no: 'SL202401180005',
    service_item_name: '驾驶证换证',
    applicant_name: '钱七',
    submit_time: '2024-01-18 11:30:00',
    status: 'rejected'
  }
]

const mockEvaluations = [
  {
    id: 1,
    applicant_name: '张三',
    avatar: '',
    service_item_name: '个体工商户营业执照办理',
    rating: 5,
    content: '办理速度很快，工作人员态度很好，非常满意！',
    created_at: '2024-01-20 10:30:00'
  },
  {
    id: 2,
    applicant_name: '李四',
    avatar: '',
    service_item_name: '社保卡申领',
    rating: 2,
    content: '办理时间太长，等了一周还没有消息，希望能改进。',
    created_at: '2024-01-19 14:20:00'
  },
  {
    id: 3,
    applicant_name: '王五',
    avatar: '',
    service_item_name: '身份证补办',
    rating: 4,
    content: '整体服务不错，就是现场拍照需要排队。',
    created_at: '2024-01-18 09:15:00'
  }
]

onMounted(() => {
  fetchDepartments()
  fetchOverview()
  fetchTrendData()
  fetchRegionData()
  fetchRecentApplications()
  fetchRecentAlerts()
  fetchRecentEvaluations()
  fetchItemAccessStats()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stat-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-28 {
  font-size: 28px;
}

.bg-yellow-500 {
  background-color: #e6a23c;
}

.bg-pink-500 {
  background-color: #ec4899;
}

.text-warning-500 {
  color: #e6a23c;
}

.text-pink-500 {
  color: #ec4899;
}

.w-12 {
  width: 12px;
  height: 12px;
}

.h-12 {
  width: 12px;
  height: 12px;
}

.rounded-full {
  border-radius: 50%;
}

.item-access-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.text-32 {
  font-size: 32px;
}
</style>
