<template>
  <el-config-provider :locale="zhCn">
    <el-container class="app-container">
      <el-aside width="240px" class="app-aside">
        <div class="logo">
          <el-icon :size="28" color="#409EFF"><Shield /></el-icon>
          <span class="logo-text">风控中台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="side-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          <el-sub-menu index="rules">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>规则管理</span>
            </template>
            <el-menu-item index="/rules/list">
              <el-icon><List /></el-icon>
              <span>规则列表</span>
            </el-menu-item>
            <el-menu-item index="/rules/builder">
              <el-icon><Edit /></el-icon>
              <span>规则配置器</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="variables">
            <template #title>
              <el-icon><Coin /></el-icon>
              <span>变量管理</span>
            </template>
            <el-menu-item index="/variables/list">
              <el-icon><Menu /></el-icon>
              <span>变量列表</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/decision">
            <el-icon><Connection /></el-icon>
            <span>决策中心</span>
          </el-menu-item>
          <el-menu-item index="/review">
            <el-icon><Document /></el-icon>
            <span>审核池</span>
            <el-badge :value="pendingCount" class="review-badge" v-if="pendingCount > 0" />
          </el-menu-item>
          <el-menu-item index="/backtest">
            <el-icon><TrendCharts /></el-icon>
            <span>回测分析</span>
          </el-menu-item>
          <el-menu-item index="/audit">
            <el-icon><View /></el-icon>
            <span>审计日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="app-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon :size="20"><User /></el-icon>
                <span class="user-name">{{ currentUser }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import api from './utils/api'

const route = useRoute()
const router = useRouter()
const currentUser = ref('策略员')
const pendingCount = ref(0)

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    name: item.meta.title
  }))
})

const handleCommand = (command) => {
  if (command === 'logout') {
    console.log('退出登录')
  }
}

const loadPendingCount = async () => {
  try {
    const res = await api.get('/review/pending')
    if (res.data.success) {
      pendingCount.value = res.data.data.length
    }
  } catch (e) {
    console.error('加载待审核数量失败', e)
  }
}

loadPendingCount()

const timer = setInterval(loadPendingCount, 30000)

watch(() => route.path, () => {
  if (route.path === '/review') {
    loadPendingCount()
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
  width: 100%;
  overflow: hidden;
}

.app-container {
  height: 100%;
}

.app-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background-color: #263445;
  border-bottom: 1px solid #1f2d3d;
}

.logo-text {
  margin-left: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.side-menu {
  border-right: none;
}

.review-badge {
  margin-right: 12px;
}

.app-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-name {
  margin-left: 8px;
  color: #606266;
}

.app-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-card {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.status-tag {
  &.tag-pass {
    background-color: #f0f9eb;
    color: #67c23a;
    border-color: #c2e7b0;
  }
  &.tag-reject {
    background-color: #fef0f0;
    color: #f56c6c;
    border-color: #fbc4c4;
  }
  &.tag-review {
    background-color: #fdf6ec;
    color: #e6a23c;
    border-color: #f5dab1;
  }
  &.tag-draft {
    background-color: #ecf5ff;
    color: #409eff;
    border-color: #b3d8ff;
  }
  &.tag-active {
    background-color: #f0f9eb;
    color: #67c23a;
    border-color: #c2e7b0;
  }
  &.tag-testing {
    background-color: #fdf6ec;
    color: #e6a23c;
    border-color: #f5dab1;
  }
}
</style>
