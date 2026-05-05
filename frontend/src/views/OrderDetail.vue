<template>
  <div class="order-detail-page">
    <div class="container">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/orders' }">我的订单</el-breadcrumb-item>
        <el-breadcrumb-item>订单详情</el-breadcrumb-item>
      </el-breadcrumb>
      
      <div class="detail-content" v-loading="loading">
        <el-empty v-if="!order && !loading" description="订单不存在" />
        
        <template v-if="order">
          <div class="order-status-card">
            <div class="status-info">
              <div class="status-icon" :class="order.status">
                <el-icon :size="48">
                <component :is="getStatusIcon(order.status)" />
                </el-icon>
              </div>
              <div class="status-text">
                <h2>{{ getStatusText(order.status) }}</h2>
                <p class="status-desc">{{ getStatusDesc(order.status) }}</p>
              </div>
            </div>
            <div class="status-actions" v-if="order.status === 'confirmed'">
              <router-link :to="'/contract/' + order.orderNo">
                <el-button type="primary" size="large">
                  <el-icon><Printer /></el-icon>
                  打印合同
                </el-button>
              </router-link>
            </div>
            <div class="status-actions" v-else-if="order.status === 'pending'">
              <el-button type="primary" size="large" @click="handleConfirm">
                确认订单
              </el-button>
              <el-button size="large" @click="handleCancel">
                取消订单
              </el-button>
            </div>
          </div>
          
          <div class="detail-section">
            <h3 class="section-title">订单信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号">
                <span class="order-no">{{ order.orderNo }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="订单状态">
                <el-tag :type="getStatusType(order.status)" effect="light">
                  {{ getStatusText(order.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="下单时间">
                {{ formatTime(order.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="确认时间" v-if="order.confirmedAt">
                {{ formatTime(order.confirmedAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="订单金额">
                <span class="highlight-price">¥{{ order.totalAmount }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="订单备注" v-if="order.remark">
                {{ order.remark || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="detail-section">
            <h3 class="section-title">用户信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">
                {{ order.snapshotUser?.realName || '未填写' }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">
                {{ order.snapshotUser?.phone || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="身份证号">
                {{ order.snapshotUser?.idCard ? order.snapshotUser.idCard.replace(/^(.{6})(.{8})(.{4})$/, '$1********$3') : '未填写' }}
              </el-descriptions-item>
              <el-descriptions-item label="户型">
                {{ order.snapshotUser?.houseType || '未填写' }}
              </el-descriptions-item>
              <el-descriptions-item label="房屋面积" :span="2">
                {{ order.snapshotUser?.houseArea ? order.snapshotUser.houseArea + '㎡' : '未填写' }}
              </el-descriptions-item>
              <el-descriptions-item label="房屋地址" :span="2">
                {{ order.snapshotUser?.province || '' }}
                {{ order.snapshotUser?.city || '' }}
                {{ order.snapshotUser?.district || '' }}
                {{ order.snapshotUser?.project || '' }}
                {{ order.snapshotUser?.building ? order.snapshotUser.building + '栋' : '' }}
                {{ order.snapshotUser?.floor ? order.snapshotUser.floor + '层' : '' }}
                {{ order.snapshotUser?.roomNumber || '' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="detail-section">
            <h3 class="section-title">商品清单</h3>
            
            <div class="item-group" v-if="order.packageItems && order.packageItems.length > 0">
              <div class="group-title">套餐商品</div>
              <div class="item-list">
                <div class="order-item" v-for="(item, index) in order.packageItems" :key="'pkg-' + index">
                  <div class="item-image">
                    <el-image
                      :src="'https://picsum.photos/80/80?random=pkg' + index"
                      fit="cover"
                    />
                  </div>
                  <div class="item-info">
                    <h4 class="item-name">{{ item.packageName }}</h4>
                    <div class="item-attrs" v-if="item.selectedAttributes && item.selectedAttributes.length">
                      <span class="attr" v-for="attr in item.selectedAttributes" :key="attr.attributeId">
                        {{ attr.attributeName }}: {{ attr.value }}
                      </span>
                    </div>
                    <div class="item-area">房屋面积：{{ item.houseArea }}㎡</div>
                  </div>
                  <div class="item-price">
                    <div class="unit-price">¥{{ item.unitPrice }}/㎡</div>
                    <div class="total-price">¥{{ (item.unitPrice * item.houseArea).toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="item-group" v-if="order.accessoryItems && order.accessoryItems.length > 0">
              <div class="group-title">配件商品</div>
              <div class="item-list">
                <div class="order-item" v-for="(item, index) in order.accessoryItems" :key="'acc-' + index">
                  <div class="item-image">
                    <el-image
                      :src="item.image || 'https://picsum.photos/80/80?random=acc' + index"
                      fit="cover"
                    />
                  </div>
                  <div class="item-info">
                    <h4 class="item-name">{{ item.name }}</h4>
                    <div class="item-category">{{ item.categoryName || '配件' }}</div>
                    <div class="item-quantity">数量：×{{ item.quantity }}</div>
                  </div>
                  <div class="item-price">
                    <div class="unit-price">¥{{ item.unitPrice }}</div>
                    <div class="total-price">¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="item-group" v-if="order.upgradeItems && order.upgradeItems.length > 0">
              <div class="group-title">优化改造包</div>
              <div class="item-list">
                <div class="order-item" v-for="(item, index) in order.upgradeItems" :key="'upg-' + index">
                  <div class="item-image">
                    <el-image
                      :src="'https://picsum.photos/80/80?random=upg' + index"
                      fit="cover"
                    />
                  </div>
                  <div class="item-info">
                    <h4 class="item-name">{{ item.name }}</h4>
                    <div class="item-desc">{{ item.description }}</div>
                    <div class="item-quantity">数量：×{{ item.quantity }}</div>
                  </div>
                  <div class="item-price">
                    <div class="unit-price">¥{{ item.unitPrice }}</div>
                    <div class="total-price">¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3 class="section-title">金额明细</h3>
            <div class="price-detail">
              <div class="price-row">
                <span class="label">套餐总价</span>
                <span class="value">¥{{ calculatePackageTotal() }}</span>
              </div>
              <div class="price-row" v-if="calculateAccessoryTotal() > 0">
                <span class="label">配件总价</span>
                <span class="value">¥{{ calculateAccessoryTotal() }}</span>
              </div>
              <div class="price-row" v-if="calculateUpgradeTotal() > 0">
                <span class="label">改造包总价</span>
                <span class="value">¥{{ calculateUpgradeTotal() }}</span>
              </div>
              <div class="price-row total">
                <span class="label">订单总额</span>
                <span class="value">
                  <span class="currency">¥</span>
                  <span class="amount">{{ order.totalAmount }}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="detail-section" v-if="order.statusLogs && order.statusLogs.length > 0">
            <h3 class="section-title">订单日志</h3>
            <div class="status-logs">
              <div class="log-item" v-for="(log, index) in order.statusLogs" :key="index">
                <div class="log-time">{{ formatTime(log.createdAt) }}</div>
                <div class="log-status">
                  <el-tag :type="getStatusType(log.status)" effect="light" size="small">
                    {{ getStatusText(log.status) }}
                  </el-tag>
                </div>
                <div class="log-remark" v-if="log.remark">{{ log.remark }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { orderApi } from '@/api/order'

const route = useRoute()

const loading = ref(false)
const order = ref(null)

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

const getStatusDesc = (status) => {
  const map = {
    pending: '请确认订单信息是否正确',
    confirmed: '订单已确认，合同已生成',
    processing: '订单正在处理中',
    completed: '订单已完成，感谢您的选购',
    cancelled: '订单已取消'
  }
  return map[status] || ''
}

const getStatusIcon = (status) => {
  const map = {
    pending: 'Clock',
    confirmed: 'CircleCheck',
    processing: 'Loading',
    completed: 'Trophy',
    cancelled: 'CircleClose'
  }
  return map[status] || 'Document'
}

const calculatePackageTotal = () => {
  if (!order.value?.packageItems) {
    return order.value.packageItems.reduce((sum, item) => sum + item.unitPrice * item.houseArea, 0).toFixed(2)
  }
  return '0.00'
}

const calculateAccessoryTotal = () => {
  if (!order.value?.accessoryItems) return 0
  return order.value.accessoryItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
}

const calculateUpgradeTotal = () => {
  if (!order.value?.upgradeItems) return 0
  return order.value.upgradeItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
}

const fetchOrderDetail = async () => {
  const orderNo = route.params.orderNo
  if (!orderNo) return
  
  loading.value = true
  try {
    const result = await orderApi.getDetail(orderNo)
    order.value = result.data
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const handleConfirm = async () => {
  try {
    await ElMessageBox.confirm('确定要确认这个订单吗？', '提示', {
      type: 'warning'
    })
    await orderApi.confirm(order.value.id)
    ElMessage.success('订单已确认')
    fetchOrderDetail()
  } catch {
    // 用户取消
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      type: 'warning'
    })
    await orderApi.cancel(order.value.id)
    ElMessage.success('订单已取消')
    fetchOrderDetail()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.order-detail-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.breadcrumb {
  margin-bottom: 20px;
}

.order-status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text h2 {
  font-size: 24px;
  margin-bottom: 8px;
  font-weight: bold;
}

.status-desc {
  font-size: 14px;
  opacity: 0.9;
}

.status-actions {
  display: flex;
  gap: 10px;
}

.detail-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-family: monospace;
  font-weight: bold;
  color: #667eea;
}

.highlight-price {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.item-group {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.item-group:last-child {
  margin-bottom: 0;
}

.group-title {
  background: #f5f7fa;
  padding: 10px 15px;
  font-size: 14px;
  color: #606266;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}

.item-list {
  padding: 10px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-image {
  width: 80px;
  height: 80px;
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
  margin-bottom: 6px;
  font-weight: bold;
}

.item-attrs {
  margin-bottom: 6px;
}

.item-attrs .attr {
  display: inline-block;
  font-size: 12px;
  color: #909399;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
  margin-bottom: 4px;
}

.item-area,
.item-category,
.item-desc,
.item-quantity {
  font-size: 12px;
  color: #909399;
}

.item-price {
  text-align: right;
  min-width: 120px;
}

.unit-price {
  font-size: 12px;
  color: #909399;
}

.total-price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.price-detail {
  max-width: 400px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.price-row .label {
  color: #606266;
}

.price-row .value {
  color: #333;
}

.price-row.total {
  padding-top: 15px;
  border-bottom: none;
}

.price-row.total .label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.price-row.total .value {
  display: inline-flex;
  align-items: baseline;
}

.price-row.total .currency {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.price-row.total .amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.status-logs {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.log-time {
  color: #909399;
  font-size: 13px;
  margin-right: 15px;
}

.log-status {
  margin-right: 15px;
}

.log-remark {
  color: #606266;
  font-size: 13px;
}

@media (max-width: 768px) {
  .order-status-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .status-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .order-item {
    flex-wrap: wrap;
  }
}
</style>
