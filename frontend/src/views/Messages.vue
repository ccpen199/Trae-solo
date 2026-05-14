<template>
  <div class="messages" v-if="!loading && !error">
    <div class="messages-header">
      <h2>消息中心</h2>
      <el-button type="primary" @click="markAllRead" :disabled="submitting">
        全部已读
      </el-button>
    </div>

    <div class="messages-tabs">
      <el-radio-group v-model="activeType" size="small" @change="loadMessages">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="like">点赞</el-radio-button>
        <el-radio-button label="comment">评论</el-radio-button>
        <el-radio-button label="follow">关注</el-radio-button>
        <el-radio-button label="answer">回答</el-radio-button>
      </el-radio-group>
    </div>

    <div class="messages-list">
      <div 
        class="message-item" 
        v-for="item in messages" 
        :key="item.id"
        :class="{ unread: !item.is_read }"
        @click="handleMessageClick(item)"
      >
        <el-avatar :size="40" :src="item.actor_avatar">
          {{ (item.actor_username || '').charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="message-content">
          <div class="message-text">
            <span class="actor-name">{{ item.actor_username || '系统' }}</span>
            <span class="action-text">{{ getActionText(item.type, item.action) }}</span>
            <span class="target-text" v-if="item.target_title">
              《{{ item.target_title }}》
            </span>
          </div>
          <div class="message-time">{{ formatTime(item.created_at) }}</div>
        </div>
        <div class="unread-dot" v-if="!item.is_read"></div>
      </div>

      <el-empty v-if="messages.length === 0" description="暂无消息" />
      
      <div class="load-more" v-if="hasMore">
        <el-button @click="loadMoreMessages" :loading="loadingMore">加载更多</el-button>
      </div>
    </div>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="5" animated />
  </div>

  <div v-if="error" class="error-container">
    <el-empty :description="errorMessage">
      <el-button type="primary" @click="retry">重试</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { messageApi } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const messages = ref([]);
const activeType = ref('all');
const page = ref(1);
const hasMore = ref(false);
const loadingMore = ref(false);
const submitting = ref(false);

const loadMessages = async () => {
  page.value = 1;
  messages.value = [];
  await fetchMessages();
};

const fetchMessages = async () => {
  loadingMore.value = true;
  try {
    const response = await messageApi.getList({
      type: activeType.value === 'all' ? undefined : activeType.value,
      page: page.value,
      page_size: 20
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (page.value === 1) {
        messages.value = data.items || [];
      } else {
        messages.value = [...messages.value, ...(data.items || [])];
      }
      hasMore.value = (page.value * 20) < (data.total || 0);
    }
  } catch (err) {
    if (page.value === 1) {
      error.value = true;
      errorMessage.value = err.response?.data?.message || '加载失败';
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMoreMessages = () => {
  page.value++;
  fetchMessages();
};

const markAllRead = async () => {
  submitting.value = true;
  try {
    const response = await messageApi.markAllRead({ type: activeType.value === 'all' ? undefined : activeType.value });
    if (response.data?.success) {
      messages.value.forEach(msg => {
        msg.is_read = true;
      });
      userStore.fetchUnreadCount();
      ElMessage.success('已全部标记为已读');
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const markRead = async (id) => {
  try {
    await messageApi.markRead(id);
    userStore.fetchUnreadCount();
  } catch (err) {
    console.error('Mark read error:', err);
  }
};

const handleMessageClick = (item) => {
  if (!item.is_read) {
    item.is_read = true;
    markRead(item.id);
  }
  
  if (item.target_type === 'question' && item.target_id) {
    router.push(`/questions/${item.target_id}`);
  } else if (item.target_type === 'article' && item.target_id) {
    router.push(`/articles/${item.target_id}`);
  } else if (item.target_type === 'user' && item.actor_id) {
    router.push(`/user/${item.actor_id}`);
  }
};

const getActionText = (type, action) => {
  const actionMap = {
    'like': '点赞了',
    'comment': '评论了',
    'follow': '关注了你',
    'answer': '回答了',
    'mention': '提到了你'
  };
  return actionMap[type] || actionMap[action] || '有新消息';
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return date.toLocaleDateString();
};

const retry = () => {
  error.value = false;
  loadMessages();
};

onMounted(() => {
  loadMessages();
});
</script>

<style scoped>
.messages {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.messages-header h2 {
  font-size: 20px;
  margin: 0;
}

.messages-tabs {
  margin-bottom: 20px;
}

.messages-list {
  min-height: 300px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.message-item:hover {
  background: #f9f9f9;
}

.message-item.unread {
  background: #f5f8ff;
}

.message-content {
  flex: 1;
}

.message-text {
  line-height: 1.5;
  color: #303133;
}

.actor-name {
  font-weight: 500;
  color: #409eff;
}

.action-text {
  margin: 0 4px;
}

.target-text {
  color: #606266;
}

.message-time {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
  margin-top: 8px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.loading-container, .error-container {
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  max-width: 700px;
  margin: 0 auto;
}
</style>
