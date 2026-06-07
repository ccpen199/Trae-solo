<script setup lang="ts">
defineProps<{
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="empty-state">
    <el-empty :description="description || '暂无数据'">
      <template #image>
        <el-icon v-if="icon" :size="64" color="#c0c4cc">
          <component :is="icon" />
        </el-icon>
      </template>
      <slot />
    </el-empty>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}
</style>
