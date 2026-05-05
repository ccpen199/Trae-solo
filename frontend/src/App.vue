<template>
  <el-config-provider :locale="zhCn">
    <el-container class="app-container">
      <el-aside width="220px" class="app-aside">
        <div class="logo">
          <el-icon :size="32"><School /></el-icon>
          <span class="logo-text">教师管理系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#2c3e50"
          text-color="#bdc3c7"
          active-text-color="#3498db"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          
          <el-sub-menu index="/teacher">
            <template #title>
              <el-icon><User /></el-icon>
              <span>教师管理</span>
            </template>
            <el-menu-item index="/teacher/entry">教师入职</el-menu-item>
            <el-menu-item index="/teacher/list">教师列表</el-menu-item>
            <el-menu-item index="/teacher/accounts">账号管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="/approval">
            <template #title>
              <el-icon><DocumentChecked /></el-icon>
              <span>审批管理</span>
            </template>
            <el-menu-item index="/approval/submit">提交审批</el-menu-item>
            <el-menu-item index="/approval/list">审批列表</el-menu-item>
          </el-sub-menu>
          
          <el-menu-item index="/department">
            <el-icon><OfficeBuilding /></el-icon>
            <span>部门管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="app-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item 
                v-for="item in breadcrumbs" 
                :key="item.path"
                :to="item.path"
              >
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <span>{{ currentTime }}</span>
          </div>
        </el-header>
        
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const route = useRoute()
const router = useRouter()
const currentTime = ref('')

let timer = null

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  
  const breadcrumbMap = {
    '/': [{ path: '/', name: '首页' }],
    '/teacher/entry': [
      { path: '/', name: '首页' },
      { path: '/teacher', name: '教师管理' },
      { path: '/teacher/entry', name: '教师入职' }
    ],
    '/teacher/list': [
      { path: '/', name: '首页' },
      { path: '/teacher', name: '教师管理' },
      { path: '/teacher/list', name: '教师列表' }
    ],
    '/teacher/accounts': [
      { path: '/', name: '首页' },
      { path: '/teacher', name: '教师管理' },
      { path: '/teacher/accounts', name: '账号管理' }
    ],
    '/approval/submit': [
      { path: '/', name: '首页' },
      { path: '/approval', name: '审批管理' },
      { path: '/approval/submit', name: '提交审批' }
    ],
    '/approval/list': [
      { path: '/', name: '首页' },
      { path: '/approval', name: '审批管理' },
      { path: '/approval/list', name: '审批列表' }
    ],
    '/department': [
      { path: '/', name: '首页' },
      { path: '/department', name: '部门管理' }
    ]
  }
  
  return breadcrumbMap[route.path] || [{ path: '/', name: '首页' }]
})

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
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}
</style>

<style scoped>
.app-container {
  height: 100%;
}

.app-aside {
  background-color: #2c3e50;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  border-bottom: 1px solid #34495e;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-right {
  color: #666;
  font-size: 14px;
}

.app-main {
  background: #f0f2f5;
  padding: 20px;
}

.el-menu {
  border-right: none;
}
</style>
