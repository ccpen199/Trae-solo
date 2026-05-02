<template>
  <div class="cleaning-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>清洗工单</span>
          <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="待派发" name="pending" />
            <el-tab-pane label="进行中" name="in_progress">
              <template #label>
                <span>进行中 <el-badge :value="stats.in_progress" :hidden="stats.in_progress === 0" class="tab-badge" /></span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="已完成" name="completed" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="station_name" label="电站" width="140" fixed />
        <el-table-column prop="inverter_name" label="设备" width="140" />
        <el-table-column prop="reason" label="清洗原因" min-width="160">
          <template #default="{ row }">
            <el-tag size="small" :type="getReasonType(row.reason)">
              {{ getReasonLabel(row.reason) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimated_efficiency_loss" label="预估效率损失" width="140">
          <template #default="{ row }">
            <span class="efficiency-loss">
              -{{ ((row.estimated_efficiency_loss || 0) * 100).toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assigned_worker_name" label="清洗人员" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="userStore.hasRole('admin', 'station_owner') && row.status === 'pending'" 
              type="success" link size="small" 
              @click="showDispatchDialog(row)"
            >派发</el-button>
            <el-button 
              v-if="userStore.hasRole('maintenance_worker') && row.status === 'dispatched'" 
              type="success" link size="small" 
              @click="acceptOrder(row)"
            >接单</el-button>
            <el-button 
              v-if="userStore.hasRole('maintenance_worker') && row.status === 'accepted'" 
              type="warning" link size="small" 
              @click="startWork(row)"
            >开始清洗</el-button>
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

    <el-dialog v-model="detailVisible" :title="`清洗工单详情 - ${selectedOrder?.station_name || ''}`" width="700px">
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
        <el-descriptions-item label="清洗原因">
          <el-tag :type="getReasonType(selectedOrder.reason)" size="small">
            {{ getReasonLabel(selectedOrder.reason) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预估效率损失">
          <span class="efficiency-loss">
            -{{ ((selectedOrder.estimated_efficiency_loss || 0) * 100).toFixed(1) }}%
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedOrder.status)" size="small">
            {{ getStatusLabel(selectedOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="清洗人员">
          {{ selectedOrder.assigned_worker_name || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="触发说明" :span="2">
          {{ selectedOrder.trigger_details || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(selectedOrder.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">
          {{ formatTime(selectedOrder.completed_at) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="效率提升" v-if="selectedOrder.efficiency_improvement">
          <span class="efficiency-improvement">
            +{{ ((selectedOrder.efficiency_improvement || 0) * 100).toFixed(1) }}%
          </span>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider v-if="selectedOrder.before_photo_url || selectedOrder.after_photo_url" />
      
      <el-row :gutter="20" v-if="selectedOrder.before_photo_url || selectedOrder.after_photo_url">
        <el-col :span="12" v-if="selectedOrder.before_photo_url">
          <div class="photo-label">清洗前</div>
          <el-image :src="selectedOrder.before_photo_url" fit="cover" class="photo-image" />
        </el-col>
        <el-col :span="12" v-if="selectedOrder.after_photo_url">
          <div class="photo-label">清洗后</div>
          <el-image :src="selectedOrder.after_photo_url" fit="cover" class="photo-image" />
        </el-col>
      </el-row>
    </el-dialog>

    <el-dialog v-model="dispatchDialogVisible" title="派发工单" width="500px">
      <el-form :model="dispatchForm" label-width="100px">
        <el-form-item label="指派人员">
          <el-select v-model="dispatchForm.worker_id" placeholder="请选择清洗人员" style="width: 100%">
            <el-option
              v-for="worker in workers"
              :key="worker.id"
              :label="worker.name"
              :value="worker.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker
            v-model="dispatchForm.scheduled_time"
            type="datetime"
            placeholder="选择计划时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDispatch">确认派发</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成清洗" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="清洗前照片">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="(file) => completeForm.before_photo = file"
          >
            <el-button type="primary">上传照片</el-button>
            <template #tip>
              <div class="el-upload__tip">清洗前对比照片</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="清洗后照片">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="(file) => completeForm.after_photo = file"
          >
            <el-button type="primary">上传照片</el-button>
            <template #tip>
              <div class="el-upload__tip">清洗后对比照片</div>
            </template>
          </el-upload>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('all')
const orders = ref([])
const workers = ref([])
const detailVisible = ref(false)
const dispatchDialogVisible = ref(false)
const completeDialogVisible = ref(false)
const selectedOrder = ref(null)
const stats = ref({
  in_progress: 0
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const dispatchForm = reactive({
  worker_id: null,
  scheduled_time: null
})

const completeForm = reactive({
  before_photo: null,
  after_photo: null
})

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const result = await api.get('/cleaning/list', { params })
    orders.value = result.data || result
    pagination.value.total = orders.value.length
    
    const allResult = await api.get('/cleaning/list')
    const allOrders = allResult.data || allResult
    stats.value = {
      in_progress: allOrders.filter(o => 
        o.status === 'dispatched' || o.status === 'accepted' || o.status === 'in_progress'
      ).length
    }
  } catch (error) {
    console.error('Load cleaning orders error:', error)
  } finally {
    loading.value = false
  }
}

const loadWorkers = async () => {
  try {
    const result = await api.get('/users/list')
    const data = result.data || result
    workers.value = data.filter(u => u.role === 'maintenance_worker')
  } catch (error) {
    console.error('Load workers error:', error)
  }
}

const handleTabChange = () => {
  loadOrders()
}

const viewDetail = (order) => {
  selectedOrder.value = order
  detailVisible.value = true
}

const showDispatchDialog = (order) => {
  selectedOrder.value = order
  dispatchForm.worker_id = null
  dispatchForm.scheduled_time = null
  dispatchDialogVisible.value = true
}

const confirmDispatch = async () => {
  if (!dispatchForm.worker_id) {
    ElMessage.warning('请选择指派人员')
    return
  }
  try {
    await api.post(`/cleaning/${selectedOrder.value.id}/dispatch`, {
      worker_id: dispatchForm.worker_id
    })
    ElMessage.success('派发成功')
    dispatchDialogVisible.value = false
    loadOrders()
  } catch (error) {
    console.error('Dispatch error:', error)
  }
}

const acceptOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确定要接单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.post(`/cleaning/${order.id}/accept`)
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
    await ElMessageBox.confirm('确定开始清洗吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.post(`/cleaning/${order.id}/start`)
    ElMessage.success('已开始清洗')
    loadOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Start work error:', e)
    }
  }
}

const showCompleteDialog = (order) => {
  selectedOrder.value = order
  completeForm.before_photo = null
  completeForm.after_photo = null
  completeDialogVisible.value = true
}

const confirmComplete = async () => {
  try {
    await api.post(`/cleaning/${selectedOrder.value.id}/complete`, {
      before_photo_url: 'data:image/png;base64,placeholder',
      after_photo_url: 'data:image/png;base64,placeholder'
    })
    ElMessage.success('清洗已完成')
    completeDialogVisible.value = false
    loadOrders()
  } catch (error) {
    console.error('Complete error:', error)
  }
}

const getReasonType = (reason) => {
  const types = {
    dust_accumulation: 'warning',
    shading: 'info',
    scheduled_maintenance: 'info'
  }
  return types[reason] || 'info'
}

const getReasonLabel = (reason) => {
  const labels = {
    dust_accumulation: '积尘严重',
    shading: '遮挡影响',
    scheduled_maintenance: '定期维护'
  }
  return labels[reason] || reason
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
    pending: '待派发',
    dispatched: '已派发',
    accepted: '已接单',
    in_progress: '清洗中',
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
  loadWorkers()
})
</script>

<style scoped>
.cleaning-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.efficiency-loss {
  color: #f56c6c;
  font-weight: 600;
}

.efficiency-improvement {
  color: #67c23a;
  font-weight: 600;
}

.photo-label {
  text-align: center;
  font-weight: 600;
  margin-bottom: 8px;
}

.photo-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.tab-badge {
  margin-left: 6px;
}
</style>
