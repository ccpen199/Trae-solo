<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { api } from '../api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const transactions = ref([])
const summary = ref(null)
const filterType = ref('all')

const filteredTransactions = computed(() => {
  if (filterType.value === 'all') return transactions.value
  return transactions.value.filter(t => 
    filterType.value === 'paid' ? t.direction === 'out' : t.direction === 'in'
  )
})

async function loadData() {
  loading.value = true
  try {
    const [txns, sum] = await Promise.all([
      api.getTransactions(userStore.currentUser.id),
      api.getTransactionSummary(userStore.currentUser.id)
    ])
    transactions.value = txns
    summary.value = sum
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="transactions h-full flex flex-col">
    <div class="navbar flex items-center justify-between p-16 bg-white">
      <div class="flex items-center gap-12">
        <button class="text-18" @click="router.back()">←</button>
        <span class="text-18 font-medium">交易记录</span>
      </div>
    </div>
    
    <div class="summary-section p-16 bg-primary">
      <div class="text-white">
        <div class="text-14 opacity-80 mb-4">当前余额</div>
        <div class="text-32 font-bold mb-16">¥{{ userStore.balance?.toFixed(2) || '0.00' }}</div>
        
        <div class="flex justify-between">
          <div>
            <div class="text-12 opacity-70">累计收款</div>
            <div class="text-18 font-medium">¥{{ summary?.totalReceived?.toFixed(2) || '0.00' }}</div>
          </div>
          <div class="text-right">
            <div class="text-12 opacity-70">累计付款</div>
            <div class="text-18 font-medium">¥{{ summary?.totalPaid?.toFixed(2) || '0.00' }}</div>
          </div>
        </div>
        
        <div class="flex gap-16 mt-12 text-12 opacity-70">
          <span>成功: {{ summary?.successCount || 0 }} 笔</span>
          <span>总计: {{ summary?.totalCount || 0 }} 笔</span>
        </div>
      </div>
    </div>
    
    <div class="filter-tabs flex bg-white border-b">
      <button 
        v-for="tab in [
          { key: 'all', label: '全部' },
          { key: 'received', label: '收款' },
          { key: 'paid', label: '付款' }
        ]"
        :key="tab.key"
        class="flex-1 py-12 text-14"
        :class="filterType === tab.key ? 'text-primary font-medium border-b-2 border-primary' : 'text-secondary'"
        @click="filterType = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="list-section flex-1 overflow-auto p-16">
      <div v-if="loading" class="flex items-center justify-center py-32">
        <div class="loading"></div>
      </div>
      
      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <div class="icon">📋</div>
        <p>暂无交易记录</p>
      </div>
      
      <div v-else class="space-y-12">
        <div 
          v-for="tx in filteredTransactions" 
          :key="tx.id"
          class="card transaction-item flex items-center gap-12"
        >
          <div class="avatar w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center text-20">
            {{ tx.direction === 'in' ? '💰' : '💸' }}
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center mb-4">
              <span class="text-16 font-medium truncate">
                {{ tx.direction === 'in' ? `来自 ${tx.otherParty?.name || '用户'}` : `付给 ${tx.otherParty?.name || '用户'}` }}
              </span>
              <span 
                class="text-16 font-bold"
                :class="tx.direction === 'in' ? 'text-primary' : 'text-primary'"
              >
                {{ tx.direction === 'in' ? '+' : '-' }}¥{{ tx.amount?.toFixed(2) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-12 text-secondary">{{ formatDate(tx.created_at) }}</span>
              <span 
                class="text-12 px-6 py-1 rounded-full"
                :class="tx.status === 'success' ? 'bg-green-50 text-primary' : 'bg-red-50 text-danger'"
              >
                {{ tx.status === 'success' ? '成功' : '失败' }}
              </span>
            </div>
            <p v-if="tx.description" class="text-12 text-secondary mt-4 truncate">
              {{ tx.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-16 {
  padding: 16px;
}

.py-12 {
  padding-top: 12px;
  padding-bottom: 12px;
}

.mb-4 {
  margin-bottom: 4px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-12 {
  margin-top: 12px;
}

.gap-12 {
  gap: 12px;
}

.gap-16 {
  gap: 16px;
}

.navbar {
  border-bottom: 1px solid var(--border);
}

.bg-primary {
  background: var(--primary);
}

.bg-gray-100 {
  background: #f3f4f6;
}

.bg-green-50 {
  background: rgba(7, 193, 96, 0.1);
}

.bg-red-50 {
  background: rgba(250, 81, 81, 0.1);
}

.border-b {
  border-bottom: 1px solid var(--border);
}

.border-b-2 {
  border-bottom-width: 2px;
}

.border-primary {
  border-color: var(--primary);
}

.w-40 {
  width: 40px;
}

.h-40 {
  height: 40px;
}

.rounded-full {
  border-radius: 9999px;
}

.px-6 {
  padding-left: 6px;
  padding-right: 6px;
}

.py-1 {
  padding-top: 1px;
  padding-bottom: 1px;
}

.text-20 {
  font-size: 20px;
}

.text-32 {
  font-size: 32px;
}

.space-y-12 > * + * {
  margin-top: 12px;
}

.overflow-auto {
  overflow: auto;
}

.min-w-0 {
  min-width: 0;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
