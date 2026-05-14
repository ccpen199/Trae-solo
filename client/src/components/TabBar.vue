<template>
  <div class="tab-bar">
    <router-link 
      v-for="item in tabs" 
      :key="item.path"
      :to="item.path"
      class="tab-item"
      :class="{ active: isActive(item.path) }"
    >
      <div class="tab-icon">
        <span class="icon">{{ item.icon }}</span>
        <span v-if="item.badge" class="badge">{{ item.badge }}</span>
      </div>
      <span class="tab-label">{{ item.label }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { messageApi } from '../api';
import { useUserStore } from '../stores/user';

const route = useRoute();
const userStore = useUserStore();
const unreadCount = ref(0);

const tabs = computed(() => [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/category', label: '分类', icon: '📂' },
  { path: '/content', label: '微淘', icon: '📖' },
  { path: '/message', label: '消息', icon: '💬', badge: unreadCount.value > 0 ? unreadCount.value : null },
  { path: '/profile', label: '我的', icon: '👤' }
]);

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) {
    unreadCount.value = 0;
    return;
  }
  try {
    const res = await messageApi.getUnreadCount();
    if (res.code === 200) {
      unreadCount.value = res.data.total;
    }
  } catch (e) {
    console.error(e);
  }
};

let timer = null;

onMounted(() => {
  fetchUnreadCount();
  timer = setInterval(fetchUnreadCount, 30000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eee;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #666;
  font-size: 12px;
  padding: 6px 0;
}

.tab-item.active {
  color: var(--primary-color);
}

.tab-icon {
  position: relative;
  font-size: 22px;
  margin-bottom: 2px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -10px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.tab-label {
  font-size: 11px;
}
</style>
