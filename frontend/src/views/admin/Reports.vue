<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSettlementReportsApi, getEnergySplitApi, getOrderStatsApi } from '@/api/order'
import * as echarts from 'echarts'

const activeTab = ref<'settlement' | 'energy'>('settlement')
const loading = ref(false)
const dateRange = ref<Date[]>([])
const settlementReports = ref<any[]>([])
const energySplitData = ref<any[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const revenueChartRef = ref<HTMLDivElement>()
const energyChartRef = ref<HTMLDivElement>()
let revenueChart: echarts.ECharts | null = null
let energyChart: echarts.ECharts | null = null

async function loadSettlementReports() {
  loading.value = true
  try {
    const res = await getSettlementReportsApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    settlementReports.value = res.data.list || res.data
    pagination.value.total = res.data.total || settlementReports.value.length
  } catch (error) {
    console.error('Load settlement error:', error)
    settlementReports.value = generateMockSettlementData()
  } finally {
    loading.value = false
  }
}

async function loadEnergySplit() {
  loading.value = true
  try {
    const res = await getEnergySplitApi()
    energySplitData.value = res.data || []
  } catch (error) {
    console.error('Load energy split error:', error)
    energySplitData.value = generateMockEnergyData()
  } finally {
    loading.value = false
  }
}

function generateMockSettlementData() {
  const data = []
  for (let i = 1; i <= 12; i++) {
    data.push({
      id: i,
      period: `2024-${i.toString().padStart(2, '0')}`,
      totalOrders: Math.floor(Math.random() * 1000) + 500,
      totalRevenue: Math.floor(Math.random() * 10000) + 5000,
      powerCost: Math.floor(Math.random() * 1000) + 300,
      waterCost: Math.floor(Math.random() * 500) + 100,
      maintenanceCost: Math.floor(Math.random() * 500) + 200,
      netProfit: Math.floor(Math.random() * 8000) + 3000,
      status: i < 12 ? 'settled' : 'pending'
    })
  }
  return data
}

function generateMockEnergyData() {
  const data = []
  for (let i = 1; i <= 10; i++) {
    data.push({
      deviceId: i,
      deviceName: `设备${i}`,
      location: `位置${i}`,
      powerConsumption: Math.floor(Math.random() * 500) + 100,
      waterConsumption: Math.floor(Math.random() * 2000) + 500,
      powerCost: Math.floor(Math.random() * 500) + 100,
      waterCost: Math.floor(Math.random() * 200) + 50,
      totalEnergyCost: Math.floor(Math.random() * 700) + 150
    })
  }
  return data
}

function initRevenueChart() {
  if (!revenueChartRef.value) return
  revenueChart = echarts.init(revenueChartRef.value)
  const option = {
    title: { text: '月度收入趋势', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['总收入', '电费', '水费', '净利润'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value', name: '金额(元)' },
    series: [
      {
        name: '总收入',
        type: 'line',
        smooth: true,
        data: [8500, 9200, 7800, 10500, 11200, 12500, 13800, 14200, 12800, 11500, 10800, 12000]
      },
      {
        name: '电费',
        type: 'line',
        smooth: true,
        data: [850, 920, 780, 1050, 1120, 1250, 1380, 1420, 1280, 1150, 1080, 1200]
      },
      {
        name: '水费',
        type: 'line',
        smooth: true,
        data: [450, 520, 380, 550, 620, 750, 880, 920, 780, 650, 580, 700]
      },
      {
        name: '净利润',
        type: 'bar',
        data: [7200, 7760, 6640, 8900, 9460, 10500, 11540, 11860, 10740, 9700, 9140, 10100]
      }
    ]
  }
  revenueChart.setOption(option)
}

function initEnergyChart() {
  if (!energyChartRef.value) return
  energyChart = echarts.init(energyChartRef.value)
  const option = {
    title: { text: '设备能耗对比', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['耗电量(kWh)', '耗水量(L)'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: energySplitData.value.slice(0, 10).map((d) => d.deviceName)
    },
    yAxis: [
      { type: 'value', name: '耗电量(kWh)' },
      { type: 'value', name: '耗水量(L)' }
    ],
    series: [
      {
        name: '耗电量(kWh)',
        type: 'bar',
        data: energySplitData.value.slice(0, 10).map((d) => d.powerConsumption),
        itemStyle: { color: '#409eff' }
      },
      {
        name: '耗水量(L)',
        type: 'bar',
        yAxisIndex: 1,
        data: energySplitData.value.slice(0, 10).map((d) => d.waterConsumption),
        itemStyle: { color: '#67c23a' }
      }
    ]
  }
  energyChart.setOption(option)
}

function handleTabChange(tab: any) {
  activeTab.value = tab.name
  if (tab.name === 'settlement') {
    loadSettlementReports()
    setTimeout(initRevenueChart, 100)
  } else {
    loadEnergySplit()
    setTimeout(initEnergyChart, 100)
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadSettlementReports()
}

function exportReport() {
  // 模拟导出
  // 实际项目中调用后端导出API
}

onMounted(() => {
  loadSettlementReports()
  setTimeout(initRevenueChart, 100)
})
</script>

<template>
  <div class="reports-page">
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="结算账单" name="settlement">
          <div class="report-actions">
            <el-date-picker
              v-model="dateRange"
              type="monthrange"
              range-separator="至"
              start-placeholder="开始月份"
              end-placeholder="结束月份"
              value-format="YYYY-MM"
            />
            <el-button type="primary" @click="loadSettlementReports">查询</el-button>
            <el-button type="success" icon="Download" @click="exportReport">导出报表</el-button>
          </div>

          <el-row :gutter="20" class="stats-row">
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">累计订单数</div>
                <div class="stat-value primary">12,580</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">累计总收入</div>
                <div class="stat-value success">¥130,800</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">累计能耗费用</div>
                <div class="stat-value warning">¥25,680</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">累计净利润</div>
                <div class="stat-value danger">¥105,120</div>
              </div>
            </el-col>
          </el-row>

          <div ref="revenueChartRef" class="chart"></div>

          <el-table
            v-loading="loading"
            :data="settlementReports"
            border
            stripe
            style="width: 100%; margin-top: 20px;"
          >
            <el-table-column prop="period" label="账期" width="120" />
            <el-table-column prop="totalOrders" label="订单数" width="100" />
            <el-table-column prop="totalRevenue" label="总收入" width="120">
              <template #default="{ row }">¥{{ row.totalRevenue.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="powerCost" label="电费" width="100">
              <template #default="{ row }">¥{{ row.powerCost.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="waterCost" label="水费" width="100">
              <template #default="{ row }">¥{{ row.waterCost.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="maintenanceCost" label="维护费" width="100">
              <template #default="{ row }">¥{{ row.maintenanceCost.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="netProfit" label="净利润" width="120">
              <template #default="{ row }">
                <span class="profit">¥{{ row.netProfit.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'settled' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'settled' ? '已结算' : '待结算' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :current-page="pagination.page"
              :page-size="pagination.pageSize"
              :total="pagination.total"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="能耗分摊" name="energy">
          <div class="report-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
            <el-button type="primary" @click="loadEnergySplit">查询</el-button>
            <el-button type="success" icon="Download" @click="exportReport">导出报表</el-button>
          </div>

          <div ref="energyChartRef" class="chart"></div>

          <el-table
            v-loading="loading"
            :data="energySplitData"
            border
            stripe
            style="width: 100%; margin-top: 20px;"
          >
            <el-table-column prop="deviceId" label="设备ID" width="100" />
            <el-table-column prop="deviceName" label="设备名称" min-width="120" />
            <el-table-column prop="location" label="位置" min-width="150" />
            <el-table-column prop="powerConsumption" label="耗电量(kWh)" width="140">
              <template #default="{ row }">{{ row.powerConsumption.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="waterConsumption" label="耗水量(L)" width="140">
              <template #default="{ row }">{{ row.waterConsumption.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="powerCost" label="电费(元)" width="120">
              <template #default="{ row }">¥{{ row.powerCost.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="waterCost" label="水费(元)" width="120">
              <template #default="{ row }">¥{{ row.waterCost.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="totalEnergyCost" label="能耗合计(元)" width="140">
              <template #default="{ row }">
                <span class="total-cost">¥{{ row.totalEnergyCost.toLocaleString() }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.reports-page {
  .tabs-card {
    .report-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .stats-row {
      margin-bottom: 20px;

      .stat-box {
        background: #f5f7fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;

          &.primary {
            color: #409eff;
          }

          &.success {
            color: #67c23a;
          }

          &.warning {
            color: #e6a23c;
          }

          &.danger {
            color: #f56c6c;
          }
        }
      }
    }

    .chart {
      height: 350px;
      width: 100%;
    }

    .profit {
      color: #67c23a;
      font-weight: 600;
    }

    .total-cost {
      color: #f56c6c;
      font-weight: 600;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
