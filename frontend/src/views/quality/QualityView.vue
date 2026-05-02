<template>
  <el-container class="quality-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>质检端</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/quality/dashboard">
          <template #icon>
            <el-icon><HomeFilled /></el-icon>
          </template>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/quality/inspections">
          <template #icon>
            <el-icon><Filter /></el-icon>
          </template>
          <span>质检记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Filter } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  return route.fullPath
})
</script>

<style scoped>
.quality-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #303133;
  color: white;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #404040;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  color: white;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  color: #e6e6e6;
  height: 50px;
  line-height: 50px;
  margin: 0 10px;
  border-radius: 4px;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #409EFF !important;
  color: white !important;
}

.main-content {
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
