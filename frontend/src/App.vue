<template>
  <div id="app">
    <el-container>
      <el-header class="app-header">
        <div class="container flex-between">
          <div class="logo" @click="goHome">
            <span class="logo-icon">📚</span>
            <span class="logo-text">读书人频道</span>
          </div>
          
          <el-menu
            mode="horizontal"
            :default-active="activeMenu"
            class="nav-menu"
            background-color="transparent"
            text-color="#606266"
            active-text-color="#409eff"
            router
          >
            <el-menu-item index="/square">
              <el-icon><House /></el-icon>
              读书广场
            </el-menu-item>
            <el-menu-item index="/channels">
              <el-icon><Collection /></el-icon>
              频道聚合
            </el-menu-item>
            <el-menu-item index="/books">
              <el-icon><Reading /></el-icon>
              书籍推荐
            </el-menu-item>
            <el-menu-item index="/libraries">
              <el-icon><OfficeBuilding /></el-icon>
              图书馆
            </el-menu-item>
            <el-menu-item index="/comments/weibo">
              <el-icon><ChatDotSquare /></el-icon>
              微博评论
            </el-menu-item>
          </el-menu>

          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索书籍、频道、图书馆..."
              class="search-input"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <div class="user-section" v-if="userStore.isLoggedIn">
              <el-dropdown trigger="click">
                <div class="user-info">
                  <el-avatar :size="36" :src="userStore.user?.avatar">
                    {{ userStore.user?.nickname?.charAt(0) }}
                  </el-avatar>
                  <span class="user-name">{{ userStore.user?.nickname }}</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goProfile">个人中心</el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="auth-buttons" v-else>
              <el-button type="primary" @click="goLogin">登录</el-button>
              <el-button @click="goRegister">注册</el-button>
            </div>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
      
      <el-footer class="app-footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-logo">
              <span class="logo-icon">📚</span>
              <span class="logo-text">读书人频道</span>
            </div>
            <div class="footer-links">
              <router-link to="/square">读书广场</router-link>
              <router-link to="/channels">频道聚合</router-link>
              <router-link to="/books">书籍推荐</router-link>
              <router-link to="/libraries">图书馆</router-link>
            </div>
            <div class="footer-copyright">
              © 2026 读书人频道. All rights reserved.
            </div>
          </div>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import {
  ElMessage
} from 'element-plus';
import {
  House,
  Collection,
  Reading,
  OfficeBuilding,
  ChatDotSquare,
  Search
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const searchKeyword = ref('');

const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith('/channels')) return '/channels';
  if (path.startsWith('/books')) return '/books';
  if (path.startsWith('/libraries')) return '/libraries';
  if (path.startsWith('/comments/weibo')) return '/comments/weibo';
  return '/square';
});

const goHome = () => {
  router.push('/square');
};

const goLogin = () => {
  router.push('/login');
};

const goRegister = () => {
  router.push('/register');
};

const goProfile = () => {
  router.push('/profile');
};

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      name: 'Search',
      query: { keyword: searchKeyword.value.trim() }
    });
  }
};

const handleLogout = () => {
  userStore.logout();
  ElMessage.success('已退出登录');
  router.push('/square');
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 64px !important;
  line-height: 64px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  border-bottom: none;
  flex: 1;
  justify-content: center;
}

.nav-menu .el-menu-item {
  border-bottom: none;
  height: 64px;
  line-height: 64px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 220px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-name {
  font-size: 14px;
  color: #606266;
}

.auth-buttons {
  display: flex;
  gap: 8px;
}

.app-main {
  flex: 1;
  padding: 0;
  background: #f5f7fa;
}

.app-footer {
  background: #303133;
  color: #909399;
  padding: 0;
  height: auto !important;
}

.footer-content {
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.footer-logo {
  display: flex;
  align-items: center;
}

.footer-logo .logo-text {
  color: #fff;
  font-size: 18px;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: #909399;
  text-decoration: none;
  font-size: 14px;
}

.footer-links a:hover {
  color: #409eff;
}

.footer-copyright {
  font-size: 12px;
  color: #606266;
}
</style>
