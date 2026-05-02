<template>
  <div class="placeholder-page">
    <el-card>
      <template #header>
        <span>{{ pageTitle }}</span>
      </template>
      <el-empty description="该页面开发中...">
        <el-button type="primary" @click="goBack">返回</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('order/detail')) return '订单详情'
  if (path.includes('after-sale')) return '售后管理'
  if (path.includes('platform')) return '平台授权'
  if (path.includes('goods')) return '菜品管理'
  if (path.includes('print')) return '打印管理'
  if (path.includes('statistics')) return '营业统计'
  if (path.includes('audit')) return '审计日志'
  if (path.includes('setting')) return '系统设置'
  return '页面'
})

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.placeholder-page {
  padding: 20px;
}
</style>
