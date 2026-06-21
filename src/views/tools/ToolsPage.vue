<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Calculator,
  FileSearch,
  CalendarDays,
  ScrollText,
  Building2,
  CreditCard,
  Stethoscope,
  Car,
  Bus,
  Users,
  IdCard,
  BookOpen,
  Landmark,
  Building,
  Sparkles,
  Bell,
  ChevronRight,
  Clock,
  Flame,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-vue-next'
import { storage } from '@/utils/storage'

const router = useRouter()
const searchValue = ref('')
const activeCategory = ref('all')
const recentTools = ref<string[]>([])
const frequentTools = ref<Record<string, number>>({})

interface ToolItem {
  id: string
  name: string
  description: string
  icon: any
  category: string
  gradient: string
  route: string
  hotLevel: number
  useCount: number
}

const tools: ToolItem[] = [
  {
    id: 'calc-fund',
    name: '公积金贷款',
    description: '计算公积金贷款月供和总利息',
    icon: Building2,
    category: 'calculator',
    gradient: 'from-amber-500 to-orange-600',
    route: '/tools/calculator',
    hotLevel: 5,
    useCount: 12580,
  },
  {
    id: 'calc-social',
    name: '社保缴费',
    description: '计算社保缴费金额明细',
    icon: CreditCard,
    category: 'calculator',
    gradient: 'from-blue-500 to-indigo-600',
    route: '/tools/calculator',
    hotLevel: 4,
    useCount: 9860,
  },
  {
    id: 'calc-medical',
    name: '医保报销',
    description: '估算医保报销比例和金额',
    icon: Stethoscope,
    category: 'calculator',
    gradient: 'from-emerald-500 to-teal-600',
    route: '/tools/calculator',
    hotLevel: 4,
    useCount: 8520,
  },
  {
    id: 'query-violation',
    name: '违章查询',
    description: '查询机动车违章记录',
    icon: Car,
    category: 'query',
    gradient: 'from-rose-500 to-pink-600',
    route: '/tools/violation',
    hotLevel: 5,
    useCount: 15680,
  },
  {
    id: 'query-bus',
    name: '公交查询',
    description: '实时公交到站信息查询',
    icon: Bus,
    category: 'query',
    gradient: 'from-cyan-500 to-blue-600',
    route: '/tools/bus',
    hotLevel: 3,
    useCount: 6780,
  },
  {
    id: 'query-scenic',
    name: '景区客流',
    description: '景区实时客流和预约情况',
    icon: Users,
    category: 'query',
    gradient: 'from-green-500 to-emerald-600',
    route: '/tools/scenic',
    hotLevel: 3,
    useCount: 5420,
  },
  {
    id: 'query-license',
    name: '证照查询',
    description: '电子证照信息查询验证',
    icon: IdCard,
    category: 'query',
    gradient: 'from-violet-500 to-purple-600',
    route: '/tools/violation',
    hotLevel: 2,
    useCount: 3650,
  },
  {
    id: 'book-library',
    name: '场馆预约',
    description: '图书馆、博物馆等场馆预约',
    icon: BookOpen,
    category: 'booking',
    gradient: 'from-indigo-500 to-blue-600',
    route: '/tools/venue',
    hotLevel: 4,
    useCount: 10250,
  },
  {
    id: 'book-scenic',
    name: '景区预约',
    description: '景区门票和入园预约',
    icon: Landmark,
    category: 'booking',
    gradient: 'from-teal-500 to-cyan-600',
    route: '/tools/venue',
    hotLevel: 3,
    useCount: 7890,
  },
  {
    id: 'book-hall',
    name: '政务大厅预约',
    description: '政务服务大厅窗口预约',
    icon: Building,
    category: 'booking',
    gradient: 'from-sky-500 to-blue-600',
    route: '/tools/venue',
    hotLevel: 4,
    useCount: 9120,
  },
  {
    id: 'policy-match',
    name: '政策匹配测试',
    description: '智能匹配适合您的政策',
    icon: Sparkles,
    category: 'policy',
    gradient: 'from-orange-500 to-amber-600',
    route: '/tools/policy-match',
    hotLevel: 5,
    useCount: 14360,
  },
  {
    id: 'policy-subscribe',
    name: '政策订阅',
    description: '订阅政策更新提醒通知',
    icon: Bell,
    category: 'policy',
    gradient: 'from-pink-500 to-rose-600',
    route: '/tools/policy-match',
    hotLevel: 3,
    useCount: 6580,
  },
]

