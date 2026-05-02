<template>
  <div class="placeholder-page">
    <el-card>
      <template #header>
        <span>菜品销量</span>
      </template>
      <el-empty description="菜品销量页面开发中...">
        <el-button type="primary" @click="goBack">返回首页</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.push('/dashboard')
}
</script>

<style lang="scss" scoped>
.placeholder-page {
  padding: 20px;
}
</style>
