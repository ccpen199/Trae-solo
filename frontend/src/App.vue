<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #304156">
      <div style="padding: 20px; text-align: center; color: white; font-size: 18px; font-weight: bold; border-bottom: 1px solid #1f2d3d">
        园区招商管理系统
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        style="border: none"
      >
        <el-menu-item index="/">
          <el-icon><data-analysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-sub-menu index="resources">
          <template #title>
            <el-icon><office-building /></el-icon>
            <span>园区资源</span>
          </template>
          <el-menu-item index="/buildings">楼宇管理</el-menu-item>
          <el-menu-item index="/rooms">房源管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="leads">
          <template #title>
            <el-icon><user /></el-icon>
            <span>线索管理</span>
          </template>
          <el-menu-item index="/leads">线索列表</el-menu-item>
          <el-menu-item index="/followups">跟进记录</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="business">
          <template #title>
            <el-icon><document /></el-icon>
            <span>招商业务</span>
          </template>
          <el-menu-item index="/viewings">带看记录</el-menu-item>
          <el-menu-item index="/quotes">报价方案</el-menu-item>
          <el-menu-item index="/contracts">合同管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/reports">
          <el-icon><pie-chart /></el-icon>
          <span>招商报表</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: white; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px">
        <span style="font-size: 16px; color: #606266">{{ pageTitle }}</span>
        <el-dropdown>
          <span class="el-dropdown-link" style="cursor: pointer; color: #606266">
            <el-icon><user-filled /></el-icon>
            管理员
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人设置</el-dropdown-item>
              <el-dropdown-item>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main style="background-color: #f5f7fa; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis,
  OfficeBuilding,
  User,
  Document,
  PieChart,
  UserFilled,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/': '数据概览',
    '/buildings': '楼宇管理',
    '/rooms': '房源管理',
    '/leads': '线索列表',
    '/followups': '跟进记录',
    '/viewings': '带看记录',
    '/quotes': '报价方案',
    '/contracts': '合同管理',
    '/reports': '招商报表'
  }
  return titles[route.path] || '园区招商管理系统'
})
</script>

<style scoped>
.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
