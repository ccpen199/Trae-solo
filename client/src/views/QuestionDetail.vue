<template>
  <div class="question-detail-page">
    <el-card v-loading="loading" class="question-card">
      <div v-if="question" class="question-content">
        <div class="question-header">
          <h1>{{ question.title }}</h1>
          <div class="question-tags">
            <el-tag
              v-for="tag in question.tags"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <div class="question-meta">
          <div class="author-info">
            <el-avatar :size="32" :src="question.author?.profile?.avatar">
              {{ question.author?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span class="author-name">{{ question.author?.profile?.nickname || question.author?.username }}</span>
            <el-tag v-if="question.author?.creditLevel" :type="getCreditTagType(question.author.creditLevel)" size="small">
              {{ getCreditLevelName(question.author.creditLevel) }}
            </el-tag>
            <span class="time">{{ formatTime(question.createdAt) }}</span>
          </div>
          <div class="question-stats">
            <div class="stat-item">
              <el-icon><View /></el-icon>
              <span>{{ question.stats?.viewCount || 0 }} 浏览</span>
            </div>
            <div class="stat-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ question.stats?.answerCount || 0 }} 回答</span>
            </div>
            <div class="stat-item" v-if="question.reward?.points || question.reward?.money">
              <el-icon><Wallet /></el-icon>
              <span class="reward">
                {{ question.reward?.money ? `¥${question.reward.money}` : '' }}
                {{ question.reward?.points ? `${question.reward.points}积分` : '' }}
              </span>
            </div>
          </div>
        </div>

        <div class="question-body">
          <div class="content-text">{{ question.content }}</div>
        </div>

        <div class="question-actions" v-if="userStore.isAuthenticated">
          <el-button
            :type="userVote === 'upvote' ? 'primary' : 'default'"
            @click="handleVote('upvote')"
          >
            <el-icon><ArrowUp /></el-icon>
            赞同 ({{ question.stats?.voteCount || 0 }})
          </el-button>
          <el-button
            :type="userVote === 'downvote' ? 'danger' : 'default'"
            @click="handleVote('downvote')"
          >
            <el-icon><ArrowDown /></el-icon>
            反对
          </el-button>
        </div>

        <el-divider content-position="left">
          回答 ({{ answers.length }})
        </el-divider>

        <div class="answer-form" v-if="userStore.isAuthenticated">
          <el-input
            v-model="newAnswer"
            type="textarea"
            placeholder="写下您的回答..."
            :rows="6"
          />
          <div class="answer-actions">
            <el-button type="primary" :loading="submittingAnswer" @click="submitAnswer">
              提交回答
            </el-button>
          </div>
        </div>
        <div v-else class="login-prompt">
          <el-text>请先</el-text>
          <router-link to="/login">
            <el-button type="primary" text>登录</el-button>
          </router-link>
          <el-text>后回答问题</el-text>
        </div>

        <div class="answers-list">
          <div v-for="answer in answers" :key="answer.answerId" class="answer-item">
            <el-card :shadow="never" class="answer-card" :class="{ accepted: answer.isAccepted }">
              <div v-if="answer.isAccepted" class="accepted-badge">
                <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                <span>已采纳</span>
              </div>
              
              <div class="answer-header">
                <div class="author-info">
                  <el-avatar :size="28" :src="answer.author?.profile?.avatar">
                    {{ answer.author?.username?.charAt(0)?.toUpperCase() }}
                  </el-avatar>
                  <span class="author-name">{{ answer.author?.profile?.nickname || answer.author?.username }}</span>
                  <el-tag v-if="answer.author?.creditLevel" :type="getCreditTagType(answer.author.creditLevel)" size="small">
                    {{ getCreditLevelName(answer.author.creditLevel) }}
                  </el-tag>
                  <span class="time">{{ formatTime(answer.createdAt) }}</span>
                </div>
                <div class="answer-completeness" v-if="answer.contentCompleteness">
                  <el-progress 
                    :percentage="answer.contentCompleteness" 
                    :color="getCompletenessColor(answer.contentCompleteness)"
                    :stroke-width="8"
                    :show-text="false"
                    style="width: 80px;"
                  />
                  <span class="completeness-label">完整度 {{ answer.contentCompleteness }}%</span>
                </div>
              </div>

              <div class="answer-content">
                {{ answer.content }}
              </div>

              <div class="answer-footer">
                <div class="answer-votes">
                  <el-button
                    :type="answer.userVote === 'upvote' ? 'primary' : 'default'"
                    size="small"
                    @click="handleAnswerVote(answer, 'upvote')"
                  >
                    <el-icon><ArrowUp /></el-icon>
                    {{ answer.stats?.voteCount || 0 }}
                  </el-button>
                  <el-button
                    :type="answer.userVote === 'downvote' ? 'danger' : 'default'"
                    size="small"
                    @click="handleAnswerVote(answer, 'downvote')"
                  >
                    <el-icon><ArrowDown /></el-icon>
                  </el-button>
                </div>

                <div class="answer-actions" v-if="userStore.isAuthenticated">
                  <el-button
                    v-if="isQuestionAuthor && !answer.isAccepted && question.status === 'has_answers'"
                    type="success"
                    size="small"
                    @click="handleAcceptAnswer(answer)"
                  >
                    <el-icon><CircleCheckFilled /></el-icon>
                    采纳
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>

          <el-empty v-if="answers.length === 0" description="暂无回答，快来抢沙发吧！" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import api from '@/utils/api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const question = ref(null)
const answers = ref([])
const newAnswer = ref('')
const submittingAnswer = ref(false)
const userVote = ref(null)

const isQuestionAuthor = computed(() => {
  return userStore.isAuthenticated && 
         question.value && 
         question.value.author?._id?.toString() === userStore.user?._id?.toString()
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

const getCompletenessColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#909399'
}

const loadQuestion = async () => {
  loading.value = true
  try {
    const questionId = route.params.questionId
    
    const response = await api.get(`/questions/${questionId}`)
    if (response.data.success) {
      question.value = response.data.data
    }
    
    const answersResponse = await api.get(`/questions/${questionId}/answers`)
    if (answersResponse.data.success) {
      answers.value = answersResponse.data.data.answers || []
    }
  } catch (error) {
    console.error('Load question error:', error)
    ElMessage.error('加载问题失败')
  } finally {
    loading.value = false
  }
}

const handleVote = async (voteType) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const response = await api.post(`/questions/${route.params.questionId}/vote`, {
      voteType
    })
    
    if (response.data.success) {
      userVote.value = voteType
      ElMessage.success(voteType === 'upvote' ? '已赞同' : '已反对')
      loadQuestion()
    }
  } catch (error) {
    console.error('Vote error:', error)
  }
}

const submitAnswer = async () => {
  if (!newAnswer.value.trim()) {
    ElMessage.warning('请输入回答内容')
    return
  }

  if (newAnswer.value.length < 10) {
    ElMessage.warning('回答内容至少10个字符')
    return
  }

  submittingAnswer.value = true
  try {
    const response = await api.post(`/answers/${question.value._id}`, {
      content: newAnswer.value
    })
    
    if (response.data.success) {
      ElMessage.success('回答提交成功！')
      newAnswer.value = ''
      loadQuestion()
    }
  } catch (error) {
    console.error('Submit answer error:', error)
    ElMessage.error(error.response?.data?.error || '提交失败')
  } finally {
    submittingAnswer.value = false
  }
}

const handleAnswerVote = async (answer, voteType) => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const response = await api.post(`/answers/${answer.answerId}/vote`, {
      voteType
    })
    
    if (response.data.success) {
      answer.userVote = voteType
      ElMessage.success(voteType === 'upvote' ? '已赞同' : '已反对')
      loadQuestion()
    }
  } catch (error) {
    console.error('Answer vote error:', error)
  }
}

