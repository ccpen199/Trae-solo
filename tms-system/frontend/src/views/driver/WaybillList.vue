<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的运单</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待接单" name="pending">
        <el-table :data="pendingWaybills" v-loading="loading" stripe>
          <el-table-column prop="waybill_no" label="运单号" width="180" />
          <el-table-column label="路线" min-width="150">
            <template #default="{ row }">
              {{ row.pickup_city }} → {{ row.delivery_city }}
            </template>
          </el-table-column>
          <el-table-column label="货物" width="100">
            <template #default="{ row }">
              {{ row.weight }}吨
            </template>
          </el-table-column>
          <el-table-column prop="freight" label="运费" width="100">
            <template #default="{ row }">
              ¥{{ row.freight_amount }}
            </template>
          </el-table-column>
          <el-table-column prop="dispatched_at" label="调度时间" width="160" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleAccept(row)">接单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="进行中" name="in_progress">
        <el-table :data="inProgressWaybills" v-loading="loading" stripe>
          <el-table-column prop="waybill_no" label="运单号" width="180" />
          <el-table-column label="当前位置" min-width="150">
            <template #default="{ row }">
              {{ row.current_location?.address || '暂无' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag>{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handlePickup(row)" v-if="row.status === 'ASSIGNED'">提货</el-button>
              <el-button size="small" @click="handleDepart(row)" v-if="row.status === 'PICKED_UP'">出发</el-button>
              <el-button size="small" @click="handleArrive(row)" v-if="row.status === 'DEPARTED' || row.status === 'IN_TRANSIT'">到达</el-button>
              <el-button size="small" type="success" @click="handleSign(row)" v-if="row.status === 'ARRIVED'">签收</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已完成" name="completed">
        <el-table :data="completedWaybills" v-loading="loading" stripe>
          <el-table-column prop="waybill_no" label="运单号" width="180" />
          <el-table-column label="路线" min-width="150">
            <template #default="{ row }">
              {{ row.pickup_city }} → {{ row.delivery_city }}
            </template>
          </el-table-column>
          <el-table-column prop="signed_at" label="签收时间" width="160" />
          <el-table-column prop="freight_amount" label="运费" width="100">
            <template #default="{ row }">
              ¥{{ row.freight_amount }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { driverApi, waybillApi } from '@/api'

const loading = ref(false)
const activeTab = ref('pending')
const allWaybills = ref([])

const pendingWaybills = computed(() => allWaybills.value.filter(w => w.status === 'ASSIGNED'))
const inProgressWaybills = computed(() => allWaybills.value.filter(w => ['ACCEPTED', 'PICKED_UP', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED'].includes(w.status)))
const completedWaybills = computed(() => allWaybills.value.filter(w => ['SIGNED', 'COMPLETED'].includes(w.status)))

onMounted(() => {
  fetchMyWaybills()
})

async function fetchMyWaybills() {
  loading.value = true
  try {
    const res = await driverApi.myWaybills()
    allWaybills.value = res.data
  } catch (error) {
    ElMessage.error('获取运单列表失败')
  } finally {
    loading.value = false
  }
}

async function handleAccept(row) {
  try {
    await ElMessageBox.confirm('确认接单？', '提示')
    await waybillApi.accept(row.id)
    ElMessage.success('已接单')
    fetchMyWaybills()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('接单失败')
  }
}

async function handlePickup(row) {
  try {
    await ElMessageBox.confirm('确认已提货？', '提示')
    await waybillApi.pickup(row.id)
    ElMessage.success('已确认提货')
    fetchMyWaybills()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

async function handleDepart(row) {
  try {
    await ElMessageBox.confirm('确认出发？', '提示')
    await waybillApi.depart(row.id)
    ElMessage.success('已出发')
    fetchMyWaybills()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

async function handleArrive(row) {
  try {
    await ElMessageBox.confirm('确认已到达目的地？', '提示')
    await waybillApi.arrive(row.id)
    ElMessage.success('已到达')
    fetchMyWaybills()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

function handleSign(row) {
  ElMessage.info('签收功能开发中')
}

function getStatusText(status) {
  const texts = {
    CREATED: '已创建', ASSIGNED: '已分配', ACCEPTED: '已接单',
    PICKED_UP: '已提货', DEPARTED: '已出发', IN_TRANSIT: '运输中',
    ARRIVED: '已到达', SIGNED: '已签收', COMPLETED: '已完成'
  }
  return texts[status] || status
}
</script>
