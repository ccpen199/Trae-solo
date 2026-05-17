<template>
  <div class="messages-page">
    <van-nav-bar title="消息" left-arrow @click-left="goBack" fixed />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-if="conversations.length === 0 && !loading" class="empty-state">
          <van-empty description="暂无消息" />
        </div>
        <div v-else class="conversation-list">
          <div
            v-for="conversation in conversations"
            :key="conversation.user.id"
            class="conversation-item"
            @click="goChat(conversation.user.id)"
          >
            <van-image
              :src="conversation.user.avatar || 'https://picsum.photos/100/100'"
              round
              class="avatar"
            />
            <div class="conversation-info">
              <div class="conversation-header">
                <span class="username">{{ conversation.user.nickname || conversation.user.username }}</span>
                <span class="time">{{ formatTime(conversation.lastMessage.createdAt) }}</span>
              </div>
              <div class="last-message">{{ conversation.lastMessage.content }}</div>
            </div>
            <van-badge v-if="conversation.unreadCount > 0" :content="conversation.unreadCount" type="danger" />
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'

interface User {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

interface Message {
  id: number
  content: string
  senderId: number
  receiverId: number
  isRead: boolean
  createdAt: string
}

interface Conversation {
  user: User
  lastMessage: Message
  unreadCount: number
}

const router = useRouter()

const conversations = ref<Conversation[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const fetchConversations = async () => {
  try {
    const res = await request.get('/messages/conversations')
    conversations.value = res.data
    finished.value = true
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onLoad = () => {
  fetchConversations()
}

const onRefresh = () => {
  finished.value = false
  fetchConversations()
}

const goBack = () => {
  router.back()
}

const goChat = (userId: number) => {
  router.push(`/chat/${userId}`)
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.messages-page {
  padding-top: 46px;
  padding-bottom: 30px;
  min-height: 100vh;
  background: #f5f5f5;
}

.conversation-list {
  padding: 10px;
}

.conversation-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  position: relative;
}

.avatar {
  width: 50px;
  height: 50px;
  margin-right: 15px;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.username {
  font-size: 15px;
  font-weight: 500;
}

.time {
  font-size: 12px;
  color: #999;
}

.last-message {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 50px 0;
}
</style>
