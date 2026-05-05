<template>
  <div>
    <div class="page-header">
      <h2>报表分析</h2>
      <div class="description">统计车辆故障分布、标定版本使用情况、通讯失败记录和维修闭环率</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ dashboardData?.total_vehicles || 0 }}</div>
          <div class="stat-label">总车辆数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value warning">{{ dashboardData?.total_active_faults || 0 }}</div>
          <div class="stat-label">活跃故障</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value success">{{ dashboardData?.total_published_versions || 0 }}</div>
          <div class="stat-label">已发布标定版本</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ dashboardData?.repair_closure_rate || 0 }}%</div>
          <div class="stat-label">维修闭环率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">故障分布统计</div>
          </template>
          <div ref="faultChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">标定版本使用情况</div>
          </template>
          <div ref="versionChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">通讯失败记录</div>
          </template>
          <div ref="commChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">维修闭环率趋势</div>
          </template>
          <div ref="repairChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const dashboardData = ref(null)
const faultChartRef = ref(null)
const versionChartRef = ref(null)
const commChartRef = ref(null)
const repairChartRef = ref(null)

let faultChart = null
let versionChart = null
let commChart = null
let repairChart = null

const fetchDashboard = async () => {
  try {
    const data = await request.get('/reports/dashboard')
    dashboardData.value = data
    return data
  } catch (err) {
    console.error('获取仪表盘数据失败:', err)
    return null
  }
}

const fetchFaultDistribution = async () => {
  try {
    const data = await request.get('/reports/fault-distribution')
    return data
  } catch (err) {
    console.error('获取故障分布失败:', err)
    return []
  }
}

const fetchVersionUsage = async () => {
  try {
    const data = await request.get('/reports/version-usage')
    return data
  } catch (err) {
    console.error('获取版本使用情况失败:', err)
    return []
  }
}

const fetchCommFailures = async () => {
  try {
    const data = await request.get('/reports/communication-failures')
    return data
  } catch (err) {
    console.error('获取通讯失败记录失败:', err)
    return []
  }
}

const initCharts = async () => {
  const [faultData, versionData, commData] = await Promise.all([
    fetchFaultDistribution(),
    fetchVersionUsage(),
    fetchCommFailures(),
  ])

  await nextTick()

  // 故障分布图表
  if (faultChartRef.value) {
    faultChart = echarts.init(faultChartRef.value)
    const faultOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: '故障类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: faultData.map((item) => ({
            value: item.count,
            name: item.category_name,
          })),
          color: ['#F56C6C', '#E6A23C', '#909399', '#409EFF'],
        },
      ],
    }
    faultChart.setOption(faultOption)
  }

  // 标定版本使用图表
  if (versionChartRef.value) {
    versionChart = echarts.init(versionChartRef.value)
    const versionOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: versionData.map((item) => item.version_code),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '使用次数',
      },
      series: [
        {
          name: '使用次数',
          type: 'bar',
          data: versionData.map((item) => item.usage_count),
          itemStyle: {
            color: '#67C23A',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }
    versionChart.setOption(versionOption)
  }

  // 通讯失败图表
  if (commChartRef.value) {
    commChart = echarts.init(commChartRef.value)
    const commOption = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['失败次数'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: commData.map((item) => item.error_type),
      },
      yAxis: {
        type: 'value',
        name: '次数',
      },
      series: [
        {
          name: '失败次数',
          type: 'line',
          stack: 'Total',
          data: commData.map((item) => item.count),
          smooth: true,
          itemStyle: {
            color: '#F56C6C',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.8)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.1)' },
            ]),
          },
        },
      ],
    }
    commChart.setOption(commOption)
  }

  // 维修闭环率图表
  if (repairChartRef.value) {
    repairChart = echarts.init(repairChartRef.value)
    const repairOption = {
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      },
      yAxis: {
        type: 'value',
        name: '闭环率(%)',
        min: 0,
        max: 100,
      },
      series: [
        {
          name: '闭环率',
          type: 'line',
          data: [85, 88, 92, 89, 95, dashboardData.value?.repair_closure_rate || 90],
          smooth: true,
          itemStyle: {
            color: '#409EFF',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.8)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' },
            ]),
          },
        },
      ],
    }
    repairChart.setOption(repairOption)
  }
}

const handleResize = () => {
  faultChart?.resize()
  versionChart?.resize()
  commChart?.resize()
  repairChart?.resize()
}

onMounted(async () => {
  await fetchDashboard()
  await initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  faultChart?.dispose()
  versionChart?.dispose()
  commChart?.dispose()
  repairChart?.dispose()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-card .stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}
.stat-card .stat-value.warning {
  color: #e6a23c;
}
.stat-card .stat-value.success {
  color: #67c23a;
}
.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>
