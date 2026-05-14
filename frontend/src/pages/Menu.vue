<template>
  <div class="menu">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2>点餐</h2>
      <button class="cart-btn" @click="$router.push('/cart')">
        🛒 {{ cartCount }}
      </button>
    </div>
    
    <div class="menu-container">
      <div class="categories">
        <div 
          v-for="(cat, index) in menu" 
          :key="cat.id"
          class="category-item"
          :class="{ active: activeCategory === index }"
          @click="activeCategory = index"
        >
          {{ cat.name }}
        </div>
      </div>
      
      <div class="items">
        <div v-for="category in menu" :key="category.id" v-show="activeCategory === menu.indexOf(category)">
          <h3 class="category-title">{{ category.name }}</h3>
          <div v-for="item in category.items" :key="item.id" class="menu-item card">
            <div class="item-info">
              <div class="item-icon">{{ item.is_set_meal ? '🍱' : '🍽️' }}</div>
              <div class="item-details">
                <h4>{{ item.name }}</h4>
                <p class="item-desc">{{ item.description }}</p>
                <div class="item-footer">
                  <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
                  <span v-if="item.is_set_meal" class="tag">套餐</span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button v-if="getCartQuantity(item) > 0" class="minus-btn" @click="removeFromCart(item)">-</button>
              <span v-if="getCartQuantity(item) > 0" class="quantity">{{ getCartQuantity(item) }}</span>
              <button class="add-btn" @click="addToCart(item)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="cartCount > 0" class="bottom-bar">
      <div class="total">
        <span>合计: ¥{{ totalPrice.toFixed(2) }}</span>
        <span class="count">共{{ cartCount }}件</span>
      </div>
      <button class="btn btn-primary" @click="$router.push('/cart')">去购物车</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Menu',
  data() {
    return {
      menu: [],
      activeCategory: 0,
      cart: []
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
    this.loadMenu()
    this.loadCart()
  },
  methods: {
    async loadMenu() {
      try {
        const restaurantId = localStorage.getItem('restaurantId') || 1
        const res = await axios.get(`http://localhost:19881/api/restaurants/${restaurantId}/menu`)
        this.menu = res.data
      } catch (e) {
        console.error(e)
      }
    },
    loadCart() {
      const saved = localStorage.getItem('cart')
      if (saved) {
        this.cart = JSON.parse(saved)
      }
    },
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart))
    },
    getCartQuantity(item) {
      const cartItem = this.cart.find(i => i.id === item.id)
      return cartItem ? cartItem.quantity : 0
    },
    addToCart(item) {
      const existing = this.cart.find(i => i.id === item.id)
      if (existing) {
        existing.quantity++
      } else {
        this.cart.push({
          id: item.id,
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          is_set_meal: item.is_set_meal,
          quantity: 1
        })
      }
      this.saveCart()
    },
    removeFromCart(item) {
      const existing = this.cart.find(i => i.id === item.id)
      if (existing) {
        existing.quantity--
        if (existing.quantity <= 0) {
          this.cart = this.cart.filter(i => i.id !== item.id)
        }
      }
      this.saveCart()
    }
  }
}
</script>

<style scoped>
.menu {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}
.header {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn, .cart-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
}
.header h2 {
  font-size: 18px;
  color: #333;
}
.menu-container {
  display: flex;
  height: calc(100vh - 70px);
}
.categories {
  width: 100px;
  background: #f8f8f8;
  overflow-y: auto;
}
.category-item {
  padding: 16px 12px;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.category-item.active {
  background: white;
  border-left-color: #ff6b6b;
  color: #ff6b6b;
  font-weight: bold;
}
.items {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.category-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  padding-left: 8px;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
}
.item-info {
  display: flex;
  gap: 12px;
  flex: 1;
}
.item-icon {
  font-size: 48px;
}
.item-details {
  flex: 1;
}
.item-details h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}
.item-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}
.item-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-price {
  font-size: 18px;
  color: #ff6b6b;
  font-weight: bold;
}
.tag {
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.add-btn, .minus-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  font-size: 18px;
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
  font-size: 16px;
  min-width: 20px;
  text-align: center;
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
}
.total {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.total span:first-child {
  font-size: 20px;
  color: #ff6b6b;
  font-weight: bold;
}
.count {
  font-size: 12px;
  color: #666;
}
</style>
