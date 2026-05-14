<template>
  <div class="coupon-container">
    <van-nav-bar title="我的优惠券" left-text="返回" @click-left="goBack" />

    <div class="coupon-tabs">
      <van-tab v-model="activeTab" title="未使用" @click="activeTab = 0" />
      <van-tab v-model="activeTab" title="已使用" @click="activeTab = 1" />
      <van-tab v-model="activeTab" title="已过期" @click="activeTab = 2" />
    </div>

    <div class="coupon-list">
      <div 
        v-for="coupon in filteredCoupons" 
        :key="coupon.id" 
        class="coupon-card"
      >
        <div class="coupon-left">
          <span class="coupon-discount">{{ coupon.discount }}</span>
          <span class="coupon-unit">元</span>
          <span class="coupon-condition">满{{ coupon.minAmount }}可用</span>
        </div>
        <div class="coupon-right">
          <h3 class="coupon-name">{{ coupon.name }}</h3>
          <p class="coupon-expire">{{ coupon.expire }}前使用</p>
          <button 
            v-if="activeTab === 0" 
            class="coupon-btn"
            @click="useCoupon(coupon)"
          >
            立即使用
          </button>
          <span v-else-if="activeTab === 1" class="coupon-status">已使用</span>
          <span v-else class="coupon-status expired">已过期</span>
        </div>
      </div>
    </div>

    <div v-if="filteredCoupons.length === 0" class="empty-state">
      <div class="empty-icon">🎫</div>
      <p>暂无优惠券</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const activeTab = ref(0)

const usedCoupons = [
  { id: 101, name: '新人专享', discount: 10, minAmount: 50, expire: '2024-06-30' },
]

const expiredCoupons = [
  { id: 201, name: '限时优惠', discount: 15, minAmount: 80, expire: '2024-01-31' },
]

const filteredCoupons = computed(() => {
  if (activeTab.value === 0) {
    return appStore.coupons
  } else if (activeTab.value === 1) {
    return usedCoupons
  } else {
    return expiredCoupons
  }
})

const goBack = () => {
  router.back()
}

const useCoupon = (coupon) => {
  showToast(`使用优惠券: ${coupon.name}`)
}
</script>

<style scoped>
.coupon-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.coupon-tabs {
  background: #fff;
}

.coupon-list {
  padding: 16px;
}

.coupon-card {
  display: flex;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.coupon-left {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-right: 1px dashed rgba(255, 255, 255, 0.3);
}

.coupon-discount {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.coupon-unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.coupon-condition {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
}

.coupon-right {
  flex: 1;
  background: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.coupon-expire {
  font-size: 12px;
  color: #999;
}

.coupon-btn {
  align-self: flex-end;
  background: #ff6b35;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 12px;
}

.coupon-status {
  align-self: flex-end;
  font-size: 12px;
  color: #999;
}

.coupon-status.expired {
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #999;
  font-size: 16px;
}
</style>
