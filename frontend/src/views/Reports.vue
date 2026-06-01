<template>
  <div class="reports">
    <div class="page-header">
      <h2>数据报表</h2>
      <el-button type="success" @click="exportCSV">
        <el-icon><Download /></el-icon>
        导出报表
      </el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon :size="24"><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.total_alarms ?? 0 }}</div>
              <div class="stat-label">总警情数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.active_alarms ?? 0 }}</div>
              <div class="stat-label">活跃警情</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon :size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.completed_alarms ?? 0 }}</div>
              <div class="stat-label">已处置</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);">
              <el-icon :size="24"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.false_alarm_rate ?? '0' }}<span class="stat-unit">%</span></div>
              <div class="stat-label">误报率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.avg_response_minutes ?? '0' }}<span class="stat-unit">min</span></div>
              <div class="stat-label">平均响应时间</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);">
              <el-icon :size="24"><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.avg_arrival_minutes ?? '0' }}<span class="stat-unit">min</span></div>
              <div class="stat-label">平均到场时间</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="chart-card" v-loading="loading">
          <template #header><span class="card-title">灾种分布</span></template>
          <v-chart class="chart" :option="disasterPieOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" v-loading="loading">
          <template #header><span class="card-title">警情等级分布</span></template>
          <v-chart class="chart" :option="levelBarOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" v-loading="loading">
          <template #header><span class="card-title">站点出动力量</span></template>
          <v-chart class="chart" :option="stationBarOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" style="margin-top: 16px;" v-loading="loading">
      <template #header><span class="card-title">重点场所风险</span></template>
      <el-table :data="summary.high_risk_locations ?? []" border stripe max-height="320">
        <el-table-column prop="location_name" label="场所名称" min-width="140" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="risk_level" label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.risk_level)" effect="dark">{{ row.risk_level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location_type" label="场所类型" width="120" align="center" />
        <el-table-column prop="alarm_count" label="警情数" width="90" align="center" />
      </el-table>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="10">
        <el-card class="chart-card" v-loading="loadingVehicles">
          <template #header><span class="card-title">车辆状态分布</span></template>
          <v-chart class="chart" :option="vehiclePieOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card class="table-card" v-loading="loadingVehicles">
          <template #header><span class="card-title">车辆列表</span></template>
          <el-table :data="vehicles" border stripe max-height="350">
            <el-table-column prop="plate_no" label="车牌号" width="120" />
            <el-table-column prop="vehicle_type" label="车辆类型" width="120" />
            <el-table-column prop="station_name" label="所属站点" min-width="140" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="vehicleStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" style="margin-top: 16px;" v-loading="loadingFirefighters">
      <template #header><span class="card-title">消防员状态</span></template>
      <div class="firefighter-summary">
        <div class="ff-stat-item">
          <span class="ff-stat-label">在岗</span>
          <span class="ff-stat-value" style="color: #67c23a;">{{ ffStatusCount.在岗 }}</span>
        </div>
        <div class="ff-stat-item">
          <span class="ff-stat-label">出警中</span>
          <span class="ff-stat-value" style="color: #e6a23c;">{{ ffStatusCount.出警中 }}</span>
        </div>
        <div class="ff-stat-item">
          <span class="ff-stat-label">休假</span>
          <span class="ff-stat-value" style="color: #909399;">{{ ffStatusCount.休假 }}</span>
        </div>
        <div class="ff-stat-item">
          <span class="ff-stat-label">总计</span>
          <span class="ff-stat-value" style="color: #303133;">{{ firefighters.length }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" style="margin-top: 16px;" v-loading="loadingDispatches">
      <template #header><span class="card-title">最近调度记录</span></template>
      <el-table :data="dispatches" border stripe max-height="400">
        <el-table-column prop="dispatch_no" label="调度编号" width="150" />
        <el-table-column prop="alarm_no" label="警情编号" width="150" />
        <el-table-column prop="commander" label="指挥员" width="100" />
        <el-table-column prop="vehicle_plates" label="车辆" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ Array.isArray(row.vehicle_plates) ? row.vehicle_plates.join(', ') : row.vehicle_plates }}
          </template>
        </el-table-column>
        <el-table-column prop="firefighter_names" label="消防员" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ Array.isArray(row.firefighter_names) ? row.firefighter_names.join(', ') : row.firefighter_names }}
          </template>
        </el-table-column>
        <el-table-column prop="dispatch_time" label="调度时间" width="170" />
        <el-table-column prop="route_status" label="路线状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="routeStatusType(row.route_status)">{{ row.route_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="dispatchStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, DataLine, Warning, CircleCheck, Clock, Bell, Timer } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  getReportSummary,
  getAlarmList,
  getVehicleList,
  getFirefighterList,
  getDispatchList
} from '../api/index'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const loading = ref(false)
const loadingVehicles = ref(false)
const loadingFirefighters = ref(false)
const loadingDispatches = ref(false)

