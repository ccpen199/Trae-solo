<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">🏠 地产案场客户跟进系统</h1>
        <nav class="nav">
          <router-link to="/">仪表盘</router-link>
          <router-link to="/customers">客户管理</router-link>
          <router-link to="/properties">房源管理</router-link>
          <router-link to="/reports">数据报表</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.header-content { max-width: 1400px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; height: 64px; }
.logo { font-size: 20px; font-weight: 600; margin: 0; }
.nav { display: flex; gap: 8px; }
.nav a { color: rgba(255,255,255,0.9); text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; transition: all 0.2s; }
.nav a:hover { background: rgba(255,255,255,0.15); color: white; }
.nav a.router-link-active { background: rgba(255,255,255,0.2); color: white; font-weight: 500; }
.main { flex: 1; max-width: 1400px; width: 100%; margin: 0 auto; padding: 24px; }
</style>
