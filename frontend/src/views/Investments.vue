<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getInvestments } from '@/api/account'

const router = useRouter()

const loading = ref(false)
const finished = ref(false)
const investments = ref<any[]>([])
const activeStatus = ref('')

const page = ref(1)
const pageSize = 20

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'investing', label: '持有中' },
  { value: 'completed', label: '已完成' }
]

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    investing: '持有中',
    completed: '已完成'
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    investing: '#1989fa',
    completed: '#07c160'
  }
  return map[status] || '#999'
}

const fetchInvestments = async (refresh = false) => {
  if (refresh) {
    page.value = 1
    finished.value = false
    investments.value = []
  }

  if (finished.value || loading.value) return

  loading.value = true
  try {
    const res = await getInvestments({
      status: activeStatus.value,
      page: page.value,
      pageSize
    })
    const list = res.data?.list || []
    investments.value = [...investments.value, ...list]
    
    if (list.length < pageSize) {
      finished.value = true
    } else {
      page.value++
    }
  } catch (err) {
    console.error('Get investments error:', err)
  } finally {
    loading.value = false
  }
}

const handleStatusChange = (value: string) => {
  activeStatus.value = value
  fetchInvestments(true)
}

onMounted(() => {
  fetchInvestments()
})
</script>

<template>
  <div class="investments-page">
    <van-nav-bar title="我的投资" left-arrow @click-left="router.back()" />

    <van-tabs v-model:active="activeStatus" @change="handleStatusChange">
      <van-tab v-for="item in statusOptions" :key="item.value" :title="item.label" />
    </van-tabs>

    <van-pull-refresh v-model="loading" @refresh="fetchInvestments(true)">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="fetchInvestments"
      >
        <div v-if="investments.length > 0" class="investments-list">
          <van-cell-group v-for="item in investments" :key="item.id" inset class="investment-item">
            <van-cell center>
              <template #title>
                <div class="project-title">{{ item.title }}</div>
                <div class="project-info">
                  <span class="rate">{{ item.interest_rate }}%</span>
                  <span class="term">{{ item.term }}{{ item.term_unit === 'month' ? '个月' : '天' }}</span>
                </div>
              </template>
              <template #value>
                <div class="amount-info">
                  <div class="amount">¥{{ item.amount.toFixed(2) }}</div>
                  <div class="status" :style="{ color: getStatusColor(item.status) }">{{ getStatusText(item.status) }}</div>
                </div>
              </template>
            </van-cell>
          </van-cell-group>
        </div>

        <van-empty v-else-if="!loading" description="暂无投资记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.investments-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.investments-list {
  padding: 12px 0;
}

.investment-item {
  margin-bottom: 12px;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.project-info {
  display: flex;
  gap: 16px;
}

.rate {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
}

.term {
  font-size: 14px;
  color: #666;
}

.amount-info {
  text-align: right;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.status {
  font-size: 12px;
}
</style>
