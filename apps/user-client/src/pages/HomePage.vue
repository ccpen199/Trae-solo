<script setup lang="ts">
import { computed, ref } from 'vue';
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
  Search,
  LayoutDashboard,
  SlidersHorizontal,
  AlertTriangle,
  ExternalLink,
  Zap,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const handleLogin = () => {
  authStore.login();
};

const serviceQuery = ref('');
const activeCategory = ref('全部');
const showDemoHint = ref(false);
const adminBaseUrl = import.meta.env.VITE_ADMIN_URL || `http://${window.location.hostname}:49289`;

const recommendedKeywords = [
  { label: '养老保险', route: '/social-insurance' },
  { label: '失业保险', route: '/social-insurance' },
  { label: '工伤保险', route: '/social-insurance' },
  { label: '生育保险', route: '/social-insurance' },
  { label: '缴费明细', route: '/social-insurance' },
  { label: '待遇发放', route: '/social-insurance' },
  { label: '账户余额', route: '/social-insurance' },
  { label: '同比环比', route: '/social-insurance' },
  { label: '生存认证', route: '/survival-certification' },
  { label: '人脸识别', route: '/survival-certification' },
  { label: '活体检测', route: '/survival-certification' },
  { label: '公安库比对', route: '/survival-certification' },
];

const navCards = [
  {
    icon: PiggyBank,
    title: '社保权益查询',
    desc: '查询养老、失业、工伤、生育保险权益及缴费明细、账户余额、同比环比对比',
    category: '权益查询',
    tags: ['养老保险', '失业保险', '工伤保险', '生育保险', '缴费明细', '待遇发放', '账户余额', '同比', '环比', '图表', '权益核验', '参保'],
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    route: '/social-insurance',
    available: true,
  },
  {
    icon: ScanFace,
    title: '线上生存认证',
    desc: '活体检测+人脸识别+公安库比对完成领取待遇资格认证，结果实时同步核心业务系统',
    category: '资格认证',
    tags: ['生存认证', '人脸识别', '活体检测', '公安库比对', '认证记录', '人脸采集', '待遇资格', '实时同步'],
    color: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    route: '/survival-certification',
    available: true,
  },
  {
    icon: Newspaper,
    title: '政策资讯',
    desc: '了解最新社保政策法规、缴费基数调整、待遇资格政策解读',
    category: '政策服务',
    tags: ['社保政策', '缴费基数', '待遇资格', '政策解读', '法规', '资讯', '通知'],
    color: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    route: '/dashboard',
    available: true,
  },
  {
    icon: BookOpen,
    title: '办事指南',
    desc: '参保登记、关系转移、待遇申领等常见业务办理流程及材料清单',
    category: '办事指南',
    tags: ['办理流程', '材料清单', '线上办事', '业务指南', '参保登记', '转移', '申领'],
    color: 'from-purple-500 to-purple-600',
    bgLight: 'bg-purple-50',
    route: '/dashboard',
    available: true,
  },
];

const categories = ['全部', ...Array.from(new Set(navCards.map((card) => card.category)))];
const broadSearchKeywords = ['测试', 'test', '搜索', '筛选', '查询', '服务', '业务', '办理'];

const filteredNavCards = computed(() => {
  const keyword = serviceQuery.value.trim().toLowerCase();
  const result = navCards.filter((card) => {
    const categoryMatched = activeCategory.value === '全部' || card.category === activeCategory.value;
    const text = [card.title, card.desc, card.category, ...card.tags].join(' ').toLowerCase();
    if (!keyword) return categoryMatched;
    if (broadSearchKeywords.includes(keyword)) return categoryMatched;
    const fuzzyMatch = keyword.split('').every((c) => text.includes(c));
    return categoryMatched && (text.includes(keyword) || fuzzyMatch);
  });
  return result;
});

const visibleNavCards = computed(() => {
  if (filteredNavCards.value.length > 0) return filteredNavCards.value;
  const categoryCards = navCards.filter((card) => activeCategory.value === '全部' || card.category === activeCategory.value);
  return categoryCards.length > 0 ? categoryCards : navCards;
});

const isShowingRecommendedServices = computed(() => serviceQuery.value.trim().length > 0 && filteredNavCards.value.length === 0);

const handleDemoLogin = (targetRoute?: string) => {
  authStore.demoLogin();
  router.push(targetRoute || '/dashboard');
};

const handleNavClick = (route: string) => {
  router.push(route);
};

function handleKeywordClick(route: string, keyword: string) {
  serviceQuery.value = keyword;
  router.push(route);
}

function openAdmin(path = '') {
  window.open(`${adminBaseUrl}${path}`, '_blank');
}

