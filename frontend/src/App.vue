<template>
  <div id="app">
    <div class="header">
      <div class="header-content">
        <h1>政务材料复用系统</h1>
        <div class="nav-menu">
          <a href="#/" class="nav-item" :class="{ active: activeMenu === '/' }" @click.prevent="goTo('/')">首页</a>
          <a href="#/citizen" class="nav-item" :class="{ active: activeMenu === '/citizen' }" @click.prevent="goTo('/citizen')">群众端</a>
          <a href="#/window" class="nav-item" :class="{ active: activeMenu === '/window' }" @click.prevent="goTo('/window')">窗口端</a>
          <a href="#/approver" class="nav-item" :class="{ active: activeMenu === '/approver' }" @click.prevent="goTo('/approver')">审批端</a>
        </div>
      </div>
    </div>
    <div class="main-content">
      <router-view />
    </div>
    <div class="footer">
      <p>政务材料复用系统 &copy; 2024</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const goTo = (path) => {
  router.push(path)
}

onMounted(() => {
  console.log('App mounted')
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #409eff;
  color: white;
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header h1 {
  color: white;
  font-size: 20px;
  margin: 0;
}

.nav-menu {
  display: flex;
  gap: 5px;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 0 15px;
  height: 60px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  border-bottom: 2px solid white;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
}

.footer {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  color: #909399;
}
</style>
