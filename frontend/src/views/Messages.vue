<template>
  <div class="messages-page">
    <h2>消息中心</h2>
    <p class="page-desc">查看待办事项、通知和提醒</p>
    
    <div class="messages-header">
      <button class="mark-all-btn" @click="markAllAsRead">
        全部标为已读
      </button>
    </div>
    
    <div v-if="messages.length === 0" class="empty-state">
      暂无消息
    </div>
    
    <div v-else class="messages-list">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        :class="['message-item', { unread: msg.status === 'UNREAD' }]"
        @click="markAsRead(msg)"
      >
        <div class="message-icon">
          <span v-if="msg.type === 'TODO'">📋</span>
          <span v-else-if="msg.type === 'NOTIFICATION'">🔔</span>
          <span v-else>⚠️</span>
        </div>
        <div class="message-content">
          <h4>{{ msg.title }}</h4>
          <p>{{ msg.content }}</p>
          <span class="message-time">{{ formatDate(msg.createdAt) }}</span>
        </div>
        <div v-if="msg.status === 'UNREAD'" class="unread-dot"></div>
      </div>
    </div>
    
    <div v-if="pagination && pagination.totalPages > 1" class="pagination">
      <button 
        :disabled="pagination.page <= 1" 
        @click="goToPage(pagination.page - 1)"
      >
        上一页
      </button>
      <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
      <button 
        :disabled="pagination.page >= pagination.totalPages" 
        @click="goToPage(pagination.page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Message } from '@/types';
import { messageApi } from '@/api';
import dayjs from 'dayjs';

const messages = ref<Message[]>([]);
const pagination = ref<{
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
} | null>(null);

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD HH:mm');
};

const loadMessages = async () => {
  try {
    const result = await messageApi.getList({
      page: pagination.value?.page || 1,
      pageSize: 20
    });
    
    if (result.success && result.data) {
      messages.value = result.data.list;
      pagination.value = result.data.pagination;
    }
  } catch (error) {
    console.error('Load messages error:', error);
  }
};

const markAsRead = async (msg: Message) => {
  if (msg.status !== 'UNREAD') return;
  
  try {
    await messageApi.markAsRead(msg.id);
    msg.status = 'READ';
  } catch (error) {
    console.error('Mark as read error:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await messageApi.markAllAsRead();
    messages.value.forEach(m => m.status = 'READ');
  } catch (error) {
    console.error('Mark all read error:', error);
  }
};

const goToPage = (page: number) => {
  if (pagination.value) {
    pagination.value.page = page;
    loadMessages();
  }
};

onMounted(() => {
  pagination.value = {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  };
  loadMessages();
});
</script>

<style scoped>
.messages-page {
  padding: 20px;
}

.messages-page h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-desc {
  color: #888;
  margin-bottom: 24px;
}

.messages-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.mark-all-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
  color: #999;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.message-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message-item.unread {
  background: #f8fafc;
  border-left: 3px solid #667eea;
}

.message-icon {
  font-size: 28px;
}

.message-content {
  flex: 1;
}

.message-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.message-content p {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pagination button {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 14px;
}

.pagination button:disabled {
  opacity: 0.5;
}

.pagination span {
  font-size: 14px;
  color: #666;
}
</style>
