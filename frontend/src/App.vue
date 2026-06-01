<template>
  <div class="layout-container">
    <div class="aside">
      <div class="logo">
        <span>控房系统</span>
      </div>
      <div class="menu">
        <router-link to="/" class="menu-item">数据概览</router-link>
        <router-link to="/hotels" class="menu-item">酒店管理</router-link>
        <router-link to="/control-plans" class="menu-item">控房计划</router-link>
        <router-link to="/teams" class="menu-item">团队管理</router-link>
        <router-link to="/settlements" class="menu-item">结算管理</router-link>
      </div>
    </div>
    <div class="content">
      <div class="header">
        <span>旅游团队控房管理系统</span>
        <span>管理员</span>
      </div>
      <div class="main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}

.layout-container {
  height: 100%;
  display: flex;
}

.aside {
  width: 220px;
  background-color: #001529;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.menu {
  padding: 10px 0;
}

.menu-item {
  display: block;
  padding: 12px 24px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s;
}

.menu-item:hover, .menu-item.router-link-active {
  background-color: #1890ff;
  color: #fff;
}

.content {
  flex: 1;
  margin-left: 220px;
}

.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  right: 0;
  left: 220px;
  z-index: 100;
  font-size: 18px;
  font-weight: 500;
}

.main {
  margin-top: 60px;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}
</style>
