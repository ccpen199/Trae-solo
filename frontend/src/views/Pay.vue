<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { api } from '../api'
import { $message } from '../utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const qrData = ref(null)
const amount = ref('')
const description = ref('')
const paymentMethod = ref('balance')
const showPasswordModal = ref(false)
const password = ref('')
const transactionId = ref('')
const paying = ref(false)

const finalAmount = computed(() => {
  if (qrData.value?.amount) return qrData.value.amount
  return parseFloat(amount.value) || 0
})

async function loadQRCode(qrId) {
  loading.value = true
  try {
    const data = await api.getQRCode(qrId)
    qrData.value = data
  } catch (e) {
    $message.show('二维码无效或已过期')
    router.back()
  } finally {
    loading.value = false
  }
}

async function proceedPayment() {
  console.log('proceedPayment called, finalAmount:', finalAmount.value, 'balance:', userStore.balance)
  
  if (!finalAmount.value || finalAmount.value < 0.01 || finalAmount.value > 5000) {
    $message.show('金额必须在 0.01 - 5000 元之间')
    return
  }
  
  if (paymentMethod.value === 'balance' && finalAmount.value > userStore.balance) {
    $message.show('余额不足，请选择银行卡支付')
    return
  }
  
  if (!userStore.currentUser) {
    $message.show('请先登录')
    router.push('/')
    return
  }
  
  if (!qrData.value || !qrData.value.payee) {
    $message.show('收款方信息无效')
    return
  }
  
  if (userStore.currentUser.id === qrData.value.payee.id) {
    $message.show('不能向自己转账，请换一个用户扫码付款')
    return
  }
  
  console.log('Showing password modal')
  showPasswordModal.value = true
}

async function confirmPayment() {
  if (password.value !== '123456') {
    $message.show('支付密码错误（默认: 123456）')
    return
  }
  
  paying.value = true
  try {
    const initResult = await api.initiateTransaction({
      payerId: userStore.currentUser.id,
      payeeId: qrData.value.payee.id,
      amount: finalAmount.value,
      paymentMethod: paymentMethod.value,
      description: description.value,
      qrCodeId: qrData.value.id
    })
    
    transactionId.value = initResult.transactionId
    
    const confirmResult = await api.confirmTransaction(transactionId.value)
    
    await userStore.refreshBalance()
    
    $message.show('支付成功', 'success')
    showPasswordModal.value = false
    
    setTimeout(() => {
      router.push('/transactions')
    }, 1000)
  } catch (e) {
    console.error('Payment error:', e)
    $message.show('支付失败，请重试')
  } finally {
    paying.value = false
    password.value = ''
  }
}

onMounted(() => {
  const qrId = route.params.qrId
  if (qrId) {
    loadQRCode(qrId)
  }
})
</script>

