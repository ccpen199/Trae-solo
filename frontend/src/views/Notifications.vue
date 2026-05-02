<template>
  <div class="notifications">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>消息通知</span>
            <el-tag type="info" size="small">{{ total }} 条消息</el-tag>
          </div>
          <div class="header-right">
            <el-select v-model="filterStatus" @change="handleFilterChange" placeholder="全部状态" clearable>
              <el-option label="未读" :value="false" />
              <el-option label="已读" :value="true" />
            </el-select>
            <el-button 
              type="primary" 
              plain 
              :disabled="unreadCount === 0"
              @click="markAllRead"
            >
              全部标为已读
            </el-button>
          </div>
        </div>
      </template>

      <div class="notification-list" v-loading="loading">
        <el-empty v-if="notifications.length === 0" description="暂无消息" />
        
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'is-unread': !notification.is_read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <el-icon :size="20">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">
              {{ notification.title }}
              <el-tag v-if="!notification.is_read" type="danger" size="small">新</el-tag>
            </div>
            <div class="notification-body">{{ notification.content }}</div>
            <div class="notification-meta">
              <span class="order-no" v-if="notification.order_no">
                订单: {{ notification.order_no }}
              </span>
              <span class="created-at">{{ formatTime(notification.created_at) }}</span>
            </div>
          </div>
          <div class="notification-actions">
            <el-button 
              v-if="!notification.is_read"
              type="text" 
              size="small"
              @click.stop="markAsRead(notification)"
            >
              标为已读
            </el-button>
            <el-button 
              v-if="notification.main_order_id"
              type="text" 
              size="small"
              @click.stop="goToOrder(notification.main_order_id)"
            >
              查看订单
            </el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bell, Document, UserFilled, Money, Setting, 
  CircleCheck, Warning, RefreshRight, SwitchButton 
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const filterStatus = ref(null)
const notifications = ref([])
const unreadCount = ref(0)
const total = ref(0)
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

function getNotificationIcon(type) {
  const icons = {
    new_order: 'Document',
    transfer: 'SwitchButton',
    order_complete: 'CircleCheck',
    approval: 'UserFilled',
    rejection: 'Warning',
    supplement: 'Setting',
    revert: 'RefreshRight',
    archive: 'Document',
    reopen: 'RefreshRight',
    default: 'Bell'
  }
  return icons[type] || icons.default
}

function formatTime(time) {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

async function fetchNotifications() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (filterStatus.value !== null) {
      params.isRead = filterStatus.value
    }
    
    const res = await request.get('/notifications', { params })
    if (res.data.success) {
      notifications.value = res.data.data.notifications || []
      pagination.value.total = res.data.data.pagination?.total || 0
      total.value = res.data.data.pagination?.total || 0
    }
  } catch (err) {
    console.error('获取通知列表失败:', err)
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const res = await request.get('/notifications/unread-count')
    if (res.data.success) {
      unreadCount.value = res.data.data.unreadCount
    }
  } catch (err) {
    console.error('获取未读数量失败:', err)
  }
}

async function markAsRead(notification) {
  try {
    const res = await request.put(`/notifications/${notification.id}/read`)
    if (res.data.success) {
      notification.is_read = 1
      notification.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      ElMessage.success('已标记为已读')
    }
  } catch (err) {
    console.error('标记已读失败:', err)
    ElMessage.error('标记已读失败')
  }
}

async function markAllRead() {
  try {
    await ElMessageBox.confirm('确定要将所有未读消息标记为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    const res = await request.put('/notifications/read-all')
    if (res.data.success) {
      notifications.value.forEach(n => {
        if (!n.is_read) n.is_read = 1
      })
      unreadCount.value = 0
      ElMessage.success('已全部标记为已读')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量标记已读失败:', err)
      ElMessage.error('批量标记已读失败')
    }
  }
}

function handleFilterChange() {
  pagination.value.page = 1
  fetchNotifications()
}

function handleSizeChange(size) {
  pagination.value.pageSize = size
  pagination.value.page = 1
  fetchNotifications()
}

function handleCurrentChange(page) {
  pagination.value.page = page
  fetchNotifications()
}

function handleNotificationClick(notification) {
  if (!notification.is_read) {
    markAsRead(notification)
  }
}

function goToOrder(orderId) {
  router.push(`/orders/${orderId}`)
}

onMounted(() => {
  fetchNotifications()
  fetchUnreadCount()
})
</script>

<style scoped>
.notifications {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-list {
  min-height: 200px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.is-unread {
  background-color: #ecf5ff;
}

.notification-item.is-unread:hover {
  background-color: #d9ecff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #409EFF;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.notification-body {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-all;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.order-no {
  font-weight: 500;
  color: #409EFF;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
