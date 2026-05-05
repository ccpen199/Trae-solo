<template>
  <div class="questions-page">
    <van-nav-bar title="问答" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="edit" size="20" @click="goToCreate" />
      </template>
    </van-nav-bar>
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="最新">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <div class="question-list">
              <div 
                v-for="item in questionList" 
                :key="item.id" 
                class="question-item"
                @click="goToDetail(item)"
              >
                <h3 class="question-title">{{ item.title }}</h3>
                <p class="question-content" v-if="item.content">{{ stripHtml(item.content) }}</p>
                <div class="question-meta">
                  <div class="author-info">
                    <van-avatar :src="item.user_avatar" size="24" />
                    <span class="author-name">{{ item.user_name }}</span>
                  </div>
                  <div class="question-stats">
                    <span class="stat">
                      <van-icon name="eye-o" size="12" />
                      {{ item.views }}
                    </span>
                    <span class="stat">
                      <van-icon name="chat-o" size="12" />
                      {{ item.answer_count }}回答
                    </span>
                  </div>
                </div>
                <div class="question-tags" v-if="item.tags?.length">
                  <van-tag 
                    v-for="tag in item.tags.slice(0, 3)" 
                    :key="tag"
                    size="small"
                    plain
                    type="primary"
                  >
                    {{ tag }}
                  </van-tag>
                </div>
              </div>
            </div>
            <van-empty description="暂无问题" v-if="!loading && questionList.length === 0" />
          </van-list>
        </van-pull-refresh>
      </van-tab>
      
      <van-tab title="热门">
        <van-list
          v-model:loading="hotLoading"
          :finished="hotFinished"
          finished-text="没有更多了"
          @load="onHotLoad"
        >
          <van-empty description="暂无热门问题" v-if="!hotLoading && hotList.length === 0" />
        </van-list>
      </van-tab>
      
      <van-tab title="我的">
        <van-empty description="暂无提问" v-if="myList.length === 0">
          <template #description>
            <p>还没有提出问题</p>
          </template>
          <van-button type="primary" round @click="goToCreate">
            去提问
          </van-button>
        </van-empty>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getQuestions } from '@/api/interaction'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 10
const questionList = ref([])

const hotLoading = ref(false)
const hotFinished = ref(false)
const hotList = ref([])
const myList = ref([])

const loadQuestions = async () => {
  try {
    const res = await getQuestions({
      page: page.value,
      page_size: pageSize
    })
    if (res.success) {
      if (page.value === 1) {
        questionList.value = res.data.list
      } else {
        questionList.value.push(...res.data.list)
      }
      
      if (res.data.list.length < pageSize) {
        finished.value = true
      }
    }
  } catch (error) {
    console.error('加载问答列表失败:', error)
  }
}

const onLoad = async () => {
  page.value++
  await loadQuestions()
  loading.value = false
}

const onRefresh = async () => {
  page.value = 1
  finished.value = false
  await loadQuestions()
  refreshing.value = false
}

const onHotLoad = async () => {
  hotLoading.value = false
  hotFinished.value = true
}

const stripHtml = (str) => {
  return str?.replace(/<[^>]*>/g, '').substring(0, 60) + '...' || ''
}

const goBack = () => {
  router.back()
}

const goToDetail = (item) => {
  router.push(`/question/${item.id}`)
}

const goToCreate = () => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: { redirect: '/questions' }
    })
    return
  }
  // router.push('/question/create')
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.questions-page {
  min-height: 100vh;
  background: #f5f5f5;
}

:deep(.van-tabs__wrap) {
  background: #fff;
}

:deep(.van-tab--active) {
  color: #667eea;
}

:deep(.van-tabs__line) {
  background: #667eea;
}

.question-list {
  padding: 10px;
}

.question-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin: 0 0 8px;
}

.question-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 12px;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  color: #666;
}

.question-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 2px;
}

.question-tags {
  display: flex;
  gap: 6px;
}
</style>
