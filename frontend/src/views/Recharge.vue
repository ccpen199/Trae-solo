<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { recharge } from '@/api/account'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const amount = ref('')
const loading = ref(false)

const handleRecharge = async () => {
  if (!amount.value || Number(amount.value) <= 0) {
    return showToast({ message: '请输入充值金额', type: 'fail' })
  }

  loading.value = true
  try {
    await recharge(Number(amount.value))
    
    showToast({ message: '充值成功', type: 'success' })
    
    if (userStore.user) {
      userStore.user.balance = Number(userStore.user.balance) + Number(amount.value)
      userStore.setUser({ ...userStore.user })
    }
    
    setTimeout(() => {
      router.back()
    }, 1000)
  } catch (err) {
    console.error('Recharge error:', err)
  } finally {
    loading.value = false
  }
}

const quickAmounts = [100, 500, 1000, 5000, 10000]
</script>

<template>
  <div class="recharge-page">
    <van-nav-bar title="充值" left-arrow @click-left="router.back()" />

    <div class="content">
      <div class="balance-section">
        <div class="balance-label">可用余额</div>
        <div class="balance-value">¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</div>
      </div>

      <div class="amount-section">
        <div class="section-title">充值金额</div>
        <van-field
          v-model="amount"
          type="number"
          placeholder="请输入充值金额"
          class="amount-input"
        >
          <template #right-icon>
            <span class="currency">元</span>
          </template>
        </van-field>
        <div class="quick-amounts">
          <span
            v-for="item in quickAmounts"
            :key="item"
            class="quick-item"
            :class="{ active: amount === String(item) }"
            @click="amount = String(item)"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div class="tip-section">
        <van-icon name="info-o" size="14" color="#999" />
        <span class="tip-text">充值金额将即时到账，可用于投资</span>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button
        type="primary"
        block
        size="large"
        :loading="loading"
        :disabled="!amount || Number(amount) <= 0"
        @click="handleRecharge"
      >
        确认充值
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.recharge-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.balance-section {
  background: white;
  padding: 24px 16px;
  text-align: center;
}

.balance-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.balance-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.amount-section {
  background: white;
  padding: 20px 16px;
  margin-top: 12px;
}

.section-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.amount-input {
  font-size: 24px;
  font-weight: 600;
}

.currency {
  font-size: 16px;
  color: #333;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.quick-item {
  padding: 8px 0;
  text-align: center;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.quick-item.active {
  border-color: #1989fa;
  color: #1989fa;
  background: #f0f7ff;
}

.tip-section {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tip-text {
  font-size: 12px;
  color: #999;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}
</style>
