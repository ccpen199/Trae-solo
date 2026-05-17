<template>
  <div class="qa-page">
    <van-nav-bar title="问答" fixed>
      <template #left>
        <van-icon name="search" size="20" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <van-search
      v-model="searchKeyword"
      v-model:show="showSearch"
      placeholder="搜索问题"
      @search="handleSearch"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-if="questions.length === 0 && !loading" class="empty-state">
          <van-empty description="暂无问题" />
        </div>
        <div v-else class="question-list">
          <div v-for="question in questions" :key="question.id" class="question-item" @click="goDetail(question.id)">
            <div class="question-title">{{ question.title }}</div>
            <div class="question-content">{{ question.content }}</div>
            <div v-if="question.topics && question.topics.length > 0" class="question-topics">
              <van-tag v-for="(topic, idx) in question.topics.slice(0, 3)" :key="idx" type="primary" plain size="small">
                {{ topic }}
              </van-tag>
            </div>
            <div class="question-footer">
              <div class="user-info">
                <van-image :src="question.user.avatar || 'https://picsum.photos/50/50'" round class="avatar" />
                <span class="username">{{ question.user.nickname || question.user.username }}</span>
              </div>
              <div class="stats">
                <span><van-icon name="comment-o" /> {{ question.answerCount || 0 }}</span>
                <span><van-icon name="like-o" /> {{ question.likeCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import type { Question } from '@/types'

const router = useRouter()

const questions = ref<Question[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const showSearch = ref(false)
const searchKeyword = ref('')

const fetchQuestions = async () => {
  try {
    const res = await request.get('/questions', {
      params: {
        page: page.value,
        pageSize: 10,
        search: searchKeyword.value
      }
    })
    if (refreshing.value) {
      questions.value = res.data.list
      refreshing.value = false
    } else {
      questions.value = [...questions.value, ...res.data.list]
    }
    finished.value = questions.value.length >= res.data.total
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const onLoad = () => {
  if (!refreshing.value) {
    page.value++
  }
  fetchQuestions()
}

const onRefresh = () => {
  finished.value = false
  page.value = 1
  fetchQuestions()
}

const handleSearch = () => {
  refreshing.value = false
  page.value = 1
  questions.value = []
  finished.value = false
  fetchQuestions()
}

const goDetail = (id: number) => {
  router.push(`/question/${id}`)
}

onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
.qa-page {
  padding-top: 46px;
  padding-bottom: 50px;
}

.question-list {
  padding: 10px;
}

.question-item {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
}

.question-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.question-content {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-topics {
  margin-bottom: 12px;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 28px;
  height: 28px;
  margin-right: 8px;
}

.username {
  font-size: 13px;
  color: #666;
}

.stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  padding: 50px 0;
}
</style>
