<template>
  <div id="app">
    <header class="app-header">
      <div class="container flex justify-between items-center">
        <h1 class="logo">📚 自适应学习推荐系统</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link">学习中心</router-link>
          <router-link to="/profile" class="nav-link">学习画像</router-link>
          <router-link to="/history" class="nav-link">学习记录</router-link>
          <router-link to="/admin" class="nav-link">运营后台</router-link>
        </nav>
      </div>
    </header>
    <main class="container mt-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 16px 0;
}
.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}
.nav {
  display: flex;
  gap: 24px;
}
.nav-link {
  color: var(--gray-600);
  text-decoration: none;
  font-weight: 500;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
</style>
