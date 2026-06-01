<template>
  <div class="reports">
    <div class="page-header">
      <h2 class="page-title">监管报表</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="24"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.totalParcels }}</div>
              <div class="stat-label">地块总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon :size="24"><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.transferableArea }} 亩</div>
              <div class="stat-label">可流转面积</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.activeContracts }}</div>
              <div class="stat-label">有效合同</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon :size="24"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(overview.avgPrice) }}</div>
              <div class="stat-label">平均价格(元/亩)</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>按村统计</template>
          <el-table :data="villageData" style="width: 100%">
            <el-table-column prop="village" label="村名" />
            <el-table-column prop="parcel_count" label="地块数" />
            <el-table-column prop="total_area" label="总面积(亩)" />
            <el-table-column prop="transferable_area" label="可流转面积" />
            <el-table-column prop="contracted_area" label="已流转面积" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>流转面积统计</span>
            </div>
          </template>
          <div ref="chartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>即将到期合同(90天内)</template>
          <el-table :data="expiringContracts" style="width: 100%">
            <el-table-column prop="contract_no" label="合同编号" />
            <el-table-column prop="lessor_name" label="出租方" />
            <el-table-column prop="lessee_name" label="承租方" />
            <el-table-column prop="end_date" label="到期日期" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>欠租预警</template>
          <el-table :data="overdueRent" style="width: 100%">
            <el-table-column prop="contract_no" label="合同编号" />
            <el-table-column prop="lessor_name" label="出租方" />
            <el-table-column prop="lessee_name" label="承租方" />
            <el-table-column prop="due_date" label="应缴日期" />
            <el-table-column prop="amount" label="金额" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { api } from '../utils/request'

const overview = ref({})
const villageData = ref([])
const expiringContracts = ref([])
const overdueRent = ref([])
const chartRef = ref(null)

const formatNumber = (num) => {
  if (!num) return '0'
  return Number(num).toFixed(2)
}

const loadData = async () => {
  try {
    const [overviewRes, villageRes, expiringRes, overdueRes] = await Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/by-village'),
      api.get('/reports/expiring-contracts', { days: 90 }),
      api.get('/reports/overdue-rent')
    ])
    
    overview.value = overviewRes.data
    villageData.value = villageRes.data
    expiringContracts.value = expiringRes.data
    overdueRent.value = overdueRes.data

    await nextTick()
    initChart()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const initChart = () => {
  if (!chartRef.value) return
  
  const chart = echarts.init(chartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总面积', '可流转面积', '已流转面积'] },
    xAxis: { type: 'category', data: villageData.value.map(v => v.village) },
    yAxis: { type: 'value', name: '亩' },
    series: [
      { name: '总面积', type: 'bar', data: villageData.value.map(v => v.total_area), itemStyle: { color: '#409EFF' } },
      { name: '可流转面积', type: 'bar', data: villageData.value.map(v => v.transferable_area), itemStyle: { color: '#67C23A' } },
      { name: '已流转面积', type: 'bar', data: villageData.value.map(v => v.contracted_area), itemStyle: { color: '#E6A23C' } }
    ]
  }
  chart.setOption(option)
}

onMounted(loadData)
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.chart {
  height: 280px;
}
</style>
