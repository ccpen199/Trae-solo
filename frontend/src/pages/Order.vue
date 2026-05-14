<template>
  <div class="order">
    <div class="header">
      <button class="back-btn" @click="$router.push('/')">←</button>
      <h2>订单详情</h2>
    </div>
    
    <div class="content" v-if="order">
      <div class="order-info card">
        <div class="status-badge" :class="order.status">
          {{ order.status === 'settled' ? '已完成' : '进行中' }}
        </div>
        <p class="order-id">订单号: {{ order.id }}</p>
      </div>
      
      <div class="order-items card">
        <h3>已点菜品</h3>
        <div v-for="item in order.items" :key="item.id" class="order-item">
          <span>{{ item.quantity }}x {{ item.name || '菜品' }}</span>
          <span class="price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
        </div>
        <div class="order-total">
          <span>合计</span>
          <span class="price">¥{{ order.total_amount.toFixed(2) }}</span>
        </div>
      </div>
      
      <div class="actions" v-if="order.status !== 'settled'">
        <div class="service-buttons">
          <button class="btn btn-secondary" @click="callService('add')">加菜</button>
          <button class="btn btn-secondary" @click="callService('staff')">呼叫服务员</button>
        </div>
        <button class="btn btn-primary btn-block" @click="settleOrder">申请结账</button>
      </div>
      
      <div class="actions" v-else>
        <button class="btn btn-primary btn-block" @click="$router.push(`/review/${order.id}`)">去评价</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Order',
  data() {
    return {
      order: null
    }
  },
  mounted() {
    this.loadOrder()
  },
  methods: {
    async loadOrder() {
      try {
        const res = await axios.get(`http://localhost:19881/api/orders/${this.$route.params.id}`)
        this.order = res.data
      } catch (e) {
        console.error(e)
      }
    },
    async callService(type) {
      try {
        const restaurantId = localStorage.getItem('restaurantId') || 1
        const tableId = localStorage.getItem('tableId')
        await axios.post('http://localhost:19881/api/service-calls', {
          restaurant_id: restaurantId,
          table_id: tableId ? parseInt(tableId) : null,
          type: type
        })
        alert('已呼叫成功，服务员马上过来')
      } catch (e) {
        console.error(e)
      }
    },
    async settleOrder() {
      try {
        await axios.post(`http://localhost:19881/api/orders/${this.order.id}/settle`)
        this.order.status = 'settled'
        alert('结账申请已提交')
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>

<style scoped>
.order {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
}
.header h2 {
  font-size: 18px;
  color: #333;
}
.content {
  padding: 20px;
}
.order-info {
  text-align: center;
}
.status-badge {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}
.status-badge.settled {
  background: #4ecdc4;
  color: white;
}
.status-badge.pending {
  background: #ff6b6b;
  color: white;
}
.order-id {
  color: #666;
  font-size: 14px;
}
.order-items h3 {
  margin-bottom: 16px;
  color: #333;
}
.order-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.order-total {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  font-weight: bold;
  font-size: 18px;
}
.price {
  color: #ff6b6b;
}
.actions {
  margin-top: 20px;
}
.service-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.service-buttons .btn {
  flex: 1;
}
</style>
