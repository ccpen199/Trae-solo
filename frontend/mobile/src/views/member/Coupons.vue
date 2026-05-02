<template>
  <div class="member-coupons">
    <div class="coupons-header">
      <h3>我的优惠券</h3>
      <div class="coupon-count">
        共 {{ coupons?.length || 0 }} 张
      </div>
    </div>

    <div class="coupons-tabs">
      <div class="tab-item" :class="{ active: activeTab === 'unused' }" @click="activeTab = 'unused'">
        未使用
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'used' }" @click="activeTab = 'used'">
        已使用
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'expired' }" @click="activeTab = 'expired'">
        已过期
      </div>
    </div>

    <div class="coupons-list">
      <div v-for="coupon in filteredCoupons" :key="coupon.id" class="coupon-item" :class="coupon.status">
        <div class="coupon-left">
          <div class="coupon-amount">
            ¥{{ coupon.discountValue }}
          </div>
          <div class="coupon-condition">
            {{ coupon.minConsumption > 0 ? `满${coupon.minConsumption}可用` : '无门槛' }}
          </div>
        </div>
        <div class="coupon-right">
          <div class="coupon-name">{{ coupon.couponName }}</div>
          <div class="coupon-validity">
            {{ formatDate(coupon.validFrom) }} - {{ formatDate(coupon.validUntil) }}
          </div>
          <div class="coupon-status" :class="coupon.status">
            {{ coupon.status === 'UNUSED' ? '未使用' : coupon.status === 'USED' ? '已使用' : '已过期' }}
          </div>
        </div>
      </div>
      <div v-if="filteredCoupons.length === 0" class="empty-coupons">
        <p>{{ emptyMessage }}</p>
      </div>
    </div>

    <div class="coupon-tips">
      <h4>使用说明</h4>
      <div class="tips-content">
        <div class="tip-item">
          <span>1. 优惠券在结算时自动使用</span>
        </div>
        <div class="tip-item">
          <span>2. 每张订单只能使用一张优惠券</span>
        </div>
        <div class="tip-item">
          <span>3. 优惠券不可兑换现金</span>
        </div>
        <div class="tip-item">
          <span>4. 过期优惠券自动失效</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const activeTab = ref('unused')
const coupons = ref([])

const memberInfo = computed(() => {
  const member = localStorage.getItem('memberInfo')
  return member ? JSON.parse(member) : null
})

const filteredCoupons = computed(() => {
  if (!coupons.value) return []
  
  if (activeTab.value === 'unused') {
    return coupons.value.filter(coupon => coupon.status === 'UNUSED')
  } else if (activeTab.value === 'used') {
    return coupons.value.filter(coupon => coupon.status === 'USED')
  } else {
    return coupons.value.filter(coupon => coupon.status === 'EXPIRED')
  }
})

const emptyMessage = computed(() => {
  if (activeTab.value === 'unused') {
    return '暂无可用优惠券'
  } else if (activeTab.value === 'used') {
    return '暂无已使用优惠券'
  } else {
    return '暂无过期优惠券'
  }
})

onMounted(() => {
  loadCoupons()
})

const loadCoupons = async () => {
  if (!memberInfo.value?.id) return
  
  try {
    const response = await axios.get(`/api/member/${memberInfo.value.id}/coupons`)
    if (response.data.success) {
      coupons.value = response.data.data
    }
  } catch (error) {
    console.error('加载优惠券失败:', error)
    // 加载模拟数据
    loadMockCoupons()
  }
}

const loadMockCoupons = () => {
  coupons.value = [
    {
      id: 1,
      couponId: 1,
      couponName: '新人专享券',
      discountValue: 20,
      minConsumption: 100,
      validFrom: '2024-04-01',
      validUntil: '2024-05-31',
      status: 'UNUSED'
    },
    {
      id: 2,
      couponId: 2,
      couponName: '满减券',
      discountValue: 50,
      minConsumption: 200,
      validFrom: '2024-04-01',
      validUntil: '2024-04-30',
      status: 'UNUSED'
    },
    {
      id: 3,
      couponId: 3,
      couponName: '生日券',
      discountValue: 30,
      minConsumption: 0,
      validFrom: '2024-03-01',
      validUntil: '2024-03-31',
      status: 'EXPIRED'
    },
    {
      id: 4,
      couponId: 4,
      couponName: '节日券',
      discountValue: 10,
      minConsumption: 50,
      validFrom: '2024-04-01',
      validUntil: '2024-04-10',
      status: 'USED'
    }
  ]
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.member-coupons {
  padding-bottom: 20px;
}

.coupons-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.coupons-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.coupon-count {
  font-size: 14px;
  color: #909399;
}

.coupons-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.tab-item.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
}

.coupons-list {
  margin-bottom: 20px;
}

.coupon-item {
  background: white;
  border-radius: 10px;
  margin-bottom: 15px;
  display: flex;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.coupon-left {
  width: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.coupon-left::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 0;
  bottom: 0;
  width: 20px;
  background: #f5f7fa;
  border-radius: 50%;
  box-shadow: -10px 0 0 #f5f7fa;
}

.coupon-amount {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.coupon-condition {
  font-size: 12px;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  padding: 15px;
  position: relative;
}

.coupon-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.coupon-validity {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.coupon-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.coupon-status.UNUSED {
  background: #f0f9eb;
  color: #67c23a;
}

.coupon-status.USED {
  background: #f5f7fa;
  color: #909399;
}

.coupon-status.EXPIRED {
  background: #fef0f0;
  color: #f56c6c;
}

.coupon-item.USED::after,
.coupon-item.EXPIRED::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.empty-coupons {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.coupon-tips {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.coupon-tips h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.tip-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
</style>