<template>
  <div class="pay h-full flex flex-col">
    <div class="navbar flex items-center p-16 bg-white">
      <button class="text-18" @click="router.back()">←</button>
      <span class="text-18 font-medium ml-12">付款</span>
    </div>
    
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="loading"></div>
    </div>
    
    <div v-else-if="qrData" class="content flex-1 p-16">
      <div class="card mb-24">
        <div class="flex items-center gap-12 mb-16">
          <div class="avatar text-32">👤</div>
          <div>
            <div class="text-16 font-medium">{{ qrData.payee?.name }}</div>
            <div class="text-12 text-secondary">收款人</div>
          </div>
        </div>
        
        <div v-if="qrData.amount" class="amount-section text-center py-16">
          <div class="text-14 text-secondary">付款金额</div>
          <div class="text-40 font-bold text-primary mt-8">
            ¥{{ qrData.amount.toFixed(2) }}
          </div>
          <div v-if="qrData.description" class="text-14 text-secondary mt-8">
            备注: {{ qrData.description }}
          </div>
        </div>
        
        <div v-else class="form-section py-8">
          <div class="mb-16">
            <label class="text-14 text-secondary mb-8 block">付款金额</label>
            <div class="relative">
              <span class="absolute left-12 top-1/2 -translate-y-1/2 text-24 font-bold">¥</span>
              <input 
                v-model="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="5000"
                placeholder="0.00"
                class="input pl-40 text-24 font-bold"
              />
            </div>
          </div>
          <div class="mb-8">
            <input 
              v-model="description"
              type="text"
              placeholder="添加备注（可选）"
              class="input"
            />
          </div>
        </div>
      </div>
      
      <div class="card mb-24">
        <h4 class="text-14 font-medium mb-12">支付方式</h4>
        <div class="space-y-12">
          <label 
            class="flex items-center gap-12 p-12 border rounded-lg cursor-pointer"
            :class="{ 'border-primary bg-green-50': paymentMethod === 'balance' }"
          >
            <input type="radio" v-model="paymentMethod" value="balance" class="w-16 h-16" />
            <div class="flex-1">
              <div class="text-16 font-medium">💰 零钱</div>
              <div class="text-12 text-secondary">可用: ¥{{ userStore.balance?.toFixed(2) || '0.00' }}</div>
            </div>
            <div v-if="finalAmount > userStore.balance" class="text-12 text-danger">
              余额不足
            </div>
          </label>
          
          <label 
            class="flex items-center gap-12 p-12 border rounded-lg cursor-pointer"
            :class="{ 'border-primary bg-green-50': paymentMethod === 'bank_card' }"
          >
            <input type="radio" v-model="paymentMethod" value="bank_card" class="w-16 h-16" />
            <div class="flex-1">
              <div class="text-16 font-medium">💳 银行卡</div>
              <div class="text-12 text-secondary">储蓄卡支付</div>
            </div>
          </label>
          
          <label 
            class="flex items-center gap-12 p-12 border rounded-lg opacity-50 cursor-not-allowed"
          >
            <input type="radio" disabled class="w-16 h-16" />
            <div class="flex-1">
              <div class="text-16 font-medium">💳 信用卡</div>
              <div class="text-12 text-secondary">暂不支持</div>
            </div>
          </label>
        </div>
      </div>
      
      <button 
        class="btn btn-primary w-full"
        :disabled="!finalAmount || (paymentMethod === 'balance' && finalAmount > userStore.balance)"
        @click="proceedPayment"
      >
        确认付款 ¥{{ finalAmount.toFixed(2) }}
      </button>
    </div>
    
    <div v-if="showPasswordModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="modal-content bg-white rounded-xl p-24 w-320 max-w-full mx-16">
        <h3 class="text-18 font-medium text-center mb-16">请输入支付密码</h3>
        <p class="text-14 text-secondary text-center mb-24">默认密码: 123456</p>
        
        <input 
          v-model="password"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="请输入6位密码"
          class="input text-center text-20 tracking-widest mb-24"
          @keyup.enter="password.length === 6 && confirmPayment()"
        />
        
        <div class="flex gap-12">
          <button class="btn btn-outline flex-1" @click="showPasswordModal = false; password = ''">
            取消
          </button>
          <button 
            class="btn btn-primary flex-1"
            :disabled="paying || password.length < 6"
            @click="confirmPayment"
          >
            <span v-if="paying" class="loading"></span>
            <span v-else>确认</span>
          </button>
        </div>
        
        <button class="w-full text-14 text-primary mt-16 text-center">
          忘记密码？
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-16 {
  padding: 16px;
}

.p-12 {
  padding: 12px;
}

.p-24 {
  padding: 24px;
}

.py-16 {
  padding-top: 16px;
  padding-bottom: 16px;
}

.py-8 {
  padding-top: 8px;
  padding-bottom: 8px;
}

.mb-24 {
  margin-bottom: 24px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mt-8 {
  margin-top: 8px;
}

.mt-16 {
  margin-top: 16px;
}

.ml-12 {
  margin-left: 12px;
}

.navbar {
  border-bottom: 1px solid var(--border);
}

.text-32 {
  font-size: 32px;
}

.text-40 {
  font-size: 40px;
}

.space-y-12 > * + * {
  margin-top: 12px;
}

.w-16 {
  width: 16px;
}

.h-16 {
  height: 16px;
}

.pl-40 {
  padding-left: 40px;
}

.border {
  border: 1px solid var(--border);
}

.rounded-lg {
  border-radius: 8px;
}

.rounded-xl {
  border-radius: 12px;
}

.bg-green-50 {
  background: rgba(7, 193, 96, 0.05);
}

.border-primary {
  border-color: var(--primary);
}

.w-320 {
  width: 320px;
}

.mx-16 {
  margin-left: 16px;
  margin-right: 16px;
}

.tracking-widest {
  letter-spacing: 0.2em;
}
</style>
