<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div class="text-6xl mb-4">{{ icon }}</div>
    <p class="text-gray-400 text-sm">{{ text }}</p>
    <button
      v-if="showRetry"
      @click="$emit('retry')"
      class="mt-4 px-4 py-2 bg-pdd-red text-white text-sm rounded-full"
    >
      点击重试
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '📭'
  },
  text: {
    type: String,
    default: '暂无数据'
  },
  showRetry: {
    type: Boolean,
    default: false
  }
})

defineEmits(['retry'])
</script>
