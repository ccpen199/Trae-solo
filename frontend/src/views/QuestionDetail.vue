<template>
  <div class="question-detail-page">
    <van-nav-bar title="问题详情" left-arrow @click-left="goBack" />
    
    <div class="question-detail">
      <div class="question-card">
        <h1 class="question-title">{{ question.title }}</h1>
        <div class="question-meta">
          <div class="author-info">
            <van-avatar :src="question.user_avatar" size="32" />
            <div class="author-detail">
              <span class="author-name">{{ question.user_name }}</span>
              <span class="publish-time">{{ formatDate(question.created_at) }}</span>
            </div>
          </div>
          <van-button type="primary" size="small" round v-if="!isAuthor">
            关注
          </van-button>
        </div>
        
        <div class="question-content" v-if="question.content">
          <p>{{ question.content }}</p>
        </div>
        
        <div class="question-tags" v-if="question.tags?.length">
          <van-tag 
            v-for="tag in question.tags" 
            :key="tag"
            plain
            type="primary"
            round
          >
            #{{ tag }}
          </van-tag>
        </div>
        
        <div class="question-stats">
          <div class="stat-item">
            <van-icon name="eye-o" size="16" color="#999" />
            <span>{{ question.views }} 浏览</span>
          </div>
          <div class="stat-item">
            <van-icon name="chat-o" size="16" color="#999" />
            <span>{{ question.answer_count }} 回答</span>
          </div>
        </div>
      </div>
      
      <div class="answers-section">
        <div class="section-header">
          <h3 class="section-title">全部回答 ({{ question.answer_count }})</h3>
        </div>
        
        <div class="answer-list">
          <div v-for="item in answers" :key="item.id" class="answer-item">
            <div class="answer-header">
              <van-avatar :src="item.user_avatar" size="36" />
              <div class="answer-user">
                <span class="user-name">{{ item.user_name }}</span>
                <span class="answer-time">{{ formatDate(item.created_at) }}</span>
              </div>
              <van-tag v-if="item.is_accepted" type="success" size="small">
                <van-icon name="passed" size="12" /> 已采纳
              </van-tag>
            </div>
            <div class="answer-content">
              <p>{{ item.content }}</p>
            </div>
            <div class="answer-actions">
              <span class="action-item" @click="likeAnswer(item)">
                <van-icon :name="item.is_liked ? 'like' : 'like-o'" size="14" :color="item.is_liked ? '#667eea' : '#999'" />
                <span>{{ item.likes }}</span>
              </span>
              <span class="action-item" @click="replyToAnswer(item)">
                <van-icon name="chat-o" size="14" color="#999" />
                <span>回复</span>
              </span>
            </div>
          </div>
        </div>
        
        <van-empty description="暂无回答" v-if="answers.length === 0" />
      </div>
    </div>
    
    <van-goods-action>
      <van-goods-action-icon 
        :icon="isFavorited ? 'star' : 'star-o'" 
        text="收藏" 
        @click="toggleFavorite"
      />
      <van-goods-action-icon icon="share-o" text="分享" />
      <van-goods-action-button 
        type="primary" 
        text="写回答" 
        @click="showAnswerPopup = true"
      />
    </van-goods-action>
    
    <van-popup v-model:show="showAnswerPopup" round position="bottom">
      <div class="answer-popup">
        <div class="popup-header">
          <span class="popup-title">写回答</span>
          <van-icon name="cross" size="20" @click="showAnswerPopup = false" />
        </div>
        <van-field
          v-model="answerText"
          type="textarea"
          placeholder="请输入回答内容..."
          :autosize="{ maxHeight: 200 }"
          class="answer-input"
        />
        <div class="popup-actions">
          <van-button type="primary" block :disabled="!answerText.trim()" @click="submitAnswer">
            发布回答
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getQuestionDetail, createAnswer } from '@/api/interaction'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const question = ref({
  title: '',
  user_name: '',
  user_avatar: '',
  content: '',
  tags: [],
  views: 0,
  answer_count: 0
})
const answers = ref([])
const isFavorited = ref(false)
const isAuthor = ref(false)
const showAnswerPopup = ref(false)
const answerText = ref('')

const loadQuestionDetail = async () => {
  try {
    const id = route.params.id
    const res = await getQuestionDetail(id)
    if (res.success) {
      question.value = res.data
      answers.value = res.data.answers || []
    }
  } catch (error) {
    console.error('加载问题详情失败:', error)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const goBack = () => {
  router.back()
}

const toggleFavorite = () => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }
  isFavorited.value = !isFavorited.value
  showToast(isFavorited.value ? '收藏成功' : '已取消收藏')
}

const likeAnswer = (item) => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }
  item.is_liked = !item.is_liked
  if (item.is_liked) {
    item.likes++
  } else {
    item.likes = Math.max(0, item.likes - 1)
  }
}

const replyToAnswer = (item) => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }
  showAnswerPopup.value = true
  answerText.value = `@${item.user_name} `
}

const submitAnswer = async () => {
  if (!userStore.isLoggedIn) {
    showAnswerPopup.value = false
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }
  
  if (!answerText.value.trim()) {
    showToast('请输入回答内容')
    return
  }
  
  try {
    const res = await createAnswer({
      question_id: route.params.id,
      content: answerText.value
    })
    if (res.success) {
      showToast('回答成功')
      showAnswerPopup.value = false
      answerText.value = ''
      question.value.answer_count++
      answers.value.unshift({
        id: Date.now(),
        content: res.data.content,
        user_name: userStore.user?.username,
        user_avatar: userStore.user?.avatar,
        likes: 0,
        is_liked: false,
        is_accepted: false,
        created_at: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('回答失败:', error)
  }
}

onMounted(() => {
  loadQuestionDetail()
})
</script>

<style scoped>
.question-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.question-detail {
  background: #fff;
}

.question-card {
  padding: 16px;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin: 0 0 16px;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 12px;
  color: #999;
}

.question-content {
  margin-bottom: 16px;
}

.question-content p {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin: 0;
}

.question-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.question-stats {
  display: flex;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.answers-section {
  margin-top: 10px;
  padding: 16px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.answer-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #f5f5f5;
}

.answer-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.answer-user {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.answer-time {
  font-size: 12px;
  color: #999;
}

.answer-content p {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin: 0 0 12px;
}

.answer-actions {
  display: flex;
  gap: 20px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
  cursor: pointer;
}

.answer-popup {
  padding: 16px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.answer-input {
  margin-bottom: 16px;
}

:deep(.van-field__control) {
  font-size: 14px;
}

:deep(.van-goods-action-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