const handleAcceptAnswer = async (answer) => {
  try {
    await ElMessage.confirm('确定采纳此回答吗？采纳后将进行赏金结算。', '确认采纳', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    const response = await api.post(`/answers/${answer.answerId}/accept/${question.value._id}`)
    
    if (response.data.success) {
      ElMessage.success('回答已采纳，赏金已结算！')
      loadQuestion()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Accept answer error:', error)
      ElMessage.error(error.response?.data?.error || '采纳失败')
    }
  }
}

watch(
  () => route.params.questionId,
  () => {
    loadQuestion()
  }
)

onMounted(() => {
  loadQuestion()
})
</script>

<style lang="scss" scoped>
.question-detail-page {
  max-width: 900px;
  margin: 0 auto;
}

.question-card :deep(.el-card__body) {
  padding: 24px;
}

.question-header {
  margin-bottom: 16px;

  h1 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
  }
}

.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .author-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }

  .time {
    font-size: 12px;
    color: #909399;
    margin-left: 4px;
  }
}

.question-stats {
  display: flex;
  gap: 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #606266;

    .reward {
      color: #e6a23c;
      font-weight: 500;
    }
  }
}

.question-body {
  margin-bottom: 20px;

  .content-text {
    font-size: 15px;
    line-height: 1.8;
    color: #303133;
    white-space: pre-wrap;
  }
}

.question-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.answer-form {
  margin-bottom: 24px;

  .answer-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

.login-prompt {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 24px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.answer-item {
  .accepted {
    border: 2px solid #67c23a;
  }
}

.answer-card {
  position: relative;

  &.accepted {
    border-color: #67c23a;
    background: linear-gradient(to bottom, #f0f9eb, #fff);
  }
}

.accepted-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #67c23a;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.answer-completeness {
  display: flex;
  align-items: center;
  gap: 8px;

  .completeness-label {
    font-size: 12px;
    color: #909399;
  }
}

.answer-content {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.answer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.answer-votes {
  display: flex;
  gap: 8px;
}

.answer-actions {
  display: flex;
  gap: 8px;
}
</style>
