<template>
  <div class="question-detail-page">
    <van-nav-bar title="问题详情" left-arrow @click-left="goBack" />

    <van-loading v-if="loading" class="loading" />
    <div v-else-if="question" class="content">
      <h1 class="question-title">{{ question.title }}</h1>
      
      <div class="user-info">
        <van-image :src="question.user.avatar || 'https://picsum.photos/50/50'" round class="avatar" />
        <span class="username">{{ question.user.nickname || question.user.username }}</span>
        <span class="time">{{ formatTime(question.createdAt) }}</span>
      </div>

      <div class="question-content">{{ question.content }}</div>

      <div v-if="question.topics && question.topics.length > 0" class="question-topics">
        <van-tag v-for="(topic, idx) in question.topics" :key="idx" type="primary" plain size="small">
          {{ topic }}
        </van-tag>
      </div>

      <div class="question-actions">
        <van-button type="default" size="small" icon="like-o" :class="{ 'is-liked': question.isLiked }" @click="toggleLike">
          {{ question.likeCount || 0 }}
        </van-button>
        <van-button type="default" size="small" icon="star-o" :class="{ 'is-favorited': question.isFavorited }" @click="toggleFavorite">
          收藏
        </van-button>
      </div>

      <div class="answer-section">
        <h3>回答 ({{ question.answers?.length || 0 }})</h3>
        
        <div class="answer-input">
          <van-field
            v-model="answerContent"
            type="textarea"
            placeholder="写下你的回答..."
            rows="3"
            :border="false"
          />
          <van-button type="primary" size="small" @click="submitAnswer">提交回答</van-button>
        </div>

        <div v-if="question.answers && question.answers.length > 0" class="answer-list">
          <div v-for="answer in question.answers" :key="answer.id" class="answer-item">
            <div class="answer-header">
              <van-image :src="answer.user.avatar || 'https://picsum.photos/50/50'" round class="answer-avatar" />
              <div class="answer-user">
                <div class="username">{{ answer.user.nickname || answer.user.username }}</div>
                <div class="answer-time">{{ formatTime(answer.createdAt) }}</div>
              </div>
            </div>
            <div class="answer-content">{{ answer.content }}</div>
            <div class="answer-actions">
              <van-button type="default" size="small" icon="like-o" :class="{ 'is-liked': answer.isLiked }">
                {{ answer.likeCount || 0 }}
              </van-button>
              <van-button type="default" size="small" icon="comment-o">
                评论
              </van-button>
            </div>
          </div>
        </div>
        <van-empty v-else description="暂无回答，快来抢沙发吧" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import type { Question } from '@/types'

const router = useRouter()
const route = useRoute()

const question = ref<Question | null>(null)
const loading = ref(true)
const answerContent = ref('')

const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const fetchQuestion = async () => {
  try {
    const res = await request.get(`/questions/${route.params.id}`)
    question.value = res.data
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const toggleLike = async () => {
  if (!question.value) return
  try {
    await request.post(`/questions/${question.value.id}/like`)
    question.value.isLiked = !question.value.isLiked
    question.value.likeCount += question.value.isLiked ? 1 : -1
  } catch {}
}

const toggleFavorite = async () => {
  if (!question.value) return
  try {
    await request.post(`/questions/${question.value.id}/favorite`)
    question.value.isFavorited = !question.value.isFavorited
    showToast(question.value.isFavorited ? '已收藏' : '已取消收藏')
  } catch {}
}

const submitAnswer = async () => {
  if (!answerContent.value.trim() || !question.value) {
    showToast('请输入回答内容')
    return
  }
  try {
    await request.post(`/questions/${question.value.id}/answer`, {
      content: answerContent.value,
      images: []
    })
    answerContent.value = ''
    showToast('回答成功')
    fetchQuestion()
  } catch {}
}

onMounted(() => {
  fetchQuestion()
})
</script>

<style scoped>
.question-detail-page {
  padding-bottom: 20px;
}

.loading {
  padding: 50px 0;
  text-align: center;
}

.content {
  padding: 15px;
}

.question-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  line-height: 1.4;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.avatar {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  margin-right: 10px;
}

.time {
  font-size: 12px;
  color: #999;
}

.question-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 15px;
}

.question-topics {
  margin-bottom: 15px;
}

.question-actions {
  display: flex;
  gap: 10px;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.question-actions .is-liked {
  color: #ff6b6b;
}

.question-actions .is-favorited {
  color: #ffc107;
}

.answer-section {
  padding-top: 20px;
}

.answer-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
}

.answer-input {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.answer-input .van-field {
  margin-bottom: 10px;
  background: #fff;
  border-radius: 4px;
}

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.answer-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.answer-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.answer-avatar {
  width: 35px;
  height: 35px;
  margin-right: 10px;
}

.answer-user .username {
  font-size: 14px;
  font-weight: 500;
}

.answer-time {
  font-size: 12px;
  color: #999;
}

.answer-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 10px;
}

.answer-actions {
  display: flex;
  gap: 10px;
}

.answer-actions .is-liked {
  color: #ff6b6b;
}
</style>
