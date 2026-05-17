<template>
  <div class="chat-page">
    <van-nav-bar :title="targetUser?.nickname || '聊天'" left-arrow @click-left="$router.back()" />
    
    <div ref="chatContainer" class="chat-container">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" size="24px">加载中...</van-loading>
      </div>
      
      <div v-else class="message-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ 'is-mine': msg.from_user_id === currentUserId }"
        >
          <img
            :src="msg.from_user_id === currentUserId ? userStore.userInfo?.avatar : targetUser?.avatar"
            class="message-avatar"
          />
          <div class="message-content">
            <div class="message-bubble">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="input-area">
      <van-field
        v-model="inputText"
        placeholder="输入消息..."
        :border="false"
        @keyup.enter="sendMessage"
      />
      <van-button type="primary" size="small" @click="sendMessage" :disabled="!inputText.trim()">
        发送
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const targetUserId = route.params.userId
const currentUserId = ref(userStore.userInfo?.id)
const targetUser = ref({})
const messages = ref([])
const loading = ref(true)
const inputText = ref('')
const chatContainer = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const fetchTargetUser = async () => {
  try {
    const res = await request.get(`/users/${targetUserId}`)
    targetUser.value = res.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const fetchMessages = async () => {
  try {
    const res = await request.get(`/messages/${targetUserId}`)
    messages.value = res.data?.list || []
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return
  
  const content = inputText.value.trim()
  inputText.value = ''
  
  const tempMsg = {
    id: Date.now(),
    from_user_id: currentUserId.value,
    content,
    created_at: new Date().toISOString()
  }
  messages.value.push(tempMsg)
  scrollToBottom()
  
  try {
    await request.post(`/messages/${targetUserId}`, { content })
  } catch (error) {
    console.error('发送消息失败:', error)
    showToast('发送失败')
  }
}

onMounted(async () => {
  await Promise.all([fetchTargetUser(), fetchMessages()])
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.loading-container {
  padding: 40px 20px;
  text-align: center;
}

.message-list {
  display: flex;
  flex-direction: column;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-end;
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  margin: 0 12px;
}

.message-bubble {
  padding: 10px 14px;
  background: #fff;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-item.is-mine .message-bubble {
  background: #1989fa;
  color: #fff;
}

.input-area {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #eee;
}

.input-area .van-field {
  flex: 1;
  margin-right: 8px;
}
</style>
