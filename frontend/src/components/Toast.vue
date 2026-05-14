<template>
  <transition-group name="toast" tag="div" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
    <div
      v-for="msg in toastStore.messages"
      :key="msg.id"
      class="px-4 py-2 rounded-lg text-white text-sm shadow-lg min-w-[120px] text-center"
      :class="{
        'bg-green-500': msg.type === 'success',
        'bg-red-500': msg.type === 'error',
        'bg-yellow-500': msg.type === 'warning',
        'bg-gray-700': msg.type === 'info'
      }"
    >
      {{ msg.message }}
    </div>
  </transition-group>
</template>

<script setup>
import { useToast } from '../stores/toast'

const toastStore = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
