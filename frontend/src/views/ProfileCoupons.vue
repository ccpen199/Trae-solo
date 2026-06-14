<template>
  <div class="profile-coupons-page">
    <div class="page-header">
      <h2 class="page-title">优惠券</h2>
      <div class="header-actions">
        <el-button @click="loadCoupons">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" @tab-change="loadCoupons">
      <el-tab-pane label="未使用" name="unused" />
      <el-tab-pane label="已使用" name="used" />
      <el-tab-pane label="已过期" name="expired" />
    </el-tabs>
    
    <div class="coupons-grid" v-loading="loading">
      <el-row :gutter="20">
        <el-col v-for="coupon in coupons" :key="coupon.id" :span="8">
          <div class="coupon-card" :class="{ disabled: coupon.status !== 'unused' || coupon.is_expired }">
            <div class="coupon-left">
              <div class="coupon-value">¥{{ coupon.value }}</div>
              <div class="coupon-condition">满{{ coupon.min_amount }}可用</div>
            </div>
            <div class="coupon-right">
              <div class="coupon-name">{{ coupon.name }}</div>
              <div class="coupon-code">券码：{{ coupon.code }}</div>
              <div class="coupon-expire" :class="{ warning: coupon.is_expiring_soon }">
                <el-icon><Clock /></el-icon>
                <span>{{ coupon.expires_at ? `有效期至 ${coupon.expires_at}` : '长期有效' }}</span>
              </div>
              <div class="coupon-status">
                <el-tag v-if="coupon.status === 'used'" type="success" size="small">已使用</el-tag>
                <el-tag v-else-if="coupon.is_expired" type="info" size="small">已过期</el-tag>
                <el-tag v-else-if="coupon.is_expiring_soon" type="warning" size="small">即将过期</el-tag>
                <el-button v-else type="primary" size="small" @click="useCoupon(coupon)">立即使用</el-button>
              </div>
            </div>
            <div class="coupon-tag" v-if="coupon.status === 'used'">已使用</div>
            <div class="coupon-tag expired" v-else-if="coupon.is_expired">已过期</div>
          </div>
        </el-col>
      </el-row>
      
      <el-empty v-if="!loading && coupons.length === 0" description="暂无优惠券" style="width: 100%;" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getCoupons } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const coupons = ref([])
const activeTab = ref('unused')

async function loadCoupons() {
  loading.value = true
  try {
    const res = await getCoupons({ user_id: userStore.userId })
    let list = res.data
    
    if (activeTab.value === 'unused') {
      list = list.filter(c => c.status === 'unused' && !c.is_expired)
    } else if (activeTab.value === 'used') {
      list = list.filter(c => c.status === 'used')
    } else if (activeTab.value === 'expired') {
      list = list.filter(c => c.is_expired || (c.status === 'unused' && c.is_expired)
    }
    
    coupons.value = list
  } finally {
    loading.value = false
  }
}

function useCoupon(coupon) {
  router.push('/products')
  ElMessage.info('请在下单时选择使用优惠券')
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.profile-coupons-page {
  padding: 0;
}

.coupons-grid {
  min-height: 400px;
}

.coupon-card {
  position: relative;
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.coupon-card.disabled {
  opacity: 0.6;
}

.coupon-left {
  width: 120px;
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: #fff;
  text-align: center;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.coupon-left::before,
.coupon-left::after {
  content: '';
  position: absolute;
  right: -6px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
}

.coupon-left::before { top: -6px; }
.coupon-left::after { bottom: -6px; }

.coupon-value {
  font-size: 32px;
  font-weight: 700;
}

.coupon-condition {
  font-size: 12px;
  margin-top: 5px;
}

.coupon-right {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.coupon-code {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.coupon-expire {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
}

.coupon-expire.warning {
  color: #e6a23c;
}

.coupon-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #67c23a;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.coupon-tag.expired {
  background: #909399;
}
</style>
