<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  Shield,
  PiggyBank,
  ScanFace,
  Newspaper,
  BookOpen,
  LogIn,
  ChevronRight,
  Bell,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const handleLogin = () => {
  authStore.login();
};

const navCards = [
  {
    icon: PiggyBank,
    title: '社保权益查询',
    desc: '查询养老、失业、工伤、生育保险权益及缴费明细',
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    route: '/social-insurance',
  },
  {
    icon: ScanFace,
    title: '线上生存认证',
    desc: '通过人脸识别完成领取待遇资格认证',
    color: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    route: '/survival-certification',
  },
  {
    icon: Newspaper,
    title: '政策资讯',
    desc: '了解最新社保政策及解读',
    color: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    route: '#',
  },
  {
    icon: BookOpen,
    title: '办事指南',
    desc: '常见业务办理流程及材料清单',
    color: 'from-purple-500 to-purple-600',
    bgLight: 'bg-purple-50',
    route: '#',
  },
];

const handleNavClick = (route: string) => {
  if (route === '#') return;
  if (!authStore.isAuthenticated) {
    handleLogin();
    return;
  }
  router.push(route);
};

const announcements = [
  { id: 1, text: '2026年度社保缴费基数已更新，请及时查询确认', date: '2026-06-10' },
  { id: 2, text: '生存认证新渠道上线，支持人脸识别在线认证', date: '2026-06-08' },
  { id: 3, text: '广西人社APP 3.0版本正式发布，体验全新服务', date: '2026-06-05' },
];
</script>

<template>
  <div>
    <section class="relative overflow-hidden bg-gov-gradient text-white">
      <svg
        class="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="zhuangjin" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 30 L15 0 L30 30 L15 60 Z" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
            <path d="M30 30 L45 0 L60 30 L45 60 Z" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
            <circle cx="15" cy="30" r="3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
            <circle cx="45" cy="30" r="3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
            <line x1="0" y1="15" x2="60" y2="15" stroke="rgba(255,255,255,0.1)" stroke-width="0.3" />
            <line x1="0" y1="45" x2="60" y2="45" stroke="rgba(255,255,255,0.1)" stroke-width="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#zhuangjin)" />
      </svg>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div class="text-center">
          <div class="flex items-center justify-center gap-3 mb-4">
            <Shield class="w-12 h-12" />
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-wide">
            广西人社公共服务可信数字平台
          </h1>
          <p class="text-lg sm:text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            基于区块链可信认证，为参保群众提供安全便捷的社保服务
          </p>
          <button
            v-if="!authStore.isAuthenticated"
            class="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-btn text-lg
              shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-100"
            @click="handleLogin"
          >
            <LogIn class="w-5 h-5" />
            桂事通登录
          </button>
          <button
            v-else
            class="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-btn text-lg
              shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-100"
            @click="router.push('/dashboard')"
          >
            进入工作台
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg to-transparent" />
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="card in navCards"
          :key="card.title"
          class="card-base card-hover p-6 cursor-pointer group"
          @click="handleNavClick(card.route)"
        >
          <div :class="[card.bgLight, 'w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform']">
            <component :is="card.icon" class="w-7 h-7 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ card.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ card.desc }}</p>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pb-12">
      <div class="card-base p-6">
        <div class="flex items-center gap-2 mb-4">
          <Bell class="w-5 h-5 text-accent" />
          <h2 class="text-lg font-semibold text-gray-800">通知公告</h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="item in announcements"
            :key="item.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              <span class="text-sm text-gray-700">{{ item.text }}</span>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0 ml-4">{{ item.date }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
