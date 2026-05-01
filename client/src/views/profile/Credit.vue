<template>
  <div class="credit-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>信用中心</span>
        </div>
      </template>
      
      <div class="credit-overview">
        <div class="credit-ring">
          <el-progress
            type="dashboard"
            :percentage="creditPercentage"
            :color="creditColor"
            :width="180"
          >
            <span class="credit-score">{{ userStore.user?.creditScore || 0 }}</span>
            <span class="credit-unit">分</span>
          </el-progress>
        </div>
        
        <div class="credit-info">
          <div class="info-item">
            <span class="label">当前等级</span>
            <el-tag :type="getCreditTagType" size="large">{{ getCreditLevelName }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">下一等级</span>
            <span class="value">{{ nextLevelName }}</span>
          </div>
          <div class="info-item">
            <span class="label">升级进度</span>
            <el-progress :percentage="progressPercent" :stroke-width="10" />
          </div>
          <div class="info-item">
            <span class="label">活跃权重</span>
            <span class="value highlight">{{ userStore.user?.activityWeight || 1.0 }}x</span>
          </div>
        </div>
      </div>
      
      <el-divider>信用历史</el-divider>
      
      <el-table :data="creditHistory" style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="recordType" label="类型" width="150">
          <template #default="{ row }">
            <el-tag :type="row.amount > 0 ? 'success' : 'danger'" size="small">
              {{ getRecordTypeName(row.recordType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="变动" width="120">
          <template #default="{ row }">
            <span :class="{ positive: row.amount > 0, negative: row.amount < 0 }">
              {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="previousScore" label="之前">
          <template #default="{ row }">
            {{ row.previousScore }}
          </template>
        </el-table-column>
        <el-table-column prop="newScore" label="之后">
          <template #default="{ row }">
            {{ row.newScore }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const userStore = useUserStore()

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

const progressPercent = computed(() => {
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
  if (!range || level === 'diamond') return 100

  const progress = ((score - range.min) / (range.max - range.min)) * 100
  return Math.min(Math.max(progress, 0), 100)
})

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

const getRecordTypeName = (type) => {
  const nameMap = {
    'question_posted': '发布问题',
    'answer_posted': '发布回答',
    'answer_accepted': '回答被采纳',
    'vote_received_up': '收到赞同',
    'vote_received_down': '收到反对',
    'content_quality': '内容质量',
    'plagiarism_detected': '检测抄袭',
    'suspicious_activity': '可疑行为',
    'knowledge_contribution': '知识贡献'
  }
  return nameMap[type] || type
}

const creditHistory = ref([
  {
    createdAt: new Date(Date.now() - 3600000),
    recordType: 'answer_accepted',
    amount: 10,
    previousScore: 110,
    newScore: 120,
    reason: '回答被采纳'
  },
  {
    createdAt: new Date(Date.now() - 86400000),
    recordType: 'vote_received_up',
    amount: 0.5,
    previousScore: 109.5,
    newScore: 110,
    reason: '收到赞同票'
  },
  {
    createdAt: new Date(Date.now() - 172800000),
    recordType: 'answer_posted',
    amount: 2,
    previousScore: 107.5,
    newScore: 109.5,
    reason: '发布回答'
  },
  {
    createdAt: new Date(Date.now() - 259200000),
    recordType: 'question_posted',
    amount: 0.5,
    previousScore: 107,
    newScore: 107.5,
    reason: '发布问题'
  }
])
</script>

<style lang="scss" scoped>
.credit-page {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.credit-overview {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 20px;
}

.credit-ring {
  flex-shrink: 0;

  :deep(.el-progress__text) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .credit-score {
    font-size: 36px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }

  .credit-unit {
    font-size: 14px;
    color: #909399;
  }
}

.credit-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
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
      font-size: 20px;
    }
  }
}

.positive {
  color: #67c23a;
  font-weight: 500;
}

.negative {
  color: #f56c6c;
  font-weight: 500;
}
</style>
