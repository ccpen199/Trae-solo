<template>
  <el-config-provider :locale="zhCn">
    <router-view v-if="!isLoginPage" />
    <router-view v-else />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'Login')
</script>
