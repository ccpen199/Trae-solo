<template>
  <div class="app-container">
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
    <van-tabbar v-if="showTabbar" v-model="active" class="app-tabbar" route :fixed="false" :placeholder="false" safe-area-inset-bottom>
      <van-tabbar-item to="/">
        <template #icon="props">
          <van-icon :name="props.active ? 'home' : 'home-o'" size="20" />
        </template>
        <span>首页</span>
      </van-tabbar-item>
      <van-tabbar-item to="/services">
        <template #icon="props">
          <van-icon :name="props.active ? 'apps' : 'apps-o'" size="20" />
        </template>
        <span>服务</span>
      </van-tabbar-item>
      <van-tabbar-item to="/news">
        <template #icon="props">
          <van-icon :name="props.active ? 'newspaper' : 'newspaper-o'" size="20" />
        </template>
        <span>资讯</span>
      </van-tabbar-item>
      <van-tabbar-item to="/profile">
        <template #icon="props">
          <van-icon :name="props.active ? 'user' : 'user-o'" size="20" />
        </template>
        <span>我的</span>
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const active = ref(0);

const authRoutes = ['/login'];
const showTabbar = computed(() => !authRoutes.includes(route.path));

watch(
  () => route.path,
  (path) => {
    if (path === '/') active.value = 0;
    else if (path === '/services') active.value = 1;
    else if (path === '/news') active.value = 2;
    else if (path === '/profile') active.value = 3;
  },
  { immediate: true }
);
</script>

<style>
.app-container {
  min-height: 100vh;
  width: min(100%, 430px);
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 0 24px rgba(21, 33, 50, 0.08);
}

.app-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding-bottom: 64px;
}

.app-tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 1000;
  width: min(100%, 430px);
  transform: translateX(-50%);
  border-top: 1px solid #ebedf0;
}
</style>
