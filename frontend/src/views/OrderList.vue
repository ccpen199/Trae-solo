<template>
  <div class="order-list-page">
    <div class="container">
      <h1 class="page-title">我的订单</h1>
      
      <div class="order-tabs">
        <el-radio-group v-model="statusFilter" @change="handleStatusChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="pending">待确认</el-radio-button>
          <el-radio-button label="confirmed">已确认</el-radio-button>
          <el-radio-button label="processing">处理中</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
          <el-radio-button label="cancelled">已取消</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="order-list" v-loading="loading">
        <el-empty v-if="orders.length === 0 && !loading" description="暂无订单">
          <template #action>
            <router-link to="/packages">
              <el-button type="primary">去逛逛</el-button>
            </router-link>
          </template>
        </el-empty>
        
        <div class="order-card" v-for="order in orders" :key="order.id">
          <div class="order-header">
            <div class="order-info">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-time">{{ formatTime(order.createdAt) }}</span>
            </div>
            <div class="order-status">
              <el-tag :type="getStatusType(order.status)" effect="light">
                {{ getStatusText(order.status) }}
              </el-tag>
            </div>
          </div>
          
          <div class="order-content">
            <div class="order-items">
              <div class="order-item" v-for="(item, index) in getOrderItems(order)" :key="index">
                <div class="item-image">
                  <el-image
                    :src="item.image || 'https://picsum.photos/60/60?random=' + index"
                    fit="cover"
                  />
                </div>
                <div class="item-info">
                  <h4 class="item-name">{{ item.name }}</h4>
                  <div class="item-spec" v-if="item.houseArea">
                    {{ item.houseArea }}㎡
                  </div>
                  <div class="item-spec" v-else-if="item.quantity">
                    ×{{ item.quantity }}
                  </div>
                </div>
                <div class="item-price">
                  <span class="unit-price" v-if="item.houseArea">
                    ¥{{ item.unitPrice }}/㎡
                  </span>
                  <span class="unit-price" v-else>
                    ¥{{ item.unitPrice }}
                  </span>
                  <span class="total-price">
                    ¥{{ getSubtotal(item) }}
                  </span>
                </div>
              </div>
              
              <div class="more-items" v-if="getItemCount(order) > 3">
                还有 {{ getItemCount(order) - 3 }} 件商品
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-amount">
              <span class="label">订单金额：</span>
              <span class="value">
                <span class="currency">¥</span>
                <span class="amount">{{ order.totalAmount }}</span>
              </span>
            </div>
            <div class="order-actions">
              <router-link :to="'/orders/' + order.orderNo">
                <el-button size="small">查看详情</el-button>
              </router-link>
              
              <router-link :to="'/contract/' + order.orderNo" v-if="order.status === 'confirmed'">
                <el-button type="primary" size="small">
                  <el-icon><Printer /></el-icon>
                  打印合同
                </el-button>
              </router-link>
              
              <el-button 
                v-if="order.status === 'pending'"
                type="primary" 
                size="small"
                @click="handleConfirm(order)"
              >
                确认订单
              </el-button>
              
              <el-button 
                v-if="order.status === 'pending'"
                type="danger" 
                size="small"
                @click="handleCancel(order)"
              >
                取消订单
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { orderApi } from '@/api/order'

const loading = ref(false)
const orders = ref([])
const total = ref(0)
const statusFilter = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    confirmed: 'primary',
    processing: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || '未知'
}

const getOrderItems = (order) => {
  const items = []
  if (order.packageItems && order.packageItems.length > 0) {
    items.push(...order.packageItems.map(item => ({
      ...item,
      name: item.packageName,
      type: 'package'
    })))
  }
  if (order.accessoryItems && order.accessoryItems.length > 0) {
    items.push(...order.accessoryItems.map(item => ({
      ...item,
      type: 'accessory'
    })))
  }
  if (order.upgradeItems && order.upgradeItems.length > 0) {
    items.push(...order.upgradeItems.map(item => ({
      ...item,
      type: 'upgrade'
    })))
  }
  return items.slice(0, 3)
}

const getItemCount = (order) => {
  let count = 0
  if (order.packageItems) count += order.packageItems.length
  if (order.accessoryItems) count += order.accessoryItems.length
  if (order.upgradeItems) count += order.upgradeItems.length
  return count
}

const getSubtotal = (item) => {
  if (item.type === 'package') {
    return (item.unitPrice * item.houseArea).toFixed(2)
  }
  return (item.unitPrice * item.quantity).toFixed(2)
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value || undefined
    }
    const result = await orderApi.getList(params)
    orders.value = result.data.list || []
    total.value = result.data.total || 0
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleStatusChange = () => {
  pagination.page = 1
  fetchOrders()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchOrders()
}

const handlePageChange = () => {
  fetchOrders()
}

const handleConfirm = async (order) => {
  try {
    await ElMessageBox.confirm('确定要确认这个订单吗？', '提示', {
      type: 'warning'
    })
    await orderApi.confirm(order.id)
    ElMessage.success('订单已确认')
    fetchOrders()
  } catch {
    // 用户取消
  }
}

const handleCancel = async (order) => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      type: 'warning'
    })
    await orderApi.cancel(order.id)
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-list-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.page-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  font-weight: bold;
}

.order-tabs {
  background: #fff;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.order-list {
  min-height: 400px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.order-no {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.order-time {
  font-size: 13px;
  color: #909399;
}

.order-content {
  padding: 15px 20px;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  font-weight: bold;
}

.item-spec {
  font-size: 12px;
  color: #909399;
}

.item-price {
  text-align: right;
  min-width: 120px;
}

.item-price .unit-price {
  display: block;
  font-size: 12px;
  color: #909399;
}

.item-price .total-price {
  display: block;
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.more-items {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 5px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

.order-amount .label {
  font-size: 14px;
  color: #606266;
}

.order-amount .value {
  display: inline-flex;
  align-items: baseline;
}

.order-amount .currency {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.order-amount .amount {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 30px;
  text-align: center;
}

@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .order-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .order-actions .el-button {
    flex: 1;
  }
}
</style>
