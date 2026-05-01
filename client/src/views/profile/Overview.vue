<template>
  <div class="profile-overview">
    <el-card class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80" :src="userStore.user?.profile?.avatar">
          {{ userStore.user?.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.user?.profile?.nickname || userStore.user?.username }}</h2>
          <p class="email">{{ userStore.user?.email }}</p>
          <div class="badges">
            <el-tag :type="getCreditTagType" size="large">
              {{ getCreditLevelName }}
            </el-tag>
            <el-tag type="info" size="large">
              {{ getRoleName }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon questions">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStore.user?.metadata?.questionCount || 0 }}</div>
            <div class="stat-label">提问数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon answers">
            <el-icon :size="24"><EditPen /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStore.user?.metadata?.answerCount || 0 }}</div>
            <div class="stat-label">回答数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon accepted">
            <el-icon :size="24"><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStore.user?.metadata?.acceptedAnswerCount || 0 }}</div>
            <div class="stat-label">采纳数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon credit">
            <el-icon :size="24"><Trophy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStore.user?.creditScore || 0 }}</div>
            <div class="stat-label">信用分</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>信用概览</span>
              <router-link to="/profile/credit">
                <el-button type="primary" text size="small">查看详情</el-button>
              </router-link>
            </div>
          </template>
          <div class="credit-overview">
            <div class="credit-ring">
              <el-progress
                type="dashboard"
                :percentage="creditPercentage"
                :color="creditColor"
                :width="140"
              >
                <span class="credit-score">{{ userStore.user?.creditScore || 0 }}</span>
                <span class="credit-unit">分</span>
              </el-progress>
            </div>
            <div class="credit-info">
              <div class="info-item">
                <span class="label">当前等级</span>
                <span class="value">
                  <el-tag :type="getCreditTagType">{{ getCreditLevelName }}</el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="label">下一等级</span>
                <span class="value">{{ nextLevelName }}</span>
              </div>
              <div class="info-item">
                <span class="label">升级进度</span>
                <span class="value">{{ progressToNextLevel }}</span>
              </div>
              <div class="info-item">
                <span class="label">活跃权重</span>
                <span class="value highlight">{{ userStore.user?.activityWeight || 1.0 }}x</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>资产概览</span>
              <router-link to="/profile/wallet">
                <el-button type="primary" text size="small">查看详情</el-button>
              </router-link>
            </div>
          </template>
          <div class="wallet-overview">
            <div class="asset-item">
              <div class="asset-icon money">
                <el-icon :size="28"><Wallet /></el-icon>
              </div>
              <div class="asset-info">
                <div class="asset-value">¥{{ (userStore.user?.balance || 0).toFixed(2) }}</div>
                <div class="asset-label">账户余额</div>
              </div>
            </div>
            <div class="asset-item">
              <div class="asset-icon points">
                <el-icon :size="28"><Coin /></el-icon>
              </div>
              <div class="asset-info">
                <div class="asset-value">{{ userStore.user?.points || 0 }}</div>
                <div class="asset-label">积分</div>
              </div>
            </div>
            <div class="wallet-actions">
              <router-link to="/ask">
                <el-button type="primary">
                  <el-icon><Edit /></el-icon>
                  提问
                </el-button>
              </router-link>
              <router-link to="/profile/wallet">
                <el-button>
                  <el-icon><Money /></el-icon>
                  提现
                </el-button>
              </router-link>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="expertise-card">
      <template #header>
        <div class="card-header">
          <span>专业领域</span>
          <el-button type="primary" text size="small" @click="showExpertiseDialog = true">
            编辑
          </el-button>
        </div>
      </template>
      <div class="expertise-tags">
        <el-tag
          v-for="tag in (userStore.user?.profile?.expertise || [])"
          :key="tag"
          size="large"
          effect="light"
        >
          {{ tag }}
        </el-tag>
        <el-empty v-if="!(userStore.user?.profile?.expertise?.length)" description="还没有设置专业领域" />
      </div>
    </el-card>

    <el-dialog v-model="showExpertiseDialog" title="编辑专业领域" width="500px">
      <el-select
        v-model="newExpertise"
        multiple
        filterable
        allow-create
        placeholder="选择或添加专业领域"
        size="large"
        style="width: 100%"
      >
        <el-option
          v-for="tag in availableTags"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
      <template #footer>
        <el-button @click="showExpertiseDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateExpertise">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const showExpertiseDialog = ref(false)
