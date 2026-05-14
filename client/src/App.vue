<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive :include="['Home', 'Category', 'Content', 'Profile']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <TabBar v-if="showTabBar" />
    
    <Toast v-if="toast.show" :message="toast.message" />
  </div>
</template>

<script setup>
import { computed, ref, provide } from 'vue';
import { useRoute } from 'vue-router';
import TabBar from './components/TabBar.vue';
import Toast from './components/Toast.vue';

const route = useRoute();

const showTabBar = computed(() => {
  const tabRoutes = ['/', '/category', '/content', '/message', '/profile'];
  return tabRoutes.includes(route.path);
});

const toast = ref({ show: false, message: '' });

const showToast = (message, duration = 2000) => {
  toast.value = { show: true, message };
  setTimeout(() => {
    toast.value.show = false;
  }, duration);
};

provide('showToast', showToast);
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
