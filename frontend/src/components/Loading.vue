<template>
  <div class="flex items-center justify-center py-8">
    <div class="flex flex-col items-center gap-3">
      <div class="w-8 h-8 border-4 border-pdd-red border-t-transparent rounded-full animate-spin"></div>
      <span class="text-gray-500 text-sm">{{ text }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>
