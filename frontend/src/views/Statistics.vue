<template>
  <div class="statistics">
    <div class="page-header">
      <h1 class="page-title">统计分析</h1>
      <p class="page-subtitle">行李运输数据统计与异常分析</p>
    </div>

    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="loadAllData"
        />
      </el-col>
      <el-col :span="6">
        <el-button type="primary" @click="loadAllData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-5">
      <el-col :span="6">
        <div class="stat-card primary">
          <div class="stat-value">{{ overview?.total_baggage || 0 }}</div>
          <div class="stat-label">托运行李总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-value">{{ overview?.pickup_rate || '0%' }}</div>
          <div class="stat-label">正常领取率</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-value">{{ overview?.exception_rate || '0%' }}</div>
          <div class="stat-label">异常率</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-value">¥{{ overview?.compensation_total || 0 }}</div>
          <div class="stat-label">累计赔付</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">异常类型分布</h3>
          <div ref="typeChart" style="height: 350px;"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">异常环节分布</h3>
          <div ref="nodeChart" style="height: 350px;"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-5">
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">每日趋势</h3>
          <div ref="trendChart" style="height: 350px;"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">责任方赔付统计</h3>
          <div ref="partyChart" style="height: 350px;"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-5">
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">节点缺失统计</h3>
          <el-table :data="missingNodes?.data || []" size="small">
            <el-table-column prop="name" label="节点" width="100" />
            <el-table-column prop="missing_count" label="缺失数量" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.missing_count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="说明">
              <template #default="{ row }">
                <span v-if="row.node === 'check_in'">托运后24小时内未更新托运节点</span>
                <span v-else-if="row.node === 'security'">已托运但未过安检</span>
                <span v-else-if="row.node === 'loading'">已安检但未装机</span>
                <span v-else-if="row.node === 'unloading'">已装机但未卸机</span>
                <span v-else-if="row.node === 'carousel'">已卸机但未上转盘</span>
                <span v-else-if="row.node === 'pickup'">已上转盘但未领取</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">异常航线 TOP 10</h3>
          <el-table :data="exceptionRoutes?.data || []" size="small">
            <el-table-column prop="departure" label="出发" width="80" />
            <el-table-column prop="destination" label="到达" width="80" />
            <el-table-column prop="exception_count" label="异常数" width="80" align="center" />
            <el-table-column prop="total_baggage" label="总数" width="80" align="center" />
            <el-table-column label="异常率" width="100">
              <template #default="{ row }">
                <el-tag :type="row.exception_rate > 5 ? 'danger' : 'warning'" size="small">
                  {{ row.exception_rate }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { statsApi } from '../api'

const loading = ref(false)
const dateRange = ref([])
const overview = ref(null)
const exceptionRoutes = ref(null)
const missingNodes = ref(null)

const typeChart = ref(null)
const nodeChart = ref(null)
const trendChart = ref(null)
const partyChart = ref(null)

let typeChartInstance = null
let nodeChartInstance = null
let trendChartInstance = null
let partyChartInstance = null

async function loadAllData() {
  loading.value = true
  try {
    const days = dateRange.value?.length === 2 
      ? Math.ceil((new Date(dateRange.value[1]) - new Date(dateRange.value[0])) / (1000 * 60 * 60 * 24))
      : 30

    const [overviewData, typeData, nodeData, trendData, partyData, routeData, missingData] = await Promise.all([
      statsApi.getOverview(days),
      statsApi.getExceptionsByType(days),
      statsApi.getExceptionsByNode(days),
      statsApi.getDailyTrend(days),
      statsApi.getCompensationByParty(days),
      statsApi.getExceptionsByRoute(days, 10),
      statsApi.getMissingNodes(24)
    ])

    overview.value = overviewData
    exceptionRoutes.value = routeData
    missingNodes.value = missingData

    await nextTick()
    
    renderTypeChart(typeData.data)
    renderNodeChart(nodeData.data)
    renderTrendChart(trendData.data)
    renderPartyChart(partyData.data)
  } catch (err) {
    console.error('Load stats error:', err)
  } finally {
    loading.value = false
  }
}

function renderTypeChart(data) {
  if (!typeChart.value) return
  if (typeChartInstance) typeChartInstance.dispose()
  
  typeChartInstance = echarts.init(typeChart.value)
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '40%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.map(item => ({ value: item.count, name: item.exception_name }))
    }]
  }
  typeChartInstance.setOption(option)
}

function renderNodeChart(data) {
  if (!nodeChart.value) return
  if (nodeChartInstance) nodeChartInstance.dispose()
  
  nodeChartInstance = echarts.init(nodeChart.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: data.map(d => d.node) },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.count,
        itemStyle: {
          color: d.count > 10 ? '#f56c6c' : d.count > 5 ? '#e6a23c' : '#409eff'
        }
      })),
      label: { show: true, position: 'right', formatter: '{c} ({d}%)' }
    }]
  }
  nodeChartInstance.setOption(option)
}

function renderTrendChart(data) {
  if (!trendChart.value) return
  if (trendChartInstance) trendChartInstance.dispose()
  
  trendChartInstance = echarts.init(trendChart.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['托运行李', '异常行李'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '托运行李',
        type: 'line',
        smooth: true,
        data: data.map(d => d.baggage_count),
        lineStyle: { color: '#409eff', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '异常行李',
        type: 'line',
        smooth: true,
        data: data.map(d => d.exception_count),
        lineStyle: { color: '#f56c6c', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
          ])
        }
      }
    ]
  }
  trendChartInstance.setOption(option)
}

function renderPartyChart(data) {
  if (!partyChart.value) return
  if (partyChartInstance) partyChartInstance.dispose()
  
  partyChartInstance = echarts.init(partyChart.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['赔付次数', '赔付金额'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.responsible_party) },
    yAxis: [
      { type: 'value', name: '次数' },
      { type: 'value', name: '金额(元)' }
    ],
    series: [
      {
        name: '赔付次数',
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: { color: '#409eff' }
      },
      {
        name: '赔付金额',
        type: 'bar',
        yAxisIndex: 1,
        data: data.map(d => d.total_amount),
        itemStyle: { color: '#f56c6c' }
      }
    ]
  }
  partyChartInstance.setOption(option)
}

onMounted(() => {
  loadAllData()
  
  window.addEventListener('resize', () => {
    typeChartInstance?.resize()
    nodeChartInstance?.resize()
    trendChartInstance?.resize()
    partyChartInstance?.resize()
  })
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mb-5 {
  margin-bottom: 20px;
}

.mt-5 {
  margin-top: 20px;
}

.text-lg {
  font-size: 18px;
}

.font-semibold {
  font-weight: 600;
}
</style>
