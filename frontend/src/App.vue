<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #2c3e50; color: white">
      <div style="padding: 20px; text-align: center; font-size: 18px; font-weight: bold; border-bottom: 1px solid #34495e">
        社区积分系统
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#2c3e50"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/residents">
          <el-icon><User /></el-icon>
          <span>居民档案</span>
        </el-menu-item>
        <el-menu-item index="/rules">
          <el-icon><Setting /></el-icon>
          <span>积分规则</span>
        </el-menu-item>
        <el-menu-item index="/activities">
          <el-icon><Calendar /></el-icon>
          <span>活动管理</span>
        </el-menu-item>
        <el-menu-item index="/exchange">
          <el-icon><Goods /></el-icon>
          <span>积分兑换</span>
        </el-menu-item>
        <el-menu-item index="/ranking">
          <el-icon><Trophy /></el-icon>
          <span>积分排行</span>
        </el-menu-item>
        <el-menu-item index="/appeals">
          <el-icon><Warning /></el-icon>
          <span>申诉处理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 16px; font-weight: bold">{{ pageTitle }}</span>
        <span>管理员</span>
      </el-header>
      <el-main style="background-color: #f5f5f5; overflow: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, User, Setting, Calendar, Goods, Trophy, Warning } from '@element-plus/icons-vue'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || '社区治理积分系统')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
