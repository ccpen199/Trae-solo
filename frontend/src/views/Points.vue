<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">积分商城</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="points-card">
        <div class="points-label">我的积分</div>
        <div class="points-amount">{{ points }}</div>
        <div class="points-actions">
          <div class="action-item" @click="showPointsDetail = true">
            <span class="action-icon">📊</span>
            <span>积分明细</span>
          </div>
          <div class="action-item">
            <span class="action-icon">🎯</span>
            <span>任务中心</span>
          </div>
        </div>
      </div>

      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'hot' }"
          @click="activeTab = 'hot'"
        >
          热门兑换
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'coupon' }"
          @click="activeTab = 'coupon'"
        >
          优惠券
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'goods' }"
          @click="activeTab = 'goods'"
        >
          实物商品
        </div>
      </div>

      <div class="exchange-list">
        <div 
          class="exchange-item" 
          v-for="item in exchangeList" 
          :key="item.id"
          @click="handleExchange(item)"
        >
          <img :src="item.image" alt="Product" />
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <div class="item-points">
              <span class="points-value">{{ item.points }}</span>
              <span class="points-unit">积分</span>
              <span v-if="item.price" class="item-price">¥{{ item.price }}</span>
            </div>
            <div class="item-stock">库存: {{ item.stock }}</div>
          </div>
          <button class="btn-exchange" :disabled="points < item.points">
            {{ points >= item.points ? '兑换' : '积分不足' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPointsDetail" class="modal-mask" @click="showPointsDetail = false">
      <div class="detail-modal" @click.stop>
        <div class="modal-header">
          <span>积分明细</span>
          <span class="modal-close" @click="showPointsDetail = false">×</span>
        </div>
        <div class="modal-content">
          <div class="detail-item" v-for="item in pointsHistory" :key="item.id">
            <div class="detail-info">
              <div class="detail-title">{{ item.title }}</div>
              <div class="detail-time">{{ item.time }}</div>
            </div>
            <div class="detail-amount" :class="{ positive: item.amount > 0 }">
              {{ item.amount > 0 ? '+' : '' }}{{ item.amount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'

const router = useRouter()

const points = ref(1280)
const activeTab = ref('hot')
const showPointsDetail = ref(false)

const exchangeList = ref([
  { id: 1, name: '50元优惠券', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=coupon%20voucher%20icon%20design&image_size=square', points: 500, price: null, stock: 100 },
  { id: 2, name: '20元优惠券', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=discount%20coupon%20icon&image_size=square', points: 200, price: null, stock: 200 },
  { id: 3, name: '精美水杯', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=beautiful%20water%20bottle%20product%20photo&image_size=square', points: 800, price: 99, stock: 50 },
  { id: 4, name: '品牌T恤', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fashion%20tshirt%20product%20photo&image_size=square', points: 1500, price: 129, stock: 30 },
  { id: 5, name: '蓝牙耳机', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=wireless%20earbuds%20headphones%20product%20photo&image_size=square', points: 3000, price: 299, stock: 20 },
  { id: 6, name: '10元优惠券', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=sale%20coupon%20discount%20icon&image_size=square', points: 100, price: null, stock: 500 }
])

const pointsHistory = ref([
  { id: 1, title: '购物奖励', time: '2026-05-10 14:30', amount: 100 },
  { id: 2, title: '每日签到', time: '2026-05-10 09:00', amount: 10 },
  { id: 3, title: '兑换优惠券', time: '2026-05-09 18:20', amount: -200 },
  { id: 4, title: '购物奖励', time: '2026-05-09 12:00', amount: 150 },
  { id: 5, title: '每日签到', time: '2026-05-09 09:00', amount: 10 }
])

function goBack() {
  router.back()
}

function handleExchange(item) {
  if (points.value < item.points) {
    const event = new CustomEvent('showToast', { detail: '积分不足' })
    window.dispatchEvent(event)
    return
  }
  
  points.value -= item.points
  const event = new CustomEvent('showToast', { detail: '兑换成功！' })
  window.dispatchEvent(event)
}
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 60px;
}

.points-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  margin: 15px;
  padding: 25px 20px;
  border-radius: 12px;
  color: #fff;
}

.points-label {
  font-size: 14px;
  opacity: 0.9;
}

.points-amount {
  font-size: 42px;
  font-weight: bold;
  margin: 15px 0;
}

.points-actions {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.action-icon {
  font-size: 20px;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  flex: 1;
  padding: 15px;
  text-align: center;
  font-size: 14px;
  color: var(--gray-color);
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.exchange-list {
  padding: 10px;
}

.exchange-item {
  display: flex;
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  align-items: center;
}

.exchange-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-points {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: 5px;
}

.points-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.points-unit {
  font-size: 12px;
  color: var(--primary-color);
}

.item-price {
  font-size: 12px;
  color: var(--gray-color);
  text-decoration: line-through;
  margin-left: 5px;
}

.item-stock {
  font-size: 12px;
  color: var(--gray-color);
}

.btn-exchange {
  padding: 8px 16px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}

.btn-exchange:disabled {
  background: #ccc;
}

.detail-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 15px 15px 0 0;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  font-size: 16px;
  font-weight: bold;
}

.modal-close {
  font-size: 24px;
  color: var(--gray-color);
}

.modal-content {
  padding: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.detail-time {
  font-size: 12px;
  color: var(--gray-color);
}

.detail-amount {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.detail-amount.positive {
  color: var(--primary-color);
}
</style>
