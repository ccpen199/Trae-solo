<template>
  <div class="chat-page">
    <div class="chat-header">
      <el-button @click="$router.back()" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div class="user-info">
        <div class="avatar-small" :style="{ background: getAvatarColor(otherUserId) }">
          {{ getAvatarEmoji(otherUserId) }}
        </div>
        <span>聊天</span>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div v-if="loading" class="loading-messages">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>
      <div v-else class="message-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ 'own': msg.from_user_id === currentUserId }"
        >
          <div class="message-avatar" :style="{ background: getAvatarColor(msg.from_user_id) }">
            {{ getAvatarEmoji(msg.from_user_id) }}
          </div>
          <div class="message-content">
            <div class="message-bubble">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <el-input
        v-model="inputMessage"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
      >
        <template #append>
          <el-button :loading="sending" @click="sendMessage">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import { ArrowLeft, Loading, Promotion } from '@element-plus/icons-vue'
import request from '../utils/request'

const route = useRoute()
const userStore = useUserStore()
const otherUserId = route.params.userId
const currentUserId = userStore.currentUserId
const messages = ref([])
const inputMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const messagesContainer = ref(null)

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const avatarEmojis = ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻']

const getAvatarColor = (id) => avatarColors[(id - 1) % avatarColors.length]
const getAvatarEmoji = (id) => avatarEmojis[(id - 1) % avatarEmojis.length]

const formatTime = (time) => {
  const date = new Date(time)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const fetchMessages = async () => {
  try {
    const res = await request.get(`/messages/${otherUserId}`)
    messages.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || sending.value) return
  
  try {
    sending.value = true
    await request.post('/messages', {
      toUserId: otherUserId,
      content: inputMessage.value
    })
    inputMessage.value = ''
    await fetchMessages()
    nextTick(scrollToBottom)
  } catch (e) {
    console.error(e)
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  fetchMessages()
  setInterval(fetchMessages, 5000)
})
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background: white;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.chat-header .el-button {
  background: #f3f4f6;
  border: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
}

.avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading-messages {
  text-align: center;
  padding: 40px;
  color: #999;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-item {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-item.own {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #333;
  line-height: 1.5;
}

.message-item.own .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.message-item.own .message-time {
  text-align: right;
}

.input-area {
  background: white;
  padding: 15px 20px;
  padding-bottom: max(15px, env(safe-area-inset-bottom));
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-area .el-input :deep(.el-input__wrapper) {
  border-radius: 25px;
  padding-right: 10px;
}

.input-area .el-input :deep(.el-input__group-btn .el-button) {
  border-radius: 0 25px 25px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}
</style>
