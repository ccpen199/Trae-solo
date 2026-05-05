<template>
  <div id="app">
    <nav-header v-if="!isLoginPage" />
    <main class="main-content">
      <router-view />
    </main>
    <app-footer v-if="!isLoginPage" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useCartStore } from '@/store/cart'
import NavHeader from '@/components/NavHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()

const isLoginPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    cartStore.fetchCart().catch(() => {})
  }
})
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
