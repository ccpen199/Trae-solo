<template>
  <div :class="{ 'elder-mode': userStore.elderMode }">
    <router-view />
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
