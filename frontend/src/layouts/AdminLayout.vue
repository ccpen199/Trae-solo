<template>
  <el-container class="admin-container">
    <el-header class="header">
      <div class="header-left">
        <h2 class="logo">
          <el-icon><Monitor /></el-icon>
          运营管理后台
        </h2>
      </div>
      <div class="header-right">
        <el-button type="primary" link @click="$router.push('/')">
          <el-icon><Back /></el-icon>
          返回前台
        </el-button>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userStore.userInfo?.realName || userStore.userInfo?.username }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="220px" class="aside">
        <el-menu
          :default-active="$route.path"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409eff"
        >
          <el-menu-item index="/admin">
            <el-icon><DataAnalysis /></el-icon>
            <span>健康度仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/items">
            <el-icon><Management /></el-icon>
            <span>事项管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/standard">
            <el-icon><Connection /></el-icon>
            <span>标准化引擎</span>
          </el-menu-item>
          <el-menu-item index="/admin/bottlenecks">
            <el-icon><Warning /></el-icon>
            <span>堵点分析</span>
          </el-menu-item>
          <el-menu-item index="/admin/packages">
            <el-icon><Box /></el-icon>
            <span>服务包配置</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/logs">
            <el-icon><DocumentCopy /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const userStore = useUserStore();
const router = useRouter();

onMounted(() => {
  userStore.restoreUserInfo();
});

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  }
};
</script>

<style scoped>
.admin-container {
  height: 100vh;
}

.header {
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 20px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.aside {
  background-color: #001529;
}

.main-content {
  background-color: #f5f7fa;
  padding: 24px;
}
</style>
