<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item name="/posts" icon="photo-o">
      日常
    </van-tabbar-item>
    <van-tabbar-item name="/questions" icon="question-o">
      问答
    </van-tabbar-item>
    <van-tabbar-item name="/messages" icon="chat-o" :badge="unreadCount">
      消息
    </van-tabbar-item>
    <van-tabbar-item name="/my" icon="user-o">
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const active = computed(() => route.path)
const unreadCount = ref(0)
</script>
