<template>
  <div class="reports-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.total }}</div>
              <div class="stat-label">总单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
              <el-icon :size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ avgDuration }}</div>
              <div class="stat-label">平均耗时(秒)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.failureRate }}%</div>
              <div class="stat-label">异常比例</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ successRate }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>每日趋势</span>
            </div>
          </template>
          <div ref="dailyChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>状态分布</span>
            </div>
          </template>
          <div ref="statusChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>各阶段耗时统计</span>
            </div>
          </template>
          <div ref="stageChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>失败原因统计</span>
            </div>
          </template>
          <el-table :data="failureReasons" size="small" v-if="failureReasons.length > 0">
            <el-table-column prop="stage_name_text" label="阶段" width="120" />
            <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip />
            <el-table-column prop="count" label="次数" width="80" sortable />
          </el-table>
          <el-empty v-else description="暂无失败数据" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getReportSummary, getDailyStats, getStageDuration, getFailureReasons } from '@/utils/api'
import { Document, CircleCheck, Warning, TrendCharts } from '@element-plus/icons-vue'

const dailyChartRef = ref()
const statusChartRef = ref()
const stageChartRef = ref()

const summary = ref({
  total: 0,
  avgDuration: 0,
  failureRate: 0,
  byStatus: []
})

const dailyStats = ref([])
const stageDuration = ref([])
const failureReasons = ref([])

const avgDuration = computed(() => {
  return summary.value.avgDuration ? Math.round(summary.value.avgDuration) : 0
})

const successRate = computed(() => {
  return (100 - parseFloat(summary.value.failureRate || 0)).toFixed(2)
})

const statusTextMap = {
  pending_code: '待代码提交',
  pending_trigger: '待触发',
  pending_build: '待构建',
  pending_deploy: '待部署',
  pending_monitor: '待监控',
  completed: '已完成',
  failed: '失败',
  rolled_back: '已回滚'
}

const stageTextMap = {
  code_submit: '代码提交',
  trigger: '触发流水线',
  build_test: '构建测试',
  deploy: '部署',
  monitor: '监控回滚'
}

const initDailyChart = () => {
  if (!dailyChartRef.value) return
  
  const chart = echarts.init(dailyChartRef.value)
  
  const days = dailyStats.value.map((d) => d.day)
  const total = dailyStats.value.map((d) => d.total)
  const completed = dailyStats.value.map((d) => d.completed)
  const failed = dailyStats.value.map((d) => d.failed)
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总数', '完成', '失败'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      { name: '总数', type: 'line', data: total, smooth: true },
      { name: '完成', type: 'line', data: completed, smooth: true, itemStyle: { color: '#67c23a' } },
      { name: '失败', type: 'line', data: failed, smooth: true, itemStyle: { color: '#f56c6c' } }
    ]
  }
  
  chart.setOption(option)
}

const initStatusChart = () => {
  if (!statusChartRef.value) return
  
  const chart = echarts.init(statusChartRef.value)
  
  const data = summary.value.byStatus.map((s) => ({
    name: statusTextMap[s.status] || s.status,
    value: s.count
  })).filter((d) => d.value > 0)
  
  const option = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: data
      }
    ]
  }
  
  chart.setOption(option)
}

const initStageChart = () => {
  if (!stageChartRef.value) return
  
  const chart = echarts.init(stageChartRef.value)
  
  const stages = stageDuration.value.map((s) => stageTextMap[s.stage_name] || s.stage_name)
  const avgDurations = stageDuration.value.map((s) => Math.round(s.avg_duration_seconds || 0))
  
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: stages, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '平均耗时(秒)' },
    series: [
      {
        type: 'bar',
        data: avgDurations,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }
  
  chart.setOption(option)
}

const fetchData = async () => {
  try {
    const [summaryRes, dailyRes, stageRes, failureRes] = await Promise.all([
      getReportSummary(),
      getDailyStats(),
      getStageDuration(),
      getFailureReasons()
    ])
    
    if (summaryRes.success) summary.value = summaryRes.data
    if (dailyRes.success) dailyStats.value = dailyRes.data
    if (stageRes.success) stageDuration.value = stageRes.data
    if (failureRes.success) failureReasons.value = failureRes.data.topReasons || []
    
    await nextTick()
    initDailyChart()
    initStatusChart()
    initStageChart()
  } catch (e) {
    console.error('获取报表数据失败', e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.reports-page {
  min-height: 100%;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
</style>
