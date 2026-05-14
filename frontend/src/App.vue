<template>
  <div id="app" class="min-h-screen bg-pdd-bg">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <Toast />
  </div>
</template>

<script setup>
import { onErrorCaptured, provide } from 'vue'
import Toast from './components/Toast.vue'
import { useToast } from './stores/toast'

const toast = useToast()

onErrorCaptured((err, vm, info) => {
  console.error('App Error:', err, info)
  toast.error('页面加载失败，请点击重试')
  return true
})
</script>
