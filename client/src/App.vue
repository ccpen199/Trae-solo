<template>
  <div id="app">
    <nav class="nav">
      <div class="container">
        <div class="nav-inner">
          <router-link to="/" class="nav-logo">猫扑联盟</router-link>
          <div class="nav-links">
            <router-link to="/" class="nav-link" :class="{ active: $route.name === 'Home' }">首页</router-link>
            <router-link to="/ranking" class="nav-link" :class="{ active: $route.name === 'Ranking' }">排行榜</router-link>
            <template v-if="userStore.isLoggedIn">
              <router-link to="/my-unions" class="nav-link" :class="{ active: $route.name === 'MyUnions' }">我的联盟</router-link>
              <router-link to="/create-union" class="btn btn-primary">创建联盟</router-link>
              <div class="user-info">
                <div class="avatar">{{ userStore.user?.nickname?.charAt(0) || 'U' }}</div>
                <span class="nav-link" @click="handleLogout">退出</span>
              </div>
            </template>
            <template v-else>
              <router-link to="/login" class="nav-link">登录</router-link>
              <router-link to="/register" class="btn btn-primary">注册</router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>
    <main style="padding: 32px 0;">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import router from '@/router';

const userStore = useUserStore();

const handleLogout = async () => {
  await userStore.logout();
  router.push('/');
};
</script>
