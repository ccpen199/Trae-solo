<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

onMounted(() => {
  const userStore = useUserStore()
  userStore.initFromStorage()
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