const newExpertise = ref([])

const availableTags = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
  'React', 'Vue', 'Angular', 'Node.js', 'Next.js', 'Nuxt.js',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', '阿里云', '微服务', '分布式系统',
  '机器学习', '深度学习', '数据分析', '数据科学',
  '前端', '后端', '全栈', '架构', '安全', '测试', '运维'
]

watch(showExpertiseDialog, (val) => {
  if (val) {
    newExpertise.value = [...(userStore.user?.profile?.expertise || [])]
  }
})

const getCreditTagType = computed(() => {
  const level = userStore.user?.creditLevel
  const typeMap = {
    bronze: 'info',
    silver: '',
    gold: 'warning',
    platinum: 'primary',
    diamond: 'success'
  }
  return typeMap[level] || 'info'
})

const getCreditLevelName = computed(() => {
  const level = userStore.user?.creditLevel
  const nameMap = {
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
    diamond: '钻石'
  }
  return nameMap[level] || '青铜'
})

const getRoleName = computed(() => {
  const role = userStore.user?.role
  const roleMap = {
    questioner: '提问者',
    answerer: '回答者',
    expert: '行业专家',
    editor: '知识编辑',
    admin: '管理员'
  }
  return roleMap[role] || role
})

const creditPercentage = computed(() => {
  const score = userStore.user?.creditScore || 0
  return Math.min((score / 1000) * 100, 100)
})

const creditColor = computed(() => {
  const score = userStore.user?.creditScore || 0
  if (score >= 800) return '#67c23a'
  if (score >= 600) return '#409eff'
  if (score >= 400) return '#e6a23c'
  if (score >= 200) return '#909399'
  return '#f56c6c'
})

const nextLevelName = computed(() => {
  const level = userStore.user?.creditLevel
  const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  const currentIndex = levelOrder.indexOf(level)
  if (currentIndex < levelOrder.length - 1) {
    const nextMap = { bronze: '白银', silver: '黄金', gold: '铂金', platinum: '钻石' }
    return nextMap[level]
  }
  return '已达最高等级'
})

const progressToNextLevel = computed(() => {
  const score = userStore.user?.creditScore || 0
  const level = userStore.user?.creditLevel
  
  const levelRanges = {
    bronze: { min: 0, max: 199 },
    silver: { min: 200, max: 399 },
    gold: { min: 400, max: 599 },
    platinum: { min: 600, max: 799 },
    diamond: { min: 800, max: 1000 }
  }

  const range = levelRanges[level]
  if (!range || level === 'diamond') {
    return '100%'
  }

  const progress = ((score - range.min) / (range.max - range.min)) * 100
  return `${Math.min(progress, 100).toFixed(1)}%`
})

const handleUpdateExpertise = async () => {
  const result = await userStore.updateExpertise(newExpertise.value)
  if (result.success) {
    ElMessage.success('专业领域更新成功！')
    showExpertiseDialog.value = false
  } else {
    ElMessage.error(result.error || '更新失败')
  }
}

onMounted(() => {
  userStore.refreshUser()
})
</script>

<style lang="scss" scoped>
.profile-overview {
  max-width: 1000px;
  margin: 0 auto;
}

.profile-card :deep(.el-card__body) {
  padding: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-info {
  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }

  .email {
    margin: 0 0 12px;
    font-size: 14px;
    color: #909399;
  }

  .badges {
    display: flex;
    gap: 8px;
  }
}

.stats-row {
  margin: 20px 0;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.questions {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: #fff;
  }

  &.answers {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: #fff;
  }

  &.accepted {
    background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    color: #fff;
  }

  &.credit {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    color: #fff;
  }
}

.stat-content {
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.credit-overview {
  display: flex;
  align-items: center;
  gap: 24px;
}

.credit-ring {
  flex-shrink: 0;

  :deep(.el-progress__text) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .credit-score {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }

  .credit-unit {
    font-size: 12px;
    color: #909399;
  }
}

.credit-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .label {
    font-size: 14px;
    color: #909399;
  }

  .value {
    font-size: 14px;
    font-weight: 500;
    color: #303133;

    &.highlight {
      color: #409eff;
      font-size: 18px;
    }
  }
}

.wallet-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.asset-icon {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.money {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.points {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
  }
}

.asset-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.asset-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.wallet-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.expertise-card {
  margin-top: 20px;
}

.expertise-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
