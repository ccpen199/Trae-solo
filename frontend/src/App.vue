<template>
  <div id="app" class="app-container">
    <router-view />
    <Tabbar v-if="showTabbar" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Tabbar from '@/components/Tabbar.vue'

const route = useRoute()

const showTabbar = computed(() => {
  const tabbarRoutes = ['/community', '/qa', '/publish', '/activities', '/my']
  return tabbarRoutes.includes(route.path)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

.app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #fff;
  position: relative;
  padding-bottom: 50px;
}
</style>
