<template>
  <div class="messages-page page-container">
    <van-nav-bar title="消息" />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="32px">加载中...</van-loading>
    </div>
    
    <div v-else-if="conversations.length === 0" class="empty-container">
      <van-empty description="暂无消息" />
    </div>
    
    <div v-else class="conversation-list">
      <div
        v-for="item in conversations"
        :key="item.user_id"
        class="conversation-item card flex"
        @click="goChat(item.user_id)"
      >
        <img :src="item.avatar" class="avatar" />
        <div class="conversation-info flex-1 ml-12">
          <div class="flex-between">
            <span class="nickname">{{ item.nickname }}</span>
            <span class="time text-gray">{{ formatTime(item.last_message_time) }}</span>
          </div>
          <div class="last-message text-gray ellipsis mt-4">{{ item.last_message }}</div>
        </div>
        <van-badge v-if="item.unread_count > 0" :content="item.unread_count" class="badge" />
      </div>
    </div>
    
    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()

const loading = ref(true)
const conversations = ref([])

const fetchConversations = async () => {
  try {
    const res = await request.get('/messages/conversations')
    conversations.value = res.data || []
  } catch (error) {
    console.error('获取会话列表失败:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const goChat = (userId) => {
  router.push(`/messages/${userId}`)
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.messages-page {
  padding-bottom: 50px;
}

.loading-container,
.empty-container {
  padding: 60px 20px;
  text-align: center;
}

.conversation-list {
  padding: 8px;
}

.conversation-item {
  margin-bottom: 8px;
  padding: 12px;
  align-items: center;
  position: relative;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.nickname {
  font-size: 15px;
  font-weight: 500;
}

.time {
  font-size: 12px;
}

.last-message {
  font-size: 13px;
}

.badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.mt-4 {
  margin-top: 4px;
}

.ml-12 {
  margin-left: 12px;
}
</style>
