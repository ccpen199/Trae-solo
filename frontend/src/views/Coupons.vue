<template>
  <div class="coupons-page page-container">
    <div class="header">
      <h1>我的优惠券</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="myCoupons.length === 0" class="empty">
      <Ticket class="empty-icon" />
      <p>暂无优惠券</p>
    </div>

    <div v-else class="content">
      <div class="coupon-list">
        <div 
          v-for="coupon in myCoupons" 
          :key="coupon.id" 
          class="coupon-card"
          :class="{ used: coupon.status === 0 }"
        >
          <div class="coupon-left">
            <div class="coupon-amount">¥{{ coupon.amount }}</div>
            <div class="coupon-condition">满{{ coupon.min_amount }}可用</div>
          </div>
          <div class="coupon-right">
            <div class="coupon-name">{{ coupon.name }}</div>
            <div class="coupon-date">{{ formatDate(coupon.end_time) }}到期</div>
            <div class="coupon-status">
              {{ coupon.status === 0 ? '已使用' : '未使用' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Ticket } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { couponAPI } from '@/api'

const loading = ref(true)
const myCoupons = ref([])

onMounted(() => {
  loadCoupons()
})

async function loadCoupons() {
  loading.value = true
  try {
    myCoupons.value = await couponAPI.mine()
  } catch {
    myCoupons.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-card {
  display: flex;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  overflow: hidden;
}

.coupon-card.used {
  opacity: 0.5;
}

.coupon-left {
  width: 120px;
  padding: 16px;
  text-align: center;
  border-right: 2px dashed #fbbf24;
}

.coupon-amount {
  font-size: 32px;
  font-weight: 700;
  color: #d97706;
}

.coupon-condition {
  font-size: 12px;
  color: #d97706;
  margin-top: 4px;
}

.coupon-right {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.coupon-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.coupon-date {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.coupon-status {
  margin-top: auto;
  font-size: 12px;
  color: #d97706;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty p {
  color: #999;
}
</style>