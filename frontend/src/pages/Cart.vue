<template>
  <div class="cart">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2>购物车</h2>
    </div>
    
    <div class="content">
      <div v-if="cart.length === 0" class="empty">
        <div class="empty-icon">🛒</div>
        <p>购物车是空的</p>
        <button class="btn btn-primary" @click="$router.push('/menu')">去点餐</button>
      </div>
      
      <div v-else>
        <div v-for="item in cart" :key="item.id" class="cart-item card">
          <div class="item-info">
            <h4>{{ item.name }}</h4>
            <span v-if="item.is_set_meal" class="tag">套餐</span>
            <p class="price">¥{{ item.price.toFixed(2) }}</p>
          </div>
          <div class="item-actions">
            <button class="minus-btn" @click="updateQuantity(item, -1)">-</button>
            <span class="quantity">{{ item.quantity }}</span>
            <button class="add-btn" @click="updateQuantity(item, 1)">+</button>
          </div>
        </div>
        
        <div class="summary card">
          <div class="summary-row">
            <span>共{{ cartCount }}件</span>
            <span class="total">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <button class="btn btn-primary btn-block" @click="submitOrder" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交订单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Cart',
  data() {
    return {
      cart: [],
      submitting: false
    }
  },
  computed: {
    cartCount() {
      return this.cart.reduce((sum, item) => sum + item.quantity, 0)
    },
    totalPrice() {
      return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }
  },
  mounted() {
    this.loadCart()
  },
  methods: {
    loadCart() {
      const saved = localStorage.getItem('cart')
      if (saved) {
        this.cart = JSON.parse(saved)
      }
    },
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart))
    },
    updateQuantity(item, delta) {
      item.quantity += delta
      if (item.quantity <= 0) {
        this.cart = this.cart.filter(i => i.id !== item.id)
      }
      this.saveCart()
    },
    async submitOrder() {
      if (this.submitting) return
      this.submitting = true
      
      try {
        const restaurantId = localStorage.getItem('restaurantId') || 1
        const tableId = localStorage.getItem('tableId')
        const queueId = localStorage.getItem('queueId')
        
        const orderItems = this.cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price
        }))
        
        const res = await axios.post('http://localhost:19881/api/orders', {
          restaurant_id: restaurantId,
          table_id: tableId ? parseInt(tableId) : null,
          queue_id: queueId ? parseInt(queueId) : null,
          items: orderItems
        })
        
        localStorage.removeItem('cart')
        localStorage.removeItem('tableId')
        localStorage.removeItem('queueId')
        this.$router.push(`/order/${res.data.id}`)
      } catch (e) {
        console.error(e)
        alert('提交失败，请重试')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.cart {
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
.empty {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}
.empty p {
  color: #666;
  margin-bottom: 20px;
}
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-info {
  flex: 1;
}
.item-info h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}
.tag {
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
}
.price {
  font-size: 18px;
  color: #ff6b6b;
  font-weight: bold;
  margin-top: 8px;
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.add-btn, .minus-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-btn {
  background: #ff6b6b;
  color: white;
}
.minus-btn {
  background: #eee;
  color: #333;
}
.quantity {
  font-size: 18px;
  min-width: 24px;
  text-align: center;
}
.summary {
  margin-top: 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.total {
  font-size: 24px;
  color: #ff6b6b;
  font-weight: bold;
}
</style>
