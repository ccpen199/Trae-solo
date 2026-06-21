<template>
  <div class="app-container" :class="{ 'elder-mode': isElderMode }">
    <router-view />
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './store/user'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const userStore = useUserStore()

const isElderMode = computed(() => userStore.isElderMode)

const showTabBar = computed(() => {
  return !route.meta.hideTabBar
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 50px;
}

.elder-mode {
  font-size: 18px;
}
</style>
