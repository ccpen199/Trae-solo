<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">监管报表中心</h1>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">平台合规率报表</div>
          <div ref="platformComplianceRef" style="height: 350px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">投诉热点分析</div>
          <div ref="complaintHotspotRef" style="height: 350px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">处罚金额统计</div>
          <div ref="penaltyStatsRef" style="height: 350px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">证件到期预警</div>
          <div ref="expiryWarningRef" style="height: 350px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-container">
          <div class="chart-title">区域风险分析</div>
          <div ref="riskAnalysisRef" style="height: 400px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-card-title">司机合规率</div>
          <div class="stat-card-value" style="color: #3b82f6">{{ stats.driverComplianceRate }}%</div>
          <div class="stat-card-sub">共 {{ stats.totalDrivers }} 名司机</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-card-title">待处理投诉</div>
          <div class="stat-card-value" style="color: #f59e0b">{{ stats.pendingComplaints }}</div>
          <div class="stat-card-sub">需要及时处理</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-card-title">待处理工单</div>
          <div class="stat-card-value" style="color: #ef4444">{{ stats.pendingWorkOrders }}</div>
          <div class="stat-card-sub">需要尽快派单</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const stats = ref({
  driverComplianceRate: 0,
  totalDrivers: 0,
  pendingComplaints: 0,
  pendingWorkOrders: 0
})

const platformComplianceRef = ref(null)
const complaintHotspotRef = ref(null)
const penaltyStatsRef = ref(null)
const expiryWarningRef = ref(null)
const riskAnalysisRef = ref(null)

let platformComplianceChart = null
let complaintHotspotChart = null
let penaltyStatsChart = null
let expiryWarningChart = null
let riskAnalysisChart = null

const initPlatformComplianceChart = (rawData) => {
  if (!platformComplianceRef.value) return
  platformComplianceChart = echarts.init(platformComplianceRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['司机合规率', '车辆合规率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: rawData.map(i => i.name) },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '司机合规率',
        type: 'bar',
        data: rawData.map(i => i.driver_compliance_rate),
        itemStyle: { color: '#3b82f6' },
        label: { show: true, position: 'top', formatter: '{c}%' }
      },
      {
        name: '车辆合规率',
        type: 'bar',
        data: rawData.map(i => i.vehicle_compliance_rate),
        itemStyle: { color: '#10b981' },
        label: { show: true, position: 'top', formatter: '{c}%' }
      }
    ]
  }
  platformComplianceChart.setOption(option)
}

const initComplaintHotspotChart = (rawData) => {
  if (!complaintHotspotRef.value) return
  complaintHotspotChart = echarts.init(complaintHotspotRef.value)
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}件 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: rawData.map((item, index) => ({
        value: item.count,
        name: item.complaint_type,
        itemStyle: { color: colors[index % colors.length] }
      }))
    }]
  }
  complaintHotspotChart.setOption(option)
}

const initPenaltyStatsChart = (rawData) => {
  if (!penaltyStatsRef.value) return
  penaltyStatsChart = echarts.init(penaltyStatsRef.value)
  const byPlatform = rawData.by_platform || []
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['处罚金额'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: byPlatform.map(i => i.platform_name) },
    yAxis: { type: 'value', name: '金额(元)' },
    series: [
      {
        name: '处罚金额',
        type: 'bar',
        data: byPlatform.map(i => i.total_amount),
        itemStyle: { color: '#ef4444' },
        label: { show: true, position: 'top' }
      }
    ]
  }
  penaltyStatsChart.setOption(option)
}

const initExpiryWarningChart = (rawData) => {
  if (!expiryWarningRef.value) return
  expiryWarningChart = echarts.init(expiryWarningRef.value)
  const drivers = rawData.drivers || []
  const vehicles = rawData.vehicles || []
  const now = new Date()
  const calcDaysDiff = (dateStr) => {
    if (!dateStr) return 999
    const expiryDate = new Date(dateStr)
    const diff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
    return diff
  }
  const countByRange = (items, dateField, ranges) => {
    return ranges.map(maxDays => 
      items.filter(item => {
        const diff = calcDaysDiff(item[dateField])
        return diff >= 0 && diff <= maxDays
      }).length
    )
  }
  const driverExpiry = countByRange(drivers, 'driver_license_expiry_date', [7, 15, 30, 90])
  const vehicleExpiry = countByRange(vehicles, 'operation_license_expiry_date', [7, 15, 30, 90])
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['驾驶证到期', '营运证到期'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: ['7天内', '15天内', '30天内', '90天内'] },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        name: '驾驶证到期',
        type: 'bar',
        stack: 'total',
        data: driverExpiry,
        itemStyle: { color: '#ef4444' },
        label: { show: true }
      },
      {
        name: '营运证到期',
        type: 'bar',
        stack: 'total',
        data: vehicleExpiry,
        itemStyle: { color: '#f59e0b' },
        label: { show: true }
      }
    ]
  }
  expiryWarningChart.setOption(option)
}

const initRiskAnalysisChart = (rawData) => {
  if (!riskAnalysisRef.value) return
  riskAnalysisChart = echarts.init(riskAnalysisRef.value)
  const colors = { high: '#dc2626', medium: '#f59e0b', low: '#10b981' }
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['异常订单数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: rawData.map(i => i.region) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '异常订单数',
        type: 'bar',
        data: rawData.map(i => ({
          value: i.anomaly_count,
          itemStyle: { color: colors[i.risk_level] || '#3b82f6' }
        })),
        label: { show: true }
      }
    ]
  }
  riskAnalysisChart.setOption(option)
}

const fetchStats = async () => {
  try {
    const data = await request.get('/reports/summary')
    stats.value = {
      driverComplianceRate: data.drivers.compliance_rate,
      totalDrivers: data.drivers.total,
      pendingComplaints: data.complaints.pending,
      pendingWorkOrders: data.work_orders.pending
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const fetchChartsData = async () => {
  try {
    const [platformRes, complaintRes, penaltyRes, expiryRes, riskRes] = await Promise.all([
      request.get('/reports/platform-compliance'),
      request.get('/reports/complaint-hotspots'),
      request.get('/reports/penalty-summary'),
      request.get('/reports/expiring-documents'),
      request.get('/reports/regional-risk')
    ])
    await nextTick()
    const platformData = platformRes.data || []
    const complaintData = complaintRes.data || []
    const penaltyData = penaltyRes
    const expiryData = expiryRes
    const riskData = riskRes.data || []
    setTimeout(() => {
      initPlatformComplianceChart(platformData)
      initComplaintHotspotChart(complaintData)
      initPenaltyStatsChart(penaltyData)
      initExpiryWarningChart(expiryData)
      initRiskAnalysisChart(riskData)
    }, 50)
  } catch (error) {
    console.error('图表数据获取失败:', error)
    ElMessage.error('获取图表数据失败')
  }
}

const handleResize = () => {
  platformComplianceChart?.resize()
  complaintHotspotChart?.resize()
  penaltyStatsChart?.resize()
  expiryWarningChart?.resize()
  riskAnalysisChart?.resize()
}

onMounted(() => {
  fetchStats()
  fetchChartsData()
  window.addEventListener('resize', handleResize)
})
</script>
