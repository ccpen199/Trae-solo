<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="createOrder">
            <el-icon><Plus /></el-icon>创建订单
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in orderStatusOptions"
              :key="item.dict_key"
              :label="item.dict_value"
              :value="item.dict_key"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="origin_address" label="起点地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="dest_address" label="终点地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="total_fee" label="运费" width="100">
          <template #default="{ row }">
            ¥{{ row.total_fee || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link @click="editOrder(row)" v-if="row.status === 'pending'">编辑</el-button>
            <el-button type="primary" link @click="doReviewOrder(row)" v-if="row.status === 'pending'">审核</el-button>
            <el-button type="primary" link @click="doAssignOrder(row)" v-if="row.status === 'reviewed' || row.status === 'planned'">分配</el-button>
            <el-button type="primary" link @click="doStartOrder(row)" v-if="['planned', 'loading', 'transit', 'unloading'].includes(row.status)">执行</el-button>
            <el-button type="danger" link @click="doCancelOrder(row)" v-if="['pending', 'reviewed', 'planned'].includes(row.status)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="assignDialogVisible"
      title="分配订单"
      width="500px"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="选择车辆" required>
          <el-select v-model="assignForm.vehicle_id" placeholder="请选择车辆" style="width: 100%" @change="handleVehicleChange">
            <el-option
              v-for="item in idleVehicles"
              :key="item.id"
              :label="`${item.plate_number} - ${item.vehicle_type}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择司机" required>
          <el-select v-model="assignForm.driver_id" placeholder="请选择司机" style="width: 100%">
            <el-option
              v-for="item in idleDrivers"
              :key="item.id"
              :label="`${item.real_name} - ${item.phone}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划出发">
          <el-date-picker
            v-model="assignForm.plan_departure_time"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="计划到达">
          <el-date-picker
            v-model="assignForm.plan_arrival_time"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :loading="submitLoading">确认分配</el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="startDialogVisible"
      title="订单执行"
      width="400px"
    >
      <el-form :model="startForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="startForm.status">
            <el-radio value="loading" v-if="currentOrder?.status === 'planned'">开始装货</el-radio>
            <el-radio value="transit" v-if="currentOrder?.status === 'loading'">开始运输</el-radio>
            <el-radio value="unloading" v-if="currentOrder?.status === 'transit'">开始卸货</el-radio>
            <el-radio value="completed" v-if="currentOrder?.status === 'unloading'">完成订单</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStart" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getOrderList, reviewOrder, assignOrder, startOrder, cancelOrder, deleteOrder } from '@/api/orders'
import { getIdleVehicles } from '@/api/vehicles'
import { getIdleDrivers } from '@/api/drivers'
import { getBatchDict } from '@/api/dictionary'

const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const orderStatusOptions = ref([])
const idleVehicles = ref([])
const idleDrivers = ref([])

const currentOrder = ref(null)
const assignDialogVisible = ref(false)
const startDialogVisible = ref(false)

const searchForm = reactive({
  order_no: '',
  customer_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const assignForm = reactive({
  vehicle_id: '',
  driver_id: '',
  plan_departure_time: '',
  plan_arrival_time: ''
})

const startForm = reactive({
  status: ''
})

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    reviewed: 'info',
    planned: 'primary',
    loading: 'warning',
    transit: 'success',
    unloading: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const option = orderStatusOptions.value.find(item => item.dict_key === status)
  return option ? option.dict_value : status
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const fetchOrderList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const res = await getOrderList(params)
    tableData.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchDictData = async () => {
  try {
    const res = await getBatchDict(['order_status'])
    if (res.order_status) {
      orderStatusOptions.value = res.order_status
    }
  } catch (error) {
    console.error('获取字典数据失败:', error)
  }
}

const fetchIdleResources = async () => {
  try {
    const [vehiclesRes, driversRes] = await Promise.all([
      getIdleVehicles(),
      getIdleDrivers()
    ])
    idleVehicles.value = vehiclesRes || []
    idleDrivers.value = driversRes || []
  } catch (error) {
    console.error('获取空闲资源失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchOrderList()
}

const handleReset = () => {
  searchForm.order_no = ''
  searchForm.customer_name = ''
  searchForm.status = ''
  handleSearch()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchOrderList()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchOrderList()
}

const createOrder = () => {
  router.push('/orders/create')
}

const viewDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

const editOrder = (row) => {
  router.push(`/orders/${row.id}/edit`)
}

const doReviewOrder = async (row) => {
  await ElMessageBox.confirm('确定要审核通过该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  await reviewOrder(row.id, {})
  ElMessage.success('审核成功')
  fetchOrderList()
}

const doAssignOrder = (row) => {
  currentOrder.value = row
  assignForm.vehicle_id = row.vehicle_id || ''
  assignForm.driver_id = row.driver_id || ''
  assignForm.plan_departure_time = row.plan_departure_time ? dayjs(row.plan_departure_time).toDate() : ''
  assignForm.plan_arrival_time = row.plan_arrival_time ? dayjs(row.plan_arrival_time).toDate() : ''
  fetchIdleResources()
  assignDialogVisible.value = true
}

const handleVehicleChange = (vehicleId) => {
  const vehicle = idleVehicles.value.find(v => v.id === vehicleId)
  if (vehicle?.driver_id) {
    assignForm.driver_id = vehicle.driver_id
  }
}

const submitAssign = async () => {
  if (!assignForm.vehicle_id || !assignForm.driver_id) {
    ElMessage.warning('请选择车辆和司机')
    return
  }
  
  submitLoading.value = true
  try {
    const data = {
      vehicle_id: assignForm.vehicle_id,
      driver_id: assignForm.driver_id,
      plan_departure_time: assignForm.plan_departure_time ? dayjs(assignForm.plan_departure_time).format('YYYY-MM-DD HH:mm:ss') : null,
      plan_arrival_time: assignForm.plan_arrival_time ? dayjs(assignForm.plan_arrival_time).format('YYYY-MM-DD HH:mm:ss') : null
    }
    
    await assignOrder(currentOrder.value.id, data)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchOrderList()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const doStartOrder = (row) => {
  currentOrder.value = row
  const statusMap = {
    planned: 'loading',
    loading: 'transit',
    transit: 'unloading',
    unloading: 'completed'
  }
  startForm.status = statusMap[row.status]
  startDialogVisible.value = true
}

const submitStart = async () => {
  submitLoading.value = true
  try {
    await startOrder(currentOrder.value.id, { status: startForm.status })
    ElMessage.success('操作成功')
    startDialogVisible.value = false
    fetchOrderList()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const doCancelOrder = async (row) => {
  await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  await cancelOrder(row.id, {})
  ElMessage.success('取消成功')
  fetchOrderList()
}

onMounted(() => {
  fetchDictData()
  fetchOrderList()
})
</script>

<style scoped>
.order-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
