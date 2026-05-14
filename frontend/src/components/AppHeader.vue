<template>
  <el-header class="app-header">
    <div class="header-content">
      <div class="logo" @click="router.push('/')">
        <span class="logo-icon">P</span>
        <span class="logo-text">PMcaff</span>
      </div>
      
      <el-menu
        mode="horizontal"
        :default-active="activeMenu"
        class="nav-menu"
        router
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/questions">提问</el-menu-item>
        <el-menu-item index="/articles">文章</el-menu-item>
      </el-menu>

      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索问题、文章、用户"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon @click="handleSearch" class="pointer"><Search /></el-icon>
          </template>
        </el-input>

        <template v-if="userStore.isLoggedIn">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] }}
              </el-avatar>
              <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              <el-badge :value="userStore.unreadCount" :max="99" hidden>
                <el-icon><Bell /></el-icon>
              </el-badge>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="favorites">
                  <el-icon><Star /></el-icon>
                  我的收藏
                </el-dropdown-item>
                <el-dropdown-item command="messages">
                  <el-icon><Bell /></el-icon>
                  消息中心
                  <el-badge v-if="userStore.unreadCount > 0" :value="userStore.unreadCount" :max="99" class="ml-2" />
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                  <el-icon><Menu /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-divider />
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <el-button type="primary" @click="router.push('/login')">登录</el-button>
          <el-button @click="router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, Bell, User, Star, Setting, Menu, SwitchButton 
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const searchKeyword = ref('');

const activeMenu = computed(() => {
  if (route.path === '/' || route.path === '/questions' || route.path === '/articles') {
    return route.path;
  }
  return '/';
});

watch(() => route.query.keyword, (val) => {
  searchKeyword.value = val || '';
}, { immediate: true });

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { keyword: searchKeyword.value.trim() } });
  }
};

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'favorites':
      router.push('/favorites');
      break;
    case 'messages':
      router.push('/messages');
      break;
    case 'settings':
      router.push('/settings');
      break;
    case 'admin':
      router.push('/admin');
      break;
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        userStore.logout();
        ElMessage.success('已退出登录');
        router.push('/');
      }).catch(() => {});
      break;
  }
};
</script>

<style scoped>
.app-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 40px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
  justify-content: flex-start;
}

.nav-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 240px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: #303133;
  font-size: 14px;
}
</style>
