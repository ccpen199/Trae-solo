<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #2c3e50">
      <div style="color: white; padding: 20px; font-size: 18px; font-weight: bold; text-align: center">
        ❄️ 冷库WMS
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#2c3e50"
        text-color="#bdc3c7"
        active-text-color="#3498db"
      >
        <el-menu-item index="/dashboard">📊 仪表盘</el-menu-item>
        <el-menu-item index="/customers">👥 客户管理</el-menu-item>
        <el-menu-item index="/products">📦 货品管理</el-menu-item>
        <el-menu-item index="/inbound">📥 入库管理</el-menu-item>
        <el-menu-item index="/inventory">🗄️ 库存管理</el-menu-item>
        <el-menu-item index="/temperature">🌡️ 温度监控</el-menu-item>
        <el-menu-item index="/outbound">📤 出库管理</el-menu-item>
        <el-menu-item index="/billing">💰 费用结算</el-menu-item>
        <el-menu-item index="/exceptions">⚠️ 异常处理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background-color: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 20px; font-weight: bold">{{ $route.name }}</span>
        <span style="color: #666">{{ currentTime }}</span>
      </el-header>
      <el-main style="background-color: #f5f7fa; overflow: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentTime: new Date().toLocaleString(),
      timer: null
    }
  },
  mounted() {
    this.timer = setInterval(() => {
      this.currentTime = new Date().toLocaleString()
    }, 1000)
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
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
</style>
