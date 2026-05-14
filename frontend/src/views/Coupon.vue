<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">优惠券</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'available' }"
          @click="activeTab = 'available'"
        >
          可使用 ({{ availableCount }})
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'used' }"
          @click="activeTab = 'used'"
        >
          已使用
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'expired' }"
          @click="activeTab = 'expired'"
        >
          已过期
        </div>
      </div>

      <div v-if="coupons.length === 0" class="empty-state">
        <div class="icon">🎫</div>
        <p>暂无优惠券</p>
        <button class="btn btn-primary" @click="goShopping">去逛逛</button>
      </div>

      <div v-else class="coupon-list">
        <div 
          class="coupon-card" 
          v-for="coupon in coupons" 
          :key="coupon.id"
          :class="{ disabled: activeTab !== 'available' }"
        >
          <div class="coupon-left">
            <div class="coupon-amount">
              <span class="currency">¥</span>
              <span class="amount">{{ coupon.amount }}</span>
            </div>
            <div class="coupon-condition">满{{ coupon.condition }}元可用</div>
          </div>
          <div class="coupon-right">
            <div class="coupon-name">{{ coupon.name }}</div>
            <div class="coupon-range">{{ coupon.range }}</div>
            <div class="coupon-expire">{{ coupon.expireTime }}</div>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../components/TabBar.vue'

const router = useRouter()

const activeTab = ref('available')

const coupons = ref([
  { id: 1, name: '新人专享券', amount: 50, condition: 200, range: '全场通用', expireTime: '2026-06-30' },
  { id: 2, name: '满减优惠券', amount: 20, condition: 100, range: '服装类商品', expireTime: '2026-05-20' },
  { id: 3, name: '手机数码券', amount: 100, condition: 1000, range: '手机数码', expireTime: '2026-05-15' },
  { id: 4, name: '生鲜食品券', amount: 30, condition: 150, range: '食品生鲜', expireTime: '2026-05-25' }
])

const availableCount = computed(() => coupons.value.length)

function goBack() {
  router.back()
}

function goShopping() {
  router.push('/')
}
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 60px;
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

.coupon-list {
  padding: 10px;
}

.coupon-card {
  display: flex;
  background: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.coupon-card.disabled {
  opacity: 0.6;
}

.coupon-left {
  width: 100px;
  background: linear-gradient(135deg, #FF6B6B, #FF4757);
  color: #fff;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.coupon-amount {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 14px;
}

.amount {
  font-size: 32px;
  font-weight: bold;
}

.coupon-condition {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.coupon-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.coupon-range {
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 5px;
}

.coupon-expire {
  font-size: 12px;
  color: var(--gray-color);
}
</style>
