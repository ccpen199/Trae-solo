<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon :size="32" color="#fff"><Warning /></el-icon>
        <h1 class="title">地震应急信息系统</h1>
      </div>
      <div class="header-right">
        <span class="time">{{ currentTime }}</span>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#ffd04b">
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>震情首页</span>
          </el-menu-item>
          <el-menu-item index="/disasters">
            <el-icon><DocumentAdd /></el-icon>
            <span>灾情上报</span>
          </el-menu-item>
          <el-menu-item index="/rescue">
            <el-icon><Van /></el-icon>
            <span>救援调度</span>
          </el-menu-item>
          <el-menu-item index="/materials">
            <el-icon><Goods /></el-icon>
            <span>物资保障</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><DataLine /></el-icon>
            <span>指挥报表</span>
          </el-menu-item>
          <el-menu-item index="/logs">
            <el-icon><Notebook /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentTime = ref('')
let timer = null

const activeMenu = computed(() => route.path)

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}
.app-header {
  background: linear-gradient(90deg, #c62828 0%, #e53935 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  padding: 0 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}
.header-right {
  font-size: 14px;
  opacity: 0.9;
}
.app-aside {
  background-color: #001529;
}
.app-aside :deep(.el-menu) {
  border-right: none;
}
.app-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
