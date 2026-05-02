<template>
  <div class="page-container">
    <div class="page-header">
      <h2>监控中心</h2>
      <el-button @click="refreshData">刷新</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>在途运单</span>
          </template>
          <div class="stat-value">{{ stats.inTransitCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>今日完成</span>
          </template>
          <div class="stat-value">{{ stats.completedToday }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>异常告警</span>
          </template>
          <div class="stat-value stat-alert">{{ stats.exceptionCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-table :data="waybills" v-loading="loading" stripe style="margin-top: 20px">
      <el-table-column prop="waybill_no" label="运单号" width="180" />
      <el-table-column label="当前位置" min-width="200">
        <template #default="{ row }">
          <div v-if="row.current_location">{{ row.current_location.address }}</div>
          <div v-else class="text-secondary">暂无位置</div>
        </template>
      </el-table-column>
      <el-table-column prop="speed" label="速度" width="100">
        <template #default="{ row }">
          {{ row.speed ? row.speed + ' km/h' : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="exception" label="异常" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.has_exception" type="danger">有异常</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewTrack(row)">轨迹</el-button>
          <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { monitorApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const waybills = ref([])
const stats = ref({
  inTransitCount: 0,
  completedToday: 0,
  exceptionCount: 0
})

let refreshTimer = null

onMounted(() => {
  fetchData()
  refreshTimer = setInterval(fetchData, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

async function fetchData() {
  loading.value = true
  try {
    const res = await monitorApi.waybills()
    waybills.value = res.data.waybills || []
    stats.value = res.data.stats || stats.value
  } catch (error) {
    ElMessage.error('获取监控数据失败')
  } finally {
    loading.value = false
  }
}

function refreshData() {
  fetchData()
}

function viewTrack(row) {
  router.push(`/dispatch/waybill/${row.id}/track`)
}

function viewDetail(row) {
  router.push(`/dispatch/waybill/${row.id}`)
}

function getStatusType(status) {
  const types = {
    CREATED: 'info',
    ASSIGNED: 'info',
    ACCEPTED: 'info',
    PICKED_UP: 'primary',
    DEPARTED: 'primary',
    IN_TRANSIT: 'success',
    ARRIVED: 'warning',
    SIGNED: 'success',
    COMPLETED: 'success'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    CREATED: '已创建',
    ASSIGNED: '已分配',
    ACCEPTED: '已接单',
    PICKED_UP: '已提货',
    DEPARTED: '已出发',
    IN_TRANSIT: '运输中',
    ARRIVED: '已到达',
    SIGNED: '已签收',
    COMPLETED: '已完成'
  }
  return texts[status] || status
}
</script>

<style lang="scss" scoped>
.stat-value {
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  padding: 10px 0;
}

.stat-alert {
  color: #f56c6c;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
}
</style>
