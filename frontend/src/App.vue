<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" style="background-color: #2e3b4e">
      <div style="color: white; padding: 20px; font-size: 16px; font-weight: bold">
        批发市场交易系统
      </div>
      <el-menu
        background-color="#2e3b4e"
        text-color="#fff"
        active-text-color="#ffd04b"
        :router="true"
        default-active="/dashboard"
      >
        <el-menu-item index="/dashboard">数据概览</el-menu-item>
        <el-menu-item index="/merchants">商户管理</el-menu-item>
        <el-menu-item index="/products">商品管理</el-menu-item>
        <el-menu-item index="/customers">客户管理</el-menu-item>
        <el-menu-item index="/orders">订单管理</el-menu-item>
        <el-menu-item index="/order-create">采购下单</el-menu-item>
        <el-menu-item index="/disputes">纠纷处理</el-menu-item>
        <el-menu-item index="/transactions">交易台账</el-menu-item>
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
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.el-main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
