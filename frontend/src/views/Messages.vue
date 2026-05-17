<template>
  <div class="messages-page">
    <div class="page-header">
      <h2>消息中心</h2>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon :size="48"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchMessages">重试</el-button>
    </div>
    
    <div v-else-if="messages.length === 0" class="empty-container">
      <el-icon :size="64"><ChatDotRound /></el-icon>
      <p>暂无消息</p>
      <p class="sub-text">有新消息会在这里显示</p>
    </div>
    
    <div v-else class="messages-list">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="message-item"
        :class="{ unread: !msg.is_read }"
        @click="markAsRead(msg)"
      >
        <div class="message-icon">
          <el-icon :size="24" :color="msg.is_read ? '#999' : '#409eff'">
            <Bell />
          </el-icon>
        </div>
        <div class="message-content">
          <h4 class="message-title">{{ msg.title }}</h4>
          <p class="message-body">{{ msg.content }}</p>
          <span class="message-time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <div v-if="!msg.is_read" class="unread-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Warning, ChatDotRound, Bell } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const messages = ref([])

const fetchMessages = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get('/api/messages')
    if (res.success) {
      messages.value = res.data || []
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (msg) => {
  if (msg.is_read) return
  
  try {
    await request.put(`/api/messages/${msg.id}/read`)
    msg.is_read = true
  } catch (err) {
    console.error('Failed to mark as read:', err)
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
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped lang="scss">
.messages-page {
  padding: 20px;
  
  .page-header {
    margin-bottom: 24px;
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      color: #333;
    }
  }
  
  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #999;
    
    .el-icon {
      margin-bottom: 16px;
      color: #c0c4cc;
    }
    
    p {
      margin: 8px 0;
      
      &.sub-text {
        font-size: 14px;
        color: #c0c4cc;
      }
    }
  }
  
  .messages-list {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    
    .message-item {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: #f9f9f9;
      }
      
      &.unread {
        background: #f0f7ff;
      }
      
      .message-icon {
        margin-right: 16px;
        margin-top: 4px;
      }
      
      .message-content {
        flex: 1;
        
        .message-title {
          margin: 0 0 8px 0;
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }
        
        .message-body {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
        
        .message-time {
          font-size: 12px;
          color: #999;
        }
      }
      
      .unread-dot {
        width: 8px;
        height: 8px;
        background: #ff2442;
        border-radius: 50%;
        margin-left: 12px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
