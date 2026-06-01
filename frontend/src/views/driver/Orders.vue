<template>
  <div class="driver-orders">
    <el-card>
      <template #header>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="订单大厅" name="hall" />
          <el-tab-pane label="我的订单" name="my" />
        </el-tabs>
      </template>

      <el-table :data="orders" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column label="订单类型" width="90">
          <template #default="{ row }">{{ getOrderTypeText(row.order_type) }}</template>
        </el-table-column>
        <el-table-column prop="loading_address" label="装货地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="unloading_address" label="卸货地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="distance" label="里程" width="80">
          <template #default="{ row }">{{ row.distance?.toFixed(1) }}km</template>
        </el-table-column>
        <el-table-column prop="price" label="收入" width="90">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.driver_income }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="activeTab === 'hall' && row.status === 'pending'" size="small" type="primary" @click="acceptOrder(row)">抢单</el-button>
            <el-button v-if="activeTab === 'my' && row.status === 'accepted'" size="small" type="warning" @click="arriveOrder(row)">到达装货</el-button>
            <el-button v-if="activeTab === 'my' && row.status === 'arrived'" size="small" type="success" @click="completeOrder(row)">完成</el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderAPI, driverAPI, vehicleAPI } from '@/api'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const activeTab = ref('hall')
const orders = ref([])
const loading = ref(false)
const driverInfo = ref(null)
const myVehicles = ref([])

const loadDriverInfo = async () => {
  const res = await driverAPI.list({})
  if (res.success) {
    driverInfo.value = res.data.find(d => d.user_id === user.id)
    if (driverInfo.value) {
      const vRes = await vehicleAPI.listByDriver(driverInfo.value.id)
      if (vRes.success) {
        myVehicles.value = vRes.data
      }
    }
  }
}

const loadOrders = async () => {
  loading.value = true
  const params = activeTab.value === 'hall' ? { status: 'pending' } : { driver_id: driverInfo.value?.id }
  const res = await orderAPI.list(params)
  if (res.success) {
    orders.value = res.data
  }
  loading.value = false
}

const acceptOrder = async (row) => {
  if (!driverInfo.value) {
    ElMessage.warning('请先完成司机认证')
    return
  }
  if (myVehicles.value.length === 0) {
    ElMessage.warning('请先添加车辆')
    return
  }
  ElMessageBox.confirm('确认抢单？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    const res = await orderAPI.accept(row.id, {
      driver_id: driverInfo.value.id,
      vehicle_id: myVehicles.value[0].id
    })
    if (res.success) {
      ElMessage.success('抢单成功')
      loadOrders()
    } else {
      ElMessage.error(res.message)
    }
  })
}

const arriveOrder = async (row) => {
  const res = await orderAPI.arrive(row.id)
  if (res.success) {
    ElMessage.success('已确认到达')
    loadOrders()
  }
}

const completeOrder = async (row) => {
  ElMessageBox.confirm('确认完成订单？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
      const res = await orderAPI.complete(row.id)
      if (res.success) {
        ElMessage.success('订单已完成')
        loadOrders()
      }
    })
}

const viewDetail = async (row) => {
  ElMessage.info('查看订单详情')
}

const getStatusType = (status) => {
  const types = { pending: 'info', accepted: 'warning', arrived: 'primary', completed: 'success', cancelled: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待接单', accepted: '已接单', arrived: '已到达', completed: '已完成', cancelled: '已取消' }
  return texts[status] || status
}

const getOrderTypeText = (type) => {
  const texts = { instant: '即时单', appointment: '预约单', long_distance: '长途零担' }
  return texts[type] || type
}

watch(activeTab, () => {
  loadOrders()
})

onMounted(() => {
  loadDriverInfo().then(() => {
    loadOrders()
  })
})
</script>
