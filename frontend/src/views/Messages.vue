<template>
  <div class="messages-page">
    <div class="header">
      <h1>消息</h1>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>
      <div v-else-if="conversations.length === 0" class="empty">
        <el-icon :size="60"><ChatDotRound /></el-icon>
        <p>暂无消息</p>
      </div>
      <div v-else class="conversation-list">
        <div
          v-for="item in conversations"
          :key="item.user.id"
          class="conversation-item"
          @click="goToChat(item.user.id)"
        >
          <div class="avatar" :style="{ background: getAvatarColor(item.user.id) }">
            {{ getAvatarEmoji(item.user.id) }}
          </div>
          <div class="info">
            <div class="name">用户{{ item.user.id }}</div>
            <div class="time">{{ formatTime(item.last_message_time) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/')">
        <el-icon><Planet /></el-icon>
        <span>星球</span>
      </div>
      <div class="nav-item" @click="$router.push('/square')">
        <el-icon><Document /></el-icon>
        <span>广场</span>
      </div>
      <div class="nav-item match-btn" @click="$router.push('/match')">
        <el-icon><Connection /></el-icon>
        <span>匹配</span>
      </div>
      <div class="nav-item active">
        <el-icon><ChatDotRound /></el-icon>
        <span>消息</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, ChatDotRound, Planet, Document, Connection } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()

const loading = ref(true)
const conversations = ref([])

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const avatarEmojis = ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻']

const getAvatarColor = (id) => avatarColors[(id - 1) % avatarColors.length]
const getAvatarEmoji = (id) => avatarEmojis[(id - 1) % avatarEmojis.length]

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const fetchConversations = async () => {
  try {
    loading.value = true
    const res = await request.get('/messages/conversations')
    conversations.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const goToChat = (userId) => {
  router.push(`/chat/${userId}`)
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
}

.header h1 {
  font-size: 28px;
  margin: 0;
}

.content {
  padding: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty .el-icon {
  margin-bottom: 15px;
}

.conversation-list {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: #f9f9f9;
}

.conversation-item:last-child {
  border-bottom: none;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.nav-item.active {
  color: #667eea;
}

.nav-item.match-btn {
  color: #667eea;
}

.nav-item.match-btn .el-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -8px;
}
</style>
