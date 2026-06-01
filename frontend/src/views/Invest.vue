<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getProjectDetail, invest } from '@/api/project'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const project = ref<any>(null)
const amount = ref('')
const agreed = ref(false)

const fetchProject = async () => {
  const id = route.params.id
  if (!id) return

  loading.value = true
  try {
    const res = await getProjectDetail(Number(id))
    project.value = res.data
    amount.value = String(res.data.min_invest)
  } catch (err) {
    console.error('Get project error:', err)
  } finally {
    loading.value = false
  }
}

const expectedEarnings = computed(() => {
  if (!project.value || !amount.value) return 0
  const termDays = project.value.term_unit === 'day' ? project.value.term : project.value.term * 30
  return (Number(amount.value) * (project.value.interest_rate / 100) * (termDays / 365)).toFixed(2)
})

const handleInvest = async () => {
  if (!amount.value || Number(amount.value) <= 0) {
    return showToast({ message: '请输入投资金额', type: 'fail' })
  }
  if (Number(amount.value) < project.value.min_invest) {
    return showToast({ message: `最低投资${project.value.min_invest}元`, type: 'fail' })
  }
  if (Number(amount.value) > Number(userStore.user?.balance || 0)) {
    return showToast({ message: '余额不足，请先充值', type: 'fail' })
  }
  if (Number(amount.value) > Number(project.value.remaining_amount)) {
    return showToast({ message: '项目剩余金额不足', type: 'fail' })
  }
  if (!agreed.value) {
    return showToast({ message: '请先阅读并同意投资服务协议和风险告知书', type: 'fail' })
  }

  submitting.value = true
  try {
    await invest({
      projectId: project.value.id,
      amount: Number(amount.value)
    })
    
    showToast({ message: '投资成功', type: 'success' })
    
    if (userStore.user) {
      userStore.user.balance = Number(userStore.user.balance) - Number(amount.value)
      userStore.setUser({ ...userStore.user })
    }
    
    setTimeout(() => {
      router.push('/mine')
    }, 1000)
  } catch (err) {
    console.error('Invest error:', err)
  } finally {
    submitting.value = false
  }
}

const goToRecharge = () => {
  router.push('/recharge')
}

onMounted(() => {
  fetchProject()
})
</script>

<template>
  <div class="invest-page">
    <van-nav-bar title="投资确认" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading" />

    <div v-if="project" class="content">
      <div class="project-info">
        <div class="project-title">{{ project.title }}</div>
        <div class="project-rate">
          <span class="rate-value">{{ project.interest_rate }}</span>
          <span class="rate-unit">%</span>
          <span class="rate-label">预期年化</span>
        </div>
      </div>

      <div class="amount-section">
        <div class="section-title">投资金额</div>
        <van-field
          v-model="amount"
          type="number"
          placeholder="请输入投资金额"
          class="amount-input"
        >
          <template #right-icon>
            <span class="currency">元</span>
          </template>
        </van-field>
        <div class="amount-tips">
          <span>最低{{ project.min_invest }}元起投</span>
          <span @click="amount = String(userStore.user?.balance || 0)" class="use-all">全部投入</span>
        </div>
      </div>

      <div class="earnings-section">
        <div class="section-title">预期收益</div>
        <div class="earnings-value">¥{{ expectedEarnings }}</div>
        <div class="earnings-detail">
          <span>投资期限：{{ project.term }}{{ project.term_unit === 'month' ? '个月' : '天' }}</span>
          <span>还款方式：到期还本付息</span>
        </div>
      </div>

      <div class="balance-section">
        <div class="balance-info">
          <span class="balance-label">可用余额</span>
          <span class="balance-value">¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</span>
        </div>
        <van-button size="small" type="primary" plain @click="goToRecharge">充值</van-button>
      </div>

      <div class="agreement-section">
        <van-checkbox v-model="agreed" shape="square">
          我已阅读并同意《投资服务协议》和《风险告知书》
        </van-checkbox>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="total-info">
        <span class="total-label">投资金额：</span>
        <span class="total-value">¥{{ amount || '0.00' }}</span>
      </div>
      <van-button
        type="primary"
        size="large"
        class="submit-btn"
        :loading="submitting"
        :disabled="!amount || Number(amount) <= 0 || !agreed"
        @click="handleInvest"
      >
        确认投资
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.invest-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.project-info {
  background: white;
  padding: 20px 16px;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.project-rate {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.rate-value {
  font-size: 32px;
  font-weight: 700;
  color: #ff4d4f;
}

.rate-unit {
  font-size: 16px;
  color: #ff4d4f;
}

.rate-label {
  font-size: 14px;
  color: #999;
}

.amount-section,
.earnings-section,
.balance-section {
  background: white;
  padding: 16px;
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

.amount-tips {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.use-all {
  color: #1989fa;
  cursor: pointer;
}

.earnings-value {
  font-size: 28px;
  font-weight: 700;
  color: #ff4d4f;
  margin-bottom: 12px;
}

.earnings-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.balance-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.balance-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.agreement-section {
  background: white;
  padding: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-value {
  font-size: 20px;
  font-weight: 600;
  color: #ff4d4f;
}

.submit-btn {
  width: 140px;
}
</style>
