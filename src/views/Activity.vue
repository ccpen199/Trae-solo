<template>
  <div class="activity-container">
    <van-nav-bar :title="activityTitle" left-text="返回" @click-left="goBack" />

    <div class="activity-content">
      <div class="banner-section">
        <img :src="activityBanner" class="activity-banner" />
      </div>

      <div class="product-section">
        <h3 class="section-title">{{ activityTitle }}商品</h3>
        <div class="product-grid">
          <div 
            v-for="product in activityProducts" 
            :key="product.id" 
            class="product-card"
          >
            <img :src="product.image" class="product-image" />
            <div class="product-info">
              <p class="product-name">{{ product.name }}</p>
              <p class="product-unit">{{ product.unit }}</p>
              <div class="product-price">
                <span class="price-current">¥{{ product.price }}</span>
                <span v-if="product.originalPrice" class="price-original">¥{{ product.originalPrice }}</span>
              </div>
            </div>
            <van-button type="primary" size="small" @click="addToCart(product)">加入购物车</van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { flashSaleProducts, recommendProducts } from '@/data/mockData'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const activityType = computed(() => decodeURIComponent(route.params.type || '秒杀'))

const activityTitle = computed(() => {
  const titles = {
    '秒杀': '限时秒杀',
    '推荐': '为你推荐',
    '蔬菜': '新鲜蔬菜',
    '水果': '精选水果',
    '肉食': '优质肉食',
    '海鲜': '鲜美海鲜',
    '干货': '山珍干货',
    '速食': '方便速食',
    '酒品': '酒水饮料',
    '调料': '厨房调料',
    '厨房用品': '厨房用品',
  }
  return titles[activityType.value] || activityType.value
})

const activityBanner = computed(() => 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20225%22%20style%3D%22background%3Alinear-gradient%28135deg%2C%23ff6b35%200%25%2C%23f7931e%20100%25%29%3B%22%3E%3Ctext%20y%3D%2250%25%22%20x%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22white%22%20font-size%3D%2224%22%3E' + encodeURIComponent(activityTitle.value) + '%3C%2Ftext%3E%3C%2Fsvg%3E')

const activityProducts = computed(() => {
  if (activityType.value === '秒杀') {
    return flashSaleProducts
  }
  return recommendProducts
})

const goBack = () => {
  router.back()
}

const addToCart = (product) => {
  appStore.addToCart(product)
  showToast('已加入购物车')
}
</script>

<style scoped>
.activity-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.activity-content {
  padding-bottom: 16px;
}

.activity-banner {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.product-section {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}

.product-image {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.product-info {
  margin-top: 12px;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-unit {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}

.product-price {
  display: flex;
  align-items: baseline;
}

.price-current {
  color: #ff6b35;
  font-size: 18px;
  font-weight: bold;
}

.price-original {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
  margin-left: 8px;
}

.product-card .van-button {
  width: 100%;
  margin-top: 12px;
}
</style>
