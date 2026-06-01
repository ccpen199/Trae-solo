<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { api } from '../api'
import { $message } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const qrImage = ref('')
const qrId = ref('')
const showSetAmount = ref(false)
const amount = ref('')
const description = ref('')
const currentAmount = ref(null)

async function generateQRCode(withAmount = false) {
  if (withAmount) {
    const num = parseFloat(amount.value)
    if (isNaN(num) || num < 0.01 || num > 5000) {
      $message.show('金额必须在 0.01 - 5000 元之间')
      return
    }
  }
  
  loading.value = true
  try {
    document.documentElement.style.filter = 'brightness(1.5)'
    
    const data = await api.generateQRCode({
      userId: userStore.currentUser.id,
      amount: withAmount ? parseFloat(amount.value) : null,
      description: description.value
    })
    
    qrImage.value = data.qrImage
    qrId.value = data.id
    currentAmount.value = data.amount
    showSetAmount.value = false
    
    $message.show('二维码已生成', 'success')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    setTimeout(() => {
      document.documentElement.style.filter = ''
    }, 3000)
  }
}

function reset() {
  amount.value = ''
  description.value = ''
  currentAmount.value = null
  qrImage.value = ''
  qrId.value = ''
}

function goToScan() {
  router.push('/scan')
}

onMounted(async () => {
  try {
    const latest = await api.getLatestQRCode(userStore.currentUser.id)
    if (latest) {
      qrId.value = latest.id
      currentAmount.value = latest.amount
    }
  } catch (e) {}
})
</script>

<template>
  <div class="receive h-full flex flex-col">
    <div class="navbar flex items-center justify-between p-16 bg-white">
      <div class="flex items-center gap-12">
        <span class="text-18 font-medium">收钱</span>
      </div>
      <div class="flex items-center gap-16">
        <button class="text-14 text-secondary" @click="goToScan">
          🔍 扫一扫
        </button>
        <button class="text-14 text-secondary" @click="() => router.push('/transactions')">
          📊 账单
        </button>
      </div>
    </div>
    
    <div class="content flex-1 flex flex-col items-center p-24">
      <div v-if="qrImage" class="qr-container card mb-24">
        <div class="text-center mb-16">
          <div class="text-14 text-secondary">向 {{ userStore.currentUser?.name }} 付款</div>
          <div v-if="currentAmount" class="text-32 font-bold text-primary mt-8">
            ¥{{ currentAmount.toFixed(2) }}
          </div>
        </div>
        <img :src="qrImage" class="qr-img w-full" alt="收款二维码" />
        <div class="text-12 text-secondary text-center mt-12">
          有效期 30 分钟
        </div>
      </div>
      
      <div v-else class="empty-qr card flex flex-col items-center justify-center mb-24">
        <div class="text-48 mb-16">📱</div>
        <div class="text-16 text-secondary">点击下方生成收款二维码</div>
      </div>
      
      <div class="w-full max-w-300">
        <div v-if="showSetAmount" class="card mb-16">
          <h4 class="text-14 font-medium mb-12">设置金额</h4>
          <input 
            v-model="amount"
            type="number"
            step="0.01"
            min="0.01"
            max="5000"
            placeholder="输入金额 (0.01 - 5000)"
            class="input mb-12"
          />
          <input 
            v-model="description"
            type="text"
            placeholder="收钱备注（可选）"
            class="input mb-16"
          />
          <div class="flex gap-12">
            <button class="btn btn-outline flex-1" @click="showSetAmount = false">
              取消
            </button>
            <button 
              class="btn btn-primary flex-1"
              :disabled="loading || !amount"
              @click="generateQRCode(true)"
            >
              <span v-if="loading" class="loading"></span>
              <span v-else>生成</span>
            </button>
          </div>
        </div>
        
        <div v-else class="flex flex-col gap-12">
          <button 
            class="btn btn-primary w-full"
            :disabled="loading"
            @click="generateQRCode(false)"
          >
            <span v-if="loading" class="loading"></span>
            <span v-else>生成收款码</span>
          </button>
          
          <button 
            class="btn btn-outline w-full"
            @click="showSetAmount = true"
          >
            设置金额收钱
          </button>
          
          <button 
            v-if="qrImage"
            class="btn btn-outline w-full"
            @click="reset"
          >
            重置
          </button>
        </div>
      </div>
      
      <div class="mt-24 text-center">
        <div class="text-14 text-secondary">当前余额</div>
        <div class="text-24 font-bold text-primary mt-4">
          ¥{{ userStore.balance?.toFixed(2) || '0.00' }}
        </div>
      </div>
    </div>
    
    <div class="tab-bar flex bg-white border-t">
      <button 
        class="flex-1 flex flex-col items-center p-12 active"
        @click="() => router.push('/receive')"
      >
        <span class="text-20">💰</span>
        <span class="text-12 text-primary mt-4">收钱</span>
      </button>
      <button 
        class="flex-1 flex flex-col items-center p-12"
        @click="() => router.push('/bank-cards')"
      >
        <span class="text-20">💳</span>
        <span class="text-12 text-secondary mt-4">银行卡</span>
      </button>
      <button 
        class="flex-1 flex flex-col items-center p-12"
        @click="() => router.push('/profile')"
      >
        <span class="text-20">👤</span>
        <span class="text-12 text-secondary mt-4">我的</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.p-16 {
  padding: 16px;
}

.p-24 {
  padding: 24px;
}

.p-12 {
  padding: 12px;
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

.mt-8 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-24 {
  margin-top: 24px;
}

.navbar {
  border-bottom: 1px solid var(--border);
}

.tab-bar {
  border-top-color: var(--border);
}

.tab-bar button.active {
  color: var(--primary);
}

.max-w-300 {
  max-width: 300px;
}

.qr-img {
  max-width: 250px;
}

.empty-qr {
  width: 280px;
  height: 280px;
  background: #fafafa;
  border: 2px dashed var(--border);
}

.text-48 {
  font-size: 48px;
}

.text-20 {
  font-size: 20px;
}
</style>
