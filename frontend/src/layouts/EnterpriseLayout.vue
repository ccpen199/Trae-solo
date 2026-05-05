<template>
  <el-container class="enterprise-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="32"><Document /></el-icon>
        <span>物流信息平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/enterprise/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-sub-menu index="logistics">
          <template #title>
            <el-icon><List /></el-icon>
            <span>物流单管理</span>
          </template>
          <el-menu-item index="/enterprise/logistics/create">新增物流单</el-menu-item>
          <el-menu-item index="/enterprise/logistics/upload">上传Excel</el-menu-item>
          <el-divider />
          <el-menu-item index="/enterprise/logistics/production">生产企业物流单</el-menu-item>
          <el-menu-item index="/enterprise/logistics/initiator">发起企业物流单</el-menu-item>
          <el-menu-item index="/enterprise/logistics/transfer">中转企业物流单</el-menu-item>
          <el-menu-item index="/enterprise/logistics/receiver">接收企业物流单</el-menu-item>
          <el-menu-item index="/enterprise/logistics/unmatched">异常数据</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/enterprise/profile">
          <el-icon><Setting /></el-icon>
          <span>个人设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="welcome">欢迎回来，{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
          <el-tag v-if="userStore.userInfo?.enterprise" :type="enterpriseTagType" size="small" effect="dark">
            {{ enterpriseTypeName }}
          </el-tag>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon :size="20"><Avatar /></el-icon>
              <span>{{ userStore.userInfo?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { enterpriseTypeMap } from '@/types';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);

const enterpriseTypeName = computed(() => {
  const type = userStore.userInfo?.enterprise?.enterpriseType;
  return type ? enterpriseTypeMap[type] : '';
});

const enterpriseTagType = computed(() => {
  const type = userStore.userInfo?.enterprise?.enterpriseType;
  const typeMap: Record<string, string> = {
    production: 'primary',
    logistics: 'success',
    transfer: 'warning',
    receiver: 'info',
  };
  return type ? typeMap[type] : 'info';
});

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await userStore.logout();
      router.push('/login');
    } catch {
      // 取消退出
    }
  } else if (command === 'profile') {
    router.push('/enterprise/profile');
  }
};
</script>

<style scoped>
.enterprise-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  border-right: none;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.el-menu {
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left .welcome {
  font-size: 16px;
  color: #303133;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