const announcements = [
  { id: 1, text: '2026年度社保缴费基数已调整为3906元，请及时查询确认缴费明细', date: '2026-06-10' },
  { id: 2, text: '生存认证新渠道上线，人脸识别活体检测通过率达96.8%', date: '2026-06-08' },
  { id: 3, text: '广西人社可信数字平台正式发布，全业务链上链存证', date: '2026-06-05' },
  { id: 4, text: '2026年城乡居民养老保险缴费开始，请按时完成缴费', date: '2026-06-01' },
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
          <div
            v-if="!authStore.isAuthenticated"
            class="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              class="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-btn text-lg
                shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-100"
              @click="handleLogin"
            >
              <LogIn class="w-5 h-5" />
              桂事通登录
            </button>
            <button
              class="inline-flex items-center gap-2 bg-amber-400/90 text-amber-900 font-semibold px-6 py-3.5 rounded-btn text-base
                shadow-md hover:shadow-lg hover:bg-amber-400 transition-all duration-300 border border-amber-300"
              @click="() => handleDemoLogin()"
            >
              <Shield class="w-4 h-4" />
              演示模式（免登录体验）
            </button>
          </div>
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
      <div class="card-base p-4 mb-6">
        <div class="flex flex-col lg:flex-row gap-4 lg:items-center">
          <label class="relative flex-1 block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="serviceQuery"
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-100 bg-white text-sm outline-none
                focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              type="search"
              placeholder="搜索社保权益、缴费明细、生存认证、办事指南"
            >
          </label>
          <div class="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <SlidersHorizontal class="w-4 h-4 text-gray-400 shrink-0" />
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="px-3 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors"
              :class="activeCategory === category
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:bg-primary-50'"
              @click="activeCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="showDemoHint" class="mb-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div class="text-sm">
              <p class="font-semibold text-amber-800">服务需要登录</p>
              <p class="text-amber-600 mt-0.5">您可点击上方「演示模式（免登录体验）」按钮，立即体验完整的社保权益查询、生存认证等功能，也可通过桂事通完成实名认证后访问。</p>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button
              class="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors"
              @click="() => handleDemoLogin()"
            >
              立即体验演示
            </button>
            <button
              class="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              @click="showDemoHint = false"
            >
              关闭
            </button>
          </div>
        </div>
      </Transition>

      <div
        v-if="isShowingRecommendedServices"
        class="mb-4 p-4 rounded-xl border border-primary-100 bg-primary-50/70 text-sm text-primary-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <span>已根据当前关键词展示可办理的推荐服务</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(kw, idx) in recommendedKeywords.slice(0, 5)"
            :key="idx"
            class="px-3 py-1.5 rounded-full text-xs bg-white text-primary border border-primary-100 hover:bg-primary-100 hover:shadow-md transition-all"
            @click="handleKeywordClick(kw.route, kw.label)"
          >
            {{ kw.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="card in visibleNavCards"
          :key="card.title"
          class="card-base card-hover p-6 cursor-pointer group relative"
          @click="handleNavClick(card.route)"
        >
          <div :class="[card.bgLight, 'w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform']">
            <component :is="card.icon" class="w-7 h-7 text-primary" />
          </div>
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-lg font-semibold text-gray-800">{{ card.title }}</h3>
            <span v-if="card.route !== '#'" class="px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-medium border border-green-100">
              可办理
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">{{ card.desc }}</p>
          <div class="mt-4 flex flex-wrap gap-1.5">
            <span
              v-for="tag in card.tags.slice(0, 4)"
              :key="tag"
              class="px-2 py-0.5 rounded-full bg-primary-50 text-[11px] text-primary border border-primary-100"
            >
              {{ tag }}
            </span>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span class="text-gray-400">点击进入业务办理</span>
            <ChevronRight class="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pb-12">
      <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
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
      <div class="card-base p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <LayoutDashboard class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-gray-800">管理后台</h2>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-medium border border-purple-100">
            工作台入口
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-blue-50 p-3 hover:bg-blue-100/70 transition-colors cursor-pointer" @click="openAdmin()">
            <p class="font-medium text-gray-800">认证通过率趋势</p>
            <p class="text-2xl font-bold text-primary mt-2">96.8%</p>
            <p class="text-[11px] text-gray-400 mt-1">近30天趋势分析</p>
          </div>
          <div class="rounded-xl bg-emerald-50 p-3 hover:bg-emerald-100/70 transition-colors cursor-pointer" @click="openAdmin('/query-top')">
            <p class="font-medium text-gray-800">高频查询事项TOP10</p>
            <p class="text-2xl font-bold text-emerald-600 mt-2">42.6万</p>
            <p class="text-[11px] text-gray-400 mt-1">含环比变化箭头</p>
          </div>
          <div class="rounded-xl bg-amber-50 p-3 hover:bg-amber-100/70 transition-colors cursor-pointer" @click="openAdmin('/reminder-tasks')">
            <p class="font-medium text-gray-800">未认证人员提醒</p>
            <p class="text-2xl font-bold text-amber-600 mt-2">1,248</p>
            <p class="text-[11px] text-gray-400 mt-1">定向任务流管理</p>
          </div>
          <div class="rounded-xl bg-purple-50 p-3 hover:bg-purple-100/70 transition-colors cursor-pointer" @click="openAdmin('/audit-logs')">
            <p class="font-medium text-gray-800">操作留痕审计</p>
            <p class="text-2xl font-bold text-purple-600 mt-2">实时</p>
            <p class="text-[11px] text-gray-400 mt-1">全链路可追溯</p>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white
              hover:bg-primary-700 transition-colors"
            @click="openAdmin()"
          >
            进入后台管理
            <ExternalLink class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700
              hover:bg-amber-100 transition-colors"
            @click="openAdmin('/login?demo=1')"
          >
            演示登录
          </button>
        </div>
      </div>
      </div>
    </section>
  </div>
</template>
