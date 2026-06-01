<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { api } from '../api'
import { $message } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()

const cards = ref([])
const loading = ref(false)

async function loadCards() {
  try {
    const data = await api.getBankCards(userStore.currentUser.id)
    cards.value = data
  } catch (e) {}
}

async function unbindCard(cardId) {
  if (!confirm('确定要解绑这张银行卡吗？')) return
  
  try {
    await api.unbindBankCard(cardId)
    $message.show('解绑成功', 'success')
    loadCards()
  } catch (e) {}
}

onMounted(() => {
  loadCards()
})
</script>

<template>
  <div class="bank-cards h-full flex flex-col">
    <div class="navbar flex items-center justify-between p-16 bg-white">
      <div class="flex items-center gap-12">
        <button class="text-18" @click="router.back()">←</button>
        <span class="text-18 font-medium">银行卡</span>
      </div>
      <button class="text-primary text-14" @click="router.push('/bank-cards/bind')">
        + 添加
      </button>
    </div>
    
    <div class="content flex-1 p-16 overflow-auto">
      <div v-if="cards.length === 0" class="empty-state">
        <div class="icon">💳</div>
        <p>暂无绑定的银行卡</p>
        <button class="btn btn-primary mt-16" @click="router.push('/bank-cards/bind')">
          添加银行卡
        </button>
      </div>
      
      <div v-else class="space-y-16">
        <div 
          v-for="card in cards" 
          :key="card.id"
          class="card bank-card"
        >
          <div class="flex items-start justify-between mb-12">
            <div class="flex items-center gap-12">
              <div class="card-icon w-40 h-40 bg-blue-500 rounded-lg flex items-center justify-center text-white text-20">
                🏦
              </div>
              <div>
                <div class="text-16 font-medium">{{ card.bank_name }}</div>
                <div class="text-14 text-secondary">
                  {{ card.card_type === 'debit' ? '储蓄卡' : '信用卡' }}
                </div>
              </div>
            </div>
            <span class="text-12 px-8 py-4 bg-green-50 text-primary rounded-full">
              已绑定
            </span>
          </div>
          
          <div class="card-number text-18 tracking-widest mb-16">
            **** **** **** {{ card.card_number?.slice(-4) || '0000' }}
          </div>
          
          <div class="flex justify-between items-center">
            <div class="text-14 text-secondary">
              持卡人: {{ card.card_holder || '未知' }}
            </div>
            <button 
              class="text-14 text-danger"
              @click="unbindCard(card.id)"
            >
              解绑
            </button>
          </div>
        </div>
      </div>
      
      <div class="card mt-24">
        <h4 class="text-14 font-medium mb-12">安全提示</h4>
        <ul class="text-12 text-secondary space-y-8">
          <li>• 仅支持绑定储蓄卡，暂不支持信用卡</li>
          <li>• 请确保银行卡为本人实名账户</li>
          <li>• 资金往来请务必确认对方身份</li>
        </ul>
      </div>
    </div>
    
    <div class="tab-bar flex bg-white border-t">
      <button 
        class="flex-1 flex flex-col items-center p-12"
        @click="() => router.push('/receive')"
      >
        <span class="text-20">💰</span>
        <span class="text-12 text-secondary mt-4">收钱</span>
      </button>
      <button 
        class="flex-1 flex flex-col items-center p-12 active"
        @click="() => router.push('/bank-cards')"
      >
        <span class="text-20">💳</span>
        <span class="text-12 text-primary mt-4">银行卡</span>
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

.p-12 {
  padding: 12px;
}

.p-8 {
  padding: 8px;
}

.p-4 {
  padding: 4px;
}

.py-4 {
  padding-top: 4px;
  padding-bottom: 4px;
}

.px-8 {
  padding-left: 8px;
  padding-right: 8px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-24 {
  margin-top: 24px;
}

.ml-12 {
  margin-left: 12px;
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

.text-20 {
  font-size: 20px;
}

.space-y-16 > * + * {
  margin-top: 16px;
}

.space-y-8 > * + * {
  margin-top: 8px;
}

.w-40 {
  width: 40px;
}

.h-40 {
  height: 40px;
}

.bg-blue-500 {
  background: #3b82f6;
}

.bg-green-50 {
  background: rgba(7, 193, 96, 0.1);
}

.rounded-lg {
  border-radius: 8px;
}

.rounded-full {
  border-radius: 9999px;
}

.bank-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.bank-card .text-secondary {
  color: rgba(255, 255, 255, 0.7);
}

.overflow-auto {
  overflow: auto;
}
</style>
