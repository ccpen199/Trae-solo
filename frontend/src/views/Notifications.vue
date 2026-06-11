<template>
  <div class="notifications-page page-container">
    <van-nav-bar
      title="消息中心"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <span class="read-all" @click="markAllRead">全部已读</span>
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab">
      <van-tab title="全部" name="all" />
      <van-tab title="系统通知" name="system" />
      <van-tab title="服务通知" name="service" />
    </van-tabs>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
      <div
        v-for="item in filteredNotifications"
        :key="item.id"
        class="notification-item"
        :class="{ unread: !item.is_read }"
        @click="markRead(item.id)"
      >
        <div class="notification-icon">
          <van-icon v-if="item.type === 'system'" name="bell-o" size="24" color="#1989fa" />
          <van-icon v-else name="service-o" size="24" color="#07c160" />
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ item.title }}</div>
          <div class="notification-desc">{{ item.content }}</div>
          <div class="notification-time">{{ item.created_at }}</div>
        </div>
        <div v-if="!item.is_read" class="unread-dot"></div>
      </div>
    </van-list>

    <div v-if="filteredNotifications.length === 0 && !loading" class="empty-state">
      <van-icon name="bell-o" size="48" />
      <div>暂无消息</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccessToast } from 'vant';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/profile';

const router = useRouter();
const notifications = ref([]);
const activeTab = ref('all');
const page = ref(1);
const pageSize = 20;
const loading = ref(false);
const finished = ref(false);

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') return notifications.value;
  return notifications.value.filter(n => n.type === activeTab.value);
});

const loadMore = async () => {
  const res = await getNotifications({ page: page.value, pageSize });
  if (res.code === 200) {
    notifications.value = [...notifications.value, ...res.data.list];
    page.value++;
    if (res.data.list.length < pageSize) {
      finished.value = true;
    }
  }
  loading.value = false;
};

const markRead = async (id) => {
  await markNotificationRead(id);
  const item = notifications.value.find(n => n.id === id);
  if (item) item.is_read = 1;
};

const markAllRead = async () => {
  const res = await markAllNotificationsRead();
  if (res.code === 200) {
    notifications.value.forEach(n => n.is_read = 1);
    showSuccessToast('已全部标记为已读');
  }
};

onMounted(() => {
  loadMore();
});
</script>

<style scoped>
.notifications-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.read-all {
  font-size: 14px;
  color: #1989fa;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  margin-bottom: 1px;
  position: relative;
}

.notification-item.unread {
  background: #f5f9ff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 15px;
  color: #323233;
  margin-bottom: 4px;
}

.notification-desc {
  font-size: 13px;
  color: #646566;
  margin-bottom: 4px;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #c8c9cc;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #ee0a24;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
