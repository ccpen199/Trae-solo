<template>
  <el-config-provider :locale="zhCn">
    <div id="app">
      <router-view v-if="!isLoginPage" />
      <Login v-else />
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import Login from '@/views/Login.vue'

const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  min-height: 100vh;
  background-color: #f5f7fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
