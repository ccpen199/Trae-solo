<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f5f5f5;
}

a {
  text-decoration: none;
  color: inherit;
}

.el-container {
  min-height: 100vh;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.el-main {
  padding: 20px;
}

.el-footer {
  background-color: #333;
  color: #fff;
  text-align: center;
  padding: 20px 0;
}

.product-card {
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.price {
  color: #ff4d4f;
  font-size: 18px;
  font-weight: bold;
}

.cart-badge {
  position: relative;
}

.search-box {
  margin-bottom: 20px;
}

.category-menu {
  background-color: #fff;
  border-radius: 4px;
  padding: 10px;
}
</style>
