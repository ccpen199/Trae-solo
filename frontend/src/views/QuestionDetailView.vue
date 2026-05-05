<template>
  <div class="page-container question-detail-page">
    <el-card v-loading="loading" shadow="never" class="question-card">
      <div class="question-header">
        <h2 class="question-title">{{ question?.title }}</h2>
        <div class="question-meta">
          <el-tag v-if="question?.isSolved" type="success" effect="plain">已解决</el-tag>
          <el-tag v-else type="warning" effect="plain">待解决</el-tag>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            {{ question?.viewCount }} 浏览
          </span>
          <span class="meta-item">
            <el-icon><ChatDotRound /></el-icon>
            {{ question?.answerCount }} 回答
          </span>
          <span class="meta-item time">
            {{ formatTime(question?.createdAt) }}
          </span>
        </div>
      </div>

      <el-divider />

      <div class="question-content" v-html="question?.content"></div>

      <div class="question-tags" v-if="question?.tags">
        <el-tag
          v-for="tag in question?.tags?.split(',')"
          :key="tag"
          size="small"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
      </div>
    </el-card>

    <el-card shadow="never" class="answer-card">
      <template #header>
        <div class="answer-header">
          <h3>回答 ({{ answers.length }})</h3>
          <el-button type="primary" @click="scrollToAnswer">
            <el-icon><Edit /></el-icon>
            我来回答
          </el-button>
        </div>
      </template>

      <el-empty v-if="answers.length === 0" description="暂无回答，快来抢沙发吧！" />

      <div v-else class="answer-list">
        <div class="answer-item" v-for="answer in answers" :key="answer.id">
          <div class="answer-user">
            <el-avatar :size="40">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="user-info">
              <span class="username">用户{{ answer.userId?.slice(0, 8) }}</span>
              <span class="time">{{ formatTime(answer.createdAt) }}</span>
            </div>
            <el-tag v-if="answer.isAdopted" type="success" size="small">
              <el-icon><CircleCheck /></el-icon>
              已采纳
            </el-tag>
          </div>
          <div class="answer-content" v-html="answer.content"></div>
          <div class="answer-actions">
            <el-button type="text" :icon="ThumbUp">
              {{ answer.likeCount || 0 }}
            </el-button>
          </div>
          <el-divider v-if="!$last" />
        </div>
      </div>
    </el-card>

    <el-card shadow="never" id="answer-form" class="answer-form-card">
      <template #header>
        <h3>提交回答</h3>
      </template>

      <el-form ref="answerFormRef" :model="answerForm" label-width="0">
        <el-form-item>
          <el-input
            v-model="answerForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入您的回答..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitAnswer" :loading="submitting">
            提交回答
          </el-button>
          <el-button @click="clearForm">清空</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const question = ref<any>(null)
const answers = ref<any[]>([])

const answerFormRef = ref()
const answerForm = reactive({
  content: ''
})

const formatTime = (time: string) => {
  if (!time) return ''
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

const fetchQuestionDetail = async () => {
  const questionId = route.params.id as string
  if (!questionId) return

  loading.value = true
  try {
    const response = await api.get(`/questions/${questionId}`)
    if (response.data.success) {
      question.value = response.data.data
      answers.value = response.data.data?.answers || []
    }
  } catch (error) {
    console.error('获取问题详情失败:', error)
    ElMessage.error('获取问题详情失败')
  } finally {
    loading.value = false
  }
}

const scrollToAnswer = () => {
  const element = document.getElementById('answer-form')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const submitAnswer = async () => {
  if (!answerForm.content.trim()) {
    ElMessage.warning('请输入回答内容')
    return
  }

  submitting.value = true
  try {
    const response = await api.post(`/questions/${route.params.id}/answers`, {
      content: answerForm.content
    })
    if (response.data.success) {
      ElMessage.success('回答提交成功')
      answerForm.content = ''
      fetchQuestionDetail()
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
    } else {
      ElMessage.error('提交回答失败')
    }
  } finally {
    submitting.value = false
  }
}

const clearForm = () => {
  answerForm.content = ''
}

onMounted(() => {
  fetchQuestionDetail()
})
</script>

<style lang="scss">
.question-detail-page {
  .question-card {
    margin-bottom: 24px;

    .question-header {
      .question-title {
        font-size: 20px;
        margin: 0 0 16px;
        color: #303133;
      }

      .question-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;

        .meta-item {
          font-size: 13px;
          color: #909399;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .time {
          margin-left: auto;
        }
      }
    }

    .question-content {
      font-size: 15px;
      line-height: 1.8;
      color: #303133;
      white-space: pre-wrap;
    }

    .question-tags {
      margin-top: 20px;
      display: flex;
      gap: 8px;
    }
  }

  .answer-card {
    margin-bottom: 24px;

    .answer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 16px;
      }
    }

    .answer-list {
      .answer-item {
        .answer-user {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .user-info {
            display: flex;
            flex-direction: column;

            .username {
              font-size: 14px;
              color: #409EFF;
            }

            .time {
              font-size: 12px;
              color: #c0c4cc;
            }
          }
        }

        .answer-content {
          font-size: 14px;
          line-height: 1.8;
          color: #606266;
          white-space: pre-wrap;
        }

        .answer-actions {
          margin-top: 12px;
        }
      }
    }
  }

  .answer-form-card {
    h3 {
      margin: 0;
      font-size: 16px;
    }
  }
}
</style>
