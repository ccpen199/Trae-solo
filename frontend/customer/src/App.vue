<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from './stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

router.beforeEach(async (to, _from, next) => {
  const tableId = localStorage.getItem('tableId')
  const orderId = localStorage.getItem('orderId')

  if (to.meta.requiresTable && !tableId && !to.path.includes('/scan')) {
    next({ path: '/scan', query: { redirect: to.fullPath } })
    return
  }

  next()
})

watch(
  () => cartStore.totalCount,
  (count) => {
    if (count > 0) {
      document.title = `购物车(${count}) - 点餐`
    } else {
      document.title = '点餐'
    }
  }
)
</script>

<template>
  <router-view />
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
