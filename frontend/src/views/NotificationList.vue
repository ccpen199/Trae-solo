<template>
  <div class="notification-list">
    <div class="page-header">
      <div class="header-left">
        <h2>通知消息</h2>
        <p>查看系统通知和消息提醒</p>
      </div>
      <div class="header-actions">
        <button class="btn-action" @click="handleMarkAllRead" :disabled="unreadCount === 0">
          全部标记已读
        </button>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <p>加载中...</p>
    </div>

    <div class="empty-state" v-else-if="notifications.length === 0">
      <p>暂无通知消息</p>
    </div>

    <div class="notification-cards" v-else>
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        :class="{ 'is-unread': !notification.isRead }"
        @click="handleMarkRead(notification.id)"
      >
        <div class="notification-icon" :style="{ backgroundColor: getTypeBgColor(notification.type) }">
          {{ getTypeIcon(notification.type) }}
        </div>
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-body" v-if="notification.content">{{ notification.content }}</p>
          <div class="notification-footer">
            <span class="type-badge" :style="{ color: getTypeColor(notification.type) }">
              {{ notification.typeDisplay || notification.type }}
            </span>
            <span class="time">{{ formatDate(notification.createdAt) }}</span>
          </div>
        </div>
        <div class="notification-indicator" v-if="!notification.isRead">
          <span class="unread-dot"></span>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="total > 0">
      <span class="pagination-info">共 {{ total }} 条记录</span>
      <div class="pagination-actions">
        <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page }} 页</span>
        <button :disabled="page * pageSize >= total" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { systemApi } from '@/api';

const loading = ref(true);
const notifications = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.isRead).length;
});

const typeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  status_change: { icon: '↻', color: '#1890ff', bgColor: '#e6f7ff' },
  todo_created: { icon: '📋', color: '#faad14', bgColor: '#fffbe6' },
  todo_completed: { icon: '✓', color: '#52c41a', bgColor: '#f6ffed' },
  exception: { icon: '⚠', color: '#ff4d4f', bgColor: '#fff2f0' },
  approval: { icon: '☑', color: '#722ed1', bgColor: '#f9f0ff' },
  reject: { icon: '✗', color: '#ff4d4f', bgColor: '#fff2f0' },
  system: { icon: 'ℹ', color: '#8c8c8c', bgColor: '#fafafa' },
};

function getTypeIcon(type: string): string {
  return typeConfig[type]?.icon || 'ℹ';
}

function getTypeColor(type: string): string {
  return typeConfig[type]?.color || '#8c8c8c';
}

function getTypeBgColor(type: string): string {
  return typeConfig[type]?.bgColor || '#fafafa';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadNotifications() {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    };

    const result = await systemApi.getNotifications(params);
    notifications.value = result?.data?.items || [];
    total.value = result?.data?.total || 0;
  } catch (error) {
    console.error('加载通知消息失败:', error);
    notifications.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function changePage(newPage: number) {
  page.value = newPage;
  loadNotifications();
}

async function handleMarkRead(notificationId: string) {
  const notification = notifications.value.find((n) => n.id === notificationId);
  if (notification?.isRead) return;

  try {
    await systemApi.markNotificationRead(notificationId);
    notification!.isRead = true;
  } catch (error: any) {
    console.error('标记已读失败:', error);
  }
}

async function handleMarkAllRead() {
  try {
    await systemApi.markAllNotificationsRead();
    notifications.value.forEach((n) => {
      n.isRead = true;
    });
    alert('已全部标记为已读');
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notification-list {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #8c8c8c;
  margin: 0;
}

.btn-action {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-action:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px;
  color: #8c8c8c;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.notification-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.notification-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-card.is-unread {
  background: linear-gradient(to right, #f0f5ff 0%, white 100%);
}

.notification-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 4px 0;
}

.notification-body {
  font-size: 14px;
  color: #595959;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.notification-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-badge {
  font-size: 12px;
  font-weight: 500;
}

.time {
  font-size: 12px;
  color: #8c8c8c;
}

.notification-indicator {
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pagination-info {
  color: #8c8c8c;
  font-size: 14px;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-info {
  color: #262626;
  font-weight: 500;
}

.pagination-actions button {
  padding: 6px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.pagination-actions button:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-actions button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}
</style>
