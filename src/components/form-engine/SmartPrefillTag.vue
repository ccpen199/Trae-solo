<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { ElTooltip } from 'element-plus'

defineProps<{
  source?: string
}>()

const emit = defineEmits<{
  (e: 'prefill'): void
}>()
</script>

<template>
  <ElTooltip :content="source ? `从${source}智能预填` : '点击使用智能预填'" placement="top">
    <button
      type="button"
      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md
             bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200
             hover:from-amber-100 hover:to-orange-100 hover:border-amber-300
             transition-all duration-200 cursor-pointer"
      @click="emit('prefill')"
    >
      <Sparkles class="w-3 h-3" />
      <span>智能预填</span>
    </button>
  </ElTooltip>
</template>
