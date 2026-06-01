<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background-color: #2e3b4e">
      <div style="color: white; padding: 20px; font-size: 18px; font-weight: bold">
        车贷抵押物管理系统
      </div>
      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical"
        router
        background-color="#2e3b4e"
        text-color="#fff"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/vehicles">
          <el-icon><Van /></el-icon>
          <span>车辆档案</span>
        </el-menu-item>
        <el-menu-item index="/valuations">
          <el-icon><Money /></el-icon>
          <span>评估管理</span>
        </el-menu-item>
        <el-menu-item index="/loans">
          <el-icon><Document /></el-icon>
          <span>贷款管理</span>
        </el-menu-item>
        <el-menu-item index="/mortgages">
          <el-icon><Stamp /></el-icon>
          <span>抵押登记</span>
        </el-menu-item>
        <el-menu-item index="/gps">
          <el-icon><Position /></el-icon>
          <span>GPS监控</span>
        </el-menu-item>
        <el-menu-item index="/risks">
          <el-icon><Warning /></el-icon>
          <span>风险预警</span>
        </el-menu-item>
        <el-menu-item index="/disposals">
          <el-icon><Tools /></el-icon>
          <span>处置记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { DataAnalysis, Van, Money, Document, Stamp, Position, Warning, Tools } from '@element-plus/icons-vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
