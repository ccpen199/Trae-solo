<template>
  <el-container class="layout-wrapper">
    <el-aside :width="isCollapse ? '64px' : '240px'" class="layout-aside">
      <Sidebar :collapse="isCollapse" />
    </el-aside>

    <el-container class="layout-main-container">
      <el-header class="layout-header">
        <HeaderBar
          :collapse="isCollapse"
          @toggle-collapse="isCollapse = !isCollapse"
        />
      </el-header>

      <el-breadcrumb class="breadcrumb-wrapper" separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path">
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <el-footer class="layout-footer">
        <span>© 2025 郑州市大数据管理局 版权所有 | 技术支持：郑州市掌上办事中枢项目组 v2.1.0</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'

const isCollapse = ref(false)
const route = useRoute()

const breadcrumbList = computed(() => {
  const matched = route.matched.filter(r => r.meta && r.meta.title && r.meta.title !== '首页')
  const list: { path: string; title: string }[] = [{ path: '/dashboard', title: '首页' }]
  matched.forEach(r => list.push({ path: r.path, title: r.meta.title as string }))
  return list
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.layout-wrapper { height: 100vh; width: 100vw; overflow: hidden; }

.layout-aside {
  background: linear-gradient(180deg, #0D3A7C 0%, #1E4FA5 100%);
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
}

.layout-main-container { display: flex; flex-direction: column; background: $bg-page; overflow: hidden; }

.layout-header {
  height: 60px !important;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  padding: 0;
  z-index: 10;
}

.breadcrumb-wrapper {
  padding: 12px 20px 0;
  background: $bg-page;
  flex-shrink: 0;
  margin: 0 !important;
  height: auto;
}

.layout-main {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.layout-footer {
  height: 48px !important;
  background: #fff;
  border-top: 1px solid $border-lighter;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  font-size: 12px;
  padding: 0;
  flex-shrink: 0;
}
</style>
