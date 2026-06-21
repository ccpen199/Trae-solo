<template>
  <div class="min-h-screen flex flex-col bg-neutral-100">
    <FrontendHeader />
    <main class="flex-1">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>
    <footer class="bg-neutral-800 text-white py-10 mt-auto">
      <div class="container">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center gap-2.5 mb-4">
              <div class="w-9 h-9 bg-gov-gradient rounded-lg flex items-center justify-center">
                <Building2 class="w-4 h-4 text-white" />
              </div>
              <span class="text-lg font-bold">抚州政务</span>
            </div>
            <p class="text-neutral-400 text-sm leading-relaxed">
              抚州市政务民生服务门户，为市民提供高效、便捷、优质的政务服务。
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-white">服务热线</h4>
            <div class="space-y-2 text-neutral-400 text-sm">
              <p class="flex items-center gap-2">
                <Phone class="w-4 h-4" />
                12345（市民服务热线）
              </p>
              <p class="flex items-center gap-2">
                <Clock class="w-4 h-4" />
                周一至周五 9:00-17:00
              </p>
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-white">快捷入口</h4>
            <div class="space-y-2 text-neutral-400 text-sm">
              <router-link to="/services" class="block hover:text-white transition-colors">办事服务</router-link>
              <router-link to="/tools" class="block hover:text-white transition-colors">便民工具</router-link>
              <router-link to="/complaints" class="block hover:text-white transition-colors">投诉建议</router-link>
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-white">关注我们</h4>
            <div class="flex gap-3">
              <div class="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                <QrCode class="w-16 h-16 text-neutral-800" />
              </div>
              <div class="text-neutral-400 text-sm">
                <p>扫码关注</p>
                <p>抚州政务微信</p>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t border-neutral-700 mt-8 pt-6 text-center text-neutral-500 text-sm">
          <p>© 2024 抚州市人民政府 版权所有 | 赣ICP备XXXXXXXX号</p>
          <p class="mt-1">主办单位：抚州市人民政府办公室 | 技术支持：抚州市大数据中心</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import FrontendHeader from './components/FrontendHeader.vue'
import { Building2, Phone, Clock, QrCode } from 'lucide-vue-next'
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
