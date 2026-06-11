<template>
  <div class="min-h-screen flex flex-col bg-bg-50">
    <header class="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="flex items-center justify-between h-16">
          <router-link to="/" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span class="text-white font-bold text-lg">德</span>
            </div>
            <div>
              <div class="text-lg font-bold text-gray-900">德邦大件 · 企业开放平台</div>
              <div class="text-xs text-gray-500">Enterprise API Platform</div>
            </div>
          </router-link>

          <nav class="hidden md:flex items-center gap-1">
            <router-link
              :to="'/enterprise/api-docs'"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/enterprise/api-docs' }"
            >
              接口文档
            </router-link>
            <router-link
              :to="'/enterprise/api-apply'"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/enterprise/api-apply' }"
            >
              对接申请
            </router-link>
            <router-link to="/" class="nav-link">返回门户</router-link>
          </nav>

          <div class="flex items-center gap-3">
            <button class="btn-ghost text-sm">文档中心</button>
            <button class="btn-primary text-sm inline-flex items-center gap-1.5">
              <component :is="icons.KeyRound" class="w-4 h-4" />
              获取密钥
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 animate-fade-in">
      <slot />
    </main>

    <footer class="bg-white border-t border-gray-100 py-6">
      <div class="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-6">
          <span>API v2.1.0</span>
          <span>SDK: Java / Python / Node.js / PHP</span>
          <span>SLA 99.95%</span>
        </div>
        <p>© 2026 德邦物流企业开放平台 · 技术支持：研发中心</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { KeyRound } from 'lucide-vue-next'

const icons = { KeyRound }
</script>
