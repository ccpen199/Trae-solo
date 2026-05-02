<template>
  <div class="page-container">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-operations">
        <el-button type="primary" @click="handleCreate">新建订单</el-button>
        <el-button @click="handleImport">导入订单</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="订单状态" clearable @change="fetchData">
        <el-option label="待调度" value="PENDING" />
        <el-option label="已调度" value="DISPATCHED" />
        <el-option label="运输中" value="IN_TRANSIT" />
        <el-option label="已完成" value="COMPLETED" />
        <el-option label="已取消" value="CANCELLED" />
      </el-select>
      <el-input v-model="filters.orderNo" placeholder="订单号" clearable style="width: 200px" @change="fetchData" />
      <el-input v-model="filters.customerName" placeholder="客户名称" clearable style="width: 200px" @change="fetchData" />
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="fetchData"
      />
    </div>

    <el-table :data="orders" v-loading="loading" stripe>
      <el-table-column prop="order_no" label="订单号" width="180" />
      <el-table-column prop="customer_name" label="客户" width="120" />
      <el-table-column label="提货信息" min-width="200">
        <template #default="{ row }">
          <div>{{ row.pickup_city }} {{ row.pickup_address }}</div>
          <div class="text-secondary">{{ row.pickup_time }}</div>
        </template>
      </el-table-column>
      <el-table-column label="收货信息" min-width="200">
        <template #default="{ row }">
          <div>{{ row.delivery_city }} {{ row.delivery_address }}</div>
        </template>
      </el-table-column>
      <el-table-column label="货物" width="120">
        <template #default="{ row }">
          <div>{{ row.goods_name }}</div>
          <div class="text-secondary">{{ row.weight }}吨 / {{ row.volume }}方</div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          <el-button link type="primary" @click="handleDispatch(row)" v-if="row.status === 'PENDING'">调度</el-button>
          <el-button link type="danger" @click="handleCancel(row)" v-if="row.status === 'PENDING'">取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @change="fetchData"
    />

    <el-dialog v-model="createDialogVisible" title="新建订单" width="700px" @close="createDialogVisible = false">
      <el-form :model="orderForm" label-width="100px">
        <el-divider content-position="left">客户信息</el-divider>
        <el-form-item label="客户名称" required>
          <el-input v-model="orderForm.customer_name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="orderForm.customer_contact" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="orderForm.customer_phone" />
        </el-form-item>

        <el-divider content-position="left">提货信息</el-divider>
        <el-form-item label="提货地址" required>
          <el-input v-model="orderForm.pickup_address" />
        </el-form-item>
        <el-form-item label="提货城市" required>
          <el-cascader v-model="orderForm.pickup_city" :options="cityOptions" placeholder="选择城市" />
        </el-form-item>
        <el-form-item label="提货时间" required>
          <el-date-picker v-model="orderForm.pickup_time" type="datetime" placeholder="选择日期时间" />
        </el-form-item>
        <el-form-item label="提货联系人">
          <el-input v-model="orderForm.pickup_contact" />
        </el-form-item>
        <el-form-item label="提货电话">
          <el-input v-model="orderForm.pickup_phone" />
        </el-form-item>

        <el-divider content-position="left">收货信息</el-divider>
        <el-form-item label="收货地址" required>
          <el-input v-model="orderForm.delivery_address" />
        </el-form-item>
        <el-form-item label="收货城市" required>
          <el-cascader v-model="orderForm.delivery_city" :options="cityOptions" placeholder="选择城市" />
        </el-form-item>
        <el-form-item label="收货联系人">
          <el-input v-model="orderForm.delivery_contact" />
        </el-form-item>
        <el-form-item label="收货电话">
          <el-input v-model="orderForm.delivery_phone" />
        </el-form-item>

        <el-divider content-position="left">货物信息</el-divider>
        <el-form-item label="货物名称" required>
          <el-input v-model="orderForm.goods_name" />
        </el-form-item>
        <el-form-item label="货物类型">
          <el-select v-model="orderForm.goods_type" placeholder="选择类型">
            <el-option label="普通货物" value="NORMAL" />
            <el-option label="易碎物品" value="FRAGILE" />
            <el-option label="危险品" value="DANGEROUS" />
            <el-option label="生鲜食品" value="FRESH" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量(吨)">
          <el-input-number v-model="orderForm.weight" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="体积(方)">
          <el-input-number v-model="orderForm.volume" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="件数">
          <el-input-number v-model="orderForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="包装类型">
          <el-select v-model="orderForm.package_type" placeholder="选择包装">
            <el-option label="纸箱" value="CARTON" />
            <el-option label="木箱" value="WOODEN_BOX" />
            <el-option label="托盘" value="PALLET" />
            <el-option label="散装" value="BULK" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCreate" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchDialogVisible" title="智能调度" width="900px" @close="dispatchDialogVisible = false">
      <div v-if="selectedOrder" class="dispatch-content">
        <el-alert type="info" :closable="false" style="margin-bottom: 20px">
          <template #title>
            <span>订单：{{ selectedOrder.order_no }}</span>
            <span style="margin-left: 20px">货物：{{ selectedOrder.goods_name }} / {{ selectedOrder.weight }}吨 / {{ selectedOrder.volume }}方</span>
          </template>
        </el-alert>

        <div v-if="recommendation" class="recommendation-card">
          <div class="recommend-header">
            <span class="recommend-title">智能推荐</span>
            <el-tag type="success">匹配度 {{ (recommendation.matching_score * 100).toFixed(0) }}%</el-tag>
          </div>
          <div class="recommend-content">
            <div class="recommend-item">
              <el-icon><Van /></el-icon>
              <span>推荐车辆：{{ recommendation.vehicle?.vehicle_no }} ({{ recommendation.vehicle?.vehicle_type }})</span>
            </div>
            <div class="recommend-item">
              <el-icon><User /></el-icon>
              <span>推荐司机：{{ recommendation.driver?.name }} ({{ recommendation.driver?.phone }})</span>
            </div>
            <div class="recommend-item">
              <el-icon><Location /></el-icon>
              <span>预计距离：{{ recommendation.route?.distance }}公里</span>
            </div>
            <div class="recommend-item">
              <el-icon><Clock /></el-icon>
              <span>预计送达：{{ recommendation.estimated_delivery_time }}</span>
            </div>
          </div>
          <div class="recommend-reasons">
            <b>推荐理由：</b>
            <ul>
              <li v-for="reason in recommendation.reasons" :key="reason">{{ reason }}</li>
            </ul>
          </div>
        </div>

        <el-divider content-position="left">选择车辆和司机</el-divider>

        <el-form label-width="100px">
          <el-form-item label="选择车辆">
            <el-select v-model="dispatchForm.vehicle_id" placeholder="请选择车辆" @change="onVehicleChange">
              <el-option
                v-for="vehicle in availableVehicles"
                :key="vehicle.id"
                :label="`${vehicle.vehicle_no} - ${vehicle.vehicle_type} (载重${vehicle.max_load}吨)`"
                :value="vehicle.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="选择司机">
            <el-select v-model="dispatchForm.driver_id" placeholder="请选择司机">
              <el-option
                v-for="driver in availableDrivers"
                :key="driver.id"
                :label="`${driver.name} - ${driver.phone}`"
                :value="driver.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitDispatch" :loading="submitting">确认调度</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi, dispatchApi, vehicleApi, driverApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const orders = ref([])
