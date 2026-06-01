<template>
  <el-container style="height: 100%">
    <el-header style="background: #fff; border-bottom: 1px solid #e4e7ed; display: flex; align-items: center; padding: 0 24px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-icon :size="28" color="#409eff"><OfficeBuilding /></el-icon>
        <h2 style="margin: 0; font-size: 18px; color: #303133;">人员技能上岗系统</h2>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" style="background: #fff; border-right: 1px solid #e4e7ed;">
        <el-menu
          :default-active="activeMenu"
          router
          style="border-right: none;"
        >
          <el-menu-item index="/">
            <el-icon><DataAnalysis /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/employees">
            <el-icon><User /></el-icon>
            <span>员工档案</span>
          </el-menu-item>
          <el-menu-item index="/positions">
            <el-icon><Briefcase /></el-icon>
            <span>岗位管理</span>
          </el-menu-item>
          <el-menu-item index="/training">
            <el-icon><Reading /></el-icon>
            <span>培训考试</span>
          </el-menu-item>
          <el-menu-item index="/authorizations">
            <el-icon><DocumentAdd /></el-icon>
            <span>授权申请</span>
          </el-menu-item>
          <el-menu-item index="/approval">
            <el-icon><Check /></el-icon>
            <span>授权审批</span>
          </el-menu-item>
          <el-menu-item index="/schedules">
            <el-icon><Calendar /></el-icon>
            <span>排班校验</span>
          </el-menu-item>
          <el-menu-item index="/audit">
            <el-icon><CircleCheck /></el-icon>
            <span>验收检查</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main style="background: #f5f7fa; padding: 0;">
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
