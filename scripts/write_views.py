import os
BASE = '/Users/chen/Documents/trae_projects/local_projects/may-63448/frontend/src/views'

dashboard = r'''<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">监管总览仪表盘</h1>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6" v-for="stat in statistics" :key="stat.title">
        <div class="stat-card">
          <div class="stat-card-title">{{ stat.title }}</div>
          <div class="stat-card-value" :style="{ color: stat.color }">
            {{ stat.value }}<span v-if="stat.unit" style="font-size: 14px; margin-left: 4px">{{ stat.unit }}</span>
          </div>
          <div class="stat-card-sub">{{ stat.subtitle }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">平台合规率统计</div>
          <div ref="platformChartRef" style="height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">投诉类型分布</div>
          <div ref="complaintChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">处罚金额趋势</div>
          <div ref="penaltyChartRef" style="height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">区域风险分布</div>
          <div ref="riskChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const statistics = ref([])
const platformChartRef = ref(null)
const complaintChartRef = ref(null)
const penaltyChartRef = ref(null)
const riskChartRef = ref(null)

let platformChart = null
let complaintChart = null
let penaltyChart = null
let riskChart = null

const fetchStatistics = async () => {
  loading.value = true
  try {
    const data = await request.get('/reports/summary')
    const d = data.drivers || {}
    const v = data.vehicles || {}
    const o = data.orders || {}
    const c = data.complaints || {}
    const w = data.workOrders || {}
    const p = data.penalties || {}
    statistics.value = [
      { title: '司机合规率', value: (d.complianceRate || 0) + '%', unit: '', color: '#10b981', subtitle: '共 ' + (d.total || 0) + ' 名司机，' + (d.approved || 0) + ' 人合规' },
      { title: '车辆合规率', value: (v.complianceRate || 0) + '%', unit: '', color: '#3b82f6', subtitle: '共 ' + (v.total || 0) + ' 辆车，' + (v.approved || 0) + ' 辆合规' },
      { title: '订单总量', value: o.total || 0, unit: '单', color: '#8b5cf6', subtitle: '异常 ' + (o.anomaly || 0) + ' 单，抽查率 ' + (o.checkRate || 0) + '%' },
      { title: '待处理投诉', value: c.pending || 0, unit: '件', color: '#f59e0b', subtitle: '共 ' + (c.total || 0) + ' 件投诉' },
      { title: '处罚总金额', value: p.totalFineAmount || 0, unit: '元', color: '#ef4444', subtitle: '已缴 ' + (p.paidFineAmount || 0) + ' 元' },
      { title: '待处理工单', value: w.pending || 0, unit: '件', color: '#dc2626', subtitle: '处理中 ' + (w.processing || 0) + ' 件' }
    ]
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

const barColor = (v) => v >= 90 ? '#10b981' : v >= 70 ? '#f59e0b' : '#ef4444'

const initPlatformChart = (rawData) => {
  if (!platformChartRef.value) return
  platformChart = echarts.init(platformChartRef.value)
  const items = rawData.data || []
  const names = items.map(i => i.name)
  const driverRates = items.map(i => i.driverComplianceRate)
  const vehicleRates = items.map(i => i.vehicleComplianceRate)
  platformChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['司机合规率', '车辆合规率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: names },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '司机合规率', type: 'bar', data: driverRates, itemStyle: { color: (p) => barColor(p.value) }, label: { show: true, position: 'top', formatter: '{c}%' } },
      { name: '车辆合规率', type: 'bar', data: vehicleRates, itemStyle: { color: (p) => barColor(p.value) }, label: { show: true, position: 'top', formatter: '{c}%' } }
    ]
  })
}

const initComplaintChart = (rawData) => {
  if (!complaintChartRef.value) return
  complaintChart = echarts.init(complaintChartRef.value)
  const items = rawData.data || []
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4']
  complaintChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: items.map((item, index) => ({
        value: item.count,
        name: item.complaintType,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  })
}

const initPenaltyChart = (rawData) => {
  if (!penaltyChartRef.value) return
  penaltyChart = echarts.init(penaltyChartRef.value)
  const items = rawData.byType || []
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
  const typeMap = { fine: '罚款', suspend_license: '暂扣证照' }
  penaltyChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}元' },
      data: items.map((item, index) => ({
        value: item.totalAmount,
        name: typeMap[item.penaltyType] || item.penaltyType,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  })
}

const initRiskChart = (rawData) => {
  if (!riskChartRef.value) return
  riskChart = echarts.init(riskChartRef.value)
  const items = rawData.data || []
  const colors = { high: '#dc2626', medium: '#f59e0b', low: '#10b981' }
  riskChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: '60%',
      data: items.map(item => ({
        value: item.anomalyCount,
        name: item.region,
        itemStyle: { color: colors[item.riskLevel] || '#3b82f6' }
      })),
      label: { formatter: '{b}: {c}件 ({d}%)' }
    }]
  })
}

const fetchChartsData = async () => {
  try {
    const [platformData, complaintData, penaltyData, riskData] = await Promise.all([
      request.get('/reports/platform-compliance'),
      request.get('/reports/complaint-hotspots'),
      request.get('/reports/penalty-summary'),
      request.get('/reports/regional-risk')
    ])
    await nextTick()
    initPlatformChart(platformData)
    initComplaintChart(complaintData)
    initPenaltyChart(penaltyData)
    initRiskChart(riskData)
  } catch (error) {
    ElMessage.error('获取图表数据失败')
  }
}

const handleResize = () => {
  platformChart?.resize()
  complaintChart?.resize()
  penaltyChart?.resize()
  riskChart?.resize()
}

onMounted(() => {
  fetchStatistics()
  fetchChartsData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  platformChart?.dispose()
  complaintChart?.dispose()
  penaltyChart?.dispose()
  riskChart?.dispose()
})
</script>
'''

with open(os.path.join(BASE, 'Dashboard.vue'), 'w') as f:
    f.write(dashboard)
print('Dashboard.vue written:', len(dashboard), 'bytes')
