<template>
  <div class="page-container">
    <div class="page-header">
      <h2>运营报表</h2>
      <el-button @click="exportReport">导出报表</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">本月运输量</div>
            <div class="stat-value">{{ stats.totalOrders }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总行驶里程</div>
            <div class="stat-value">{{ stats.totalDistance }} km</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">准点率</div>
            <div class="stat-value">{{ stats.onTimeRate }}%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">异常率</div>
            <div class="stat-value exception">{{ stats.exceptionRate }}%</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 20px">
      <el-tab-pane label="运输时效" name="timely">
        <el-table :data="timelyData" border>
          <el-table-column prop="route" label="路线" />
          <el-table-column prop="total_orders" label="订单数" />
          <el-table-column prop="avg_duration" label="平均时长(小时)" />
          <el-table-column prop="on_time_count" label="准点数量" />
          <el-table-column prop="on_time_rate" label="准点率" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="异常统计" name="exception">
        <el-table :data="exceptionData" border>
          <el-table-column prop="type" label="异常类型" />
          <el-table-column prop="count" label="数量" />
          <el-table-column prop="percentage" label="占比" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="成本统计" name="cost">
        <el-table :data="costData" border>
          <el-table-column prop="route" label="路线" />
          <el-table-column prop="total_cost" label="总成本" />
          <el-table-column prop="cost_per_km" label="每公里成本" />
          <el-table-column prop="cost_per_ton" label="每吨成本" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="签收率" name="signing">
        <el-table :data="signingData" border>
          <el-table-column prop="period" label="周期" />
          <el-table-column prop="total" label="总数" />
          <el-table-column prop="signed" label="已签收" />
          <el-table-column prop="pending" label="待签收" />
          <el-table-column prop="rate" label="签收率" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api'

const activeTab = ref('timely')
const stats = ref({ totalOrders: 0, totalDistance: 0, onTimeRate: 0, exceptionRate: 0 })
const timelyData = ref([])
const exceptionData = ref([])
const costData = ref([])
const signingData = ref([])

onMounted(() => {
  fetchReportData()
})

async function fetchReportData() {
  try {
    const res = await reportApi.comprehensive()
    stats.value = res.stats
    timelyData.value = res.timely || []
    exceptionData.value = res.exception || []
    costData.value = res.cost || []
    signingData.value = res.signing || []
  } catch (error) {
    ElMessage.error('获取报表数据失败')
  }
}

function exportReport() {
  ElMessage.info('导出报表功能')
}
</script>

<style lang="scss" scoped>
.stat-item {
  text-align: center;
  padding: 10px 0;

  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 10px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #303133;

    &.exception {
      color: #f56c6c;
    }
  }
}
</style>
