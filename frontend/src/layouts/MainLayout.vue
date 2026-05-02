<template>
  <div class="layout-container">
    <header class="layout-header">
      <div class="header-left">
        <div class="logo">环保监测平台</div>
        <nav class="header-nav">
          <div
            class="nav-item"
            :class="{ active: activeNav === 'monitor' }"
            @click="navigateTo('/monitor')"
          >
            监测管理
          </div>
          <div
            class="nav-item"
            :class="{ active: activeNav === 'violation' }"
            @click="navigateTo('/violation')"
          >
            超标事件
          </div>
          <div
            class="nav-item"
            :class="{ active: activeNav === 'enterprise' }"
            @click="navigateTo('/enterprise')"
          >
            企业管理
          </div>
          <div
            class="nav-item"
            :class="{ active: activeNav === 'report' }"
            @click="navigateTo('/report')"
          >
            报告管理
          </div>
        </nav>
      </div>
      
      <div class="header-right">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="header-action" @click="navigateTo('/notification')">
          <el-icon size="20"><Bell /></el-icon>
        </el-badge>
        
        <div class="user-info">
          <div class="user-avatar">{{ userStore.userInfo?.name?.[0] || 'U' }}</div>
          <div>
            <div class="user-name">{{ userStore.userInfo?.name || '用户' }}</div>
            <div class="user-role">{{ userStore.roleName }}</div>
          </div>
        </div>
        
        <el-button type="primary" link size="small" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </header>
    
    <main class="layout-main">
      <aside class="layout-aside">
        <el-menu
          :default-active="activeMenu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#ffffff"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>管理看板</span>
          </el-menu-item>
          
          <el-menu-item index="/monitor">
            <el-icon><Monitor /></el-icon>
            <span>监测管理</span>
          </el-menu-item>
          
          <el-menu-item index="/violation">
            <el-icon><Warning /></el-icon>
            <span>超标事件</span>
          </el-menu-item>
          
          <el-menu-item index="/enterprise">
            <el-icon><OfficeBuilding /></el-icon>
            <span>企业管理</span>
          </el-menu-item>
          
          <el-menu-item index="/report">
            <el-icon><Document /></el-icon>
            <span>报告管理</span>
          </el-menu-item>
          
          <el-menu-item index="/notification">
            <el-icon><Bell /></el-icon>
            <span>通知中心</span>
          </el-menu-item>
        </el-menu>
      </aside>
      
      <section class="layout-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessageBox, ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = ref(route.path);
const unreadCount = ref(0);

const activeNav = computed(() => {
  if (route.path.includes('monitor')) return 'monitor';
  if (route.path.includes('violation')) return 'violation';
  if (route.path.includes('enterprise')) return 'enterprise';
  if (route.path.includes('report')) return 'report';
  return 'dashboard';
});

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  }
);

const navigateTo = (path) => {
  router.push(path);
};

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logout();
      ElMessage.success('已退出登录');
      router.push('/login');
    })
    .catch(() => {});
};
</script>
