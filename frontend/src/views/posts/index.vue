<template>
  <div class="posts-page page-container">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="推荐">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              @click="goDetail(post.id)"
            />
          </van-list>
        </van-pull-refresh>
      </van-tab>
      <van-tab title="附近">
        <div class="empty-tip">
          <van-empty description="附近暂无动态" />
        </div>
      </van-tab>
      <van-tab title="关注">
        <van-pull-refresh v-model="refreshingFollow" @refresh="onRefreshFollow">
          <van-list
            v-model:loading="loadingFollow"
            :finished="finishedFollow"
            finished-text="没有更多了"
            @load="onLoadFollow"
          >
            <PostCard
              v-for="post in followPosts"
              :key="post.id"
              :post="post"
              @click="goDetail(post.id)"
            />
          </van-list>
        </van-pull-refresh>
      </van-tab>
    </van-tabs>
    <TabBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import TabBar from '@/components/TabBar.vue'
import PostCard from '@/components/PostCard.vue'

const router = useRouter()

const activeTab = ref(0)
const posts = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)

const followPosts = ref([])
const loadingFollow = ref(false)
const finishedFollow = ref(false)
const refreshingFollow = ref(false)
const followPage = ref(1)

const fetchPosts = async (type = 'recommend', pageNum = 1) => {
  try {
    const res = await request.get('/posts', {
      params: { type, page: pageNum, pageSize: 10 }
    })
    return res.data.list || []
  } catch (error) {
    console.error('获取动态失败:', error)
    return []
  }
}

const onLoad = async () => {
  const newPosts = await fetchPosts('recommend', page.value)
  if (refreshing.value) {
    posts.value = []
    refreshing.value = false
  }
  posts.value = [...posts.value, ...newPosts]
  loading.value = false
  if (newPosts.length < 10) {
    finished.value = true
  }
  page.value++
}

const onRefresh = () => {
  finished.value = false
  page.value = 1
  onLoad()
}

const onLoadFollow = async () => {
  const newPosts = await fetchPosts('following', followPage.value)
  if (refreshingFollow.value) {
    followPosts.value = []
    refreshingFollow.value = false
  }
  followPosts.value = [...followPosts.value, ...newPosts]
  loadingFollow.value = false
  if (newPosts.length < 10) {
    finishedFollow.value = true
  }
  followPage.value++
}

const onRefreshFollow = () => {
  finishedFollow.value = false
  followPage.value = 1
  onLoadFollow()
}

const goDetail = (id) => {
  router.push(`/posts/${id}`)
}
</script>

<style scoped>
.posts-page {
  padding-bottom: 50px;
}

.empty-tip {
  padding: 40px 20px;
}
</style>
