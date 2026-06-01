<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRepaymentPlans } from '@/api/account'

const router = useRouter()

const loading = ref(false)
const plans = ref<any[]>([])

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待回款',
    completed: '已回款'
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: '#ff976a',
    completed: '#07c160'
  }
  return map[status] || '#999'
}

const fetchPlans = async () => {
  loading.value = true
  try {
    const res = await getRepaymentPlans()
    plans.value = res.data || []
  } catch (err) {
    console.error('Get repayment plans error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="repayment-plans-page">
    <van-nav-bar title="回款计划" left-arrow @click-left="router.back()" />

    <van-pull-refresh v-model="loading" @refresh="fetchPlans">
      <div v-if="plans.length > 0" class="plans-list">
        <van-cell-group v-for="item in plans" :key="item.id" inset class="plan-item">
          <van-cell center>
            <template #title>
              <div class="project-title">{{ item.title }}</div>
              <div class="plan-date">
                <van-icon name="clock-o" size="12" />
                <span>{{ item.plan_date }}</span>
              </div>
            </template>
            <template #value>
              <div class="amount-info">
                <div class="total">¥{{ item.total.toFixed(2) }}</div>
                <div class="detail">
                  本金{{ item.amount.toFixed(2) }} + 利息{{ item.interest.toFixed(2) }}
                </div>
                <div class="status" :style="{ color: getStatusColor(item.status) }">
                  {{ getStatusText(item.status) }}
                </div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <van-empty v-else-if="!loading" description="暂无回款计划" />
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.repayment-plans-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.plans-list {
  padding: 12px 0;
}

.plan-item {
  margin-bottom: 12px;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.plan-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.amount-info {
  text-align: right;
}

.total {
  font-size: 18px;
  font-weight: 700;
  color: #ff4d4f;
  margin-bottom: 4px;
}

.detail {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.status {
  font-size: 12px;
}
</style>
