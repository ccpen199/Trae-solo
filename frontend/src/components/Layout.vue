<template>
  <el-container class="layout-container">
    <el-aside width="220px" style="background-color: #304156;">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold; border-bottom: 1px solid #3a4a5b;">
        🚗 网约车派单系统
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        class="sidebar-menu"
        :collapse="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Promotion /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <el-menu-item index="/order/create">
          <el-icon><Plus /></el-icon>
          <span>发起叫车</span>
        </el-menu-item>
        
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>订单列表</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header style="background-color: white; border-bottom: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 16px; color: #303133;">
          {{ pageTitle }}
        </div>
        <div class="header-user">
          <div class="badge-wrapper" style="margin-right: 20px;">
            <el-badge :value="userStore.todoCount" class="item">
              <el-button text>
                <el-icon><Bell /></el-icon>
                待办
              </el-button>
            </el-badge>
          </div>
          <div class="user-info">
            <el-avatar :size="32" style="background-color: #409eff;">
              {{ userStore.user?.name?.charAt(0) || 'U' }}
            </el-avatar>
            <div style="font-size: 14px;">
              <div style="color: #303133;">{{ userStore.user?.name }}</div>
              <div style="font-size: 12px; color: #909399;">{{ roleName }}</div>
            </div>
            <el-dropdown @command="handleCommand">
              <el-button text>
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <slot></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import {
  Promotion, Plus, Document, Van, User, Warning, DataAnalysis,
  Bell, ArrowDown
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '仪表盘',
    '/order/create': '发起叫车',
    '/orders': '订单列表',
    '/driver-orders': '我的订单',
    '/drivers': '司机管理',
    '/exceptions': '异常管理',
    '/reports': '报表统计'
  };
  if (route.path.startsWith('/order/')) {
    return '订单详情';
  }
  return titles[route.path] || '页面';
});

const roleName = computed(() => {
  const roleMap = {
    'admin': '管理员',
    'dispatcher': '调度员',
    'driver': '司机',
    'passenger': '乘客',
    'customer_service': '客服',
    'risk_control': '风控'
  };
  return roleMap[userStore.user?.role] || '未知角色';
});

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  }
};
</script>
