<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card sales-card">
          <div class="stat-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatCurrency(salesToday) }}</div>
            <div class="stat-label">今日销售额</div>
          </div>
          <div class="stat-trend positive">
            <el-icon><TrendCharts /></el-icon>
            <span>+12.5%</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card orders-card">
          <div class="stat-icon">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ ordersToday }}</div>
            <div class="stat-label">今日订单数</div>
          </div>
          <div class="stat-trend positive">
            <el-icon><TrendCharts /></el-icon>
            <span>+8.3%</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card customers-card">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ customersToday }}</div>
            <div class="stat-label">今日客单量</div>
          </div>
          <div class="stat-trend negative">
            <el-icon><TrendCharts /></el-icon>
            <span>-2.1%</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card stock-card">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ lowStockCount }}</div>
            <div class="stat-label">低库存商品</div>
          </div>
          <div class="stat-trend warning">
            <el-icon><Bell /></el-icon>
            <span>需关注</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :lg="16" :md="12" :xs="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="refreshChart">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="quarter">本季度</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="salesChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :lg="8" :md="12" :xs="24">
        <el-card class="chart-card">
          <template #header>
            <span>商品分类销售占比</span>
          </template>
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tables-row">
      <el-col :lg="12" :xs="24">
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span>待处理调拨申请</span>
              <el-link type="primary" :underline="false">查看全部</el-link>
            </div>
          </template>
          <el-table :data="pendingAllocations" style="width: 100%">
            <el-table-column prop="reqNo" label="申请单号" width="140" />
            <el-table-column prop="reqOrgName" label="申请门店" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :lg="12" :xs="24">
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span>低库存预警</span>
              <el-link type="primary" :underline="false">查看全部</el-link>
            </div>
          </template>
          <el-table :data="lowStockItems" style="width: 100%">
            <el-table-column prop="skuCode" label="商品编码" width="120" />
            <el-table-column prop="skuName" label="商品名称" />
            <el-table-column prop="orgName" label="门店" width="120" />
            <el-table-column prop="quantity" label="当前库存" width="100">
              <template #default="scope">
                <span class="warning-text">{{ scope.row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="safetyStock" label="安全库存" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const salesChartRef = ref(null)
const categoryChartRef = ref(null)
const chartPeriod = ref('week')

const salesToday = ref(128500.50)
const ordersToday = ref(356)
const customersToday = ref(289)
const lowStockCount = ref(15)

const pendingAllocations = ref([
  { id: 1, reqNo: 'ALLO20240428001', reqOrgName: '北京朝阳店', status: 'PENDING', createTime: '2024-04-28 09:30:00' },
  { id: 2, reqNo: 'ALLO20240428002', reqOrgName: '上海浦东店', status: 'PENDING', createTime: '2024-04-28 10:15:00' },
  { id: 3, reqNo: 'ALLO20240428003', reqOrgName: '广州天河店', status: 'AUDIT_PASS', createTime: '2024-04-28 08:45:00' }
])

const lowStockItems = ref([
  { id: 1, skuCode: 'SKU001', skuName: '纯净水500ml', orgName: '北京朝阳店', quantity: 5, safetyStock: 50 },
  { id: 2, skuCode: 'SKU002', skuName: '牛奶250ml', orgName: '上海浦东店', quantity: 12, safetyStock: 30 },
  { id: 3, skuCode: 'SKU003', skuName: '面包', orgName: '广州天河店', quantity: 8, safetyStock: 20 }
])

let salesChart = null
let categoryChart = null

function formatCurrency(value) {
  return '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function formatTime(time) {
  return time
}

function getStatusType(status) {
  const typeMap = {
    'DRAFT': 'info',
    'PENDING': 'warning',
    'AUDIT_PASS': 'success',
    'AUDIT_REJECT': 'danger',
    'COMPLETED': 'success'
  }
  return typeMap[status] || 'info'
}

function getStatusText(status) {
  const textMap = {
    'DRAFT': '草稿',
    'PENDING': '待审核',
    'AUDIT_PASS': '审核通过',
    'AUDIT_REJECT': '审核驳回',
    'OUTBOUND': '已出库',
    'INBOUND': '已入库',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return textMap[status] || status
}

function initSalesChart() {
  if (!salesChartRef.value) return
  
  salesChart = echarts.init(salesChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>销售额: ¥{c}'
    },
    legend: {
      data: ['销售额', '订单数']
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
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: [85000, 92000, 88000, 105000, 98000, 125000, 118000],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
  
  salesChart.setOption(option)
}

function initCategoryChart() {
  if (!categoryChartRef.value) return
  
  categoryChart = echarts.init(categoryChartRef.value)
  
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
          { value: 35, name: '饮料', itemStyle: { color: '#409eff' } },
          { value: 25, name: '食品', itemStyle: { color: '#67c23a' } },
          { value: 20, name: '日用品', itemStyle: { color: '#e6a23c' } },
          { value: 12, name: '烟酒', itemStyle: { color: '#f56c6c' } },
          { value: 8, name: '其他', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
  
  categoryChart.setOption(option)
}

function refreshChart() {
  if (salesChart) {
    salesChart.resize()
  }
}

function handleResize() {
  salesChart && salesChart.resize()
  categoryChart && categoryChart.resize()
}

onMounted(() => {
  initSalesChart()
  initCategoryChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  salesChart && salesChart.dispose()
  categoryChart && categoryChart.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;
        margin-right: 16px;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;

        &.positive {
          color: #67c23a;
          background: #f0f9eb;
        }

        &.negative {
          color: #f56c6c;
          background: #fef0f0;
        }

        &.warning {
          color: #e6a23c;
          background: #fdf6ec;
        }
      }
    }

    .sales-card .stat-icon {
      background: linear-gradient(135deg, #409eff, #66b1ff);
    }

    .orders-card .stat-icon {
      background: linear-gradient(135deg, #67c23a, #85ce61);
    }

    .customers-card .stat-icon {
      background: linear-gradient(135deg, #e6a23c, #ebb563);
    }

    .stock-card .stat-icon {
      background: linear-gradient(135deg, #f56c6c, #f78989);
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .chart-card {
      height: 350px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .chart-container {
      width: 100%;
      height: 280px;
    }
  }

  .tables-row {
    .table-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .warning-text {
      color: #f56c6c;
      font-weight: 600;
    }
  }
}
</style>
