<template>
  <div id="app">
    <router-view />
    <van-tabbar v-model="active" v-if="showTabbar" route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/search" icon="search">找家具</van-tabbar-item>
      <van-tabbar-item to="/articles" icon="notes-o">攻略</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

const showTabbar = computed(() => {
  const tabbarPages = ['/', '/search', '/articles', '/profile']
  return tabbarPages.includes(route.path)
})

watch(() => route.path, (path) => {
  const tabbarPages = {
    '/': 0,
    '/search': 1,
    '/articles': 2,
    '/profile': 3
  }
  if (tabbarPages[path] !== undefined) {
    active.value = tabbarPages[path]
  }
}, { immediate: true })
</script>

<style scoped>
#app {
  height: 100%;
}

:deep(.van-tabbar) {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
