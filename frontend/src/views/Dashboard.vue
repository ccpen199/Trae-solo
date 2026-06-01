<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">监管总览仪表盘</h1>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="4" v-for="stat in statistics" :key="stat.title">
        <div class="stat-card">
          <div class="stat-card-title">{{ stat.title }}</div>
          <div v-if="loading" class="loading-placeholder stat-placeholder"></div>
          <div v-else class="stat-card-value" :style="{ color: stat.color }">
            {{ stat.value }}<span v-if="stat.unit" style="font-size: 14px; margin-left: 4px">{{ stat.unit }}</span>
          </div>
          <div v-if="loading" class="loading-placeholder subtitle-placeholder"></div>
          <div v-else class="stat-card-sub">{{ stat.subtitle }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">平台合规率统计</div>
          <div v-if="loading" class="loading-placeholder chart-placeholder"></div>
          <div v-else ref="platformChartRef" style="height: 300px"></div>
          <el-table :data="platformDetail" border size="small" style="margin-top: 12px">
            <el-table-column prop="name" label="平台名称" min-width="120" />
            <el-table-column prop="driver_compliance_rate" label="司机合规率" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.driver_compliance_rate >= 90 ? '#10b981' : row.driver_compliance_rate >= 70 ? '#f59e0b' : '#ef4444' }">{{ row.driver_compliance_rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="vehicle_compliance_rate" label="车辆合规率" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.vehicle_compliance_rate >= 90 ? '#10b981' : row.vehicle_compliance_rate >= 70 ? '#f59e0b' : '#ef4444' }">{{ row.vehicle_compliance_rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="total_drivers" label="司机数" width="80" align="center" />
            <el-table-column prop="total_vehicles" label="车辆数" width="80" align="center" />
            <el-table-column prop="total_orders" label="订单数" width="80" align="center" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">投诉类型分布</div>
          <div v-if="loading" class="loading-placeholder chart-placeholder"></div>
          <div v-else ref="complaintChartRef" style="height: 300px"></div>
          <el-table :data="complaintDetail" border size="small" style="margin-top: 12px">
            <el-table-column prop="complaint_type" label="投诉类型" min-width="120" />
            <el-table-column prop="count" label="投诉数量" width="100" align="center" />
            <el-table-column prop="pending_count" label="待处理" width="80" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.pending_count > 0 ? '#ef4444' : '#10b981' }">{{ row.pending_count }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">处罚金额统计</div>
          <div v-if="loading" class="loading-placeholder chart-placeholder"></div>
          <div v-else ref="penaltyChartRef" style="height: 300px"></div>
          <el-table :data="penaltyDetail" border size="small" style="margin-top: 12px">
            <el-table-column prop="platform_name" label="平台" min-width="120" />
            <el-table-column prop="total_amount" label="处罚金额(元)" width="120" align="right">
              <template #default="{ row }">
                <span style="color: #ef4444; font-weight: 600">{{ row.total_amount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="案件数" width="80" align="center" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">区域风险分布</div>
          <div v-if="loading" class="loading-placeholder chart-placeholder"></div>
          <div v-else ref="riskChartRef" style="height: 300px"></div>
          <el-table :data="riskDetail" border size="small" style="margin-top: 12px">
            <el-table-column prop="region" label="区域" min-width="120" />
            <el-table-column prop="total_orders" label="订单总数" width="100" align="center" />
            <el-table-column prop="anomaly_count" label="异常订单" width="100" align="center">
              <template #default="{ row }">
                <span style="color: #ef4444; font-weight: 600">{{ row.anomaly_count }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="anomaly_rate" label="异常率" width="80" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.anomaly_rate > 20 ? '#ef4444' : row.anomaly_rate > 10 ? '#f59e0b' : '#10b981' }">{{ row.anomaly_rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="risk_level" label="风险等级" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.risk_level === 'high' ? 'danger' : row.risk_level === 'medium' ? 'warning' : 'success'" size="small">
                  {{ row.risk_level === 'high' ? '高' : row.risk_level === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">证照到期预警</div>
          <el-table :data="expiryDriverList" border size="small">
            <el-table-column label="驾驶证即将到期" header-align="center">
              <el-table-column prop="name" label="司机姓名" min-width="100" />
              <el-table-column prop="driver_license_no" label="驾驶证号" min-width="140" show-overflow-tooltip />
              <el-table-column prop="driver_license_expiry_date" label="到期日期" width="120" align="center">
                <template #default="{ row }">
                  <span :style="{ color: getDaysDiff(row.driver_license_expiry_date) <= 15 ? '#ef4444' : '#f59e0b' }">{{ row.driver_license_expiry_date }}</span>
                </template>
              </el-table-column>
              <el-table-column label="剩余天数" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getDaysDiff(row.driver_license_expiry_date) <= 0 ? 'danger' : getDaysDiff(row.driver_license_expiry_date) <= 7 ? 'danger' : 'warning'" size="small">
                    {{ getDaysDiff(row.driver_license_expiry_date) <= 0 ? '已过期' + Math.abs(getDaysDiff(row.driver_license_expiry_date)) + '天' : getDaysDiff(row.driver_license_expiry_date) + '天' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="platform_name" label="所属平台" width="100" />
            </el-table-column>
          </el-table>
          <div v-if="expiryDriverList.length === 0" class="no-expiry-data">暂无即将到期的驾驶证</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">营运证到期预警</div>
          <el-table :data="expiryVehicleList" border size="small">
            <el-table-column label="营运证即将到期" header-align="center">
              <el-table-column prop="plate_no" label="车牌号" min-width="100" />
              <el-table-column prop="operation_license_no" label="营运证号" min-width="140" show-overflow-tooltip />
              <el-table-column prop="operation_license_expiry_date" label="到期日期" width="120" align="center">
                <template #default="{ row }">
                  <span :style="{ color: getDaysDiff(row.operation_license_expiry_date) <= 15 ? '#ef4444' : '#f59e0b' }">{{ row.operation_license_expiry_date }}</span>
                </template>
              </el-table-column>
              <el-table-column label="剩余天数" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getDaysDiff(row.operation_license_expiry_date) <= 0 ? 'danger' : getDaysDiff(row.operation_license_expiry_date) <= 7 ? 'danger' : 'warning'" size="small">
                    {{ getDaysDiff(row.operation_license_expiry_date) <= 0 ? '已过期' + Math.abs(getDaysDiff(row.operation_license_expiry_date)) + '天' : getDaysDiff(row.operation_license_expiry_date) + '天' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="platform_name" label="所属平台" width="100" />
            </el-table-column>
          </el-table>
          <div v-if="expiryVehicleList.length === 0" class="no-expiry-data">暂无即将到期的营运证</div>
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

const loading = ref(true)

const statistics = ref([
  { title: '司机合规率', value: '--', unit: '', color: '#10b981', subtitle: '数据加载中' },
  { title: '车辆合规率', value: '--', unit: '', color: '#3b82f6', subtitle: '数据加载中' },
  { title: '订单抽查率', value: '--', unit: '', color: '#8b5cf6', subtitle: '数据加载中' },
  { title: '待处理投诉', value: '--', unit: '件', color: '#f59e0b', subtitle: '数据加载中' },
  { title: '处罚金额', value: '--', unit: '元', color: '#ef4444', subtitle: '数据加载中' },
  { title: '执法案件', value: '--', unit: '件', color: '#dc2626', subtitle: '数据加载中' }
])

const platformDetail = ref([])
const complaintDetail = ref([])
const penaltyDetail = ref([])
const riskDetail = ref([])
const expiryDriverList = ref([])
const expiryVehicleList = ref([])

const platformChartRef = ref(null)
const complaintChartRef = ref(null)
const penaltyChartRef = ref(null)
const riskChartRef = ref(null)

let platformChart = null
let complaintChart = null
let penaltyChart = null
let riskChart = null

const getDaysDiff = (dateStr) => {
  if (!dateStr) return 999
  const expiryDate = new Date(dateStr)
  const now = new Date()
  return Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
}

const fetchStatistics = async () => {
  try {
    console.log('[Dashboard] 开始获取统计数据...')
    const data = await request.get('/reports/summary')
    console.log('[Dashboard] 统计数据返回:', data)

    if (!data || typeof data !== 'object') {
      console.warn('[Dashboard] 统计数据格式错误，使用默认值')
      return
    }

    const hasDrivers = data.drivers && typeof data.drivers === 'object'
    const hasVehicles = data.vehicles && typeof data.vehicles === 'object'
    const hasOrders = data.orders && typeof data.orders === 'object'
    const hasComplaints = data.complaints && typeof data.complaints === 'object'
    const hasPenalties = data.penalties && typeof data.penalties === 'object'
    const hasCases = data.cases && typeof data.cases === 'object'

    statistics.value = [
      {
        title: '司机合规率',
        value: hasDrivers ? `${data.drivers.compliance_rate ?? '--'}%` : '--',
        unit: '',
        color: '#10b981',
        subtitle: hasDrivers ? `共 ${data.drivers.total ?? '--'} 名司机，${data.drivers.approved ?? '--'} 人合规` : '数据加载中'
      },
      {
        title: '车辆合规率',
        value: hasVehicles ? `${data.vehicles.compliance_rate ?? '--'}%` : '--',
        unit: '',
        color: '#3b82f6',
        subtitle: hasVehicles ? `共 ${data.vehicles.total ?? '--'} 辆车，${data.vehicles.approved ?? '--'} 辆合规` : '数据加载中'
      },
      {
        title: '订单抽查率',
        value: hasOrders ? `${data.orders.check_rate ?? '--'}%` : '--',
        unit: '',
        color: '#8b5cf6',
        subtitle: hasOrders ? `共 ${data.orders.total ?? '--'} 单，已查 ${data.orders.checked ?? '--'} 单` : '数据加载中'
      },
      {
        title: '待处理投诉',
        value: hasComplaints ? (data.complaints.pending ?? '--') : '--',
        unit: '件',
        color: '#f59e0b',
        subtitle: hasComplaints ? `共 ${data.complaints.total ?? '--'} 件投诉` : '数据加载中'
      },
      {
        title: '处罚金额',
        value: hasPenalties ? (data.penalties.total_fine_amount ?? '--') : '--',
        unit: '元',
        color: '#ef4444',
        subtitle: hasPenalties ? `已缴 ${data.penalties.paid_fine_amount ?? '--'} 元` : '数据加载中'
      },
      {
        title: '执法案件',
        value: hasCases ? (data.cases.total ?? '--') : '--',
        unit: '件',
        color: '#dc2626',
        subtitle: hasCases ? `待处理 ${data.cases.pending ?? '--'} 件，已结案 ${data.cases.closed ?? '--'} 件` : '数据加载中'
      }
    ]
    console.log('[Dashboard] 统计数据设置完成')
  } catch (error) {
    console.error('[Dashboard] 获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

const initPlatformChart = (rawData) => {
  console.log('[Dashboard] 初始化平台合规率图表，数据:', rawData)
  if (!platformChartRef.value) {
    console.warn('[Dashboard] platformChartRef 不存在，跳过图表初始化')
    return
  }
  try {
    if (platformChart) {
      platformChart.dispose()
    }
    platformChart = echarts.init(platformChartRef.value)
    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: rawData.map(i => i.name) },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [{
        type: 'bar',
        data: rawData.map(i => i.driver_compliance_rate),
        name: '司机合规率',
        itemStyle: {
          color: params => {
            if (params.value >= 90) return '#10b981'
            if (params.value >= 70) return '#f59e0b'
            return '#ef4444'
          }
        },
        label: { show: true, position: 'top', formatter: '{c}%' }
      }]
    }
    platformChart.setOption(option)
    console.log('[Dashboard] 平台合规率图表初始化完成')
  } catch (error) {
    console.error('[Dashboard] 平台合规率图表初始化失败:', error)
  }
}

const initComplaintChart = (rawData) => {
  console.log('[Dashboard] 初始化投诉类型分布图表，数据:', rawData)
  if (!complaintChartRef.value) {
    console.warn('[Dashboard] complaintChartRef 不存在，跳过图表初始化')
    return
  }
  try {
    if (complaintChart) {
      complaintChart.dispose()
    }
    complaintChart = echarts.init(complaintChartRef.value)
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4']
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
    complaintChart.setOption(option)
    console.log('[Dashboard] 投诉类型分布图表初始化完成')
  } catch (error) {
    console.error('[Dashboard] 投诉类型分布图表初始化失败:', error)
  }
}

const initPenaltyChart = (rawData) => {
  console.log('[Dashboard] 初始化处罚金额统计图表，数据:', rawData)
  if (!penaltyChartRef.value) {
    console.warn('[Dashboard] penaltyChartRef 不存在，跳过图表初始化')
    return
  }
  try {
    if (penaltyChart) {
      penaltyChart.dispose()
    }
    penaltyChart = echarts.init(penaltyChartRef.value)
    const byType = rawData.by_type || []
    const byPlatform = rawData.by_platform || []
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['处罚金额'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: byPlatform.map(i => i.platform_name)
      },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}元' } },
      series: [{
        name: '处罚金额',
        type: 'bar',
        data: byPlatform.map(i => i.total_amount),
        itemStyle: { color: '#ef4444' },
        label: { show: true, position: 'top', formatter: '{c}元' }
      }]
    }
    penaltyChart.setOption(option)
    console.log('[Dashboard] 处罚金额统计图表初始化完成')
  } catch (error) {
    console.error('[Dashboard] 处罚金额统计图表初始化失败:', error)
  }
}

const initRiskChart = (rawData) => {
  console.log('[Dashboard] 初始化区域风险分布图表，数据:', rawData)
  if (!riskChartRef.value) {
    console.warn('[Dashboard] riskChartRef 不存在，跳过图表初始化')
    return
  }
  try {
    if (riskChart) {
      riskChart.dispose()
    }
    riskChart = echarts.init(riskChartRef.value)
    const colors = { high: '#dc2626', medium: '#f59e0b', low: '#10b981' }
    const option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c}件异常 ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: '60%',
        data: rawData.map(item => ({
          value: item.anomaly_count,
          name: item.region,
          itemStyle: { color: colors[item.risk_level] || '#3b82f6' }
        })),
        label: { formatter: '{b}: {c}件' }
      }]
    }
    riskChart.setOption(option)
    console.log('[Dashboard] 区域风险分布图表初始化完成')
  } catch (error) {
    console.error('[Dashboard] 区域风险分布图表初始化失败:', error)
  }
}

const initChartsWithRetry = async (platformData, complaintData, penaltyData, riskData, maxRetries = 3, interval = 200) => {
  console.log(`[Dashboard] 开始初始化图表，最多重试 ${maxRetries} 次`)
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[Dashboard] 第 ${i + 1} 次尝试初始化图表...`)
    const allRefsExist = platformChartRef.value && complaintChartRef.value && penaltyChartRef.value && riskChartRef.value
    if (allRefsExist) {
      console.log('[Dashboard] 所有图表 ref 已就绪，开始初始化')
      try {
        initPlatformChart(platformData)
        initComplaintChart(complaintData)
        initPenaltyChart(penaltyData)
        initRiskChart(riskData)
        console.log('[Dashboard] 所有图表初始化成功')
      } catch (error) {
        console.error('[Dashboard] 图表初始化过程中发生错误:', error)
      }
      return true
    } else {
      console.warn(`[Dashboard] 部分 ref 未就绪，${interval}ms 后重试...`)
      console.warn('[Dashboard] 当前 ref 状态:', {
        platformChartRef: !!platformChartRef.value,
        complaintChartRef: !!complaintChartRef.value,
        penaltyChartRef: !!penaltyChartRef.value,
        riskChartRef: !!riskChartRef.value
      })
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }
  console.error(`[Dashboard] 图表初始化失败，已重试 ${maxRetries} 次`)
  return false
}

const fetchPlatformData = async () => {
  try {
    console.log('[Dashboard] 开始获取平台合规率数据...')
    const res = await request.get('/reports/platform-compliance')
    console.log('[Dashboard] 平台合规率数据返回:', res)
    if (res && res.data && Array.isArray(res.data)) {
      platformDetail.value = res.data
      console.log('[Dashboard] 平台合规率数据设置完成，共', res.data.length, '条')
      return res.data
    } else {
      console.warn('[Dashboard] 平台合规率数据格式不正确，使用空数组')
      platformDetail.value = []
      return []
    }
  } catch (error) {
    console.error('[Dashboard] 获取平台合规率数据失败:', error)
    platformDetail.value = []
    return []
  }
}

const fetchComplaintData = async () => {
  try {
    console.log('[Dashboard] 开始获取投诉类型分布数据...')
    const res = await request.get('/reports/complaint-hotspots')
    console.log('[Dashboard] 投诉类型分布数据返回:', res)
    if (res && res.data && Array.isArray(res.data)) {
      complaintDetail.value = res.data
      console.log('[Dashboard] 投诉类型分布数据设置完成，共', res.data.length, '条')
      return res.data
    } else {
      console.warn('[Dashboard] 投诉类型分布数据格式不正确，使用空数组')
      complaintDetail.value = []
      return []
    }
  } catch (error) {
    console.error('[Dashboard] 获取投诉类型分布数据失败:', error)
    complaintDetail.value = []
    return []
  }
}

const fetchPenaltyData = async () => {
  try {
    console.log('[Dashboard] 开始获取处罚金额统计数据...')
    const res = await request.get('/reports/penalty-summary')
    console.log('[Dashboard] 处罚金额统计数据返回:', res)
    if (res && res.by_platform && Array.isArray(res.by_platform)) {
      penaltyDetail.value = res.by_platform
      console.log('[Dashboard] 处罚金额统计数据设置完成，共', res.by_platform.length, '条')
      return res
    } else {
      console.warn('[Dashboard] 处罚金额统计数据格式不正确，使用空数组')
      penaltyDetail.value = []
      return { by_platform: [] }
    }
  } catch (error) {
    console.error('[Dashboard] 获取处罚金额统计数据失败:', error)
    penaltyDetail.value = []
    return { by_platform: [] }
  }
}

const fetchRiskData = async () => {
  try {
    console.log('[Dashboard] 开始获取区域风险分布数据...')
    const res = await request.get('/reports/regional-risk')
    console.log('[Dashboard] 区域风险分布数据返回:', res)
    if (res && res.data && Array.isArray(res.data)) {
      riskDetail.value = res.data
      console.log('[Dashboard] 区域风险分布数据设置完成，共', res.data.length, '条')
      return res.data
    } else {
      console.warn('[Dashboard] 区域风险分布数据格式不正确，使用空数组')
      riskDetail.value = []
      return []
    }
  } catch (error) {
    console.error('[Dashboard] 获取区域风险分布数据失败:', error)
    riskDetail.value = []
    return []
  }
}

const fetchExpiryData = async () => {
  try {
    console.log('[Dashboard] 开始获取证照到期预警数据...')
    const res = await request.get('/reports/expiring-documents')
    console.log('[Dashboard] 证照到期预警数据返回:', res)
    const allExpiryDrivers = res.drivers || []
    const allExpiryVehicles = res.vehicles || []
    expiryDriverList.value = allExpiryDrivers.filter(d => {
      const diff = getDaysDiff(d.driver_license_expiry_date)
      return diff <= 90
    })
    expiryVehicleList.value = allExpiryVehicles.filter(v => {
      const diff = getDaysDiff(v.operation_license_expiry_date)
      return diff <= 90
    })
    console.log('[Dashboard] 证照到期预警数据设置完成，驾驶证:', expiryDriverList.value.length, '条，营运证:', expiryVehicleList.value.length, '条')
  } catch (error) {
    console.error('[Dashboard] 获取证照到期预警数据失败:', error)
    expiryDriverList.value = []
    expiryVehicleList.value = []
  }
}

const fetchChartsData = async () => {
  try {
    console.log('[Dashboard] 开始获取所有图表数据...')

    const [platformData, complaintData, penaltyData, riskData] = await Promise.all([
      fetchPlatformData(),
      fetchComplaintData(),
      fetchPenaltyData(),
      fetchRiskData()
    ])

    await fetchExpiryData()

    await nextTick()
    console.log('[Dashboard] DOM 更新完成，开始初始化图表')

    setTimeout(() => {
      initChartsWithRetry(platformData, complaintData, penaltyData, riskData)
    }, 50)
  } catch (error) {
    console.error('[Dashboard] 图表数据获取失败:', error)
    ElMessage.error('获取图表数据失败')
  } finally {
    loading.value = false
    console.log('[Dashboard] 数据加载完成，loading 状态关闭')
  }
}

const handleResize = () => {
  try {
    platformChart?.resize()
    complaintChart?.resize()
    penaltyChart?.resize()
    riskChart?.resize()
  } catch (error) {
    console.error('[Dashboard] 图表 resize 失败:', error)
  }
}

onMounted(async () => {
  console.log('[Dashboard] 组件挂载，开始加载数据')
  try {
    await Promise.all([
      fetchStatistics(),
      fetchChartsData()
    ])
  } catch (error) {
    console.error('[Dashboard] 数据加载异常:', error)
    loading.value = false
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  console.log('[Dashboard] 组件卸载，清理资源')
  window.removeEventListener('resize', handleResize)
  try {
    platformChart?.dispose()
    complaintChart?.dispose()
    penaltyChart?.dispose()
    riskChart?.dispose()
  } catch (error) {
    console.error('[Dashboard] 图表销毁失败:', error)
  }
})
</script>

<style scoped>
.loading-placeholder {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.stat-placeholder {
  height: 40px;
  margin: 8px 0;
}

.subtitle-placeholder {
  height: 16px;
  width: 80%;
}

.chart-placeholder {
  height: 300px;
}

.no-expiry-data {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
