<template>
  <el-container class="app-container">
    <el-header class="header">
      <div class="header-title">
        <el-icon size="28"><Monitor /></el-icon>
        <span>智慧工地扬尘噪声监测系统</span>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="$route.path"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/points">
            <el-icon><Location /></el-icon>
            <span>监测点位</span>
          </el-menu-item>
          <el-menu-item index="/alerts">
            <el-icon><Warning /></el-icon>
            <span>超标预警</span>
          </el-menu-item>
          <el-menu-item index="/tasks">
            <el-icon><List /></el-icon>
            <span>整改任务</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><Document /></el-icon>
            <span>统计报表</span>
          </el-menu-item>
          <el-menu-item index="/acceptance">
            <el-icon><CircleCheck /></el-icon>
            <span>验收检查</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { Monitor, Odometer, Location, Warning, List, Document, CircleCheck } from '@element-plus/icons-vue'
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

.app-container {
  height: 100%;
}

.header {
  background: linear-gradient(90deg, #409EFF 0%, #67C23A 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
}

.aside {
  background-color: #304156;
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
