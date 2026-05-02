<template>
  <div class="page-container">
    <el-page-header @back="goBack" content="订单详情" />
    <div v-if="order" class="detail-content">
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">订单号</span>
            <span class="value">{{ order.order_no }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态</span>
            <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="label">客户名称</span>
            <span class="value">{{ order.customer_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">客户电话</span>
            <span class="value">{{ order.customer_phone }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间</span>
            <span class="value">{{ order.created_at }}</span>
          </div>
          <div class="detail-item">
            <span class="label">优先级</span>
            <el-tag :type="order.priority === 'URGENT' ? 'danger' : 'info'">
              {{ order.priority === 'URGENT' ? '紧急' : '普通' }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">提货信息</div>
        <div class="detail-grid">
          <div class="detail-item full">
            <span class="label">提货地址</span>
            <span class="value">{{ order.pickup_city }} {{ order.pickup_address }}</span>
          </div>
          <div class="detail-item">
            <span class="label">提货时间</span>
            <span class="value">{{ order.pickup_time }}</span>
          </div>
          <div class="detail-item">
            <span class="label">提货联系人</span>
            <span class="value">{{ order.pickup_contact }} {{ order.pickup_phone }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">收货信息</div>
        <div class="detail-grid">
          <div class="detail-item full">
            <span class="label">收货地址</span>
            <span class="value">{{ order.delivery_city }} {{ order.delivery_address }}</span>
          </div>
          <div class="detail-item">
            <span class="label">收货联系人</span>
            <span class="value">{{ order.delivery_contact }} {{ order.delivery_phone }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">货物信息</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">货物名称</span>
            <span class="value">{{ order.goods_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">货物类型</span>
            <span class="value">{{ order.goods_type }}</span>
          </div>
          <div class="detail-item">
            <span class="label">重量</span>
            <span class="value">{{ order.weight }} 吨</span>
          </div>
          <div class="detail-item">
            <span class="label">体积</span>
            <span class="value">{{ order.volume }} 方</span>
          </div>
          <div class="detail-item">
            <span class="label">件数</span>
            <span class="value">{{ order.quantity }}</span>
          </div>
          <div class="detail-item">
            <span class="label">包装类型</span>
            <span class="value">{{ order.package_type }}</span>
          </div>
        </div>
      </div>
    </div>
    <el-skeleton v-else :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderApi } from '@/api'

const router = useRouter()
const route = useRoute()
const order = ref(null)

onMounted(() => {
  fetchOrder()
})

async function fetchOrder() {
  try {
    order.value = await orderApi.detail(route.params.id)
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

function goBack() {
  router.back()
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
</script>

<style lang="scss" scoped>
.detail-content {
  margin-top: 20px;
}

.full {
  grid-column: span 2;
}
</style>
