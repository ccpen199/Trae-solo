<template>
  <div class="app">
    <AppHeader v-if="!isAdminPage" />
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <ErrorBoundary>
          <component :is="Component" />
        </ErrorBoundary>
      </transition>
    </router-view>
    <AppFooter v-if="!isAdminPage" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ErrorBoundary from '@/components/ErrorBoundary.vue';

const route = useRoute();
const userStore = useUserStore();

const isAdminPage = computed(() => route.path.startsWith('/admin'));

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchUnreadCount();
  }
});
</script>

<style scoped>
.app {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
