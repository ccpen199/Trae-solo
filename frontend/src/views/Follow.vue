<template>
  <div class="min-h-screen bg-pdd-bg pb-16">
    <div class="sticky top-0 bg-white z-30 border-b">
      <div class="px-3 py-2">
        <h1 class="text-center font-medium text-lg">关注</h1>
      </div>
      <div class="flex overflow-x-auto px-3">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="currentTab = tab.key"
          class="px-4 py-2 text-sm whitespace-nowrap border-b-2"
          :class="currentTab === tab.key ? 'border-pdd-red text-pdd-red font-medium' : 'border-transparent text-gray-500'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <div v-if="currentTab === 'live'">
      <div v-if="liveLoading" class="py-10">
        <Loading />
      </div>
      <div v-else-if="lives.length === 0" class="py-20">
        <Empty icon="📺" text="暂无直播" />
      </div>
      <div v-else class="p-3 grid grid-cols-2 gap-2">
        <div
          v-for="live in lives"
          :key="live.id"
          class="bg-white rounded-lg overflow-hidden"
          @click="goToLive(live.id)"
        >
          <div class="relative">
            <img :src="live.cover" class="w-full aspect-video object-cover" />
            <div class="absolute top-2 left-2 px-2 py-0.5 bg-pdd-red text-white text-xs rounded-full flex items-center gap-1">
              <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              直播中
            </div>
            <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full">
              {{ live.viewers }} 人观看
            </div>
          </div>
          <div class="p-2">
            <h3 class="text-sm line-clamp-1">{{ live.title }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ live.shop_name }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentTab === 'follows'">
      <div v-if="followLoading" class="py-10">
        <Loading />
      </div>
      <div v-else-if="follows.length === 0" class="py-20">
        <Empty icon="❤️" text="暂无关注的店铺" />
      </div>
      <div v-else class="p-3 space-y-2">
        <div
          v-for="shop in follows"
          :key="shop.id"
          class="bg-white rounded-lg p-3 flex items-center gap-3"
        >
          <img :src="shop.avatar" class="w-12 h-12 rounded-full" />
          <div class="flex-1">
            <div class="font-medium">{{ shop.name }}</div>
            <div class="text-xs text-gray-400">{{ shop.followers }} 粉丝</div>
          </div>
          <button
            @click="toggleFollow(shop)"
            class="px-4 py-1 text-sm rounded-full border"
            :class="shop.is_follow ? 'border-gray-300 text-gray-500' : 'border-pdd-red text-pdd-red'"
          >
            {{ shop.is_follow ? '已关注' : '+ 关注' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="currentTab === 'dynamic'">
      <div v-if="dynamicLoading" class="py-10">
        <Loading />
      </div>
      <div v-else-if="dynamics.length === 0" class="py-20">
        <Empty icon="📝" text="暂无动态" />
      </div>
      <div v-else class="p-3 space-y-2">
        <div
          v-for="dynamic in dynamics"
          :key="dynamic.id"
          class="bg-white rounded-lg p-3"
        >
          <div class="flex items-center gap-3 mb-2">
            <img :src="dynamic.shop_avatar" class="w-10 h-10 rounded-full" />
            <div class="flex-1">
              <div class="font-medium text-sm">{{ dynamic.shop_name }}</div>
              <div class="text-xs text-gray-400">{{ formatTime(dynamic.created_at) }}</div>
            </div>
          </div>
          <p class="text-sm text-gray-700 mb-2">{{ dynamic.content }}</p>
          <div v-if="dynamic.images?.length > 0" class="grid grid-cols-3 gap-1">
            <img
              v-for="(img, index) in dynamic.images.slice(0, 3)"
              :key="index"
              :src="img"
              class="w-full aspect-square object-cover rounded"
            />
          </div>
          <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <button @click="toggleLike(dynamic)" class="flex items-center gap-1">
              <span>{{ dynamic.is_liked ? '❤️' : '🤍' }}</span>
              <span>{{ dynamic.like_count }}</span>
            </button>
            <span class="flex items-center gap-1">
              <span>💬</span>
              <span>{{ dynamic.comment_count }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../stores/toast'
import { liveApi, followApi, dynamicApi } from '../api'
import TabBar from '../components/TabBar.vue'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'

const router = useRouter()
const toast = useToast()

const tabs = [
  { key: 'live', name: '直播' },
  { key: 'follows', name: '我的关注' },
  { key: 'dynamic', name: '关注动态' }
]

const currentTab = ref('live')
const liveLoading = ref(true)
const followLoading = ref(true)
const dynamicLoading = ref(true)
const lives = ref([])
const follows = ref([])
const dynamics = ref([])

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString()
}

async function loadLives() {
  liveLoading.value = true
  try {
    const res = await liveApi.getList()
    if (res.success) {
      lives.value = res.data?.list || []
    }
  } catch (e) {
    console.error('加载直播列表失败:', e)
  } finally {
    liveLoading.value = false
  }
}

async function loadFollows() {
  followLoading.value = true
  try {
    const res = await followApi.getList()
    if (res.success) {
      follows.value = res.data?.list || []
    }
  } catch (e) {
    console.error('加载关注列表失败:', e)
  } finally {
    followLoading.value = false
  }
}

async function loadDynamics() {
  dynamicLoading.value = true
  try {
    const res = await dynamicApi.getList()
    if (res.success) {
      dynamics.value = res.data?.list || []
    }
  } catch (e) {
    console.error('加载动态列表失败:', e)
  } finally {
    dynamicLoading.value = false
  }
}

async function toggleFollow(shop) {
  try {
    const res = await followApi.toggle(shop.id)
    if (res.success) {
      shop.is_follow = res.data.is_follow
      toast.success(res.data.is_follow ? '已关注' : '已取消关注')
    }
  } catch (e) {
    console.error('关注失败:', e)
  }
}

async function toggleLike(dynamic) {
  try {
    const res = await dynamicApi.toggleLike(dynamic.id)
    if (res.success) {
      dynamic.is_liked = res.data.is_liked
      dynamic.like_count += res.data.is_liked ? 1 : -1
    }
  } catch (e) {
    console.error('点赞失败:', e)
  }
}

function goToLive(liveId) {
  router.push(`/live/${liveId}`)
}

onMounted(() => {
  loadLives()
  loadFollows()
  loadDynamics()
})
</script>
