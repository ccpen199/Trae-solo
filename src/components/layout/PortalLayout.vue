<template>
  <div class="min-h-screen flex flex-col bg-bg-50">
    <header class="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="flex items-center justify-between h-16">
          <router-link to="/" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
              <span class="text-white font-bold text-lg">德</span>
            </div>
            <div>
              <div class="text-lg font-bold text-gray-900">德邦大件物流</div>
              <div class="text-xs text-gray-500">数字服务门户</div>
            </div>
          </router-link>

          <nav class="hidden md:flex items-center gap-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="nav-link"
              :class="{ 'nav-link-active': isActive(item.path) }"
            >
              {{ item.label }}
            </router-link>
          </nav>

          <div class="flex items-center gap-3">
            <router-link to="/enterprise/api-docs" class="btn-ghost hidden sm:inline-flex items-center gap-1.5">
              <component :is="icons.Code" class="w-4 h-4" />
              <span>企业API</span>
            </router-link>
            <router-link to="/admin/login" class="btn-ghost hidden sm:inline-flex items-center gap-1.5">
              <component :is="icons.User" class="w-4 h-4" />
              <span>运营后台</span>
            </router-link>
            <button class="btn-primary inline-flex items-center gap-1.5">
              <component :is="icons.Phone" class="w-4 h-4" />
              <span class="hidden sm:inline">95353</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 animate-fade-in">
      <slot />
    </main>

    <footer class="bg-gray-900 text-gray-300">
      <div class="container mx-auto px-4 max-w-7xl py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 class="text-white font-semibold mb-4">服务产品</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white transition-colors">标准大件运输</a></li>
              <li><a href="#" class="hover:text-white transition-colors">精密设备运输</a></li>
              <li><a href="#" class="hover:text-white transition-colors">冷链大件运输</a></li>
              <li><a href="#" class="hover:text-white transition-colors">企业搬家服务</a></li>
              <li><router-link to="/packaging/quote" class="hover:text-white transition-colors">特殊包装服务</router-link></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">客户服务</h4>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/order/create" class="hover:text-white transition-colors">在线下单</router-link></li>
              <li><router-link to="/tracking" class="hover:text-white transition-colors">运单追踪</router-link></li>
              <li><router-link to="/measurement/book" class="hover:text-white transition-colors">上门测量</router-link></li>
              <li><a href="#" class="hover:text-white transition-colors">网点查询</a></li>
              <li><a href="#" class="hover:text-white transition-colors">运费查询</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">企业合作</h4>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/enterprise/api-docs" class="hover:text-white transition-colors">API对接</router-link></li>
              <li><router-link to="/enterprise/api-apply" class="hover:text-white transition-colors">合作申请</router-link></li>
              <li><a href="#" class="hover:text-white transition-colors">月结客户</a></li>
              <li><a href="#" class="hover:text-white transition-colors">定制方案</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">联系我们</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-center gap-2">
                <component :is="icons.Phone" class="w-4 h-4" />
                全国服务热线：95353
              </li>
              <li class="flex items-center gap-2">
                <component :is="icons.Mail" class="w-4 h-4" />
                企业邮箱：vip@deppon.com
              </li>
              <li class="flex items-center gap-2">
                <component :is="icons.MapPin" class="w-4 h-4" />
                总部：上海市青浦区徐泾镇
              </li>
            </ul>
          </div>
        </div>
        <div class="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 德邦物流股份有限公司 版权所有 | 沪ICP备XXXXXXXX号</p>
          <p>交通运输部货运车辆动态监控平台 · 已对接</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Phone, User, Code, Mail, MapPin } from 'lucide-vue-next'

const icons = { Phone, User, Code, Mail, MapPin }
const route = useRoute()

const navItems = [
  { path: '/', label: '首页' },
  { path: '/order/create', label: '在线下单' },
  { path: '/tracking', label: '运单追踪' },
  { path: '/packaging/quote', label: '包装报价' },
  { path: '/measurement/book', label: '上门测量' }
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
