<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background-color: #304156">
      <div style="padding: 20px; color: #fff; text-align: center; font-size: 16px; font-weight: 600; border-bottom: 1px solid #1f2d3d">
        消防隐患排查系统
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>隐患看板</span>
        </el-menu-item>
        <el-menu-item index="/units">
          <el-icon><OfficeBuilding /></el-icon>
          <span>检查对象</span>
        </el-menu-item>
        <el-menu-item index="/inspections">
          <el-icon><Document /></el-icon>
          <span>检查记录</span>
        </el-menu-item>
        <el-menu-item index="/hazards">
          <el-icon><Warning /></el-icon>
          <span>隐患管理</span>
        </el-menu-item>
        <el-menu-item index="/rectifications">
          <el-icon><Tools /></el-icon>
          <span>整改管理</span>
        </el-menu-item>
        <el-menu-item index="/rechecks">
          <el-icon><CircleCheck /></el-icon>
          <span>复查管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 14px; color: #606266">欢迎使用消防隐患排查系统</span>
        <el-tag type="info">管理员</el-tag>
      </el-header>
      <el-main style="padding: 0; background: #f5f7fa">
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
</script>

<style>
.el-menu-vertical-demo {
  border-right: none;
}
</style>
