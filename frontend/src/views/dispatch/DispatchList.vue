<template>
  <div class="dispatch-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>调度指令</span>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>新建指令
          </el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待处理" name="pending" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="instruction_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeType(row.instruction_type)" size="small">
              {{ getTypeText(row.instruction_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehicle_plate" label="车辆" width="100" />
        <el-table-column prop="driver_name" label="司机" width="80" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="['pending', 'sent', 'read'].includes(row.status)" type="primary" link @click="confirmInstruction(row)">确认</el-button>
            <el-button v-if="['pending', 'sent'].includes(row.status)" type="primary" link @click="markAsRead(row)">标记已读</el-button>
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="dialogVisible"
      title="新建调度指令"
      width="500px"
    >
      <el-form :model="dispatchForm" :rules="dispatchRules" ref="dispatchFormRef" label-width="100px">
        <el-form-item label="订单" prop="order_id">
          <el-select v-model="dispatchForm.order_id" placeholder="请选择订单" style="width: 100%">
            <el-option v-for="order in orders" :key="order.id" :label="order.order_no" :value="order.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="instruction_type">
          <el-select v-model="dispatchForm.instruction_type" placeholder="请选择类型" style="width: 100%">
            <el-option label="取货单" value="pickup" />
            <el-option label="调度指令" value="dispatch" />
            <el-option label="确认指令" value="confirm" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="dispatchForm.priority">
            <el-radio :value="3">高</el-radio>
            <el-radio :value="2">中</el-radio>
            <el-radio :value="1">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="dispatchForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="dispatchForm.content" type="textarea" :rows="4" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="detailVisible"
      title="指令详情"
      width="500px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">{{ currentDispatch.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="指令类型">{{ getTypeText(currentDispatch.instruction_type) }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ getPriorityText(currentDispatch.priority) }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ currentDispatch.content }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDispatch.status)">{{ getStatusText(currentDispatch.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车辆">{{ currentDispatch.vehicle_plate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentDispatch.driver_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentDispatch.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="已读时间">{{ formatDate(currentDispatch.read_at) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="确认时间">{{ formatDate(currentDispatch.confirmed_at) || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getDispatchList, getPendingDispatches, createDispatch, markAsRead as markRead, confirmDispatch } from '@/api/dispatch'
import { getOrderList } from '@/api/orders'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const activeTab = ref('pending')
const dispatchFormRef = ref(null)
const orders = ref([])
const currentDispatch = ref({})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dispatchForm = reactive({
  order_id: null,
  instruction_type: 'dispatch',
  priority: 2,
  title: '',
  content: ''
})

const dispatchRules = {
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const getTypeType = (type) => {
  const typeMap = {
    pickup: 'success',
    dispatch: 'primary',
    confirm: 'warning',
    urgent: 'danger'
  }
  return typeMap[type] || 'info'
}

const getTypeText = (type) => {
  const textMap = {
    pickup: '取货单',
    dispatch: '调度指令',
    confirm: '确认指令',
    urgent: '紧急通知'
  }
  return textMap[type] || type
}

const getStatusType = (status) => {
  const typeMap = {
    sent: 'warning',
    pending: 'warning',
    read: 'info',
    confirmed: 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    sent: '待处理',
    pending: '待处理',
    read: '已读',
    confirmed: '已确认'
  }
  return textMap[status] || status
}

const getPriorityType = (priority) => {
  const typeMap = {
    high: 'danger',
    3: 'danger',
    medium: 'warning',
    2: 'warning',
    low: 'success',
    1: 'success'
  }
  return typeMap[priority] || 'info'
}

const getPriorityText = (priority) => {
  const textMap = {
    high: '高',
    3: '高',
    medium: '中',
    2: '中',
    low: '低',
    1: '低'
  }
  return textMap[priority] || priority
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const fetchDispatchList = async () => {
  loading.value = true
  try {
    let res
    if (activeTab.value === 'pending') {
      res = await getPendingDispatches()
      tableData.value = res || []
      pagination.total = res?.length || 0
    } else {
      res = await getDispatchList({
        page: pagination.page,
        pageSize: pagination.pageSize
      })
      tableData.value = res.data || []
      pagination.total = res.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取调度指令列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchOrders = async () => {
  try {
    const res = await getOrderList({
      page: 1,
      pageSize: 100
    })
    orders.value = res.data || []
  } catch (error) {
    console.error('获取订单列表失败:', error)
  }
}

const handleTabChange = () => {
  pagination.page = 1
  fetchDispatchList()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchDispatchList()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchDispatchList()
}

const openCreateDialog = () => {
  Object.assign(dispatchForm, {
    order_id: null,
    instruction_type: 'dispatch',
    priority: 'medium',
    title: '',
    content: ''
  })
  dialogVisible.value = true
}

const viewDetail = (row) => {
  currentDispatch.value = row
  detailVisible.value = true
}

const markAsRead = async (row) => {
  try {
    await markRead(row.id)
    ElMessage.success('已标记为已读')
    fetchDispatchList()
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const confirmInstruction = async (row) => {
  try {
    await confirmDispatch(row.id)
    ElMessage.success('已确认')
    fetchDispatchList()
  } catch (error) {
    console.error('确认失败:', error)
  }
}

const submitForm = async () => {
  if (!dispatchFormRef.value) return
  
  await dispatchFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await createDispatch(dispatchForm)
        ElMessage.success('创建成功')
        dialogVisible.value = false
        fetchDispatchList()
      } catch (error) {
        console.error('创建失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchDispatchList()
  fetchOrders()
})
</script>

<style scoped>
.dispatch-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
