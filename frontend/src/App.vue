<template>
  <el-container style="height: 100vh">
    <el-header style="background: #001529; color: white; display: flex; align-items: center; padding: 0 20px">
      <h2 style="margin: 0; color: white">🏗️ 智慧工地塔吊监测系统</h2>
      <el-menu
        mode="horizontal"
        :router="true"
        style="flex: 1; margin-left: 30px; background: transparent; border: none"
        active-text-color="#409eff"
        text-color="#fff"
      >
        <el-menu-item index="/dashboard">安全看板</el-menu-item>
        <el-menu-item index="/cranes">塔吊档案</el-menu-item>
        <el-menu-item index="/monitor">实时监测</el-menu-item>
        <el-menu-item index="/alerts">预警处置</el-menu-item>
        <el-menu-item index="/maintenance">维保管理</el-menu-item>
      </el-menu>
    </el-header>
    <el-main style="background: #f0f2f5; padding: 20px">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
</script>
