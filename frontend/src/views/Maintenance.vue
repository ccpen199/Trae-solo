<template>
  <div class="maintenance-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>维修工单</span>
          <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="待处理" name="pending">
              <template #label>
                <span>待处理 <el-badge :value="stats.pending" :hidden="stats.pending === 0" class="tab-badge" /></span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="处理中" name="in_progress">
              <template #label>
                <span>处理中 <el-badge :value="stats.in_progress" :hidden="stats.in_progress === 0" class="tab-badge" /></span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="已完成" name="completed" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="station_name" label="电站" width="140" fixed />
        <el-table-column prop="inverter_name" label="设备" width="140" />
        <el-table-column prop="string_code" label="组串" width="120" />
        <el-table-column prop="problem_description" label="问题描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fault_type" label="故障类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getFaultTypeLabel(row.fault_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assigned_worker_name" label="运维人员" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="userStore.hasRole('maintenance_worker') && row.status === 'dispatched'" 
              type="success" link size="small" 
              @click="acceptOrder(row)"
            >接单</el-button>
            <el-button 
              v-if="userStore.hasRole('maintenance_worker') && row.status === 'accepted'" 
              type="warning" link size="small" 
              @click="startWork(row)"
            >开始处理</el-button>
            <el-button 
              v-if="userStore.hasRole('maintenance_worker') && row.status === 'in_progress'" 
              type="success" link size="small" 
              @click="showCompleteDialog(row)"
            >完成</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="detailVisible" :title="`工单详情 - ${selectedOrder?.station_name || ''}`" width="700px">
      <el-descriptions v-if="selectedOrder" :column="2" border>
        <el-descriptions-item label="工单编号" :span="2">
          {{ selectedOrder.order_code }}
        </el-descriptions-item>
        <el-descriptions-item label="电站">
          {{ selectedOrder.station_name }}
        </el-descriptions-item>
        <el-descriptions-item label="逆变器">
          {{ selectedOrder.inverter_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="组串">
          {{ selectedOrder.string_code || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="故障类型">
          <el-tag size="small">{{ getFaultTypeLabel(selectedOrder.fault_type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(selectedOrder.priority)" size="small">
            {{ getPriorityLabel(selectedOrder.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedOrder.status)" size="small">
            {{ getStatusLabel(selectedOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="运维人员">
          {{ selectedOrder.assigned_worker_name || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">
          {{ selectedOrder.problem_description }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(selectedOrder.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="接单时间">
          {{ formatTime(selectedOrder.accepted_at) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatTime(selectedOrder.started_at) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">
          {{ formatTime(selectedOrder.completed_at) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="MTTR">
          {{ selectedOrder.mttr_minutes ? `${selectedOrder.mttr_minutes} 分钟` : '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成工单" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="解决方案">
          <el-input
            v-model="completeForm.solution"
            type="textarea"
            :rows="4"
            placeholder="请输入解决方案"
          />
        </el-form-item>
        <el-form-item label="耗时(分钟)">
          <el-input-number v-model="completeForm.time_spent" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('all')
const orders = ref([])
const detailVisible = ref(false)
const selectedOrder = ref(null)
const completeDialogVisible = ref(false)
const stats = ref({
  pending: 0,
  in_progress: 0,
  completed: 0
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const completeForm = reactive({
  solution: '',
  time_spent: 0
})

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const result = await api.get('/maintenance/list', { params })
    orders.value = result.data || result
    pagination.value.total = orders.value.length
    
    const allResult = await api.get('/maintenance/list')
    const allOrders = allResult.data || allResult
    stats.value = {
      pending: allOrders.filter(o => o.status === 'pending' || o.status === 'dispatched').length,
      in_progress: allOrders.filter(o => o.status === 'accepted' || o.status === 'in_progress').length,
      completed: allOrders.filter(o => o.status === 'completed' || o.status === 'verified').length
    }
  } catch (error) {
    console.error('Load orders error:', error)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  loadOrders()
}

const viewDetail = (order) => {
  selectedOrder.value = order
  detailVisible.value = true
}

const acceptOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确定要接单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.post(`/maintenance/${order.id}/accept`)
    ElMessage.success('接单成功')
    loadOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Accept order error:', e)
    }
  }
}

const startWork = async (order) => {
  try {
    await ElMessageBox.confirm('确定开始处理吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.post(`/maintenance/${order.id}/start`)
    ElMessage.success('已开始处理')
    loadOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Start work error:', e)
    }
  }
}

const showCompleteDialog = (order) => {
  selectedOrder.value = order
  completeForm.solution = ''
  completeForm.time_spent = 0
  completeDialogVisible.value = true
}

const confirmComplete = async () => {
  try {
    await api.post(`/maintenance/${selectedOrder.value.id}/complete`, completeForm)
    ElMessage.success('工单已完成')
    completeDialogVisible.value = false
    loadOrders()
  } catch (error) {
    console.error('Complete order error:', error)
  }
}

const getFaultTypeLabel = (type) => {
  const labels = {
    inverter_fault: '逆变器故障',
    string_fault: '组串故障',
    panel_fault: '组件故障',
    wiring_issue: '接线问题',
    communication_error: '通信异常',
    grid_issue: '并网问题',
    over_temperature: '过温告警',
    over_voltage: '过压告警'
  }
  return labels[type] || type
}

const getPriorityType = (priority) => {
  const types = {
    critical: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'info'
  }
  return types[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const labels = {
    critical: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || priority
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    dispatched: 'warning',
    accepted: 'primary',
    in_progress: 'danger',
    completed: 'success',
    verified: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待处理',
    dispatched: '已派发',
    accepted: '已接单',
    in_progress: '处理中',
    completed: '已完成',
    verified: '已验收',
    cancelled: '已取消'
  }
  return labels[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.maintenance-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.tab-badge {
  margin-left: 6px;
}
</style>
