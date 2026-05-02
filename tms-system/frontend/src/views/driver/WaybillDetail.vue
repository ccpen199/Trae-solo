<template>
  <div class="page-container">
    <el-page-header @back="goBack" :content="waybill?.waybill_no || '运单详情'" />
    <div v-if="waybill" class="waybill-detail">
      <div class="detail-section">
        <div class="section-title">运单信息</div>
        <div class="detail-grid">
          <div class="detail-item"><span class="label">运单号</span><span class="value">{{ waybill.waybill_no }}</span></div>
          <div class="detail-item"><span class="label">状态</span><el-tag>{{ getStatusText(waybill.status) }}</el-tag></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">提货信息</div>
        <div class="info-card">
          <p><strong>{{ waybill.pickup_city }} {{ waybill.pickup_address }}</strong></p>
          <p>{{ waybill.pickup_contact }} {{ waybill.pickup_phone }}</p>
          <p>提货时间: {{ waybill.pickup_time }}</p>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">送货信息</div>
        <div class="info-card">
          <p><strong>{{ waybill.delivery_city }} {{ waybill.delivery_address }}</strong></p>
          <p>{{ waybill.delivery_contact }} {{ waybill.delivery_phone }}</p>
        </div>
      </div>
      <div class="action-section" v-if="waybill.status !== 'COMPLETED'">
        <el-button type="primary" size="large" @click="handleAction">
          {{ getActionText(waybill.status) }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { waybillApi } from '@/api'

const router = useRouter()
const route = useRoute()
const waybill = ref(null)

onMounted(async () => {
  waybill.value = await waybillApi.detail(route.params.id)
})

function goBack() {
  router.push('/driver/waybills')
}

async function handleAction() {
  const status = waybill.value.status
  try {
    if (status === 'ASSIGNED') {
      await ElMessageBox.confirm('确认接单？')
      await waybillApi.accept(waybill.value.id)
    } else if (status === 'ACCEPTED') {
      await ElMessageBox.confirm('确认已提货？')
      await waybillApi.pickup(waybill.value.id)
    } else if (status === 'PICKED_UP') {
      await ElMessageBox.confirm('确认出发？')
      await waybillApi.depart(waybill.value.id)
    } else if (status === 'DEPARTED' || status === 'IN_TRANSIT') {
      await ElMessageBox.confirm('确认已到达？')
      await waybillApi.arrive(waybill.value.id)
    }
    ElMessage.success('操作成功')
    waybill.value = await waybillApi.detail(route.params.id)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

function getStatusText(status) {
  const texts = { CREATED: '已创建', ASSIGNED: '已分配', ACCEPTED: '已接单', PICKED_UP: '已提货', DEPARTED: '已出发', IN_TRANSIT: '运输中', ARRIVED: '已到达', SIGNED: '已签收', COMPLETED: '已完成' }
  return texts[status] || status
}

function getActionText(status) {
  const texts = { ASSIGNED: '接单', ACCEPTED: '确认提货', PICKED_UP: '出发', DEPARTED: '到达', IN_TRANSIT: '到达', ARRIVED: '签收' }
  return texts[status] || '操作'
}
</script>

<style lang="scss" scoped>
.info-card {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  p { margin: 4px 0; }
}

.action-section {
  margin-top: 30px;
  text-align: center;
}
</style>
