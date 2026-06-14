<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onMounted(async () => {
  if (userStore.token && !userStore.userInfo) {
    await userStore.fetchCurrentUser()
  }
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background: #f5f7fa;
}
</style>
