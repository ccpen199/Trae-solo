<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="profile-header">
            <el-avatar :size="80" icon="User" />
            <div class="profile-info">
              <h3>{{ userStore.user?.nickname || '用户' }}</h3>
              <p>{{ userStore.user?.phone }}</p>
              <el-tag :type="roleTagType" size="small">
                {{ roleText }}
              </el-tag>
            </div>
          </div>
          <el-divider />
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">{{ formatAmount(virtualAccount?.totalEarnings || 0) }}</div>
              <div class="stat-label">累计收益</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatAmount(virtualAccount?.availableBalance || 0) }}</div>
              <div class="stat-label">可提现</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatAmount(virtualAccount?.frozenBalance || 0) }}</div>
              <div class="stat-label">冻结中</div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px" v-if="userStore.user?.referralCode">
          <template #header>
            <span>我的推广</span>
          </template>
          <div class="referral-info">
            <div class="referral-code-info">
              <span class="label">推荐码</span>
              <span class="value">{{ userStore.user.referralCode }}</span>
              <el-button type="primary" size="small" link @click="copyReferralCode">
                复制
              </el-button>
            </div>
            <el-divider />
            <div class="referral-stats">
              <div class="stat-item">
                <div class="stat-value">{{ downlineStats.direct }}</div>
                <div class="stat-label">直接推荐</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ downlineStats.indirect }}</div>
                <div class="stat-label">间接推荐</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户ID">
              {{ userStore.user?.id }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ userStore.user?.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="昵称">
              {{ userStore.user?.nickname }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              {{ roleText }}
            </el-descriptions-item>
            <el-descriptions-item label="分销员ID" v-if="userStore.user?.distributorId">
              {{ userStore.user.distributorId }}
            </el-descriptions-item>
            <el-descriptions-item label="加入时间" v-if="userStore.user?.joinDate">
              {{ formatDate(userStore.user.joinDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="分销状态" v-if="userStore.user?.distributorStatus">
              <el-tag :type="distributorStatusTagType">
                {{ distributorStatusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDate(userStore.user?.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px" v-if="!userStore.isDistributor">
          <template #header>
            <span>成为分销员</span>
          </template>
          <div class="apply-section">
            <p>申请成为分销员，即可享受推广佣金收益！</p>
            <el-button type="primary" :loading="applyLoading" @click="applyDistributor">
              立即申请
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const applyLoading = ref(false)
const downlineStats = ref({ direct: 0, indirect: 0 })

const virtualAccount = computed(() => userStore.user?.virtualAccount)

const roleText = computed(() => {
  const role = userStore.user?.role
  const map: Record<string, string> = {
    ADMIN: '管理员',
    FINANCE: '财务',
    OPERATOR: '运营',
    DISTRIBUTOR: '分销员',
    END_USER: '普通用户',
  }
  return map[role || ''] || role
})

const roleTagType = computed(() => {
  const role = userStore.user?.role
  const map: Record<string, string> = {
    ADMIN: 'danger',
    FINANCE: 'warning',
    OPERATOR: 'success',
    DISTRIBUTOR: 'primary',
    END_USER: 'info',
  }
  return map[role || ''] || 'info'
})

const distributorStatusText = computed(() => {
  const status = userStore.user?.distributorStatus
  const map: Record<string, string> = {
    ACTIVE: '已激活',
    SUSPENDED: '已暂停',
    TERMINATED: '已终止',
  }
  return map[status || ''] || status
})

const distributorStatusTagType = computed(() => {
  const status = userStore.user?.distributorStatus
  const map: Record<string, string> = {
    ACTIVE: 'success',
    SUSPENDED: 'warning',
    TERMINATED: 'danger',
  }
  return map[status || ''] || 'info'
})

function formatAmount(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`
}

function formatDate(date: string | Date | undefined) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

function copyReferralCode() {
  if (userStore.user?.referralCode) {
    navigator.clipboard.writeText(userStore.user.referralCode)
    ElMessage.success('推荐码已复制')
  }
}

async function applyDistributor() {
  applyLoading.value = true
  try {
    const result = await userStore.applyDistributor()
    if (result.success) {
      ElMessage.success('申请成功，您已成为分销员！')
    }
  } catch (e) {
    console.error('申请失败', e)
  } finally {
    applyLoading.value = false
  }
}

onMounted(() => {
  userStore.fetchProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
}

.profile-info {
  margin-left: 16px;
}

.profile-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.profile-info p {
  margin: 0 0 8px 0;
  color: #909399;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item .stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #909399;
}

.referral-info {
  text-align: center;
}

.referral-code-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.referral-code-info .label {
  color: #909399;
}

.referral-code-info .value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  letter-spacing: 2px;
}

.referral-stats {
  display: flex;
  justify-content: space-around;
}

.apply-section {
  text-align: center;
  padding: 20px;
}

.apply-section p {
  color: #909399;
  margin-bottom: 16px;
}
</style>
