<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <el-icon :size="28"><Monitor /></el-icon>
        <span v-show="!isCollapse">监控告警平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="aside-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/tickets">
          <el-icon><Document /></el-icon>
          <template #title>工单管理</template>
        </el-menu-item>
        <el-menu-item index="/alerts">
          <el-icon><Bell /></el-icon>
          <template #title>告警管理</template>
        </el-menu-item>
        <el-menu-item index="/rules">
          <el-icon><Setting /></el-icon>
          <template #title>告警规则</template>
        </el-menu-item>
        <el-menu-item index="/messages">
          <el-icon>
            <Badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
              <Message />
            </Badge>
          </el-icon>
          <template #title>消息中心</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasPermission('audit:view')" index="/audit">
          <el-icon><View /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.user?.name }}
              <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="message-badge" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="messages">
                  <el-icon><Message /></el-icon> 消息中心
                  <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" />
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Monitor, DataAnalysis, Document, Bell, Setting, Message, View, User, Fold, Expand, SwitchButton } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { messageApi } from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isCollapse = ref(false);
const unreadCount = ref(0);

let timer = null;

const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith('/tickets/')) return '/tickets';
  if (path.startsWith('/rules/')) return '/rules';
  return path;
});

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title);
  return matched.map(item => ({
    path: item.path,
    name: item.meta.title
  })).slice(1);
});

const fetchUnreadCount = async () => {
  try {
    const result = await messageApi.getUnread();
    unreadCount.value = result.data.count || 0;
  } catch (error) {
    console.error('获取未读消息数失败:', error);
  }
};

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      break;
    case 'messages':
      router.push('/messages');
      break;
    case 'logout':
      userStore.logout();
      break;
  }
};

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
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5c;
  gap: 10px;
}

.aside-menu {
  border-right: none;
}

.layout-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #5a5e66;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
  position: relative;
}

.message-badge {
  position: absolute;
  top: -8px;
  right: -18px;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
