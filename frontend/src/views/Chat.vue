<template>
  <div class="chat-page">
    <van-nav-bar :title="chatUser?.nickname || chatUser?.username || '聊天'" left-arrow @click-left="goBack" fixed />

    <div class="messages-container" ref="messagesContainer">
      <van-loading v-if="loading" class="loading" />
      <div v-else class="message-list">
        <div v-if="messages.length === 0" class="empty-state">
          <van-empty description="暂无消息，开始聊天吧" />
        </div>
        <div v-for="message in messages" :key="message.id" class="message-item" :class="{ 'is-mine': message.senderId === currentUserId }">
          <van-image
            :src="message.senderId === currentUserId ? (userStore.user?.avatar || 'https://picsum.photos/100/100') : (chatUser?.avatar || 'https://picsum.photos/100/100')"
            round
            class="message-avatar"
          />
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <van-field
        v-model="inputMessage"
        placeholder="输入消息..."
        :border="false"
        @keyup.enter="sendMessage"
      />
      <van-button type="primary" size="small" @click="sendMessage" :loading="sending">发送</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

interface Message {
  id: number
  content: string
  senderId: number
  receiverId: number
  isRead: boolean
  createdAt: string
}

interface User {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const messages = ref<Message[]>([])
const loading = ref(true)
const sending = ref(false)
const inputMessage = ref('')
const chatUser = ref<User | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

const currentUserId = computed(() => userStore.user?.id || 0)

const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const fetchMessages = async () => {
  try {
    const res = await request.get(`/messages/${route.params.userId}`)
    messages.value = res.data
    scrollToBottom()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const fetchChatUser = async () => {
  const userId = Number(route.params.userId)
  chatUser.value = {
    id: userId,
    username: `用户${userId}`,
    nickname: `用户${userId}`
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || sending.value) return
  sending.value = true
  try {
    await request.post(`/messages/${route.params.userId}`, {
      content: inputMessage.value
    })
    inputMessage.value = ''
    await fetchMessages()
  } catch {
    showToast('发送失败')
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchChatUser()
  fetchMessages()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 56px 10px 70px;
}

.loading {
  padding: 50px 0;
  text-align: center;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-text {
  background: #fff;
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.is-mine .message-text {
  background: #1989fa;
  color: #fff;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.is-mine .message-time {
  text-align: right;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-top: 1px solid #eee;
}

.input-area .van-field {
  flex: 1;
  margin-right: 10px;
}

.empty-state {
  padding: 50px 0;
}
</style>
