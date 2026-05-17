<template>
  <div class="question-detail-page">
    <van-nav-bar title="问题详情" left-arrow @click-left="$router.back()" />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="32px">加载中...</van-loading>
    </div>
    
    <div v-else class="question-content">
      <div class="question-header card">
        <h1 class="question-title">{{ question.title }}</h1>
        
        <div class="user-info flex mt-12">
          <img :src="question.avatar" class="avatar-small" />
          <span class="nickname ml-8">{{ question.nickname }}</span>
          <span v-if="question.category" class="category-tag ml-8">{{ question.category }}</span>
        </div>
        
        <div class="question-text mt-12">{{ question.content }}</div>
        
        <div class="vote-actions flex-center mt-16">
          <van-button 
            size="small" 
            :type="question.my_vote === 1 ? 'primary' : 'default'"
            @click="handleVote(1)"
          >
            <van-icon name="arrow-up" /> 赞同 ({{ question.agree_count || 0 }})
          </van-button>
          <van-button 
            size="small" 
            :type="question.my_vote === -1 ? 'danger' : 'default'"
            class="ml-12"
            @click="handleVote(-1)"
          >
            <van-icon name="arrow-down" /> 反对 ({{ question.disagree_count || 0 }})
          </van-button>
          <van-button 
            size="small" 
            :type="question.is_favorited ? 'warning' : 'default'"
            class="ml-12"
            @click="handleFavorite"
          >
            <van-icon name="star-o" /> 收藏
          </van-button>
        </div>
      </div>
      
      <div class="answers-section">
        <div class="section-title">回答 ({{ question.answers?.length || 0 }})</div>
        
        <div v-if="!question.answers?.length" class="empty-answers">
          <van-empty description="暂无回答" />
        </div>
        
        <div v-for="answer in question.answers" :key="answer.id" class="answer-item card">
          <div class="flex">
            <img :src="answer.avatar" class="avatar-small" />
            <div class="flex-1 ml-8">
              <div class="answer-user">{{ answer.nickname }}</div>
              <div class="answer-text">{{ answer.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const questionId = route.params.id
const question = ref({})
const loading = ref(true)

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/questions/${questionId}`)
    question.value = res.data
  } catch (err) {
    console.error('获取问题详情失败:', err)
  } finally {
    loading.value = false
  }
}

const handleVote = async (voteType) => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await request.post(`/questions/${questionId}/vote`, { vote_type: voteType })
    await fetchDetail()
    showToast(voteType === 1 ? '已赞同' : '已反对')
  } catch (error) {
    console.error('投票失败:', error)
  }
}

const handleFavorite = async () => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await request.post(`/questions/${questionId}/favorite`)
    await fetchDetail()
    showToast(question.value.is_favorited ? '已收藏' : '已取消收藏')
  } catch (error) {
    console.error('收藏失败:', error)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.question-detail-page {
  padding-bottom: 20px;
}

.loading-container {
  padding: 60px 20px;
  text-align: center;
}

.question-header {
  margin: 8px;
}

.question-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: #333;
}

.avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.nickname {
  font-size: 13px;
  color: #666;
}

.category-tag {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 10px;
  font-size: 11px;
  color: #666;
}

.question-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.vote-actions {
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.answers-section {
  margin-top: 12px;
}

.section-title {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.empty-answers {
  padding: 20px;
}

.answer-item {
  margin: 0 8px 8px;
}

.answer-user {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.answer-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.mt-8 {
  margin-top: 8px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-16 {
  margin-top: 16px;
}

.ml-8 {
  margin-left: 8px;
}

.ml-12 {
  margin-left: 12px;
}
</style>
