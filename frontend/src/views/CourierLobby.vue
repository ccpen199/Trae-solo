<template>
  <div class="courier-lobby-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>接单大厅</h2>
          <el-tag type="success" size="large">
            <el-icon><CircleCheck /></el-icon>
            信用分: {{ userStore.user?.credit_score || 0 }}
          </el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="可接任务" name="available">
          <el-table :data="availableTasks" style="width: 100%" v-loading="loading" @row-click="handleRowClick">
            <el-table-column prop="id" label="任务ID" width="80" />
            <el-table-column prop="item.name" label="物品" width="150" :show-overflow-tooltip="true" />
            <el-table-column prop="item.category" label="类别" width="120">
              <template #default="{ row }">
                {{ row.item?.category || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="pickup_address" label="取货地址" :show-overflow-tooltip="true" />
            <el-table-column prop="delivery_address" label="送货地址" :show-overflow-tooltip="true" />
            <el-table-column prop="distance_km" label="距离" width="100">
              <template #default="{ row }">
                {{ row.distance_km ? row.distance_km + 'km' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="final_price" label="配送费" width="120">
              <template #default="{ row }">
                <span style="color: #67c23a; font-weight: 600; font-size: 16px">
                  ¥{{ row.final_price }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="安全等级" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.safety_level_id" :type="getSafetyTagType(row.safety_level_id)" size="small">
                  {{ getSafetyLevelText(row.safety_level_id) }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click.stop="handleAccept(row)">
                  接单
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && availableTasks.length === 0" description="暂无可接任务" />
        </el-tab-pane>

        <el-tab-pane label="我的任务" name="my-tasks">
          <el-table :data="myTasks" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="任务ID" width="80" />
            <el-table-column prop="item.name" label="物品" width="150" :show-overflow-tooltip="true" />
            <el-table-column prop="pickup_address" label="取货地址" :show-overflow-tooltip="true" />
            <el-table-column prop="delivery_address" label="送货地址" :show-overflow-tooltip="true" />
            <el-table-column prop="final_price" label="配送费" width="120">
              <template #default="{ row }">
                <span style="color: #67c23a; font-weight: 600">¥{{ row.final_price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <span :class="['status-badge', `status-${row.status}`]">
                  {{ getStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/tasks/${row.id}`)">
                  查看
                </el-button>
                <el-button v-if="row.status === 'accepted'" link type="success" @click="handleUpdateStatus(row, 'picked_up')">
                  取货
                </el-button>
                <el-button v-if="row.status === 'picked_up'" link type="success" @click="handleUpdateStatus(row, 'completed')">
                  送达
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && myTasks.length === 0" description="暂无进行中任务" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="任务详情" width="700px">
      <el-descriptions :column="2" border v-if="selectedTask.id">
        <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
        <el-descriptions-item label="物品名称">{{ selectedTask.item?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物品类别">{{ selectedTask.item?.category || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物品特征码">{{ selectedTask.item?.feature_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取货地址" :span="2">{{ selectedTask.pickup_address }}</el-descriptions-item>
        <el-descriptions-item label="送货地址" :span="2">{{ selectedTask.delivery_address }}</el-descriptions-item>
        <el-descriptions-item label="预估距离">{{ selectedTask.distance_km ? selectedTask.distance_km + 'km' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="配送费用">¥{{ selectedTask.final_price }}</el-descriptions-item>
        <el-descriptions-item label="特殊要求" :span="2">
          {{ selectedTask.item?.special_requirements || '无' }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAcceptFromDetail">
          确认接单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { taskApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('available')
const availableTasks = ref([])
const myTasks = ref([])
const detailDialogVisible = ref(false)
const selectedTask = ref({})

const getSafetyLevelText = (id) => {
  const map = {
    1: '活体',
    2: '易碎',
    3: '时效敏感',
    4: '普通'
  }
  return map[id] || '未知'
}

const getSafetyTagType = (id) => {
  const map = {
    1: 'warning',
    2: 'danger',
    3: 'info',
    4: ''
  }
  return map[id] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待接单',
    accepted: '已接单',
    picked_up: '已取货',
    in_transit: '配送中',
    completed: '已完成',
    exception: '异常',
    cancelled: '已取消',
    failed: '失败'
  }
  return statusMap[status] || status
}

const loadAvailableTasks = async () => {
  loading.value = true
  try {
    const res = await taskApi.available()
    if (res.success) {
      availableTasks.value = res.tasks
    }
  } catch (error) {
    console.error('加载可接任务失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMyTasks = async () => {
  loading.value = true
  try {
    const res = await taskApi.list()
    if (res.success) {
      myTasks.value = res.tasks.filter(t => ['accepted', 'picked_up', 'in_transit'].includes(t.status))
    }
  } catch (error) {
    console.error('加载我的任务失败:', error)
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row) => {
  selectedTask.value = row
  detailDialogVisible.value = true
}

const handleAccept = async (row) => {
  try {
    await ElMessageBox.confirm(`确认接下此任务？配送费：¥${row.final_price}`, '确认接单', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })

    const res = await taskApi.accept(row.id)
    if (res.success) {
      ElMessage.success('接单成功')
      loadAvailableTasks()
      loadMyTasks()
      detailDialogVisible.value = false
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('接单失败:', error)
    }
  }
}

const handleAcceptFromDetail = () => {
  handleAccept(selectedTask.value)
}

const handleUpdateStatus = async (task, newStatus) => {
  try {
    const statusText = newStatus === 'picked_up' ? '取货' : '送达'
    await ElMessageBox.confirm(`确认${statusText}？`, `任务${statusText}`, {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    })

    const res = await taskApi.updateStatus(task.id, {
      status: newStatus,
      note: `接单人更新状态：${statusText}`
    })

    if (res.success) {
      ElMessage.success(`${statusText}成功`)
      loadMyTasks()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

onMounted(() => {
  loadAvailableTasks()
  loadMyTasks()
})
</script>

<style scoped>
.courier-lobby-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}
</style>