const categories = [
  { key: 'all', label: '全部工具', icon: ScrollText },
  { key: 'calculator', label: '计算工具', icon: Calculator },
  { key: 'query', label: '查询服务', icon: FileSearch },
  { key: 'booking', label: '预约服务', icon: CalendarDays },
  { key: 'policy', label: '政策服务', icon: ScrollText },
]

const filteredTools = computed(() => {
  let result = tools
  if (activeCategory.value !== 'all') {
    result = result.filter((t) => t.category === activeCategory.value)
  }
  if (searchValue.value.trim()) {
    const keyword = searchValue.value.trim().toLowerCase()
    result = result.filter(
      (t) => t.name.toLowerCase().includes(keyword) || t.description.toLowerCase().includes(keyword)
    )
  }
  return result
})

const myFrequentTools = computed(() => {
  const toolMap = new Map(tools.map((t) => [t.id, t]))
  const sorted = Object.entries(frequentTools.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => toolMap.get(id))
    .filter(Boolean) as ToolItem[]
  if (sorted.length < 4) {
    const hotTools = [...tools].sort((a, b) => b.useCount - a.useCount).slice(0, 4 - sorted.length)
    hotTools.forEach((t) => {
      if (!sorted.find((s) => s.id === t.id)) {
        sorted.push(t)
      }
    })
  }
  return sorted
})

const recentUsedTools = computed(() => {
  const toolMap = new Map(tools.map((t) => [t.id, t]))
  return recentTools.value
    .map((id) => toolMap.get(id))
    .filter(Boolean) as ToolItem[]
})

function goToTool(route: string, toolId: string) {
  recordUsage(toolId)
  router.push(route)
}

function recordUsage(toolId: string) {
  const recent = storage.get('recent_tools', []) as string[]
  const newRecent = [toolId, ...recent.filter((id) => id !== toolId)].slice(0, 5)
  storage.set('recent_tools', newRecent)
  recentTools.value = newRecent

  const frequent = storage.get('frequent_tools', {}) as Record<string, number>
  frequent[toolId] = (frequent[toolId] || 0) + 1
  storage.set('frequent_tools', frequent)
  frequentTools.value = frequent
}

function handleSearch() {
  // search is reactive via computed
}

function formatCount(count: number) {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toLocaleString()
}

function isRecent(toolId: string) {
  return recentTools.value.includes(toolId)
}

onMounted(() => {
  recentTools.value = storage.get('recent_tools', []) as string[]
  frequentTools.value = storage.get('frequent_tools', {}) as Record<string, number>
})
</script>

