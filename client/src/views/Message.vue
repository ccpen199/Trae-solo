<template>
  <div class="message page-container">
    <div class="header">
      <div class="header-title">消息</div>
    </div>

    <div class="quick-actions">
      <div class="action-card" @click="goMessageType('order')">
        <div class="action-icon">📦</div>
        <div class="action-text">交易物流</div>
        <div v-if="unreadCounts?.types?.order" class="action-badge">{{ unreadCounts.types.order }}</div>
      </div>
      <div class="action-card" @click="goMessageType('system')">
        <div class="action-icon">🔔</div>
        <div class="action-text">系统通知</div>
        <div v-if="unreadCounts?.types?.system" class="action-badge">{{ unreadCounts.types.system }}</div>
      </div>
      <div class="action-card" @click="goChat(1)">
        <div class="action-icon">💬</div>
        <div class="action-text">客服消息</div>
        <div v-if="unreadCounts?.types?.chat" class="action-badge">{{ unreadCounts.types.chat }}</div>
      </div>
      <div class="action-card" @click="showToast('淘友功能开发中')">
        <div class="action-icon">👥</div>
        <div class="action-text">淘友消息</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">最近消息</div>
      
      <div v-if="messages.length > 0" class="message-list">
        <div 
          v-for="item in messages" 
          :key="item.id"
          class="message-item card"
          :class="{ unread: !item.is_read }"
          @click="openMessage(item)"
        >
          <div class="message-icon" :class="'icon-' + item.type">
            {{ getMessageIcon(item.type) }}
          </div>
          <div class="message-info">
            <div class="message-header">
              <span class="message-title">{{ item.title || getMessageTitle(item.type) }}</span>
              <span class="message-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <div class="message-content text-ellipsis">{{ item.content }}</div>
          </div>
          <span v-if="!item.is_read" class="dot"></span>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="icon">💬</div>
        <div class="text">暂无消息</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, inject } from 'vue';
import { useRouter } from 'vue-router';
import { messageApi } from '../api';

const router = useRouter();
const showToast = inject('showToast');

const messages = ref([]);
const unreadCounts = ref({ total: 0, types: {} });

const getMessageIcon = (type) => {
  const icons = {
    order: '📦',
    system: '🔔',
    chat: '💬',
    promotion: '🎁',
    default: '💬'
  };
  return icons[type] || icons.default;
};

const getMessageTitle = (type) => {
  const titles = {
    order: '交易物流',
    system: '系统通知',
    chat: '客服消息',
    promotion: '优惠活动'
  };
  return titles[type] || '消息通知';
};

const fetchMessages = async () => {
  try {
    const res = await messageApi.getMessages({ page: 1, pageSize: 20 });
    if (res.code === 200) {
      messages.value = res.data.list;
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchUnreadCount = async () => {
  try {
    const res = await messageApi.getUnreadCount();
    if (res.code === 200) {
      unreadCounts.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const goMessageType = (type) => {
  showToast(`${getMessageTitle(type)} 列表开发中`);
};

const goChat = (shopId) => {
  router.push(`/chat/${shopId}`);
};

const openMessage = async (item) => {
  if (!item.is_read) {
    try {
      await messageApi.markAsRead(item.id);
      item.is_read = 1;
    } catch (e) {
      console.error(e);
    }
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

onMounted(() => {
  fetchMessages();
  fetchUnreadCount();
});

onActivated(() => {
  fetchMessages();
  fetchUnreadCount();
});
</script>

<style scoped>
.message {
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 16px;
  background: #fff;
  margin-bottom: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.action-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.action-text {
  font-size: 12px;
  color: #333;
}

.action-badge {
  position: absolute;
  top: -4px;
  right: 8px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.section {
  background: #fff;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  position: relative;
}

.message-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f5f5f5;
  flex-shrink: 0;
}

.message-icon.icon-order { background: #fff7e6; }
.message-icon.icon-system { background: #e6f7ff; }
.message-icon.icon-chat { background: #f6ffed; }
.message-icon.icon-promotion { background: #fff1f0; }

.message-info {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-content {
  font-size: 13px;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state .text {
  color: #999;
  font-size: 14px;
}
</style>
