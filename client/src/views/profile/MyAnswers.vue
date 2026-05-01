<template>
  <div class="my-answers-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的回答</span>
          <el-radio-group v-model="filterStatus" size="small" @change="handleFilter">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="accepted">已采纳</el-radio-button>
            <el-radio-button label="not_accepted">待采纳</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="answers" v-loading="loading" style="width: 100%">
        <el-table-column prop="question.title" label="问题" min-width="250">
          <template #default="{ row }">
            <router-link :to="`/questions/${row.question?.questionId || row.questionId}`" class="question-link">
              {{ row.question?.title || '问题详情' }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="回答摘要" min-width="200">
          <template #default="{ row }">
            <span class="content-preview">{{ row.content?.substring(0, 80) }}...</span>
          </template>
        </el-table-column>
        <el-table-column prop="isAccepted" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAccepted ? 'success' : 'info'" size="small">
              {{ row.isAccepted ? '已采纳' : '待采纳' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统计" width="180">
          <template #default="{ row }">
            <div class="stats-row">
              <span class="stat-item">
                <el-icon><ThumbsUp /></el-icon>
                {{ row.stats?.voteCount || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ row.stats?.viewCount || 0 }}
              </span>
              <span class="stat-item">
                完整度 {{ row.contentCompleteness || 0 }}%
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="回答时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/questions/${row.question?.questionId || row.questionId}`">
              <el-button type="primary" link size="small">查看</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="answers.length === 0 && !loading" description="暂无回答" />

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'

const loading = ref(false)
const filterStatus = ref('')
const answers = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const handleFilter = () => {
  loadAnswers()
}

const loadAnswers = () => {
  loading.value = true
  
  answers.value = [
    {
      answerId: 'A-DEMO-001',
      content: 'React性能优化可以从多个方面入手...',
      contentCompleteness: 92,
      isAccepted: true,
      question: {
        questionId: 'Q-DEMO-001',
        title: '如何优化大型React应用的性能？'
      },
      stats: { voteCount: 45, viewCount: 892 },
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      answerId: 'A-DEMO-002',
      content: '处理大规模数据可以使用Dask或Vaex...',
      contentCompleteness: 85,
      isAccepted: false,
      question: {
        questionId: 'Q-DEMO-002',
        title: 'Python中如何处理大规模数据的内存管理？'
      },
      stats: { voteCount: 12, viewCount: 234 },
      createdAt: new Date(Date.now() - 172800000)
    }
  ]
  
  total.value = answers.value.length
  loading.value = false
}

onMounted(() => {
  loadAnswers()
})
</script>

<style lang="scss" scoped>
.my-answers-page {
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

.content-preview {
  color: #606266;
  font-size: 13px;
}

.stats-row {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
