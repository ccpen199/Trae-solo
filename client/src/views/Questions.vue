<template>
  <div class="questions-page">
    <div class="page-header">
      <h1>问题广场</h1>
      <router-link to="/ask">
        <el-button type="primary">
          <el-icon><Edit /></el-icon>
          我要提问
        </el-button>
      </router-link>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="待响应" value="pending_response" />
            <el-option label="有回答" value="has_answers" />
            <el-option label="已解决" value="solved" />
            <el-option label="已收录" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="filterForm.sortBy" @change="handleFilter">
            <el-option label="最新发布" value="createdAt" />
            <el-option label="最多浏览" value="viewCount" />
            <el-option label="最多回答" value="answerCount" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.search"
            placeholder="搜索问题..."
            clearable
            @keyup.enter="handleFilter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <div class="questions-list">
      <el-card v-for="question in questions" :key="question.questionId" class="question-card">
        <div class="question-stats">
          <div class="stat-item">
            <div class="stat-value">{{ question.stats?.voteCount || 0 }}</div>
            <div class="stat-label">投票</div>
          </div>
          <div class="stat-item" :class="{ hasAnswers: question.stats?.answerCount > 0 }">
            <div class="stat-value">{{ question.stats?.answerCount || 0 }}</div>
            <div class="stat-label">回答</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ question.stats?.viewCount || 0 }}</div>
            <div class="stat-label">浏览</div>
          </div>
        </div>
        <div class="question-content">
          <div class="question-header">
            <router-link :to="`/questions/${question.questionId}`" class="question-title">
              <el-tag v-if="question.isFeatured" type="success" effect="light" size="small" class="feature-tag">
                精选
              </el-tag>
              <el-tag v-if="question.isInKnowledgeBase" type="primary" effect="light" size="small" class="kb-tag">
                知识图谱
              </el-tag>
              {{ question.title }}
            </router-link>
          </div>
          <p class="question-excerpt">{{ question.content?.substring(0, 120) }}...</p>
          <div class="question-tags">
            <el-tag
              v-for="tag in question.tags?.slice(0, 4)"
              :key="tag"
              size="small"
              effect="plain"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div class="question-footer">
            <div class="author-info">
              <el-avatar :size="24" :src="question.author?.profile?.avatar">
                {{ question.author?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="author-name">{{ question.author?.profile?.nickname || question.author?.username }}</span>
              <el-tag v-if="question.author?.creditLevel" :type="getCreditTagType(question.author.creditLevel)" size="small">
                {{ getCreditLevelName(question.author.creditLevel) }}
              </el-tag>
            </div>
            <div class="meta-info">
              <span class="reward" v-if="question.reward?.points || question.reward?.money">
                <el-icon><Wallet /></el-icon>
                {{ question.reward?.money ? `¥${question.reward.money}` : '' }}
                {{ question.reward?.points ? `${question.reward.points}积分` : '' }}
              </span>
              <span class="time">
                {{ formatTime(question.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <el-empty v-if="questions.length === 0 && !isLoading" description="暂无问题" />

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import api from '@/utils/api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const questions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const isLoading = ref(false)

const filterForm = reactive({
  status: '',
  sortBy: 'createdAt',
  search: ''
})

const getCreditTagType = (level) => {
  const typeMap = {
    bronze: 'info',
    silver: '',
    gold: 'warning',
    platinum: 'primary',
    diamond: 'success'
  }
  return typeMap[level] || 'info'
}

const getCreditLevelName = (level) => {
  const nameMap = {
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
    diamond: '钻石'
  }
  return nameMap[level] || '青铜'
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

const loadQuestions = async () => {
  isLoading.value = true
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      sortBy: filterForm.sortBy,
      sortOrder: 'desc'
    }

    if (filterForm.status) {
      params.status = filterForm.status
    }

    if (filterForm.search) {
      params.search = filterForm.search
    }

    const response = await api.get('/questions', { params })
    
    if (response.data.success) {
      questions.value = response.data.data.questions || []
      total.value = response.data.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('Load questions error:', error)
    questions.value = [
      {
        questionId: 'Q-DEMO-001',
        title: '如何优化大型React应用的性能？',
        content: '我有一个大型React应用，随着功能增加变得越来越慢。请问有哪些常见的性能优化策略？',
        tags: ['React', '性能优化', '前端'],
        stats: { answerCount: 12, viewCount: 1543, voteCount: 45 },
        reward: { points: 100 },
        author: { username: '前端开发者', profile: { nickname: '前端开发者' }, creditLevel: 'gold' },
        createdAt: new Date(Date.now() - 3600000),
        isFeatured: true
      },
      {
        questionId: 'Q-DEMO-002',
        title: 'Python中如何处理大规模数据的内存管理？',
        content: '我正在处理一个超过10GB的数据集，直接加载到内存会导致OOM错误。请问有什么好的解决方案？',
        tags: ['Python', '数据处理', '内存管理'],
        stats: { answerCount: 8, viewCount: 892, voteCount: 23 },
        reward: { money: 50 },
        author: { username: '数据工程师', profile: { nickname: '数据工程师' }, creditLevel: 'silver' },
        createdAt: new Date(Date.now() - 86400000)
      }
    ]
    total.value = 2
  } finally {
    isLoading.value = false
  }
}

const handleFilter = () => {
  currentPage.value = 1
  loadQuestions()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadQuestions()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadQuestions()
}

onMounted(() => {
  loadQuestions()
})
</script>

<style lang="scss" scoped>
.questions-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.filter-section {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-form {
  margin-bottom: 0;
}

.question-card {
  margin-bottom: 16px;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.question-card :deep(.el-card__body) {
  display: flex;
  padding: 20px;
}

.question-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-right: 20px;
  min-width: 80px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  border-radius: 4px;
  background: #f5f7fa;

  &.hasAnswers {
    background: #67c23a;
    color: #fff;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  &.hasAnswers .stat-label {
    color: rgba(255, 255, 255, 0.9);
  }
}

.question-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.question-header {
  margin-bottom: 8px;
}

.question-title {
  font-size: 17px;
  font-weight: 500;
  color: #303133;
  text-decoration: none;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #409eff;
  }

  .feature-tag,
  .kb-tag {
    font-weight: normal;
  }
}

.question-excerpt {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tag-item {
  cursor: pointer;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  color: #606266;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.reward {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e6a23c;
  font-weight: 500;
}

.time {
  color: #c0c4cc;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
