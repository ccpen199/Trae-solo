<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { api } from '../api'
import { $message } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const cardNumber = ref('')
const cardHolder = ref('')
const identifiedBank = ref(null)

async function identifyBank() {
  if (cardNumber.value.replace(/\s/g, '').length < 16) {
    return
  }
  
  try {
    const data = await api.identifyBankCard(cardNumber.value.replace(/\s/g, ''))
    identifiedBank.value = data
  } catch (e) {}
}

async function bindCard() {
  const cleanNumber = cardNumber.value.replace(/\s/g, '')
  if (cleanNumber.length < 16) {
    $message.show('请输入正确的银行卡号')
    return
  }
  
  if (!cardHolder.value.trim()) {
    $message.show('请输入持卡人姓名')
    return
  }
  
  if (identifiedBank.value?.type === 'credit') {
    $message.show('暂不支持绑定信用卡')
    return
  }
  
  loading.value = true
  try {
    await api.bindBankCard({
      userId: userStore.currentUser.id,
      cardNumber: cleanNumber,
      cardHolder: cardHolder.value.trim()
    })
    
    $message.show('绑卡成功', 'success')
    router.back()
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function formatCardNumber() {
  const cleaned = cardNumber.value.replace(/\D/g, '')
  cardNumber.value = cleaned.replace(/(.{4})/g, '$1 ').trim()
  identifyBank()
}
</script>

<template>
  <div class="bind-card h-full flex flex-col">
    <div class="navbar flex items-center p-16 bg-white">
      <button class="text-18" @click="router.back()">←</button>
      <span class="text-18 font-medium ml-12">添加银行卡</span>
    </div>
    
    <div class="content flex-1 p-16">
      <div class="card mb-24">
        <div class="mb-16">
          <label class="text-14 text-secondary mb-8 block">银行卡号</label>
          <input 
            v-model="cardNumber"
            type="text"
            inputmode="numeric"
            maxlength="23"
            placeholder="请输入银行卡号"
            class="input text-18 tracking-wider"
            @input="formatCardNumber"
          />
          <div v-if="identifiedBank" class="mt-8 flex items-center gap-8 text-14">
            <span class="text-secondary">银行识别:</span>
            <span class="text-primary font-medium">{{ identifiedBank.bank }}</span>
            <span 
              class="px-8 py-2 rounded-full text-12"
              :class="identifiedBank.type === 'debit' ? 'bg-green-50 text-primary' : 'bg-red-50 text-danger'"
            >
              {{ identifiedBank.type === 'debit' ? '储蓄卡' : '信用卡' }}
            </span>
          </div>
        </div>
        
        <div class="mb-16">
          <label class="text-14 text-secondary mb-8 block">持卡人姓名</label>
          <input 
            v-model="cardHolder"
            type="text"
            placeholder="请输入持卡人姓名"
            class="input"
          />
        </div>
        
        <div class="text-12 text-secondary">
          <p class="mb-4">💡 测试卡号（前6位匹配BIN规则）:</p>
          <ul class="space-y-2 ml-16">
            <li>• 622202 xxxxxxxxxx (工商银行 储蓄卡)</li>
            <li>• 622700 xxxxxxxxxx (建设银行 储蓄卡)</li>
            <li>• 622848 xxxxxxxxxx (农业银行 储蓄卡)</li>
            <li>• 436742 xxxxxxxxxx (建设银行 信用卡 - 不支持)</li>
          </ul>
        </div>
      </div>
      
      <div class="card">
        <h4 class="text-14 font-medium mb-12">温馨提示</h4>
        <ul class="text-12 text-secondary space-y-8">
          <li>• 仅支持绑定本人名下的储蓄卡（借记卡）</li>
          <li>• 暂不支持信用卡、准贷记卡</li>
          <li>• 请确保卡号输入正确，避免转账失败</li>
          <li>• 绑卡后可选择银行卡作为支付方式</li>
        </ul>
      </div>
      
      <button 
        class="btn btn-primary w-full mt-24"
        :disabled="loading || cardNumber.replace(/\s/g, '').length < 16"
        @click="bindCard"
      >
        <span v-if="loading" class="loading"></span>
        <span v-else>确认绑定</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.p-16 {
  padding: 16px;
}

.mb-24 {
  margin-bottom: 24px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 4px;
}

.mt-8 {
  margin-top: 8px;
}

.mt-24 {
  margin-top: 24px;
}

.ml-12 {
  margin-left: 12px;
}

.ml-16 {
  margin-left: 16px;
}

.navbar {
  border-bottom: 1px solid var(--border);
}

.gap-8 {
  gap: 8px;
}

.px-8 {
  padding-left: 8px;
  padding-right: 8px;
}

.py-2 {
  padding-top: 2px;
  padding-bottom: 2px;
}

.rounded-full {
  border-radius: 9999px;
}

.bg-green-50 {
  background: rgba(7, 193, 96, 0.1);
}

.bg-red-50 {
  background: rgba(250, 81, 81, 0.1);
}

.space-y-8 > * + * {
  margin-top: 8px;
}

.space-y-2 > * + * {
  margin-top: 2px;
}
</style>
