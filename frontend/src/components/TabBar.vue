<template>
  <van-tabbar v-model="active" route active-color="#1976d2">
    <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item to="/workbench" icon="apps-o">工作台</van-tabbar-item>
    <van-tabbar-item to="/identity" icon="qr">码上办</van-tabbar-item>
    <van-tabbar-item to="/outlets" icon="location-o">就近办</van-tabbar-item>
    <van-tabbar-item to="/elder" icon="heart-o">暖心办</van-tabbar-item>
    <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(route.path)
</script>

<style scoped>
:deep(.van-tabbar) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

:deep(.van-tabbar-item__icon) {
  font-size: 20px;
}

:deep(.van-tabbar-item__text) {
  font-size: 11px;
}
</style>
