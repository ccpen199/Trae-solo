<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item name="/community" icon="home-o">社区</van-tabbar-item>
    <van-tabbar-item name="/qa" icon="comment-o">问答</van-tabbar-item>
    <van-tabbar-item name="/publish" icon="plus">发布</van-tabbar-item>
    <van-tabbar-item name="/activities" icon="calendar-o">活动</van-tabbar-item>
    <van-tabbar-item name="/my" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(route.path)

watch(
  () => route.path,
  (newPath) => {
    active.value = newPath
  }
)
</script>
