<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { ElLoading } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

const showLoading = () => {
  if (!loadingInstance) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
  }
}

const hideLoading = () => {
  if (loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  if (to.meta.roles && authStore.user?.role) {
    const hasPermission = to.meta.roles.includes(authStore.user.role)
    if (!hasPermission) {
      next('/403')
      return
    }
  }

  if (to.meta.requiresAuth) {
    showLoading()
  }

  next()
})

router.afterEach(() => {
  hideLoading()
})

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && route.meta.requiresAuth) {
      router.push('/login')
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
  height: 100%;
}
</style>
