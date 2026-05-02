<template>
  <div class="message-list-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>消息中心</span>
            <el-tag v-if="unreadCount > 0" type="danger" effect="dark">
              {{ unreadCount }} 条未读
            </el-tag>
          </div>
          <el-button 
            type="primary" 
            :disabled="unreadCount === 0"
            @click="handleMarkAllRead"
          >
            全部标为已读
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.message_type" placeholder="全部类型" clearable>
            <el-option label="待办任务" value="todo" />
            <el-option label="通知消息" value="notification" />
            <el-option label="系统消息" value="system" />
            <el-option label="告警通知" value="alert" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchMessages">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="message-list" v-loading="loading">
        <el-empty v-if="messages.length === 0" description="暂无消息" />
        
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{ 'message-unread': msg.status === 'unread' }"
          @click="handleMessageClick(msg)"
        >
          <div class="message-icon">
            <el-icon :size="24" :color="getIconColor(msg.message_type)">
              <component :is="getIconName(msg.message_type)" />
            </el-icon>
          </div>
          
          <div class="message-content">
            <div class="message-title">
              <span v-if="msg.status === 'unread'" class="unread-dot"></span>
              {{ msg.title }}
            </div>
            <div class="message-desc" v-if="msg.content">
              {{ msg.content }}
            </div>
            <div class="message-meta">
              <el-tag :type="getPriorityType(msg.priority)" size="small">
                {{ getPriorityLabel(msg.priority) }}
              </el-tag>
              <span v-if="msg.ticket_no" class="ticket-ref">
                关联工单：{{ msg.ticket_no }}
                <span v-if="msg.ticket_title">- {{ msg.ticket_title }}</span>
              </span>
              <span class="message-time">{{ formatDate(msg.created_at) }}</span>
            </div>
          </div>

          <div class="message-actions" v-if="msg.status === 'unread'">
            <el-button type="primary" link @click.stop="handleMarkRead(msg)">
              标为已读
            </el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchMessages"
        @current-change="fetchMessages"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { messageApi } from '@/api';
import { Document, Bell, Warning, Info, CircleCheck } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const router = useRouter();

const loading = ref(false);
const messages = ref([]);
const unreadCount = ref(0);

const searchForm = reactive({
  status: '',
  message_type: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const iconMap = {
  todo: Document,
  notification: Bell,
  system: Info,
  alert: Warning
};

const iconColorMap = {
  todo: '#409eff',
  notification: '#67c23a',
  system: '#909399',
  alert: '#f56c6c'
};

const getIconName = (type) => {
  return iconMap[type] || Info;
};

const getIconColor = (type) => {
  return iconColorMap[type] || '#909399';
};

const getPriorityType = (priority) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  };
  return typeMap[priority] || 'info';
};

const getPriorityLabel = (priority) => {
  const labelMap = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };
  return labelMap[priority] || priority;
};

const formatDate = (date) => {
  if (!date) return '-';
  const now = dayjs();
  const target = dayjs(date);
  const diffHours = now.diff(target, 'hour');
  
  if (diffHours < 1) {
    const diffMinutes = now.diff(target, 'minute');
    return diffMinutes <= 1 ? '刚刚' : `${diffMinutes} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else {
    return target.format('YYYY-MM-DD HH:mm');
  }
};

const fetchMessages = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    if (!params.status) delete params.status;
    if (!params.message_type) delete params.message_type;
    
    const result = await messageApi.getList(params);
    messages.value = result.data.messages;
    pagination.total = result.data.pagination.total;
    unreadCount.value = result.data.unreadCount;
  } catch (error) {
    console.error('获取消息列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  searchForm.status = '';
  searchForm.message_type = '';
  pagination.page = 1;
  fetchMessages();
};

const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定将所有消息标记为已读？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await messageApi.markAllAsRead();
    ElMessage.success('已全部标记为已读');
    fetchMessages();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记已读失败:', error);
    }
  }
};

const handleMarkRead = async (msg) => {
  try {
    await messageApi.markAsRead(msg.id);
    msg.status = 'read';
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

const handleMessageClick = async (msg) => {
  if (msg.status === 'unread') {
    await handleMarkRead(msg);
  }
  
  if (msg.ticket_id) {
    router.push(`/tickets/${msg.ticket_id}`);
  }
};

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-form {
  margin-bottom: 20px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.message-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.message-unread {
  background: #f5f7fa;
}

.message-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #ecf5ff;
  border-radius: 8px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  margin-left: 16px;
  min-width: 0;
}

.message-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.message-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
  color: #909399;
}

.ticket-ref {
  color: #409eff;
}

.message-time {
  color: #c0c4cc;
}

.message-actions {
  flex-shrink: 0;
  margin-left: 16px;
}
</style>
