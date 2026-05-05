<template>
  <div class="order-detail-page">
    <div class="page-header" style="position: relative;">
      <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%);" @click="$router.back()">
        <span style="font-size: 20px; cursor: pointer;">←</span>
      </div>
      <h1>订单详情</h1>
    </div>
    
    <div v-if="loading" class="loading" style="padding-top: 100px;">
      加载中...
    </div>
    
    <template v-else-if="order">
      <div class="card">
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
          <span class="info-label">顾客姓名</span>
          <span class="info-value">{{ order.customerName }}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">联系电话</span>
          <span class="info-value">
            {{ order.customerPhone }}
            <button 
              class="btn btn-primary" 
              style="padding: 6px 12px; font-size: 12px; margin-left: 8px;"
              @click="callPhone(order.customerPhone)"
            >拨打</button>
          </span>
        </div>
        
        <div class="info-row">
          <span class="info-label">送达地址</span>
          <span class="info-value">{{ order.deliveryAddress }}</span>
        </div>
        
        <div class="info-row" v-if="order.estimatedDeliveryTime">
          <span class="info-label">预计送达</span>
          <span class="info-value">{{ formatDateTime(order.estimatedDeliveryTime) }}</span>
        </div>
        
        <div class="info-row" v-if="order.offsiteRider">
          <span class="info-label">校外骑手</span>
          <span class="info-value">
            {{ order.offsiteRider.realName }} ({{ order.offsiteRider.phone }})
          </span>
        </div>
        
        <div class="info-row" v-if="order.onsiteRider">
          <span class="info-label">校内骑手</span>
          <span class="info-value">
            {{ order.onsiteRider.realName }} ({{ order.onsiteRider.phone }})
          </span>
        </div>
        
        <div class="flex-between" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
          <div>
            <div style="font-size: 12px; color: #999;">骑手收益</div>
            <div class="earnings">¥{{ order.riderEarnings }}</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #999;">
            创建时间: {{ formatDateTime(order.createdAt) }}
          </div>
        </div>
      </div>
      
      <div class="card" v-if="order.mapData">
        <h3 style="font-size: 16px; margin-bottom: 16px;">配送地图</h3>
        <div style="height: 200px; background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
          <div style="font-size: 40px; margin-bottom: 8px;">🗺️</div>
          <div style="font-size: 14px; color: #666;">地图展示区域</div>
          <div style="font-size: 12px; color: #999; margin-top: 8px;">
            <span v-if="order.mapData.offsiteRider">校外骑手位置: ({{ order.mapData.offsiteRider.lat.toFixed(4) }}, {{ order.mapData.offsiteRider.lng.toFixed(4) }})</span>
            <span v-if="order.mapData.onsiteRider" style="margin-left: 16px;">校内骑手位置: ({{ order.mapData.onsiteRider.lat.toFixed(4) }}, {{ order.mapData.onsiteRider.lng.toFixed(4) }})</span>
          </div>
        </div>
      </div>
      
      <div class="card" v-if="showActionButtons">
        <h3 style="font-size: 16px; margin-bottom: 16px;">操作</h3>
        
        <div class="action-buttons" style="padding-top: 0; border-top: none;">
          <button 
            v-if="order.status === 'available'"
            class="btn btn-primary"
            @click="acceptOrder"
            :disabled="processing"
          >抢单</button>
          
          <button 
            v-if="order.status === 'offsite_delivered' && isOffsiteRider"
            class="btn btn-success"
            @click="offsiteArrive"
            :disabled="processing"
          >确认到达交接点</button>
          
          <button 
            v-if="order.status === 'offsite_delivered' && !isOffsiteRider"
            class="btn btn-success"
            @click="confirmPickup"
            :disabled="processing"
          >确认取货</button>
          
          <button 
            v-if="order.status === 'in_delivery'"
            class="btn btn-success"
            @click="completeOrder"
            :disabled="processing"
          >确认送达</button>
          
          <button 
            class="btn btn-secondary"
            @click="reportProblem"
          >遇到问题</button>
          
          <button 
            v-if="['pending_pickup', 'offsite_delivered', 'in_delivery'].includes(order.status)"
            class="btn btn-danger"
            @click="showRefund = true"
          >申请退单</button>
        </div>
      </div>
      
      <div class="card" v-if="order.orderLogs && order.orderLogs.length > 0">
        <h3 style="font-size: 16px; margin-bottom: 16px;">订单日志</h3>
        <div v-for="log in order.orderLogs" :key="log.id" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <div class="flex-between">
            <span style="font-size: 14px; color: #333;">{{ log.action }}</span>
            <span style="font-size: 12px; color: #999;">{{ formatDateTime(log.createdAt) }}</span>
          </div>
          <div v-if="log.description" style="font-size: 12px; color: #666; margin-top: 4px;">
            {{ log.description }}
          </div>
        </div>
      </div>
      
      <div class="card" v-if="order.refund">
        <h3 style="font-size: 16px; margin-bottom: 16px;">退单信息</h3>
        <div class="info-row">
          <span class="info-label">退单原因</span>
          <span class="info-value">{{ order.refund.reason }}</span>
        </div>
        <div class="info-row" v-if="order.refund.description">
          <span class="info-label">详细说明</span>
          <span class="info-value">{{ order.refund.description }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="info-value">
            <span class="card-badge" :class="order.refund.status === 'approved' ? 'badge-delivery' : 'badge-pending'">
              {{ order.refund.status === 'pending' ? '待审核' : order.refund.status === 'approved' ? '已通过' : '已拒绝' }}
            </span>
          </span>
        </div>
      </div>
      
      <div style="height: 20px;"></div>
    </template>
    
    <div v-else class="empty-state" style="padding-top: 100px;">
      <div class="empty-icon">❌</div>
      <p>订单不存在</p>
      <button class="btn btn-primary" style="margin-top: 16px;" @click="$router.push('/rider/orders')">
        返回订单列表
      </button>
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
          <button class="btn btn-danger" @click="submitRefund" :disabled="processing">
            {{ processing ? '提交中...' : '确认退单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { orderApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const order = ref(null)
const loading = ref(false)
const processing = ref(false)
const showRefund = ref(false)
const refundForm = ref({
  reason: '',
  description: ''
})

const isOffsiteRider = computed(() => userStore.userInfo?.rider?.isOffsite)

const showActionButtons = computed(() => {
  return ['available', 'pending_pickup', 'offsite_delivered', 'in_delivery'].includes(order.value?.status)
})

const getBadgeClass = (status) => {
  const classes = {
    available: 'badge-available',
    pending_pickup: 'badge-pending',
    offsite_delivered: 'badge-pending',
    in_delivery: 'badge-delivery',
    completed: 'badge-completed',
    refund_pending: 'badge-pending'
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
    refund_pending: '退单待审',
    refunded: '已退单'
  }
  return texts[status] || status
}

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const loadOrder = async () => {
  const orderId = route.params.id
  if (!orderId) {
    return
  }
  
  loading.value = true
  try {
    const response = await orderApi.getDetail(orderId)
    if (response.data.success) {
      order.value = response.data.data
    }
  } catch (err) {
    console.error('加载订单失败:', err)
  } finally {
    loading.value = false
  }
}

const callPhone = (phone) => {
  if (phone) {
    window.location.href = `tel:${phone}`
  }
}

const acceptOrder = async () => {
  processing.value = true
  try {
    const response = await orderApi.accept(order.value.id)
    if (response.data.success) {
      alert('抢单成功！')
      loadOrder()
    }
  } catch (err) {
    alert(err.response?.data?.message || '抢单失败')
  } finally {
    processing.value = false
  }
}

const offsiteArrive = async () => {
  processing.value = true
  try {
    const response = await orderApi.offsiteArrive(order.value.id)
    if (response.data.success) {
      alert('已标记到达交接点')
      loadOrder()
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  } finally {
    processing.value = false
  }
}

const confirmPickup = async () => {
  processing.value = true
  try {
    const response = await orderApi.confirmPickup(order.value.id)
    if (response.data.success) {
      alert('取货确认成功')
      loadOrder()
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  } finally {
    processing.value = false
  }
}

const completeOrder = async () => {
  processing.value = true
  try {
    const response = await orderApi.complete(order.value.id)
    if (response.data.success) {
      alert('配送完成！')
      loadOrder()
    }
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  } finally {
    processing.value = false
  }
}

const reportProblem = () => {
  alert('遇到问题功能：请联系客服或提交退单申请')
}

const submitRefund = async () => {
  if (!refundForm.value.reason) {
    alert('请选择退单原因')
    return
  }
  
  processing.value = true
  try {
    const response = await orderApi.refund(order.value.id, refundForm.value)
    if (response.data.success) {
      alert('退单申请已提交')
      showRefund.value = false
      loadOrder()
    }
  } catch (err) {
    alert(err.response?.data?.message || '提交失败')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>
