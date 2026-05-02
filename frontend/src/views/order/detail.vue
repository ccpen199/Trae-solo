<template>
  <div class="placeholder-page">
    <el-card>
      <template #header>
        <span>订单详情</span>
      </template>
      <el-empty description="订单详情页面开发中...">
        <el-button type="primary" @click="goBack">返回订单列表</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

console.log('订单ID:', route.params.id)

function goBack() {
  router.push('/order/list')
}
</script>

<style lang="scss" scoped>
.placeholder-page {
  padding: 20px;
}
</style>
