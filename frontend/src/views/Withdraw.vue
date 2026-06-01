<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { withdraw } from '@/api/account'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const amount = ref('')
const loading = ref(false)

const handleWithdraw = async () => {
  if (!amount.value || Number(amount.value) <= 0) {
    return showToast({ message: '请输入提现金额', type: 'fail' })
  }
  if (Number(amount.value) > Number(userStore.user?.balance || 0)) {
    return showToast({ message: '余额不足', type: 'fail' })
  }

  loading.value = true
  try {
    await withdraw(Number(amount.value))
    
    showToast({ message: '提现成功', type: 'success' })
    
    if (userStore.user) {
      userStore.user.balance = Number(userStore.user.balance) - Number(amount.value)
      userStore.setUser({ ...userStore.user })
    }
    
    setTimeout(() => {
      router.back()
    }, 1000)
  } catch (err) {
    console.error('Withdraw error:', err)
  } finally {
    loading.value = false
  }
}

const useAll = () => {
  amount.value = String(userStore.user?.balance || 0)
}
</script>

<template>
  <div class="withdraw-page">
    <van-nav-bar title="提现" left-arrow @click-left="router.back()" />

    <div class="content">
      <div class="balance-section">
        <div class="balance-label">可用余额</div>
        <div class="balance-value">¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</div>
        <span class="use-all" @click="useAll">全部提现</span>
      </div>

      <div class="amount-section">
        <div class="section-title">提现金额</div>
        <van-field
          v-model="amount"
          type="number"
          placeholder="请输入提现金额"
          class="amount-input"
        >
          <template #right-icon>
            <span class="currency">元</span>
          </template>
        </van-field>
      </div>

      <div class="tip-section">
        <van-icon name="info-o" size="14" color="#999" />
        <span class="tip-text">提现申请将在1-3个工作日内处理完成</span>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button
        type="danger"
        block
        size="large"
        :loading="loading"
        :disabled="!amount || Number(amount) <= 0"
        @click="handleWithdraw"
      >
        确认提现
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.withdraw-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.balance-section {
  background: white;
  padding: 24px 16px;
  text-align: center;
  position: relative;
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

.use-all {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
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
