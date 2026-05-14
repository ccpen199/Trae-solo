<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">充值中心</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="balance-card">
        <div class="balance-label">账户余额</div>
        <div class="balance-amount">¥{{ balance }}</div>
        <div class="balance-tips">充值后可用于消费付款</div>
      </div>

      <div class="section">
        <div class="section-title">选择充值金额</div>
        <div class="amount-grid">
          <div 
            class="amount-item" 
            v-for="item in amountOptions" 
            :key="item.value"
            :class="{ active: selectedAmount === item.value, gift: item.gift > 0 }"
            @click="selectedAmount = item.value"
          >
            <div class="amount-value">¥{{ item.value }}</div>
            <div v-if="item.gift > 0" class="amount-gift">送¥{{ item.gift }}</div>
          </div>
        </div>

        <div class="custom-amount">
          <div class="custom-label">自定义金额</div>
          <div class="custom-input-wrap">
            <span class="currency">¥</span>
            <input 
              type="number" 
              v-model.number="customAmount" 
              placeholder="请输入金额"
              @focus="selectedAmount = null"
            />
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">选择支付方式</div>
        <div class="payment-list">
          <div 
            class="payment-item" 
            v-for="payment in paymentMethods" 
            :key="payment.id"
            :class="{ active: selectedPayment === payment.id }"
            @click="selectedPayment = payment.id"
          >
            <span class="payment-icon">{{ payment.icon }}</span>
            <span class="payment-name">{{ payment.name }}</span>
            <span class="payment-check" v-if="selectedPayment === payment.id">✓</span>
          </div>
        </div>
      </div>

      <div class="recharge-btn-wrap">
        <button 
          class="btn-recharge" 
          :disabled="!canRecharge || isLoading"
          @click="handleRecharge"
        >
          {{ isLoading ? '充值中...' : `立即充值 ¥${rechargeAmount}` }}
        </button>
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

const balance = ref('100.00')
const selectedAmount = ref(100)
const customAmount = ref(null)
const selectedPayment = ref('alipay')
const isLoading = ref(false)

const amountOptions = [
  { value: 50, gift: 0 },
  { value: 100, gift: 5 },
  { value: 200, gift: 15 },
  { value: 500, gift: 50 },
  { value: 1000, gift: 120 },
  { value: 2000, gift: 300 }
]

const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: '💙' },
  { id: 'wechat', name: '微信支付', icon: '💚' }
]

const rechargeAmount = computed(() => {
  return selectedAmount.value || customAmount.value || 0
})

const canRecharge = computed(() => {
  return rechargeAmount.value > 0 && selectedPayment.value
})

function goBack() {
  router.back()
}

async function handleRecharge() {
  if (!canRecharge.value) return
  
  isLoading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const event = new CustomEvent('showToast', { detail: '充值成功！' })
    window.dispatchEvent(event)
    balance.value = (parseFloat(balance.value) + rechargeAmount.value).toFixed(2)
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: '充值失败，请重试' })
    window.dispatchEvent(event)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 120px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 15px;
  padding: 20px;
  border-radius: 12px;
  color: #fff;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
}

.balance-amount {
  font-size: 36px;
  font-weight: bold;
  margin: 10px 0;
}

.balance-tips {
  font-size: 12px;
  opacity: 0.8;
}

.section {
  background: #fff;
  margin: 15px;
  padding: 15px;
  border-radius: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.amount-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px 10px;
  text-align: center;
  position: relative;
}

.amount-item.active {
  border-color: var(--primary-color);
  background: #FFF2F2;
}

.amount-item.gift {
  background: linear-gradient(135deg, #FFF5F5, #FFE8E8);
}

.amount-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.amount-gift {
  font-size: 11px;
  color: var(--primary-color);
  margin-top: 5px;
}

.custom-amount {
  margin-top: 20px;
}

.custom-label {
  font-size: 14px;
  color: var(--gray-color);
  margin-bottom: 10px;
}

.custom-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0 15px;
}

.currency {
  font-size: 18px;
  color: #333;
  margin-right: 5px;
}

.custom-input-wrap input {
  flex: 1;
  height: 45px;
  border: none;
  font-size: 18px;
  outline: none;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.payment-item.active {
  border-color: var(--primary-color);
  background: #FFF2F2;
}

.payment-icon {
  font-size: 24px;
  margin-right: 10px;
}

.payment-name {
  flex: 1;
  font-size: 16px;
}

.payment-check {
  color: var(--primary-color);
  font-size: 20px;
}

.recharge-btn-wrap {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  padding: 15px;
  background: #fff;
  border-top: 1px solid var(--border-color);
}

.btn-recharge {
  width: 100%;
  padding: 15px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.btn-recharge:disabled {
  opacity: 0.6;
}
</style>