const createDialogVisible = ref(false)
const dispatchDialogVisible = ref(false)
const selectedOrder = ref(null)
const recommendation = ref(null)
const availableVehicles = ref([])
const availableDrivers = ref([])

const filters = reactive({
  status: '',
  orderNo: '',
  customerName: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const orderForm = reactive({
  customer_name: '',
  customer_contact: '',
  customer_phone: '',
  pickup_address: '',
  pickup_city: '',
  pickup_contact: '',
  pickup_phone: '',
  pickup_time: '',
  delivery_address: '',
  delivery_city: '',
  delivery_contact: '',
  delivery_phone: '',
  goods_name: '',
  goods_type: 'NORMAL',
  weight: 0,
  volume: 0,
  quantity: 1,
  package_type: 'CARTON'
})

const dispatchForm = reactive({
  vehicle_id: '',
  driver_id: ''
})

const cityOptions = [
  { value: '上海市', label: '上海市' },
  { value: '北京市', label: '北京市' },
  { value: '广州市', label: '广州市' },
  { value: '深圳市', label: '深圳市' },
  { value: '杭州市', label: '杭州市' },
  { value: '成都市', label: '成都市' },
  { value: '武汉市', label: '武汉市' },
  { value: '南京市', label: '南京市' }
]

onMounted(() => {
  fetchData()
  fetchVehicles()
  fetchDrivers()
})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    }
    if (filters.dateRange?.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    const res = await orderApi.list(params)
    orders.value = res.data
    pagination.total = res.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchVehicles() {
  const res = await vehicleApi.list({ status: 'AVAILABLE', pageSize: 100 })
  availableVehicles.value = res.data
}

async function fetchDrivers() {
  const res = await driverApi.list({ status: 'AVAILABLE', pageSize: 100 })
  availableDrivers.value = res.data
}

function getStatusType(status) {
  const types = {
    PENDING: 'warning',
    DISPATCHED: 'primary',
    IN_TRANSIT: 'success',
    COMPLETED: 'info',
    CANCELLED: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    PENDING: '待调度',
    DISPATCHED: '已调度',
    IN_TRANSIT: '运输中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return texts[status] || status
}

function handleCreate() {
  Object.keys(orderForm).forEach(key => {
    if (typeof orderForm[key] === 'number') orderForm[key] = 0
    else orderForm[key] = ''
  })
  orderForm.goods_type = 'NORMAL'
  orderForm.package_type = 'CARTON'
  orderForm.quantity = 1
  createDialogVisible.value = true
}

async function handleSubmitCreate() {
  if (!orderForm.customer_name || !orderForm.pickup_address || !orderForm.delivery_address) {
    ElMessage.warning('请填写必填项')
    return
  }
  submitting.value = true
  try {
    await orderApi.create(orderForm)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

function handleImport() {
  ElMessage.info('导入功能开发中')
}

function handleDetail(row) {
  router.push(`/dispatch/orders/${row.id}`)
}

async function handleDispatch(row) {
  selectedOrder.value = row
  dispatchForm.vehicle_id = ''
  dispatchForm.driver_id = ''
  recommendation.value = null
  dispatchDialogVisible.value = true

  try {
    const res = await dispatchApi.recommend({
      orderId: row.id,
      pickupLat: row.pickup_lat,
      pickupLng: row.pickup_lng,
      weight: row.weight,
      volume: row.volume
    })
    recommendation.value = res.data
    if (res.data.vehicle) {
      dispatchForm.vehicle_id = res.data.vehicle.id
    }
    if (res.data.driver) {
      dispatchForm.driver_id = res.data.driver.id
    }
  } catch (error) {
    ElMessage.warning('获取推荐失败，请手动选择')
  }
}

function onVehicleChange(vehicleId) {
  const vehicle = availableVehicles.value.find(v => v.id === vehicleId)
  if (vehicle && vehicle.current_driver_id) {
    dispatchForm.driver_id = vehicle.current_driver_id
  }
}

async function handleSubmitDispatch() {
  if (!dispatchForm.vehicle_id || !dispatchForm.driver_id) {
    ElMessage.warning('请选择车辆和司机')
    return
  }
  submitting.value = true
  try {
    await orderApi.dispatch(selectedOrder.value.id, dispatchForm)
    ElMessage.success('调度成功')
    dispatchDialogVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error('调度失败')
  } finally {
    submitting.value = false
  }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示')
    await orderApi.cancel(row.id)
    ElMessage.success('订单已取消')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.header-operations {
  display: flex;
  gap: 10px;
}

.text-secondary {
  font-size: 12px;
  color: #909399;
}

.recommendation-card {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;

  .recommend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .recommend-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .recommend-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;

    .recommend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .recommend-reasons {
    background: #fff;
    padding: 12px;
    border-radius: 4px;

    ul {
      margin: 8px 0 0 20px;
      padding: 0;

      li {
        color: #606266;
        line-height: 1.8;
      }
    }
  }
}
</style>
