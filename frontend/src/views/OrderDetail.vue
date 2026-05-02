<template>
  <div class="order-detail">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h1>订单详情</h1>
    </div>

    <div v-if="order" class="detail-content">
      <el-card class="detail-card">
        <div class="card-header">
          <span class="order-number">{{ order.orderNumber }}</span>
          <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>订单名称</label>
            <span>{{ order.title }}</span>
          </div>
          <div class="info-item">
            <label>客户名称</label>
            <span>{{ order.customerName }}</span>
          </div>
          <div class="info-item">
            <label>联系电话</label>
            <span>{{ order.contactPhone }}</span>
          </div>
          <div class="info-item">
            <label>订单金额</label>
            <span class="amount">¥{{ order.totalAmount?.toLocaleString() || 0 }}</span>
          </div>
          <div class="info-item">
            <label>支付方式</label>
            <span>{{ order.paymentMethod }}</span>
          </div>
          <div class="info-item">
            <label>创建时间</label>
            <span>{{ order.createdAt }}</span>
          </div>
          <div class="info-item full-width">
            <label>配送地址</label>
            <span>{{ order.province }} {{ order.city }} {{ order.district }} {{ order.address }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="timeline-card">
        <h3>订单进度</h3>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in timelineItems"
            :key="index"
            :status="item.status"
          >
            <template #dot>
              <span v-if="item.status === 'success'" class="timeline-dot success">✓</span>
              <span v-else-if="item.status === 'process'" class="timeline-dot process">●</span>
              <span v-else class="timeline-dot pending">○</span>
            </template>
            {{ item.title }}
            <span v-if="item.time" class="timeline-time">{{ item.time }}</span>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <el-card class="action-card">
        <h3>操作</h3>
        <div class="action-buttons">
          <el-button type="success" @click="startSplit" v-if="canStartSplit">开始拆单</el-button>
          <el-button type="primary" @click="createProduction" v-if="canCreateProduction">创建生产任务</el-button>
          <el-button type="primary" @click="createInstallation" v-if="canCreateInstallation">创建安装任务</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { orderApi } from '../api'

const route = useRoute()
const order = ref<any>(null)

const canStartSplit = computed(() => {
  return order.value?.status === 'PAID'
})

const canCreateProduction = computed(() => {
  return order.value?.status === 'SPLIT_APPROVED'
})

const canCreateInstallation = computed(() => {
  return order.value?.status === 'PRODUCTION_COMPLETED'
})

const timelineItems = computed(() => {
  const items = [
    { title: '订单创建', status: 'success', time: order.value?.createdAt },
    { title: '合同签约', status: order.value?.status >= 'CONTRACT_SIGNED' ? 'success' : 'pending' },
    { title: '支付完成', status: order.value?.status >= 'PAID' ? 'success' : 'pending' },
    { title: '拆单完成', status: order.value?.status >= 'SPLIT_APPROVED' ? 'success' : 'pending' },
    { title: '生产完成', status: order.value?.status >= 'PRODUCTION_COMPLETED' ? 'success' : order.value?.status >= 'PRODUCTION_IN_PROGRESS' ? 'process' : 'pending' },
    { title: '安装完成', status: order.value?.status >= 'INSTALLATION_COMPLETED' ? 'success' : order.value?.status >= 'INSTALLATION_IN_PROGRESS' ? 'process' : 'pending' },
    { title: '验收完成', status: order.value?.status >= 'ACCEPTED' ? 'success' : 'pending' }
  ]
  return items
})

onMounted(async () => {
  await loadOrder()
})

const loadOrder = async () => {
  try {
    const res = await orderApi.get(route.params.id as string)
    order.value = res.data.order
  } catch (error) {
    console.error('加载订单详情失败:', error)
  }
}

const startSplit = () => {
  alert('跳转到拆单页面')
}

const createProduction = () => {
  alert('跳转到创建生产任务页面')
}

const createInstallation = () => {
  alert('跳转到创建安装任务页面')
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'CONTRACT_SIGNED': 'info',
    'PAID': 'success',
    'PRODUCTION_SCHEDULED': 'info',
    'PRODUCTION_IN_PROGRESS': 'warning',
    'PRODUCTION_COMPLETED': 'success',
    'INSTALLATION_ASSIGNED': 'info',
    'INSTALLATION_SCHEDULED': 'info',
    'INSTALLATION_IN_PROGRESS': 'warning',
    'INSTALLATION_COMPLETED': 'success',
    'ACCEPTED': 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待处理',
    'CONTRACT_SIGNED': '已签约',
    'PAID': '已支付',
    'PRODUCTION_SCHEDULED': '生产已安排',
    'PRODUCTION_IN_PROGRESS': '生产中',
    'PRODUCTION_COMPLETED': '生产完成',
    'INSTALLATION_ASSIGNED': '安装已分配',
    'INSTALLATION_SCHEDULED': '安装已安排',
    'INSTALLATION_IN_PROGRESS': '安装中',
    'INSTALLATION_COMPLETED': '安装完成',
    'ACCEPTED': '已验收'
  }
  return texts[status] || status
}
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}

.detail-content {
  max-width: 800px;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.order-number {
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 16px;
  color: #1f2937;
}

.info-item .amount {
  font-size: 20px;
  font-weight: 600;
  color: #ef4444;
}

.timeline-card {
  margin-bottom: 20px;
}

.timeline-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
}

.timeline-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.timeline-dot.success {
  background: #22c55e;
  color: white;
}

.timeline-dot.process {
  background: #3b82f6;
  color: white;
}

.timeline-dot.pending {
  background: #e5e7eb;
  color: #9ca3af;
}

.timeline-time {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.action-card {
  margin-bottom: 20px;
}

.action-card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>