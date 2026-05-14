<template>
  <div class="min-h-screen bg-pdd-bg pb-16">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b">
      <h1 class="text-center font-medium text-lg">聊天</h1>
    </div>

    <div v-if="loading" class="py-10">
      <Loading />
    </div>

    <div v-else-if="sessions.length === 0" class="py-20">
      <Empty icon="💬" text="暂无聊天记录" />
    </div>

    <div v-else>
      <div
        v-for="session in sessions"
        :key="session.id"
        class="bg-white p-3 flex items-center gap-3 border-b"
        @click="goToChatRoom(session.id)"
      >
        <img :src="session.avatar" class="w-12 h-12 rounded-full" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ session.name }}</span>
            <span class="text-xs text-gray-400">{{ session.last_time }}</span>
          </div>
          <p class="text-sm text-gray-500 line-clamp-1 mt-1">{{ session.last_message }}</p>
        </div>
        <span v-if="session.unread > 0" class="px-2 py-0.5 bg-pdd-red text-white text-xs rounded-full">
          {{ session.unread }}
        </span>
      </div>

      <div class="bg-white mt-2 p-3">
        <h3 class="font-medium mb-2">常用联系</h3>
        <div class="flex gap-4 overflow-x-auto">
          <button class="flex flex-col items-center min-w-[60px]" @click="goToChatRoom('service')">
            <div class="w-12 h-12 rounded-full bg-pdd-red/10 flex items-center justify-center">
              <span class="text-xl">👩‍💼</span>
            </div>
            <span class="text-xs text-gray-600 mt-1">官方客服</span>
          </button>
          <button class="flex flex-col items-center min-w-[60px]" @click="goToChatRoom('seller')">
            <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <span class="text-xl">🏪</span>
            </div>
            <span class="text-xs text-gray-600 mt-1">商家客服</span>
          </button>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '../api'
import TabBar from '../components/TabBar.vue'
import Loading from '../components/Loading.vue'
import Empty from '../components/Empty.vue'

const router = useRouter()

const loading = ref(true)
const sessions = ref([])

async function loadSessions() {
  loading.value = true
  try {
    const res = await messageApi.getSessions()
    if (res.success) {
      sessions.value = res.data || []
    }
  } catch (e) {
    console.error('加载会话列表失败:', e)
  } finally {
    loading.value = false
  }
}

function goToChatRoom(sessionId) {
  router.push(`/chat/${sessionId}`)
}

onMounted(() => {
  loadSessions()
})
</script>
