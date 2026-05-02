<template>
  <div class="page-container">
    <h2>订单详情</h2>
    <div v-if="order" class="detail-content">
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <div class="detail-grid">
          <div class="detail-item"><span class="label">订单号</span><span class="value">{{ order.order_no }}</span></div>
          <div class="detail-item"><span class="label">状态</span><el-tag>{{ getStatusText(order.status) }}</el-tag></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">运输信息</div>
        <div class="detail-grid">
          <div class="detail-item full"><span class="label">路线</span><span class="value">{{ order.pickup_city }} → {{ order.delivery_city }}</span></div>
          <div class="detail-item"><span class="label">提货时间</span><span class="value">{{ order.pickup_time }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customerApi } from '@/api'

const route = useRoute()
const order = ref(null)

onMounted(async () => {
  order.value = await customerApi.orderDetail(route.params.id)
})

function getStatusText(status) {
  const texts = { PENDING: '待调度', DISPATCHED: '已调度', IN_TRANSIT: '运输中', COMPLETED: '已完成', CANCELLED: '已取消' }
  return texts[status] || status
}
</script>
