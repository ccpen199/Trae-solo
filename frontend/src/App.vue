<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #2c3e50">
      <div style="padding: 20px; color: white; text-align: center; border-bottom: 1px solid #34495e">
        <h2 style="margin: 0; font-size: 18px">专家库抽取系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#2c3e50"
        text-color="#bdc3c7"
        active-text-color="#3498db"
        router
      >
        <el-menu-item index="/">
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/experts">
          <span>专家库管理</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/audit">
          <span>审计日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: white; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between">
        <h3 style="margin: 0">{{ pageTitle }}</h3>
        <div style="color: #666">
          管理员
        </div>
      </el-header>
      <el-main style="background-color: #f5f6fa; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/': '数据概览',
    '/experts': '专家库管理',
    '/projects': '项目管理',
    '/audit': '审计日志'
  }
  if (route.path.startsWith('/projects/')) {
    return '项目详情'
  }
  return titles[route.path] || '专家库抽取系统'
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
