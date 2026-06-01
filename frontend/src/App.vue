<template>
  <el-container class="layout-container" style="height: 100%">
    <el-header class="header">
      <div class="header-left">
        <el-icon size="28" color="#409EFF"><Document /></el-icon>
        <span class="title">电子作业指导书系统</span>
      </div>
      <div class="header-right">
        <el-tag v-if="userStore.currentUser" type="info">
          {{ userStore.currentUser.name }} ({{ roleText }})
        </el-tag>
        <el-button v-if="userStore.currentUser" @click="logout" size="small" plain>退出</el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="sidebar">
        <el-menu
          :default-active="route.path"
          router
          :collapse="false"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item v-if="userStore.currentUser" index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item v-if="isEngineerOrLeader" index="/sops">
            <el-icon><Document /></el-icon>
            <span>作业指导书</span>
          </el-menu-item>
          <el-menu-item v-if="isEngineerOrLeader" index="/work-orders">
            <el-icon><List /></el-icon>
            <span>工单管理</span>
          </el-menu-item>
          <el-menu-item index="/work-execution">
            <el-icon><VideoPlay /></el-icon>
            <span>工序执行</span>
          </el-menu-item>
          <el-menu-item v-if="isLeader" index="/change-notifications">
            <el-icon><Bell /></el-icon>
            <span>变更通知</span>
          </el-menu-item>
          <el-menu-item v-if="isEngineerOrLeader" index="/products">
            <el-icon><Box /></el-icon>
            <span>产品管理</span>
          </el-menu-item>
          <el-menu-item v-if="isEngineerOrLeader" index="/processes">
            <el-icon><Setting /></el-icon>
            <span>工序管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from './stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const roleText = computed(() => {
  const roles = { worker: '操作工', engineer: '工艺工程师', leader: '班组长' };
  return roles[userStore.currentUser?.role] || '';
});

const isEngineerOrLeader = computed(() => {
  return userStore.currentUser?.role === 'engineer' || userStore.currentUser?.role === 'leader';
});

const isLeader = computed(() => {
  return userStore.currentUser?.role === 'leader';
});

const logout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar {
  background: #304156;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
