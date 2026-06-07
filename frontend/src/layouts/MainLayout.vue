<template>
  <el-container class="main-container">
    <el-header class="header">
      <div class="header-left">
        <h2 class="logo">
          <el-icon><OfficeBuilding /></el-icon>
          辽事通
        </h2>
        <span class="sub-title">辽宁省政务服务平台</span>
      </div>
      <div class="header-right">
        <el-button type="primary" link @click="$router.push('/admin')" v-if="userStore.isAdmin">
          <el-icon><Setting /></el-icon>
          管理后台
        </el-button>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userStore.userInfo?.realName || userStore.userInfo?.username }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
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
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/items">
            <el-icon><List /></el-icon>
            <span>事项大厅</span>
          </el-menu-item>
          <el-menu-item index="/applications">
            <el-icon><Document /></el-icon>
            <span>我的办件</span>
          </el-menu-item>
          <el-menu-item index="/certificates">
            <el-icon><Postcard /></el-icon>
            <span>电子证照</span>
          </el-menu-item>
          <el-menu-item index="/seals">
            <el-icon><Stamp /></el-icon>
            <span>电子印章</span>
          </el-menu-item>
          <el-menu-item index="/profile">
            <el-icon><UserFilled /></el-icon>
            <span>个人中心</span>
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
  if (command === 'profile') {
    router.push('/profile');
  } else if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  }
};
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.header {
  background: linear-gradient(90deg, #1e40af 0%, #3b82f6 100%);
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
  font-size: 24px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-title {
  font-size: 14px;
  opacity: 0.9;
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
