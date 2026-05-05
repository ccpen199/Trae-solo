<template>
  <div class="messages-page">
    <van-nav-bar title="消息中心" left-arrow @click-left="goBack" />
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="系统消息">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-cell-group inset>
            <van-cell
              v-for="item in messageList"
              :key="item.id"
              :title="item.content"
              :label="formatDate(item.created_at)"
              is-link
              @click="readMessage(item)"
            >
              <template #right-icon>
                <van-badge :content="item.is_read ? 0 : 1" v-if="!item.is_read" />
              </template>
            </van-cell>
          </van-cell-group>
          <van-empty description="暂无消息" v-if="!loading && messageList.length === 0" />
        </van-list>
      </van-tab>
      
      <van-tab title="互动消息">
        <van-list
          v-model:loading="interactiveLoading"
          :finished="interactiveFinished"
          finished-text="没有更多了"
          @load="onInteractiveLoad"
        >
          <div class="interactive-list">
            <div v-for="item in interactiveList" :key="item.id" class="interactive-item">
              <van-avatar :src="item.from_user_avatar" size="44" />
              <div class="interactive-content">
                <div class="interactive-header">
                  <span class="user-name">{{ item.from_user_name }}</span>
                  <span class="interactive-time">{{ formatDate(item.created_at) }}</span>
                </div>
                <p class="interactive-text">{{ item.content }}</p>
              </div>
            </div>
          </div>
          <van-empty description="暂无互动消息" v-if="!interactiveLoading && interactiveList.length === 0" />
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMessages } from '@/api/interaction'
import { showToast } from 'vant'

const router = useRouter()

const activeTab = ref(0)
const loading = ref(false)
const finished = ref(false)
const messageList = ref([])
const page = ref(1)
const pageSize = 10

const interactiveLoading = ref(false)
const interactiveFinished = ref(false)
const interactiveList = ref([])
const interactivePage = ref(1)

const loadMessages = async () => {
  try {
    const res = await getMessages({
      page: page.value,
      page_size: pageSize
    })
    if (res.success) {
      if (page.value === 1) {
        messageList.value = res.data.list
      } else {
        messageList.value.push(...res.data.list)
      }
      
      if (res.data.list.length < pageSize) {
        finished.value = true
      }
    }
  } catch (error) {
    console.error('加载消息列表失败:', error)
  }
}

const onLoad = async () => {
  page.value++
  await loadMessages()
  loading.value = false
}

const onInteractiveLoad = async () => {
  interactivePage.value++
  interactiveLoading.value = false
  interactiveFinished.value = true
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const goBack = () => {
  router.back()
}

const readMessage = (item) => {
  item.is_read = true
  showToast('已读')
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: #f5f5f5;
}

:deep(.van-tabs__wrap) {
  background: #fff;
}

:deep(.van-tab--active) {
  color: #667eea;
}

:deep(.van-tabs__line) {
  background: #667eea;
}

:deep(.van-cell-group--inset) {
  margin: 10px 16px;
  border-radius: 8px;
}

.interactive-list {
  padding: 10px;
}

.interactive-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
}

.interactive-content {
  flex: 1;
}

.interactive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.interactive-time {
  font-size: 12px;
  color: #999;
}

.interactive-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}
</style>
