<template>
  <div class="page-container questions-page">
    <div class="page-header">
      <h2>问答社区</h2>
      <el-button type="primary" @click="goToAskQuestion">
        <el-icon><Edit /></el-icon>
        我要提问
      </el-button>
    </div>

    <div class="filter-tabs">
      <el-radio-group v-model="filterType" @change="handleFilterChange">
        <el-radio-button value="">全部问题</el-radio-button>
        <el-radio-button value="unanswered">待解决</el-radio-button>
        <el-radio-button value="solved">已解决</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索问题..."
        prefix-icon="Search"
        style="width: 280px"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <el-empty v-if="questions.length === 0 && !loading" description="暂无问题" />

    <div v-else class="question-list">
      <div
        class="question-item"
        v-for="question in questions"
        :key="question.id"
        @click="goToQuestion(question.id)"
      >
        <div class="question-stats">
          <div class="stat-item">
            <span class="count">{{ question.viewCount }}</span>
            <span class="label">浏览</span>
          </div>
          <div class="stat-item" :class="{ answered: question.answerCount > 0 }">
            <span class="count">{{ question.answerCount }}</span>
            <span class="label">回答</span>
          </div>
        </div>
        <div class="question-content">
          <h3 class="question-title">
            <el-tag v-if="question.isSolved" type="success" size="small" effect="plain">已解决</el-tag>
            <span>{{ question.title }}</span>
          </h3>
          <p class="question-desc">{{ question.content?.slice(0, 120) }}...</p>
          <div class="question-meta">
            <template v-if="question.tags">
              <el-tag
                v-for="tag in question.tags.split(',').slice(0, 3)"
                :key="tag"
                size="small"
                effect="plain"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </template>
            <span class="time">{{ formatTime(question.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchQuestions"
        @current-change="fetchQuestions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/request'

const router = useRouter()

const questions = ref<any[]>([])
const loading = ref(false)
const filterType = ref('')
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}

const fetchQuestions = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value
    }

    if (filterType.value === 'unanswered') {
      params.isSolved = 'false'
    } else if (filterType.value === 'solved') {
      params.isSolved = 'true'
    }

    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const response = await api.get('/questions', { params })
    if (response.data.success) {
      const data = response.data.data
      questions.value = data.list || []
      total.value = data.total || 0
    }
  } catch (error) {
    console.error('获取问题列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  page.value = 1
  fetchQuestions()
}

const handleSearch = () => {
  page.value = 1
  fetchQuestions()
}

const goToQuestion = (id: string) => {
  router.push(`/questions/${id}`)
}

const goToAskQuestion = () => {
  router.push('/login?redirect=/questions')
}

onMounted(() => {
  fetchQuestions()
})
</script>

<style lang="scss">
.questions-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 24px;
    }
  }

  .filter-tabs {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .question-list {
    .question-item {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      gap: 20px;
      cursor: pointer;
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .question-stats {
        width: 100px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .stat-item {
          text-align: center;
          padding: 8px;
          border-radius: 4px;
          background: #f5f7fa;

          &.answered {
            background: #f0f9eb;

            .count {
              color: #67C23A;
            }
          }

          .count {
            display: block;
            font-size: 18px;
            font-weight: 600;
            color: #909399;
          }

          .label {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .question-content {
        flex: 1;

        .question-title {
          font-size: 16px;
          margin: 0 0 12px;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 8px;

          span:hover {
            color: #409EFF;
          }
        }

        .question-desc {
          font-size: 14px;
          color: #909399;
          margin: 0 0 12px;
          line-height: 1.6;
        }

        .question-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .tag-item {
            margin-right: 0;
          }

          .time {
            font-size: 12px;
            color: #c0c4cc;
          }
        }
      }
    }
  }

  .pagination-container {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}
</style>
