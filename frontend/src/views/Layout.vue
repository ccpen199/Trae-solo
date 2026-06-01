<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h2>访客管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>运营总览</span>
        </el-menu-item>
        <el-menu-item index="/appointment">
          <el-icon><Edit /></el-icon>
          <span>访客预约</span>
        </el-menu-item>
        <el-menu-item index="/appointments">
          <el-icon><List /></el-icon>
          <span>预约管理</span>
        </el-menu-item>
        <el-menu-item index="/review">
          <el-icon><DocumentChecked /></el-icon>
          <span>预约审核</span>
        </el-menu-item>
        <el-menu-item index="/checkin">
          <el-icon><Check /></el-icon>
          <span>入园核验</span>
        </el-menu-item>
        <el-menu-item index="/parking">
          <el-icon><Van /></el-icon>
          <span>车辆管理</span>
        </el-menu-item>
        <el-menu-item index="/checkout">
          <el-icon><SwitchButton /></el-icon>
          <span>离园确认</span>
        </el-menu-item>
        <el-menu-item index="/visitors">
          <el-icon><User /></el-icon>
          <span>访客管理</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Notebook /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="alerts.length" class="alarm-badge" :hidden="alerts.length === 0">
            <el-button type="primary" link @click="showAlerts = true">
              <el-icon><Bell /></el-icon>
              告警
            </el-button>
          </el-badge>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="showAlerts" title="系统告警" width="500px">
    <el-empty v-if="alerts.length === 0" description="暂无告警" />
    <div v-else class="alert-list">
      <div v-for="alert in alerts" :key="alert.appointmentId + alert.type" class="alert-item" :class="alert.level">
        <div class="alert-type">{{ alert.type === 'overdue' ? '超时提醒' : '待审核' }}</div>
        <div class="alert-message">{{ alert.message }}</div>
        <div class="alert-time">{{ alert.createdAt }}</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Odometer, Edit, List, DocumentChecked, Check,
  Van, SwitchButton, User, Notebook, Bell
} from '@element-plus/icons-vue'
import { alerts } from '../api'

const route = useRoute()
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

const showAlerts = ref(false)
const alertList = ref([])

const loadAlerts = async () => {
  try {
    const res = await alerts.list()
    alertList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadAlerts()
  setInterval(loadAlerts, 30000)
})
</script>

<style scoped>
.layout {
  height: 100vh;
}
.sidebar {
  background: #001529;
  color: #fff;
}
.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo h2 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}
.menu {
  border-right: none;
  background: #001529;
}
.menu :deep(.el-menu-item) {
  color: rgba(255,255,255,0.7);
}
.menu :deep(.el-menu-item:hover) {
  color: #fff;
  background: rgba(255,255,255,0.1);
}
.menu :deep(.el-menu-item.is-active) {
  background: #1890ff;
  color: #fff;
}
.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.main {
  background: #f0f2f5;
  overflow-y: auto;
}
.alert-list {
  max-height: 400px;
  overflow-y: auto;
}
.alert-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #f5f5f5;
}
.alert-item.warning {
  background: #fff7e6;
  border-left: 3px solid #faad14;
}
.alert-item.info {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}
.alert-type {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.alert-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}
.alert-time {
  font-size: 12px;
  color: #999;
}
</style>
