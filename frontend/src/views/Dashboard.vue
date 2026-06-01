<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="28"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalParcels }}</div>
              <div class="stat-label">地块总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon :size="28"><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.transferableParcels }}</div>
              <div class="stat-label">可流转地块</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeContracts }}</div>
              <div class="stat-label">有效合同</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon :size="28"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(stats.totalContractAmount) }}</div>
              <div class="stat-label">合同总金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="card-header">
              <span>流转面积统计</span>
            </div>
          </template>
          <div ref="areaChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="card-header">
              <span>按村统计</span>
            </div>
          </template>
          <el-table :data="villageData" style="width: 100%">
            <el-table-column prop="village" label="村名" />
            <el-table-column prop="parcel_count" label="地块数" />
            <el-table-column prop="total_area" label="总面积(亩)" />
            <el-table-column prop="transferable_area" label="可流转面积" />
            <el-table-column prop="contracted_area" label="已流转面积" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="card-header">
              <span>即将到期合同</span>
              <el-link type="primary" @click="$router.push('/contracts')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="expiringContracts" style="width: 100%">
            <el-table-column prop="contract_no" label="合同编号" />
            <el-table-column prop="lessor_name" label="出租方" />
            <el-table-column prop="lessee_name" label="承租方" />
            <el-table-column prop="end_date" label="到期日期" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="card-header">
              <span>欠租预警</span>
              <el-link type="primary" @click="$router.push('/reports')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="overdueRent" style="width: 100%">
            <el-table-column prop="contract_no" label="合同编号" />
            <el-table-column prop="lessor_name" label="出租方" />
            <el-table-column prop="lessee_name" label="承租方" />
            <el-table-column prop="due_date" label="应缴日期" />
            <el-table-column prop="amount" label="应缴金额" />
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

const stats = ref({})
const villageData = ref([])
const expiringContracts = ref([])
const overdueRent = ref([])
const areaChartRef = ref(null)

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const loadData = async () => {
  try {
    const [overviewRes, villageRes, expiringRes, overdueRes] = await Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/by-village'),
      api.get('/reports/expiring-contracts', { days: 90 }),
      api.get('/reports/overdue-rent')
    ])
    
    stats.value = overviewRes.data
    villageData.value = villageRes.data
    expiringContracts.value = expiringRes.data.slice(0, 5)
    overdueRent.value = overdueRes.data.slice(0, 5)

    await nextTick()
    initChart()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const initChart = () => {
  if (!areaChartRef.value) return
  
  const chart = echarts.init(areaChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总面积', '可流转面积', '已流转面积'] },
    xAxis: { type: 'category', data: villageData.value.map(v => v.village) },
    yAxis: { type: 'value', name: '亩' },
    series: [
      { name: '总面积', type: 'bar', data: villageData.value.map(v => v.total_area) },
      { name: '可流转面积', type: 'bar', data: villageData.value.map(v => v.transferable_area) },
      { name: '已流转面积', type: 'bar', data: villageData.value.map(v => v.contracted_area) }
    ]
  }
  chart.setOption(option)
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 300px;
}
</style>
