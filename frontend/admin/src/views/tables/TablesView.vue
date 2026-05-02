<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/utils/api'
import websocketService from '@/utils/websocket'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const tables = ref<any[]>([])
const tableStatus = ref({
  total: 0,
  vacant: 0,
  occupied: 0,
  cleaning: 0,
  reserved: 0,
})

const statusColors: Record<string, string> = {
  vacant: 'success',
  occupied: 'warning',
  cleaning: 'info',
  reserved: '',
}

const statusLabels: Record<string, string> = {
  vacant: '空闲',
  occupied: '占用',
  cleaning: '清台',
  reserved: '预订',
}

const fetchTables = async () => {
  loading.value = true
  try {
    tables.value = await request.get('/tables')
    tableStatus.value = await request.get('/tables/status/summary')
  } catch (error) {
    ElMessage.error('加载桌台数据失败')
  } finally {
    loading.value = false
  }
}

const occupyTable = async (table: any) => {
  try {
    await ElMessageBox.confirm(`确定要占用桌台 ${table.tableNumber} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    await request.post(`/tables/${table.id}/occupy`, { guestCount: 2 })
    ElMessage.success('桌台已占用')
    fetchTables()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const markCleaning = async (table: any) => {
  try {
    await ElMessageBox.confirm(`确定要将桌台 ${table.tableNumber} 标记为清台吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/tables/${table.id}/cleaning`)
    ElMessage.success('桌台已标记为清台')
    fetchTables()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const markVacant = async (table: any) => {
  try {
    await ElMessageBox.confirm(`确定要将桌台 ${table.tableNumber} 标记为空闲吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
    await request.post(`/tables/${table.id}/vacant`)
    ElMessage.success('桌台已标记为空闲')
    fetchTables()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const viewOrder = (table: any) => {
  if (table.currentOrderId) {
    ElMessage.info(`查看订单: ${table.currentOrderId}`)
  }
}

const onTableStatusChanged = (data: any) => {
  ElMessage.info(`桌台 ${data.tableNumber} 状态已更新`)
  fetchTables()
}

onMounted(() => {
  fetchTables()
  
  if (authStore.user) {
    websocketService.connect(authStore.user.role, authStore.user.id)
    websocketService.on('tableStatusChanged', onTableStatusChanged)
  }
})

onUnmounted(() => {
  websocketService.off('tableStatusChanged', onTableStatusChanged)
})
</script>

<template>
  <div class="tables-page">
    <el-card class="stats-card">
      <template #header>
        <span class="card-title">桌台状态统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="stat-item">
            <span class="stat-label">总台数</span>
            <span class="stat-value total">{{ tableStatus.total }}</span>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <el-tag type="success" effect="dark" size="large">空闲</el-tag>
            <span class="stat-value">{{ tableStatus.vacant }}</span>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <el-tag type="warning" effect="dark" size="large">占用</el-tag>
            <span class="stat-value">{{ tableStatus.occupied }}</span>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <el-tag type="info" effect="dark" size="large">清台</el-tag>
            <span class="stat-value">{{ tableStatus.cleaning }}</span>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <el-tag size="large">预订</el-tag>
            <span class="stat-value">{{ tableStatus.reserved }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="tables-card" v-loading="loading">
      <template #header>
        <span class="card-title">桌台列表</span>
        <el-button type="primary" size="small" @click="fetchTables">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-row :gutter="20">
        <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="table in tables" :key="table.id">
          <el-card :class="['table-card', `status-${table.status}`]">
            <div class="table-header">
              <span class="table-number">{{ table.tableNumber }}</span>
              <el-tag :type="statusColors[table.status]" size="small">
                {{ statusLabels[table.status] }}
              </el-tag>
            </div>
            <div class="table-info">
              <span class="info-label">容量:</span>
              <span class="info-value">{{ table.capacity }}人</span>
            </div>
            <div class="table-actions">
              <el-button
                v-if="table.status === 'vacant'"
                type="primary"
                size="small"
                @click="occupyTable(table)"
              >
                开单
              </el-button>
              <el-button
                v-else-if="table.status === 'occupied'"
                type="warning"
                size="small"
                @click="viewOrder(table)"
              >
                查看订单
              </el-button>
              <el-button
                v-else-if="table.status === 'occupied'"
                type="info"
                size="small"
                @click="markCleaning(table)"
              >
                清台
              </el-button>
              <el-button
                v-else-if="table.status === 'cleaning'"
                type="success"
                size="small"
                @click="markVacant(table)"
              >
                完成清台
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.tables-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.stats-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-value.total {
  color: #409eff;
}

.tables-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  :deep(.el-card__header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.table-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &.status-vacant {
    border-left: 4px solid #67c23a;
  }

  &.status-occupied {
    border-left: 4px solid #e6a23c;
  }

  &.status-cleaning {
    border-left: 4px solid #909399;
  }

  &.status-reserved {
    border-left: 4px solid #409eff;
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-number {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #606266;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