const summary = ref({})
const vehicles = ref([])
const firefighters = ref([])
const dispatches = ref([])

const disasterPieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left', top: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['55%', '50%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}\n{d}%' },
    emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
    data: (summary.value.by_disaster ?? []).map(d => ({
      value: d.cnt,
      name: d.disaster_type
    }))
  }]
}))

const levelBarOption = computed(() => {
  const data = summary.value.by_level ?? []
  const levelColors = { 'I级': '#f56c6c', 'II级': '#e6a23c', 'III级': '#409eff', 'IV级': '#67c23a' }
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.disaster_level) },
    yAxis: { type: 'value', name: '数量' },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.cnt,
        itemStyle: { color: levelColors[d.disaster_level] ?? '#409eff', borderRadius: [6, 6, 0, 0] }
      })),
      barWidth: '50%'
    }]
  }
})

const stationBarOption = computed(() => {
  const data = summary.value.by_station ?? []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['出动次数', '车辆数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.station_name) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '出动次数',
        type: 'bar',
        data: data.map(d => d.dispatch_count),
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '车辆数',
        type: 'bar',
        data: data.map(d => d.vehicle_count),
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }
})

const vehiclePieOption = computed(() => {
  const statusMap = { '待命': 0, '出警中': 0, '维修中': 0 }
  vehicles.value.forEach(v => {
    if (statusMap[v.status] !== undefined) statusMap[v.status]++
  })
  const colors = { '待命': '#67c23a', '出警中': '#e6a23c', '维修中': '#909399' }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['55%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}' },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: Object.entries(statusMap).map(([name, value]) => ({
        value,
        name,
        itemStyle: { color: colors[name] }
      }))
    }]
  }
})

const ffStatusCount = computed(() => {
  const counts = { '在岗': 0, '出警中': 0, '休假': 0 }
  firefighters.value.forEach(f => {
    if (counts[f.status] !== undefined) counts[f.status]++
  })
  return counts
})

const riskTagType = (level) => {
  const map = { '极高': 'danger', '高': 'warning', '中': 'info' }
  return map[level] ?? ''
}

const vehicleStatusType = (status) => {
  const map = { '待命': 'success', '出警中': 'warning', '维修中': 'info' }
  return map[status] ?? ''
}

const routeStatusType = (status) => {
  const map = { '畅通': 'success', '拥堵': 'warning', '严重拥堵': 'danger' }
  return map[status] ?? ''
}

const dispatchStatusType = (status) => {
  const map = { '已完成': 'success', '进行中': 'warning', '已超时': 'danger' }
  return map[status] ?? ''
}

const loadSummary = async () => {
  loading.value = true
  try {
    summary.value = await getReportSummary()
  } catch {
    ElMessage.error('加载报表数据失败')
  } finally {
    loading.value = false
  }
}

const loadVehicles = async () => {
  loadingVehicles.value = true
  try {
    vehicles.value = await getVehicleList()
  } catch {
    ElMessage.error('加载车辆数据失败')
  } finally {
    loadingVehicles.value = false
  }
}

const loadFirefighters = async () => {
  loadingFirefighters.value = true
  try {
    firefighters.value = await getFirefighterList()
  } catch {
    ElMessage.error('加载消防员数据失败')
  } finally {
    loadingFirefighters.value = false
  }
}

const loadDispatches = async () => {
  loadingDispatches.value = true
  try {
    const res = await getDispatchList()
    dispatches.value = Array.isArray(res) ? res : (res.list ?? [])
  } catch {
    ElMessage.error('加载调度记录失败')
  } finally {
    loadingDispatches.value = false
  }
}

const exportCSV = async () => {
  try {
    const res = await getAlarmList({ page: 1, page_size: 10000 })
    const list = res.list ?? res ?? []
    if (!list.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    const headers = Object.keys(list[0])
    const csvRows = [headers.join(',')]
    for (const item of list) {
      csvRows.push(headers.map(h => {
        const val = item[h] ?? ''
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(','))
    }
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `警情报表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadSummary()
  loadVehicles()
  loadFirefighters()
  loadDispatches()
})
</script>

<style scoped>
.reports {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}
.stats-row {
  margin-bottom: 16px;
}
.stat-card {
  border-radius: 8px;
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.stat-info {
  flex: 1;
  min-width: 0;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}
.stat-unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  margin-left: 2px;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.chart-card,
.table-card {
  border-radius: 8px;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.chart {
  height: 320px;
}
.firefighter-summary {
  display: flex;
  gap: 40px;
  padding: 8px 0;
}
.ff-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.ff-stat-label {
  font-size: 13px;
  color: #909399;
}
.ff-stat-value {
  font-size: 28px;
  font-weight: 600;
}
</style>
