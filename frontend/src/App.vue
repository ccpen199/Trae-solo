<template>
  <el-container class="layout-container">
    <el-header style="background: #fff; border-bottom: 1px solid #e4e7ed; padding: 0;">
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        router
        style="border-bottom: none"
      >
        <div style="display: flex; align-items: center; padding: 0 20px; font-weight: bold; font-size: 18px; color: #1e3a8a;">
          🏗️ 建筑风控平台
        </div>
        <el-menu-item index="/admin">
          <el-icon><Setting /></el-icon>
          <span class="desktop-only">管理后台</span>
        </el-menu-item>
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span class="desktop-only">健康度仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/search">
          <el-icon><Search /></el-icon>
          <span class="desktop-only">企业查询</span>
        </el-menu-item>
        <el-menu-item index="/saas/rules">
          <el-icon><Setting /></el-icon>
          <span class="desktop-only">风控规则</span>
        </el-menu-item>
        <el-menu-item index="/saas/reports">
          <el-icon><Document /></el-icon>
          <span class="desktop-only">尽调报告</span>
        </el-menu-item>
        <el-menu-item index="/credit">
          <el-icon><Star /></el-icon>
          <span class="desktop-only">信用管理</span>
        </el-menu-item>
        <el-menu-item index="/mobile/offline">
          <el-icon><FolderOpened /></el-icon>
          <span class="desktop-only">离线档案</span>
        </el-menu-item>
        <el-menu-item index="/mobile" class="mobile-only">
          <el-icon><Iphone /></el-icon>
          <span>移动端</span>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main style="padding: 20px;">
      <router-view />
    </el-main>
    <el-footer style="text-align: center; padding: 20px; color: #909399; font-size: 12px;">
      建筑行业企业级风控数据服务平台 v1.0.0 | 数据来源均标注更新时间与原始出处
    </el-footer>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DataAnalysis, Search, Setting, Document, Star, Iphone, FolderOpened } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>
