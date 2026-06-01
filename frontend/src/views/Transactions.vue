<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTransactions } from '@/api/account'

const router = useRouter()

const loading = ref(false)
const finished = ref(false)
const transactions = ref<any[]>([])
const activeType = ref('')

const page = ref(1)
const pageSize = 20

const typeOptions = [
  { value: '', label: '全部' },
  { value: 'recharge', label: '充值' },
  { value: 'withdraw', label: '提现' },
  { value: 'invest', label: '投资' }
]

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    recharge: '充值',
    withdraw: '提现',
    invest: '投资'
  }
  return map[type] || type
}

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    recharge: '#07c160',
    withdraw: '#ff4d4f',
    invest: '#1989fa'
  }
  return map[type] || '#333'
}

const fetchTransactions = async (refresh = false) => {
  if (refresh) {
    page.value = 1
    finished.value = false
    transactions.value = []
  }

  if (finished.value || loading.value) return

  loading.value = true
  try {
    const res = await getTransactions({
      type: activeType.value,
      page: page.value,
      pageSize
    })
    const list = res.data?.list || []
    transactions.value = [...transactions.value, ...list]
    
    if (list.length < pageSize) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (err) {
    console.error('Get transactions error:', err)
  } finally {
    loading.value = false
  }
}

const handleTypeChange = (value: string) => {
  activeType.value = value
  fetchTransactions(true)
}

onMounted(() => {
  fetchTransactions()
})
</script>

<template>
  <div class="transactions-page">
    <van-nav-bar title="交易记录" left-arrow @click-left="router.back()" />

    <van-tabs v-model:active="activeType" @change="handleTypeChange">
      <van-tab v-for="item in typeOptions" :key="item.value" :title="item.label" />
    </van-tabs>

    <van-pull-refresh v-model="loading" @refresh="fetchTransactions(true)">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="fetchTransactions"
      >
        <van-cell-group v-if="transactions.length > 0" inset>
          <van-cell v-for="item in transactions" :key="item.id">
            <template #title>
              <span :style="{ color: getTypeColor(item.type) }">{{ getTypeText(item.type) }}</span>
            </template>
            <template #value>
              <span :style="{ color: item.type === 'withdraw' ? '#ff4d4f' : '#07c160' }">
                {{ item.type === 'withdraw' ? '-' : '+' }}{{ item.amount.toFixed(2) }}
              </span>
            </template>
            <template #label>{{ item.description || '' }}</template>
            <template #extra>
              <div class="extra-info">
                <div class="time">{{ new Date(item.created_at).toLocaleString() }}</div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>

        <van-empty v-else-if="!loading" description="暂无交易记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.transactions-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.extra-info {
  text-align: right;
}

.time {
  font-size: 12px;
  color: #999;
}
</style>
