<template>
  <div class="app">
    <header class="header">
      <div class="logo">🚀 闪送 - 同城即时配送</div>
      <nav class="nav">
        <router-link to="/" class="nav-link">仪表盘</router-link>
        <router-link to="/orders" class="nav-link">订单管理</router-link>
        <router-link to="/riders" class="nav-link">骑手管理</router-link>
        <router-link to="/tracking" class="nav-link">实时轨迹</router-link>
        <router-link to="/enterprise" class="nav-link">企业定制</router-link>
        <router-link to="/archives" class="nav-link">文档归档</router-link>
      </nav>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
.app {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.logo {
  font-size: 20px;
  font-weight: 600;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255,255,255,0.2);
  color: white;
}

.main {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
