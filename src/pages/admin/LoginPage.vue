<template>
  <div class="min-h-screen flex">
    <div class="w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <svg class="w-full h-full" viewBox="0 0 800 800" fill="none">
          <circle cx="200" cy="200" r="150" stroke="white" stroke-width="2" />
          <circle cx="600" cy="400" r="200" stroke="white" stroke-width="2" />
          <circle cx="300" cy="600" r="100" stroke="white" stroke-width="2" />
        </svg>
      </div>
      <div class="relative z-10 h-full flex flex-col justify-between p-12 text-white">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span class="text-2xl font-bold">德</span>
          </div>
          <div>
            <div class="text-xl font-bold">德邦大件</div>
            <div class="text-sm text-white/70">Deppon Heavy Logistics</div>
          </div>
        </div>
        <div class="space-y-8">
          <div>
            <h1 class="text-4xl font-bold leading-tight mb-4">
              大件物流<br />数字运营平台
            </h1>
            <p class="text-lg text-white/80 leading-relaxed">
              智能路由规划 · 实时在途监控 · 全链路可视化管理<br />
              让大件运输更高效、更安全、更透明
            </p>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white/10 backdrop-blur rounded-xl p-5">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <component :is="icons.MapPin" class="w-5 h-5" />
              </div>
              <div class="font-semibold mb-1">智能路径规划</div>
              <div class="text-sm text-white/70">限高限重自动规避，多方案智能选优</div>
            </div>
            <div class="bg-white/10 backdrop-blur rounded-xl p-5">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <component :is="icons.Radio" class="w-5 h-5" />
              </div>
              <div class="font-semibold mb-1">实时监控</div>
              <div class="text-sm text-white/70">温湿度震动GPS，全程数据可追溯</div>
            </div>
            <div class="bg-white/10 backdrop-blur rounded-xl p-5">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <component :is="icons.Video" class="w-5 h-5" />
              </div>
              <div class="font-semibold mb-1">AI视频审核</div>
              <div class="text-sm text-white/70">装卸作业智能抽检，违规自动识别</div>
            </div>
            <div class="bg-white/10 backdrop-blur rounded-xl p-5">
              <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <component :is="icons.FileCheck" class="w-5 h-5" />
              </div>
              <div class="font-semibold mb-1">智能理赔</div>
              <div class="text-sm text-white/70">OCR自动识别，快速理算赔付</div>
            </div>
          </div>
        </div>
        <div class="text-sm text-white/50">
          © 2026 德邦大件物流 版权所有
        </div>
      </div>
    </div>

    <div class="w-1/2 flex items-center justify-center bg-bg-50">
      <div class="w-full max-w-md px-8">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">欢迎登录</h2>
          <p class="text-gray-500">请输入您的账号信息以访问运营管理平台</p>
        </div>
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="label-base">账号</label>
            <div class="relative">
              <component :is="icons.User" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="input-base pl-11"
              />
            </div>
          </div>
          <div>
            <label class="label-base">密码</label>
            <div class="relative">
              <component :is="icons.Lock" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="input-base pl-11 pr-11"
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? icons.EyeOff : icons.Eye" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.remember" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              <span class="text-sm text-gray-600">记住我</span>
            </label>
            <a href="javascript:void(0)" class="text-sm text-brand-500 hover:text-brand-600 hover:underline">
              忘记密码？
            </a>
          </div>
          <button type="submit" class="btn-primary w-full py-3 text-base">
            登 录
          </button>
        </form>
        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-3">
              返回德邦大件物流门户首页？
            </p>
            <router-link to="/" class="btn-secondary w-full inline-flex items-center justify-center gap-2">
              <component :is="icons.Home" class="w-4 h-4" />
              返回门户首页
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Eye, EyeOff, MapPin, Radio, Video, FileCheck, Home } from 'lucide-vue-next'

const icons = { User, Lock, Eye, EyeOff, MapPin, Radio, Video, FileCheck, Home }
const router = useRouter()
const showPassword = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

function handleLogin() {
  router.push('/admin/dashboard')
}
</script>
