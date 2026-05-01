<template>
  <div class="my-questions-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的提问</span>
          <el-radio-group v-model="filterStatus" size="small" @change="handleFilter">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="published">已发布</el-radio-button>
            <el-radio-button label="pending_response">待响应</el-radio-button>
            <el-radio-button label="has_answers">有回答</el-radio-button>
            <el-radio-button label="solved">已解决</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="questions" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="问题标题" min-width="300">
          <template #default="{ row }">
            <router-link :to="`/questions/${row.questionId}`" class="question-link">
              <el-tag v-if="row.isFeatured" type="success" effect="light" size="mini" style="margin-right: 8px;">
                精选
              </el-tag>
              <el-tag v-if="row.isInKnowledgeBase" type="primary" effect="light" size="mini" style="margin-right: 8px;">
                知识图谱
              </el-tag>
              {{ row.title }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="workflowStatus" label="工作流" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">
              {{ getWorkflowName(row.workflowStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统计" width="200">
          <template #default="{ row }">
            <div class="stats-row">
              <span class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                {{ row.stats?.answerCount || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ row.stats?.viewCount || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><ThumbsUp /></el-icon>
                {{ row.stats?.voteCount || 0 }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="悬赏" width="100">
          <template #default="{ row }">
            <div v-if="row.reward?.points || row.reward?.money" class="reward-info">
              <span v-if="row.reward?.money" class="money">¥{{ row.reward.money }}</span>
              <span v-if="row.reward?.points" class="points">{{ row.reward.points }}积分</span>
            </div>
            <span v-else class="no-reward">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/questions/${row.questionId}`">
              <el-button type="primary" link size="small">查看</el-button>
            </router-link>
            <router-link :to="`/workflow/${row.questionId}`">
              <el-button type="info" link size="small">流程</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="questions.length === 0 && !loading" description="暂无提问">
        <router-link to="/ask">
          <el-button type="primary">去提问</el-button>
        </router-link>
      </el-empty>

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const loading = ref(false)
const filterStatus = ref('')
const questions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const getStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'published': '',
    'pending_response': 'warning',
    'has_answers': 'primary',
    'solved': 'success',
    'archived': 'info',
    'closed': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusName = (status) => {
  const nameMap = {
    'draft': '草稿',
    'published': '已发布',
    'pending_review': '待审核',
    'pending_response': '待响应',
    'has_answers': '有回答',
    'accepted': '已采纳',
    'solved': '已解决',
    'archived': '已归档',
    'closed': '已关闭'
  }
  return nameMap[status] || status
}

const getWorkflowName = (status) => {
  const nameMap = {
    'business_request': '业务请求',
    'processing_ticket': '处理工单',
    'associated_credentials': '关联凭证',
    'result_confirmation': '结果确认',
    'archived_record': '归档记录'
  }
  return nameMap[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const handleFilter = () => {
  currentPage.value = 1
  loadQuestions()
}

const handleSizeChange = () => {
  loadQuestions()
}

const handleCurrentChange = () => {
  loadQuestions()
}

const loadQuestions = () => {
  loading.value = true
  
  questions.value = [
    {
      questionId: 'Q-DEMO-001',
      title: '如何优化大型React应用的性能？',
      status: 'solved',
      workflowStatus: 'result_confirmation',
      stats: { answerCount: 12, viewCount: 1543, voteCount: 45 },
      reward: { points: 100, money: 0 },
      createdAt: new Date(Date.now() - 86400000),
      isFeatured: true,
      isInKnowledgeBase: false
    },
    {
      questionId: 'Q-DEMO-002',
      title: 'Python中如何处理大规模数据的内存管理？',
      status: 'has_answers',
      workflowStatus: 'associated_credentials',
      stats: { answerCount: 8, viewCount: 892, voteCount: 23 },
      reward: { points: 0, money: 50 },
      createdAt: new Date(Date.now() - 172800000),
      isFeatured: false,
      isInKnowledgeBase: false
    },
    {
      questionId: 'Q-DEMO-003',
      title: '微服务架构下如何保证数据一致性？',
      status: 'pending_response',
      workflowStatus: 'processing_ticket',
      stats: { answerCount: 0, viewCount: 234, voteCount: 5 },
      reward: { points: 200, money: 100 },
      createdAt: new Date(Date.now() - 3600000),
      isFeatured: false,
      isInKnowledgeBase: false
    }
  ]
  
  total.value = questions.value.length
  loading.value = false
}

onMounted(() => {
  loadQuestions()
})
</script>

<style lang="scss" scoped>
.my-questions-page {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.question-link {
  color: #303133;
  text-decoration: none;
  
  &:hover {
    color: #409eff;
  }
}

.stats-row {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.reward-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .money {
    color: #e6a23c;
    font-weight: 500;
  }
  
  .points {
    color: #409eff;
    font-size: 12px;
  }
}

.no-reward {
  color: #c0c4cc;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
