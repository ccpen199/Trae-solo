<template>
  <van-tabbar v-model="active" fixed>
    <van-tabbar-item icon="home-o" @click="goPage('/home')">首页</van-tabbar-item>
    <van-tabbar-item icon="apps-o" @click="goPage('/category')">分类</van-tabbar-item>
    <van-tabbar-item icon="shopping-cart-o" :badge="cartCount" @click="goPage('/cart')">购物车</van-tabbar-item>
    <van-tabbar-item icon="user-o" @click="goPage('/user')">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '@/store/cart';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const active = ref(0);
const cartCount = computed(() => cartStore.cartCount);

const pathMap = {
  '/home': 0,
  '/category': 1,
  '/cart': 2,
  '/user': 3
};

const goPage = (path) => {
  if (route.path !== path) {
    router.push(path);
  }
};

watch(
  () => route.path,
  (newPath) => {
    active.value = pathMap[newPath] ?? 0;
  },
  { immediate: true }
);

onMounted(() => {
  if (localStorage.getItem('token')) {
    cartStore.getCart();
  }
});
</script>

<style scoped>
.van-tabbar {
  z-index: 999 !important;
}
</style>
