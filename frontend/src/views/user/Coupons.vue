<template>
  <div class="coupons-page">
    <div class="coupons-header">
      <van-icon name="arrow-left" size="20" @click="goBack" />
      <div class="header-title">我的优惠券</div>
    </div>

    <van-tabs v-model:active="activeTab" color="#1989fa" line-width="40" sticky>
      <van-tab title="可使用" name="unused">
        <CouponList :status="'unused'" />
      </van-tab>
      <van-tab title="已使用" name="used">
        <CouponList :status="'used'" />
      </van-tab>
      <van-tab title="已过期" name="expired">
        <CouponList :status="'expired'" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTab = ref('unused')

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="coupon-list">
    <div class="coupon-item" v-for="coupon in couponList" :key="coupon.id">
      <div class="coupon-left">
        <div class="coupon-amount">
          <span class="amount-symbol">¥</span>
          <span class="amount-value">{{ coupon.discount_amount }}</span>
        </div>
        <div class="coupon-condition" v-if="coupon.min_amount > 0">
          满{{ coupon.min_amount }}可用
        </div>
      </div>
      <div class="coupon-right">
        <div class="coupon-name">{{ coupon.name }}</div>
        <div class="coupon-type">{{ couponTypeMap[coupon.type] || '通用券' }}</div>
        <div class="coupon-validity">
          有效期: {{ coupon.valid_from }} 至 {{ coupon.valid_to }}
        </div>
        <van-button
          v-if="status === 'unused'"
          size="small"
          type="primary"
          class="use-btn"
          @click="handleUse(coupon)"
        >
          立即使用
        </van-button>
      </div>
    </div>

    <van-empty v-if="couponList.length === 0 && !loading" description="暂无优惠券" />
    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getCoupons } from '../../api/user'

const props = defineProps({
  status: {
    type: String,
    default: 'unused'
  }
})

const router = useRouter()

const couponList = ref([])
const loading = ref(false)

const couponTypeMap = {
  general: '通用券',
  fuel: '加油券',
  product: '商品券',
  new_user: '新人券'
}

const fetchCoupons = async () => {
  loading.value = true
  try {
    const res = await getCoupons({ status: props.status })
    couponList.value = res.data.list || []
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleUse = (coupon) => {
  if (coupon.type === 'fuel') {
    router.push('/fuel')
  } else {
    router.push('/home')
  }
  showToast('前往使用优惠券')
}

watch(() => props.status, () => {
  fetchCoupons()
}, { immediate: true })

onMounted(() => {
  fetchCoupons()
})
</script>

<style lang="less" scoped>
.coupons-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.coupons-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;

  .header-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin-right: 20px;
  }
}

.coupon-list {
  padding: 12px;

  .coupon-item {
    display: flex;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .coupon-left {
      width: 100px;
      padding: 16px 8px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        right: -4px;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f5f5f5;
      }

      .coupon-amount {
        color: #fff;
        text-align: center;

        .amount-symbol {
          font-size: 14px;
        }

        .amount-value {
          font-size: 28px;
          font-weight: 600;
        }
      }

      .coupon-condition {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 4px;
      }
    }

    .coupon-right {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .coupon-name {
        font-size: 14px;
        font-weight: 600;
        color: #323233;
        margin-bottom: 4px;
      }

      .coupon-type {
        font-size: 12px;
        color: #969799;
        margin-bottom: 4px;
      }

      .coupon-validity {
        font-size: 11px;
        color: #c8c9cc;
      }

      .use-btn {
        margin-top: 8px;
        border-radius: 12px;
        align-self: flex-start;
      }
    }
  }
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
