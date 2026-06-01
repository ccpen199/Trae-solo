<template>
  <div id="app">
    <header class="header">
      <div class="container header-content">
        <h1 class="logo" @click="$router.push('/')">米家</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/scenes" class="nav-link">场景</router-link>
          <router-link to="/analytics" class="nav-link">统计</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.logo {
  font-size: 24px;
  font-weight: 600;
  color: #ff6700;
  cursor: pointer;
  margin: 0;
}

.nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-size: 14px;
  padding: 8px 0;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #ff6700;
}

.main {
  padding: 24px 0;
}
</style>
