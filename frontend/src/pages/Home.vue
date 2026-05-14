<template>
  <div class="home">
    <div class="header">
      <div class="restaurant-info">
        <h1>{{ restaurant?.name || '加载中...' }}</h1>
        <p class="desc" v-if="restaurant">{{ restaurant.description }}</p>
        <p class="info" v-if="restaurant">📍 {{ restaurant.address }}</p>
        <p class="info" v-if="restaurant">📞 {{ restaurant.phone }}</p>
      </div>
    </div>
    
    <div class="content">
      <div class="card" @click="goToTable">
        <div class="icon">🪑</div>
        <h3>直接就餐</h3>
        <p>入座后确认桌号</p>
      </div>
      
      <div class="card" @click="goToQueue">
        <div class="icon">📋</div>
        <h3>排队等待</h3>
        <p>先领号，边等边选菜</p>
      </div>
      
      <div class="app-info">
        <p>扫码点餐平台 v1.0</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Home',
  data() {
    return {
      restaurant: null
    }
  },
  mounted() {
    this.loadRestaurant()
  },
  methods: {
    async loadRestaurant() {
      try {
        const res = await axios.get('http://localhost:19881/api/restaurants/1')
        this.restaurant = res.data
        localStorage.setItem('restaurantId', res.data.id)
      } catch (e) {
        console.error(e)
        this.restaurant = { name: '测试餐厅', description: '加载失败，显示默认数据', address: '-', phone: '-' }
      }
    },
    goToTable() {
      localStorage.setItem('restaurantId', this.restaurant?.id || 1)
      this.$router.push('/table')
    },
    goToQueue() {
      localStorage.setItem('restaurantId', this.restaurant?.id || 1)
      this.$router.push('/queue')
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.header {
  padding: 40px 20px;
  color: white;
}
.header h1 {
  font-size: 28px;
  margin-bottom: 12px;
}
.desc {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 16px;
}
.info {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}
.content {
  padding: 20px;
}
.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.card h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
}
.card p {
  color: #666;
  font-size: 14px;
}
.app-info {
  text-align: center;
  padding: 20px;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
}
</style>
