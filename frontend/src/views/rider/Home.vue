<template>
  <div class="rider-home">
    <div class="page-header">
      <div class="flex-between">
        <h1>骑手首页</h1>
        <div class="status-badge" :class="{ online: isOnline }">
          {{ isOnline ? '在线' : '离线' }}
        </div>
      </div>
    </div>
    
    <div class="page-content">
      <div class="card">
        <div class="flex-between" style="margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 16px; margin-bottom: 4px;">{{ userStore.userInfo?.realName || '骑手' }}</h3>
            <span class="status-tag" :class="'tag-' + userStore.userInfo?.status">
              {{ statusText }}
            </span>
          </div>
          <div style="text-align: right;">
            <div class="earnings">¥{{ todayEarnings }}</div>
            <div style="font-size: 12px; color: #999;">今日收益</div>
          </div>
        </div>
        
        <button 
          class="btn btn-block" 
          :class="isOnline ? 'btn-danger' : 'btn-success'"
          @click="toggleOnline"
          :disabled="toggling || !canGoOnline"
        >
          {{ toggling ? '处理中...' : (isOnline ? '下线' : '上线') }}
        </button>
        
        <div v-if="eligibilityIssues.length > 0" class="alert alert-warning" style="margin-top: 12px;">
          <h4 style="margin-bottom: 8px;">上线前需要处理以下问题：</h4>
          <ul style="list-style: none; padding: 0;">
            <li v-for="issue in eligibilityIssues" :key="issue.type" style="font-size: 13px; padding: 4px 0;">
              ⚠️ {{ issue.message }}
            </li>
          </ul>
        </div>
      </div>
      
      <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 16px;">快速操作</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div class="quick-action" @click="loadOrders('pending')">
            <div class="quick-icon">📦</div>
            <div class="quick-text">待取货 <span class="quick-count">{{ pendingCount }}</span></div>
          </div>
          <div class="quick-action" @click="loadOrders('delivery')">
            <div class="quick-icon">🚴</div>
            <div class="quick-text">配送中 <span class="quick-count">{{ deliveryCount }}</span></div>
          </div>
          <div class="quick-action" @click="$router.push('/rider/settings')">
            <div class="quick-icon">⚙️</div>
            <div class="quick-text">接单设置</div>
          </div>
          <div class="quick-action" @click="createTestOrder">
            <div class="quick-icon">➕</div>
            <div class="quick-text">创建测试单</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 16px;">今日订单</h3>
        <div class="tab-header" style="margin: 0 -16px 16px -16px; padding: 0 16px;">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'available' }"
            @click="activeTab = 'available'; loadOrders('available')"
          >可抢订单</div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'pending' }"
            @click="activeTab = 'pending'; loadOrders('pending')"
          >待取货</div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'delivery' }"
            @click="activeTab = 'delivery'; loadOrders('delivery')"
          >配送中</div>
        </div>
        
        <div v-if="loading" class="loading">
          加载中...
        </div>
        
        <div v-else-if="orders.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>{{ emptyText }}</p>
        </div>
        
        <div v-else>
          <div 
            v-for="order in orders" 
            :key="order.id" 
            class="order-card"
            @click="goToDetail(order)"
          >
            <div class="card-header">
              <span class="card-title">{{ order.merchantName }}</span>
              <span class="card-badge" :class="getBadgeClass(order.status)">
                {{ getStatusText(order.status) }}
              </span>
            </div>
            
            <div class="info-row">
              <span class="info-label">订单号</span>
              <span class="info-value">{{ order.orderNumber }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">送达地址</span>
              <span class="info-value">{{ order.deliveryAddress }}</span>
            </div>
            
            <div class="info-row" v-if="order.estimatedDeliveryTime">
              <span class="info-label">预计送达</span>
              <span class="info-value">{{ formatTime(order.estimatedDeliveryTime) }}</span>
            </div>
            
            <div class="flex-between" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
              <div class="earnings">¥{{ order.riderEarnings }}</div>
              
              <div class="distance-info" v-if="order.currentDistance">
                <div class="distance-item">
                  📍 距我 {{ order.currentDistance }}km
                </div>
                <div class="distance-item" v-if="order.dormitoryDistance">
                  🏠 距宿舍 {{ order.dormitoryDistance }}km
                </div>
              </div>
            </div>
            
            <div class="action-buttons" v-if="showActionButtons(order)">
              <button 
                v-if="order.status === 'available' && isOnline"
                class="btn btn-primary"
                @click.stop="acceptOrder(order)"
              >抢单</button>
              
              <button 
                v-if="order.status === 'offsite_delivered' && isOffsiteRider"
                class="btn btn-success"
                @click.stop="offsiteArrive(order)"
              >确认到达</button>
              
              <button 
                v-if="order.status === 'offsite_delivered' && !isOffsiteRider"
                class="btn btn-success"
                @click.stop="confirmPickup(order)"
              >确认取货</button>
              
              <button 
                v-if="order.status === 'in_delivery'"
                class="btn btn-success"
                @click.stop="completeOrder(order)"
              >确认送达</button>
              
              <button 
                v-if="['pending_pickup', 'offsite_delivered', 'in_delivery'].includes(order.status)"
                class="btn btn-danger"
                @click.stop="showRefundModal(order)"
              >申请退单</button>
            </div>
          </div>
        </div>
      </div>
      
      <div style="height: 20px;"></div>
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item active" @click="$router.push('/rider')">
        <div class="nav-icon">🏠</div>
        <div class="nav-text">首页</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/orders')">
        <div class="nav-icon">📋</div>
        <div class="nav-text">订单</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/schedule')">
        <div class="nav-icon">📅</div>
        <div class="nav-text">排班</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/profile')">
        <div class="nav-icon">👤</div>
        <div class="nav-text">我的</div>
      </div>
    </div>
    
    <div v-if="showRefund" class="modal-overlay" @click="showRefund = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">申请退单</h3>
        <div class="modal-content">
          <div class="form-group">
            <label class="form-label">退单原因 <span style="color: #ff4d4f;">*</span></label>
            <select v-model="refundForm.reason" class="select-input">
              <option value="">请选择原因</option>
              <option value="customer_cancel">用户取消</option>
              <option value="merchant_cancel">商家取消</option>
              <option value="item_missing">商品缺失</option>
              <option value="address_error">地址错误</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">详细说明</label>
            <textarea 
              v-model="refundForm.description" 
              class="form-input" 
              placeholder="请输入详细说明（可选）"
              rows="3"
              style="resize: vertical;"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRefund = false">取消</button>
          <button class="btn btn-danger" @click="submitRefund" :disabled="refunding">
            {{ refunding ? '提交中...' : '确认退单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { riderApi, orderApi } from '../../api'

const router = useRouter()
const userStore = useUserStore()

const isOnline = ref(false)
const toggling = ref(false)
const loading = ref(false)
const activeTab = ref('available')
const orders = ref([])
const eligibilityIssues = ref([])

const showRefund = ref(false)
const refunding = ref(false)
const refundForm = ref({
  reason: '',
  description: ''
})
const currentOrder = ref(null)

const pendingCount = ref(0)
const deliveryCount = ref(0)
const todayEarnings = ref(0)
const creatingTest = ref(false)

const statusText = computed(() => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statusMap[userStore.userInfo?.status] || '未知'
})

const isOffsiteRider = computed(() => userStore.userInfo?.rider?.isOffsite)

const canGoOnline = computed(() => eligibilityIssues.value.length === 0 || isOnline.value)

const emptyText = computed(() => {
  const texts = {
    available: '暂无可抢订单',
    pending: '暂无待取货订单',
    delivery: '暂无配送中订单'
  }
  return texts[activeTab.value] || '暂无数据'
})

const loadRiderStatus = async () => {
  try {
    const response = await riderApi.getStatus()
    if (response.data.success) {
      const data = response.data.data
      isOnline.value = data.isOnline
      eligibilityIssues.value = data.eligibility.issues
    }
  } catch (err) {
    console.error('加载骑手状态失败:', err)
  }
}

const loadOrders = async (type) => {
  loading.value = true
  try {
    let response
    switch (type) {
      case 'available':
        response = await orderApi.getAvailable()
        break
      case 'pending':
        response = await orderApi.getPendingPickup()
        break
      case 'delivery':
        response = await orderApi.getInDelivery()
        break
      default:
        response = await orderApi.getAll()
    }
    
    if (response.data.success) {
      orders.value = response.data.data
    }
  } catch (err) {
    console.error('加载订单失败:', err)
  } finally {
    loading.value = false
  }
}

const toggleOnline = async () => {
  toggling.value = true
  try {
    if (isOnline.value) {
      const response = await riderApi.goOffline()
      if (response.data.success) {
        isOnline.value = false
        alert('已下线')
      } else {
        alert(response.data.message)
      }
    } else {
      const response = await riderApi.goOnline()
      if (response.data.success) {
        isOnline.value = true
        eligibilityIssues.value = []
        alert('已上线，可以开始接单了')
      } else {
        if (response.data.issues) {
          eligibilityIssues.value = response.data.issues
        }
        alert(response.data.message)
      }
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  } finally {
    toggling.value = false
  }
}

const getBadgeClass = (status) => {
  const classes = {
    available: 'badge-available',
    pending_pickup: 'badge-pending',
    offsite_delivered: 'badge-pending',
    in_delivery: 'badge-delivery',
    completed: 'badge-completed'
  }
  return classes[status] || 'badge-completed'
}

const getStatusText = (status) => {
  const texts = {
    available: '可抢单',
    pending_pickup: '待取货',
    offsite_delivered: '校外已送达',
    in_delivery: '配送中',
    completed: '已完成',
    refund_pending: '退单待审'
  }
  return texts[status] || status
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const showActionButtons = (order) => {
  return ['available', 'pending_pickup', 'offsite_delivered', 'in_delivery'].includes(order.status)
}

const acceptOrder = async (order) => {
  try {
    const response = await orderApi.accept(order.id)
    if (response.data.success) {
      alert('抢单成功！')
      loadOrders(activeTab.value)
    }
  } catch (err) {
    alert(err.response?.data?.message || '抢单失败')
  }
}

const offsiteArrive = async (order) => {
  try {
    const response = await orderApi.offsiteArrive(order.id)
    if (response.data.success) {
      alert('已标记到达交接点，请等待校内骑手确认')
      loadOrders(activeTab.value)
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  }
}

const confirmPickup = async (order) => {
  try {
    const response = await orderApi.confirmPickup(order.id)
    if (response.data.success) {
      alert('取货确认成功，开始配送')
      loadOrders(activeTab.value)
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  }
}

const completeOrder = async (order) => {
  try {
    const response = await orderApi.complete(order.id)
    if (response.data.success) {
      alert('配送完成！')
      loadOrders(activeTab.value)
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  }
}

const showRefundModal = (order) => {
  currentOrder.value = order
  refundForm.value = { reason: '', description: '' }
  showRefund.value = true
}

const submitRefund = async () => {
  if (!refundForm.value.reason) {
    alert('请选择退单原因')
    return
  }
  
  refunding.value = true
  try {
    const response = await orderApi.refund(currentOrder.value.id, refundForm.value)
    if (response.data.success) {
      alert('退单申请已提交，等待审核')
      showRefund.value = false
      loadOrders(activeTab.value)
    }
  } catch (err) {
    alert(err.response?.data?.message || '提交失败')
  } finally {
    refunding.value = false
  }
}

const goToDetail = (order) => {
  router.push(`/rider/orders/${order.id}`)
}

const createTestOrder = async () => {
  creatingTest.value = true
  try {
    const response = await orderApi.createTestOrder({})
    if (response.data.success) {
      alert(`测试订单创建成功：${response.data.data.orderNumber}`)
      if (activeTab.value === 'available') {
        loadOrders('available')
      }
    }
  } catch (err) {
    alert(err.response?.data?.message || '创建失败')
  } finally {
    creatingTest.value = false
  }
}

onMounted(() => {
  loadRiderStatus()
  loadOrders(activeTab.value)
})
</script>

<style scoped>
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255,255,255,0.2);
}
.status-badge.online {
  background: rgba(82, 196, 26, 0.2);
  color: #52c41a;
}

.quick-action {
  text-align: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}
.quick-action:hover {
  background: #f0f0f0;
}
.quick-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.quick-text {
  font-size: 13px;
  color: #666;
}
.quick-count {
  color: #667eea;
  font-weight: 600;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
}
</style>
