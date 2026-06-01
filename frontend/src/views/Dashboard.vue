<template>
  <div>
    <h2 style="margin-bottom: 20px">数据看板</h2>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #409eff">{{ stats.totalVehicles }}</div>
            <div style="color: #909399; margin-top: 10px">车辆总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #67c23a">{{ stats.mortgagedVehicles }}</div>
            <div style="color: #909399; margin-top: 10px">抵押中车辆</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #e6a23c">{{ stats.disbursedLoans }}/{{ stats.totalLoans }}</div>
            <div style="color: #909399; margin-top: 10px">已放款/总贷款</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #f56c6c">{{ stats.pendingRisks + stats.gpsAlerts }}</div>
            <div style="color: #909399; margin-top: 10px">待处理风险</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近车辆列表</span>
              <el-button type="primary" size="small" @click="$router.push('/vehicles')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentVehicles" style="width: 100%" size="small">
            <el-table-column prop="vin" label="VIN码" />
            <el-table-column prop="plate_number" label="车牌号" />
            <el-table-column prop="brand" label="品牌" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>风险预警</span>
              <el-button type="primary" size="small" @click="$router.push('/risks')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentRisks" style="width: 100%" size="small">
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="level" label="级别">
              <template #default="scope">
                <el-tag :type="scope.row.level === 'high' ? 'danger' : 'warning'">{{ scope.row.level === 'high' ? '高' : '中' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const stats = ref({
  totalVehicles: 0,
  mortgagedVehicles: 0,
  totalLoans: 0,
  disbursedLoans: 0,
  pendingRisks: 0,
  gpsAlerts: 0
})

const recentVehicles = ref([])
const recentRisks = ref([])

const loadStats = async () => {
  try {
    const res = await api.get('/dashboard/stats')
    if (res.data.success) {
      stats.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadVehicles = async () => {
  try {
    const res = await api.get('/vehicles')
    if (res.data.success) {
      recentVehicles.value = res.data.data.slice(0, 5)
    }
  } catch (e) {
    console.error(e)
  }
}

const loadRisks = async () => {
  try {
    const res = await api.get('/risks')
    if (res.data.success) {
      recentRisks.value = res.data.data.filter(r => r.status === 'pending').slice(0, 5)
    }
  } catch (e) {
    console.error(e)
  }
}

const getStatusType = (status) => {
  const map = { pending: 'info', valuated: '', mortgaged: 'success', released: '' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待完善', valuated: '已评估', mortgaged: '抵押中', released: '已解押' }
  return map[status] || status
}

onMounted(() => {
  loadStats()
  loadVehicles()
  loadRisks()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
