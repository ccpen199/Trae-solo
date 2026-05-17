<template>
  <div class="questions-page page-container">
    <van-tabs v-model:activeTab" sticky>
      <van-tab title="热门">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <QuestionCard
              v-for="question in questions"
              :key="question.id"
              :question="question"
              @click="goDetail(question.id)"
            />
          </van-list>
        </van-pull-refresh>
      </van-tab>
      <van-tab title="推荐">
        <van-empty description="推荐功能开发中" />
      </van-tab>
      <van-tab title="分类">
        <div class="category-grid">
          <div v-for="cat in categories" :key="cat" class="category-item" @click="selectCategory(cat)">
            <span>{{ cat }}</span>
          </div>
        </div>
      </van-tab>
    </van-tabs>
    
    <van-fab icon="plus" @click="publishQuestion" />
    
    <TabBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import TabBar from '@/components/TabBar.vue'
import QuestionCard from '@/components/QuestionCard.vue'

const router = useRouter()

const activeTab = ref(0)
const questions = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)

const categories = ['健康', '饲养', '行为', '训练', '美容', '其他']

const fetchQuestions = async (type = 'hot', pageNum = 1) => {
  try {
    const res = await request.get('/questions', {
      params: { type, page: pageNum, pageSize: 10 }
    })
    return res.data.list || []
  } catch (error) {
    console.error('获取问题失败:', error)
    return []
  }
}

const onLoad = async () => {
  const newQuestions = await fetchQuestions('hot', page.value)
  if (refreshing.value) {
    questions.value = []
    refreshing.value = false
  }
  questions.value = [...questions.value, ...newQuestions]
  loading.value = false
  if (newQuestions.length < 10) {
    finished.value = true
  }
  page.value++
}

const onRefresh = () => {
  finished.value = false
  page.value = 1
  onLoad()
}

const goDetail = (id) => {
  router.push(`/questions/${id}`)
}

const publishQuestion = () => {
  router.push('/questions/publish')
}

const selectCategory = (cat) => {
  console.log('选择分类:', cat)
}
</script>

<style scoped>
.questions-page {
  padding-bottom: 50px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
}

.category-item {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.category-item:active {
  background: #f5f5f5;
}
</style>
