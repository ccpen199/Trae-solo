<template>
  <div class="app">
    <el-header class="header">
      <div class="logo">
        <el-icon :size="28" color="#409EFF"><OfficeBuilding /></el-icon>
        <span class="logo-text">陪诊服务管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        router
        class="nav-menu"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/patient-order">
          <el-icon><Calendar /></el-icon>
          <span>患者预约</span>
        </el-menu-item>
        <el-menu-item index="/escort-list">
          <el-icon><User /></el-icon>
          <span>陪诊师列表</span>
        </el-menu-item>
        <el-menu-item index="/order-list">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/service-record">
          <el-icon><Document /></el-icon>
          <span>服务记录</span>
        </el-menu-item>
        <el-menu-item index="/settlement">
          <el-icon><Money /></el-icon>
          <span>费用结算</span>
        </el-menu-item>
        <el-menu-item index="/admin">
          <el-icon><Setting /></el-icon>
          <span>管理后台</span>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { OfficeBuilding, HomeFilled, Calendar, User, List, Document, Money, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #001529;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 30px;
}

.logo-text {
  margin-left: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.main-content {
  flex: 1;
  padding: 0;
  background-color: #f0f2f5;
}

.el-menu--horizontal {
  border-bottom: none !important;
}

.el-menu--horizontal .el-menu-item {
  border-bottom: none !important;
}
</style>
