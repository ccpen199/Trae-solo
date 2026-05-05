<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h2 class="page-title">数据看板</h2>
      <p class="page-desc">实时统计会展现场数据</p>
    </div>
    
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <div class="card-container dashboard-card">
          <div class="flex-between">
            <div>
              <div class="card-title">总条码数</div>
              <div class="card-value">{{ dashboardStats.totalBarcodes || 0 }}</div>
            </div>
            <div class="card-icon" style="background: #409EFF;">
              <el-icon :size="24"><QRCode /></el-icon>
            </div>
          </div>
          <div class="card-trend">
            <el-icon v-if="dashboardStats.barcodeTrend > 0"><ArrowUp /><span class="up">较昨日 {{ dashboardStats.barcodeTrend }}%</span></el-icon>
            <el-icon v-else-if="dashboardStats.barcodeTrend < 0"><ArrowDown /><span class="down">较昨日 {{ Math.abs(dashboardStats.barcodeTrend) }}%</span></el-icon>
            <span v-else>较昨日 0%</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <div class="card-container dashboard-card">
          <div class="flex-between">
            <div>
              <div class="card-title">已入场</div>
              <div class="card-value">{{ dashboardStats.totalEntries || 0 }}</div>
            </div>
            <div class="card-icon" style="background: #67C23A;">
              <el-icon :size="24"><Camera /></el-icon>
            </div>
          </div>
          <div class="card-trend">
            <span v-if="dashboardStats.totalBarcodes">入场率: {{ ((dashboardStats.totalEntries / dashboardStats.totalBarcodes) * 100).toFixed(1) }}%</span>
            <span v-else>入场率: 0%</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <div class="card-container dashboard-card">
          <div class="flex-between">
            <div>
              <div class="card-title">餐饮消费</div>
              <div class="card-value">{{ dashboardStats.totalCaterings || 0 }}</div>
            </div>
            <div class="card-icon" style="background: #E6A23C;">
              <el-icon :size="24"><Coffee /></el-icon>
            </div>
          </div>
          <div class="card-trend">
            <span>今日新增: {{ dashboardStats.todayCaterings || 0 }}</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <div class="card-container dashboard-card">
          <div class="flex-between">
            <div>
              <div class="card-title">图册发放</div>
              <div class="card-value">{{ dashboardStats.totalBooklets || 0 }}</div>
            </div>
            <div class="card-icon" style="background: #F56C6C;">
              <el-icon :size="24"><Reading /></el-icon>
            </div>
          </div>
          <div class="card-trend">
            <span>今日新增: {{ dashboardStats.todayBooklets || 0 }}</span>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <div class="card-container">
          <h3 class="chart-title">入场趋势</h3>
          <div ref="entryChartRef" class="chart-container"></div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <div class="card-container">
          <h3 class="chart-title">部门入场统计</h3>
          <div ref="departmentChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="recent-activity">
      <el-col :xs="24" :sm="24" :md="24" :lg="24">
        <div class="card-container">
          <h3 class="chart-title">最近活动记录</h3>
          <el-table :data="recentRecords" style="width: 100%" v-loading="loading">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getRecordTypeTag(scope.row.type)">
                  {{ getRecordTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="barcode" label="条码" width="150" />
            <el-table-column prop="departmentName" label="部门" width="120" />
            <el-table-column prop="deviceName" label="设备" width="120" />
            <el-table-column prop="operatorName" label="操作员" width="120" />
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import dayjs from 'dayjs'

const entryChartRef = ref(null)
const departmentChartRef = ref(null)
const loading = ref(false)

const dashboardStats = reactive({
  totalBarcodes: 0,
  totalEntries: 0,
  totalCaterings: 0,
  totalBooklets: 0,
  todayCaterings: 0,
  todayBooklets: 0,
  barcodeTrend: 0
})

const recentRecords = ref([])

let entryChart = null
let departmentChart = null

async function fetchDashboardData() {
  loading.value = true
  try {
    const res = await request.get('/api/reports/dashboard')
    if (res.success) {
      const data = res.data
      Object.assign(dashboardStats, {
        totalBarcodes: data.totalBarcodes || 0,
        totalEntries: data.totalEntries || 0,
        totalCaterings: data.totalCaterings || 0,
        totalBooklets: data.totalBooklets || 0,
        todayCaterings: data.todayCaterings || 0,
        todayBooklets: data.todayBooklets || 0,
        barcodeTrend: data.barcodeTrend || 0
      })
      
      recentRecords.value = data.recentRecords || []
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

function initEntryChart() {
  if (!entryChartRef.value) return
  
  entryChart = echarts.init(entryChartRef.value)
  
  const hours = []
  const data = []
  for (let i = 0; i < 24; i++) {
    hours.push(`${i}:00`)
    data.push(Math.floor(Math.random() * 50))
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours,
      axisLabel: {
        interval: 2
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '入场人数',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#667eea',
          width: 2
        },
        itemStyle: {
          color: '#667eea'
        },
        data: data
      }
    ]
  }
  
  entryChart.setOption(option)
}

function initDepartmentChart() {
  if (!departmentChartRef.value) return
  
  departmentChart = echarts.init(departmentChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '部门入场',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: 'VIP区', itemStyle: { color: '#667eea' } },
          { value: 735, name: '媒体区', itemStyle: { color: '#764ba2' } },
          { value: 580, name: '参展商', itemStyle: { color: '#409EFF' } },
          { value: 484, name: '专业观众', itemStyle: { color: '#67C23A' } },
          { value: 300, name: '普通观众', itemStyle: { color: '#E6A23C' } }
        ]
      }
    ]
  }
  
  departmentChart.setOption(option)
}

function getRecordTypeTag(type) {
  const map = {
    entry: 'success',
    catering: 'warning',
    booklet: 'primary'
  }
  return map[type] || 'info'
}

function getRecordTypeName(type) {
  const map = {
    entry: '入场',
    catering: '餐饮',
    booklet: '图册'
  }
  return map[type] || type
}

function formatTime(time) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function handleResize() {
  entryChart?.resize()
  departmentChart?.resize()
}

onMounted(async () => {
  await fetchDashboardData()
  await nextTick()
  initEntryChart()
  initDepartmentChart()
  
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.dashboard-container {
  .stat-cards {
    margin-bottom: 20px;
  }
  
  .dashboard-card {
    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
    }
  }
  
  .charts-row {
    margin-bottom: 20px;
    
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 15px;
    }
    
    .chart-container {
      height: 300px;
    }
  }
  
  .recent-activity {
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 15px;
    }
  }
}
</style>