<template>
  <div class="container py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-neutral-800 mb-2">便民工具集</h1>
      <p class="text-neutral-500">实用工具，让生活办事更便捷</p>
    </div>

    <div class="card mb-6">
      <div class="relative max-w-2xl mx-auto">
        <Search class="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchValue"
          type="text"
          placeholder="搜索工具名称或功能..."
          class="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 transition-all"
          @input="handleSearch"
        />
      </div>
    </div>

    <div v-if="!searchValue.trim() && activeCategory === 'all'" class="space-y-6 mb-6">
      <div class="card">
        <div class="flex items-center gap-2 mb-4">
          <Star class="w-5 h-5 text-accent-yellow fill-accent-yellow" />
          <h3 class="text-lg font-semibold text-neutral-800">我的常用</h3>
          <span class="text-xs text-neutral-400 ml-auto">根据使用频率推荐</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="tool in myFrequentTools"
            :key="'freq-' + tool.id"
            @click="goToTool(tool.route, tool.id)"
            class="p-4 border border-neutral-100 rounded-xl cursor-pointer hover:border-gov-blue/30 hover:bg-gov-blue/5 transition-all group"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                  tool.gradient,
                ]"
              >
                <component :is="tool.icon" class="w-5 h-5 text-white" />
              </div>
              <div class="min-w-0">
                <h4 class="font-medium text-neutral-800 text-sm truncate">{{ tool.name }}</h4>
                <p class="text-xs text-neutral-400 flex items-center gap-1">
                  <Flame class="w-3 h-3 text-accent-orange" />
                  {{ formatCount(tool.useCount) }}人使用
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="recentUsedTools.length > 0" class="card">
        <div class="flex items-center gap-2 mb-4">
          <Clock class="w-5 h-5 text-gov-blue" />
          <h3 class="text-lg font-semibold text-neutral-800">最近使用</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tool in recentUsedTools"
            :key="'recent-' + tool.id"
            @click="goToTool(tool.route, tool.id)"
            class="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-lg hover:bg-gov-blue/10 hover:text-gov-blue transition-all text-sm"
          >
            <component :is="tool.icon" class="w-4 h-4" />
            {{ tool.name }}
          </button>
        </div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat.key"
          @click="activeCategory = cat.key"
          :class="[
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200',
            activeCategory === cat.key
              ? 'bg-gov-gradient text-white shadow-md'
              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-gov-blue',
          ]"
        >
          <component :is="cat.icon" class="w-4 h-4" />
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="tool in filteredTools"
        :key="tool.id"
        @click="goToTool(tool.route, tool.id)"
        class="card card-hover cursor-pointer group overflow-hidden relative"
      >
        <div
          :class="[
            'absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity',
            tool.gradient,
          ]"
        ></div>
        <div v-if="isRecent(tool.id)" class="absolute top-3 right-3 z-10">
          <span class="text-xs px-2 py-0.5 bg-gov-blue/10 text-gov-blue rounded-full flex items-center gap-1">
            <Clock class="w-3 h-3" />
            最近
          </span>
        </div>
        <div v-else-if="tool.hotLevel >= 5" class="absolute top-3 right-3 z-10">
          <span class="text-xs px-2 py-0.5 bg-accent-red/10 text-accent-red rounded-full flex items-center gap-1">
            <Flame class="w-3 h-3" />
            热门
          </span>
        </div>
        <div class="relative">
          <div class="flex items-start justify-between mb-4">
            <div
              :class="[
                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow',
                tool.gradient,
              ]"
            >
              <component :is="tool.icon" class="w-6 h-6 text-white" />
            </div>
            <ChevronRight
              class="w-5 h-5 text-neutral-300 group-hover:text-gov-blue group-hover:translate-x-1 transition-all"
            />
          </div>
          <h3 class="text-base font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors mb-1">
            {{ tool.name }}
          </h3>
          <p class="text-sm text-neutral-500 mb-3">{{ tool.description }}</p>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1 text-xs text-neutral-400">
              <Users class="w-3.5 h-3.5" />
              <span>{{ formatCount(tool.useCount) }}人使用</span>
            </div>
            <div class="flex items-center gap-0.5">
              <span v-for="i in 5" :key="i">
                <Flame
                  :class="[
                    'w-3.5 h-3.5',
                    i <= tool.hotLevel ? 'text-accent-orange fill-accent-orange' : 'text-neutral-200',
                  ]"
                />
              </span>
            </div>
          </div>
          <button
            class="w-full py-2 rounded-lg bg-gov-blue/5 text-gov-blue text-sm font-medium group-hover:bg-gov-blue group-hover:text-white transition-all flex items-center justify-center gap-1"
          >
            <Zap class="w-4 h-4" />
            立即使用
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredTools.length === 0" class="card text-center py-16">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
        <Search class="w-8 h-8 text-neutral-400" />
      </div>
      <p class="text-neutral-500">没有找到匹配的工具</p>
      <button
        @click="searchValue = ''; activeCategory = 'all'"
        class="mt-4 text-gov-blue hover:underline text-sm"
      >
        查看全部工具
      </button>
    </div>
  </div>
</template>
