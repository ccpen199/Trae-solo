<template>
  <div class="messages-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息通知</span>
          <div>
            <el-button type="primary" link @click="handleMarkAllRead">全部标为已读</el-button>
            <el-radio-group v-model="filterStatus" size="small" @change="handleFilterChange">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="unread">未读</el-radio-button>
              <el-radio-button value="read">已读</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div class="message-list" v-loading="loading">
        <el-empty v-if="messages.length === 0" description="暂无消息" />
        
        <div 
          v-for="item in messages" 
          :key="item.id" 
          class="message-item"
          :class="{ 'message-unread': !item.is_read }"
          @click="handleMessageClick(item)"
        >
          <div class="message-icon">
            <el-icon :size="24" :color="item.is_read ? '#909399' : '#409EFF'">
              <component :is="getMessageIcon(item.message_type)" />
            </el-icon>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-title">{{ item.title }}</span>
              <span class="message-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <div class="message-body">{{ item.content || '-' }}</div>
            <div class="message-footer" v-if="item.order_no">
              <el-tag size="small" type="info">关联主单: {{ item.order_no }}</el-tag>
            </div>
          </div>
          <div class="message-actions">
            <el-button 
              v-if="!item.is_read" 
              type="primary" 
              link 
              size="small"
              @click.stop="handleMarkRead(item)"
            >
              标为已读
            </el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMessages, markAsRead, markAllAsRead } from '@/api/messages'

const router = useRouter()

const loading = ref(false)
const messages = ref([])
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const messageIcons = {
  task: 'Document',
  notice: 'Bell',
  system: 'Setting'
}

const getMessageIcon = (type) => {
  return messageIcons[type] || 'Bell'
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleString('zh-CN')
}

const fetchMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterStatus.value === 'unread') {
      params.is_read = 'false'
    } else if (filterStatus.value === 'read') {
      params.is_read = 'true'
    }
    
    const res = await getMessages(params)
    messages.value = res.data
    pagination.total = res.total
  } catch (error) {
    console.error('获取消息列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchMessages()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchMessages()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchMessages()
}

const handleMarkRead = async (item) => {
  try {
    await markAsRead(item.id)
    item.is_read = 1
    ElMessage.success('已标为已读')
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    ElMessage.success('全部已标为已读')
    fetchMessages()
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

const handleMessageClick = (item) => {
  if (!item.is_read) {
    handleMarkRead(item)
  }
  if (item.main_order_id) {
    router.push(`/orders/${item.main_order_id}`)
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.messages-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-list {
  min-height: 400px;
}

.message-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item:last-child {
  border-bottom: none;
}

.message-unread {
  background-color: #f0f9ff;
}

.message-unread:hover {
  background-color: #e6f7ff;
}

.message-icon {
  width: 50px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.message-content {
  flex: 1;
  padding: 0 16px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-title {
  font-weight: bold;
  color: #303133;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-body {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.message-footer {
  font-size: 12px;
}

.message-actions {
  width: 80px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}
</style>
