<script setup>
import { provide, ref, onMounted } from 'vue'
import { useUserStore } from './store/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const isLoaded = ref(false)

onMounted(() => {
  userStore.initUser()
  setTimeout(() => {
    isLoaded.value = true
  }, 500)
})

provide('$message', ElMessage)
</script>

<template>
  <div id="app" v-if="isLoaded">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
