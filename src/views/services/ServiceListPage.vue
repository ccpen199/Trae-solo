<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  Star,
  Flame,
  Building2,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Home,
  Car,
  Landmark,
  HeartHandshake,
  Receipt,
  Store,
  ShieldCheck,
  Scale,
  Activity,
  Users,
  Building,
  Sparkles,
  X
} from 'lucide-vue-next'
import type { Department, ServiceItem, ServiceCategory } from '@/types'
import { getDepartmentList, getServiceList } from '@/api/services'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const departments = ref<Department[]>([])
const services = ref<ServiceItem[]>([])
const allServices = ref<ServiceItem[]>([])
const total = ref(0)

const searchKeyword = ref('')
const showAdvancedFilter = ref(false)
const showSuggestions = ref(false)
const sortBy = ref('relevance')

const hotKeywords = ['社保查询', '医保报销', '公积金提取', '身份证办理', '营业执照', '违章查询']

const searchSuggestions = computed(() => {
  if (!searchKeyword.value || searchKeyword.value.length < 1) return []
  const keyword = searchKeyword.value.toLowerCase()
  const suggestions = allServices.value
    .filter(s => s.name.toLowerCase().includes(keyword) || s.description.toLowerCase().includes(keyword))
    .slice(0, 6)
    .map(s => ({
      id: s.id,
      name: s.name,
      dept: s.departmentName,
      relevance: calculateRelevance(s, keyword)
    }))
    .sort((a, b) => b.relevance - a.relevance)
  return suggestions
})

function calculateRelevance(service: ServiceItem, keyword: string): number {
  let score = 0
  const name = service.name.toLowerCase()
  const desc = service.description.toLowerCase()
  const kw = keyword.toLowerCase()

  if (name === kw) score += 100
  else if (name.startsWith(kw)) score += 80
  else if (name.includes(kw)) score += 60

  if (desc.includes(kw)) score += 20

  score += service.applyCount / 1000

  score += service.satisfaction / 10

  return score
}

const sortedServices = computed(() => {
  let list = [...services.value]

  if (sortBy.value === 'relevance' && searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list.sort((a, b) => calculateRelevance(b, kw) - calculateRelevance(a, kw))
  } else if (sortBy.value === 'applyCount') {
    list.sort((a, b) => b.applyCount - a.applyCount)
  } else if (sortBy.value === 'satisfaction') {
    list.sort((a, b) => b.satisfaction - a.satisfaction)
  } else if (sortBy.value === 'timeLimit') {
    list.sort((a, b) => {
      const getDays = (s: ServiceItem) => {
        if (s.workDays === '即时办结') return 0
        const match = s.workDays.match(/(\d+)/)
        return match ? parseInt(match[1]) : 999
      }
      return getDays(a) - getDays(b)
    })
  }

  return list
})

function highlightKeyword(text: string): string {
  if (!searchKeyword.value) return text
  const regex = new RegExp(`(${searchKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-800 px-0.5 rounded">$1</mark>')
}

function handleSuggestionClick(serviceId: string) {
  showSuggestions.value = false
  router.push(`/services/${serviceId}`)
}

function handleSearchInput() {
  showSuggestions.value = searchKeyword.value.length > 0
}

function handleSearchBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function handleHotKeywordSearch(keyword: string) {
  searchKeyword.value = keyword
  showSuggestions.value = false
  pagination.page = 1
  fetchServices()
}

function handleSortChange(val: string) {
  sortBy.value = val
}

function fetchAllServices() {
  const params = { page: 1, pageSize: 100 }
  getServiceList(params).then(res => {
    if (res.code === 0) {
      allServices.value = res.data.list
    }
  })
}

const filters = reactive({
  departmentId: '',
  category: '' as ServiceCategory | '',
  type: '' as 'personal' | 'enterprise' | 'convenience' | '',
  handleMethod: '' as 'online' | 'offline' | 'both' | '',
  timeLimit: '' as 'instant' | '1day' | '3day' | '7day' | '15day' | '',
  instantOnly: false
})

const pagination = reactive({
  page: 1,
  pageSize: 12
})

const departmentCategories = [
  { key: 'social_security', name: '人社', icon: Briefcase, color: 'from-blue-500 to-indigo-600' },
  { key: 'medical_insurance', name: '医保', icon: Stethoscope, color: 'from-emerald-500 to-teal-600' },
  { key: 'education', name: '教育', icon: GraduationCap, color: 'from-orange-500 to-amber-600' },
  { key: 'traffic', name: '交通', icon: Car, color: 'from-cyan-500 to-blue-600' },
  { key: 'culture_tourism', name: '文旅', icon: Landmark, color: 'from-rose-500 to-pink-600' },
  { key: 'housing_fund', name: '公积金', icon: Home, color: 'from-amber-500 to-orange-600' },
  { key: 'civil_affairs', name: '民政', icon: HeartHandshake, color: 'from-red-500 to-rose-600' },
  { key: 'taxation', name: '税务', icon: Receipt, color: 'from-sky-500 to-blue-600' },
  { key: 'industry_commerce', name: '市监', icon: Store, color: 'from-lime-500 to-green-600' },
  { key: 'public_security', name: '公安', icon: ShieldCheck, color: 'from-slate-600 to-slate-800' },
  { key: 'justice', name: '司法', icon: Scale, color: 'from-violet-500 to-purple-600' },
  { key: 'health', name: '卫健', icon: Activity, color: 'from-green-500 to-emerald-600' }
]

const serviceTypes = [
  { key: 'personal', name: '个人办事', icon: Users },
  { key: 'enterprise', name: '法人办事', icon: Building },
  { key: 'convenience', name: '便民服务', icon: Sparkles }
]

const handleMethods = [
  { key: 'online', name: '在线办理' },
  { key: 'offline', name: '窗口办理' },
  { key: 'both', name: '线上线下' }
]

const timeLimits = [
  { key: 'instant', name: '即时办结' },
  { key: '1day', name: '1个工作日内' },
  { key: '3day', name: '3个工作日内' },
  { key: '7day', name: '7个工作日内' },
  { key: '15day', name: '15个工作日内' }
]

const activeDepartmentName = computed(() => {
  if (!filters.departmentId) return '全部部门'
  return departments.value.find(d => d.id === filters.departmentId)?.name || '全部部门'
})

const activeFilters = computed(() => {
  const tags: { key: string; label: string; value: string }[] = []
  if (filters.type) {
    const typeMap: Record<string, string> = { personal: '个人办事', enterprise: '法人办事', convenience: '便民服务' }
    tags.push({ key: 'type', label: '事项类型', value: typeMap[filters.type] || filters.type })
  }
  if (filters.handleMethod) {
    const methodMap: Record<string, string> = { online: '在线办理', offline: '窗口办理', both: '线上线下' }
    tags.push({ key: 'handleMethod', label: '办理方式', value: methodMap[filters.handleMethod] || filters.handleMethod })
  }
  if (filters.timeLimit) {
    const timeMap: Record<string, string> = { instant: '即时办结', '1day': '1个工作日内', '3day': '3个工作日内', '7day': '7个工作日内', '15day': '15个工作日内' }
    tags.push({ key: 'timeLimit', label: '承诺时限', value: timeMap[filters.timeLimit] || filters.timeLimit })
  }
  if (filters.instantOnly) {
    tags.push({ key: 'instantOnly', label: '筛选条件', value: '仅即办件' })
  }
  return tags
})

function removeFilter(key: string) {
  if (key === 'instantOnly') {
    filters.instantOnly = false
  } else {
    (filters as any)[key] = ''
  }
  pagination.page = 1
  fetchServices()
}

async function fetchDepartments() {
  const res = await getDepartmentList()
  if (res.code === 0) {
    departments.value = res.data
  }
}

async function fetchServices() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filters.departmentId) params.departmentId = filters.departmentId
    if (filters.category) params.category = filters.category
    if (filters.type) params.type = filters.type
    if (filters.handleMethod) params.handleMethod = filters.handleMethod
    if (filters.timeLimit) params.timeLimit = filters.timeLimit
    if (filters.instantOnly) params.instantOnly = filters.instantOnly

    const res = await getServiceList(params)
    if (res.code === 0) {
      services.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

function selectCategory(key: string) {
  if (key === 'all') {
    filters.category = ''
    filters.departmentId = ''
  } else {
    filters.category = key as ServiceCategory
    const dept = departments.value.find(d => d.category === key)
    filters.departmentId = dept?.id || ''
  }
  pagination.page = 1
  fetchServices()
}

function selectType(type: string) {
  filters.type = type as any
  pagination.page = 1
  fetchServices()
}

function resetFilters() {
  filters.departmentId = ''
  filters.category = ''
  filters.type = ''
  filters.handleMethod = ''
  filters.timeLimit = ''
  filters.instantOnly = false
  searchKeyword.value = ''
  pagination.page = 1
  fetchServices()
}

function goToDetail(id: string) {
  router.push(`/services/${id}`)
}

function handleSearch() {
  pagination.page = 1
  fetchServices()
}

function onPageChange(page: number) {
  pagination.page = page
  fetchServices()
}

const totalPages = computed(() => Math.ceil(total.value / pagination.pageSize))

onMounted(() => {
  fetchDepartments()
  fetchAllServices()

  const keyword = route.query.keyword as string
  const departmentId = route.query.departmentId as string
  const category = route.query.category as string

  if (keyword) {
    searchKeyword.value = keyword
  }
  if (departmentId) {
    filters.departmentId = departmentId
  }
  if (category) {
    filters.category = category as ServiceCategory
  }

  pagination.page = 1
  fetchServices()
})

watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.keyword && typeof newQuery.keyword === 'string' && newQuery.keyword !== searchKeyword.value) {
      searchKeyword.value = newQuery.keyword
      pagination.page = 1
      fetchServices()
    }
    if (newQuery.departmentId && typeof newQuery.departmentId === 'string') {
      filters.departmentId = newQuery.departmentId
      pagination.page = 1
      fetchServices()
    }
    if (newQuery.category && typeof newQuery.category === 'string') {
      filters.category = newQuery.category as ServiceCategory
      pagination.page = 1
      fetchServices()
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <section class="bg-gov-gradient py-12">
      <div class="container">
        <div class="text-center text-white mb-8">
          <h1 class="text-3xl font-bold mb-2">办事服务大厅</h1>
          <p class="text-blue-100">汇聚全市政务服务事项，一网通办，便民利民</p>
        </div>
        <div class="max-w-3xl mx-auto">
          <div class="relative">
            <div class="flex items-center bg-white rounded-xl shadow-xl p-1.5">
              <Search class="w-5 h-5 text-neutral-400 ml-4" />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索服务事项名称、关键字..."
                class="flex-1 px-3 py-3 bg-transparent outline-none text-neutral-700 placeholder:text-neutral-400"
                @keyup.enter="handleSearch"
                @input="handleSearchInput"
                @focus="handleSearchInput"
                @blur="handleSearchBlur"
              />
              <button
                v-if="searchKeyword"
                class="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                @click="searchKeyword = ''; showSuggestions = false; handleSearch()"
              >
                <X class="w-4 h-4" />
              </button>
              <button
                class="px-3 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors flex items-center gap-1.5 ml-1"
                @click="showAdvancedFilter = !showAdvancedFilter"
              >
                <Filter class="w-4 h-4" />
                高级筛选
              </button>
              <button
                @click="handleSearch"
                class="px-8 py-3 bg-gov-blue text-white font-medium rounded-lg hover:bg-gov-blue-light transition-colors"
              >
                搜索
              </button>
            </div>

            <div
              v-if="showSuggestions && searchSuggestions.length > 0"
              class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-30 overflow-hidden animate-slide-down"
            >
              <div class="p-2">
                <p class="text-xs text-neutral-400 px-3 py-2">搜索建议</p>
                <button
                  v-for="sugg in searchSuggestions"
                  :key="sugg.id"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gov-blue/5 text-left transition-colors"
                  @click="handleSuggestionClick(sugg.id)"
                >
                  <Search class="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-neutral-800 font-medium truncate" v-html="highlightKeyword(sugg.name)"></p>
                    <p class="text-xs text-neutral-500 truncate">{{ sugg.dept }}</p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-neutral-300 flex-shrink-0" />
                </button>
              </div>
            </div>

            <div v-if="!searchKeyword" class="mt-4 flex flex-wrap items-center gap-2 justify-center">
              <span class="text-xs text-blue-200">热门搜索：</span>
              <button
                v-for="kw in hotKeywords"
                :key="kw"
                class="px-3 py-1 bg-white/15 hover:bg-white/25 text-white text-xs rounded-full transition-colors"
                @click="handleHotKeywordSearch(kw)"
              >
                {{ kw }}
              </button>
            </div>

            <div
              v-if="showAdvancedFilter"
              class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl p-5 z-20 animate-slide-down"
            >
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="text-sm font-medium text-neutral-700 mb-1.5 block">办理方式</label>
                  <select v-model="filters.handleMethod" class="input-base">
                    <option value="">全部</option>
                    <option v-for="m in handleMethods" :key="m.key" :value="m.key">{{ m.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm font-medium text-neutral-700 mb-1.5 block">承诺时限</label>
                  <select v-model="filters.timeLimit" class="input-base">
                    <option value="">全部</option>
                    <option v-for="t in timeLimits" :key="t.key" :value="t.key">{{ t.name }}</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="filters.instantOnly" class="w-4 h-4 rounded accent-gov-blue" />
                    <span class="text-sm text-neutral-700">仅显示即办件</span>
                  </label>
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-100">
                <button class="btn-ghost" @click="resetFilters">
                  <X class="w-4 h-4" />
                  重置
                </button>
                <button class="btn-primary" @click="fetchServices">应用筛选</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="container py-6">
      <div class="flex flex-col lg:flex-row gap-6">
        <aside class="lg:w-64 flex-shrink-0">
          <div class="card p-0 overflow-hidden sticky top-24">
            <div class="px-5 py-4 border-b border-neutral-100">
              <h3 class="text-base font-semibold text-neutral-800 flex items-center gap-2">
                <Building2 class="w-4 h-4 text-gov-blue" />
                按部门分类
              </h3>
            </div>
            <div class="p-2">
              <button
                :class="[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all',
                  !filters.category ? 'bg-gov-blue/10 text-gov-blue font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                ]"
                @click="selectCategory('all')"
              >
                <div class="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <Sparkles class="w-4 h-4 text-neutral-500" />
                </div>
                <span>全部服务</span>
              </button>
              <button
                v-for="cat in departmentCategories"
                :key="cat.key"
                :class="[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all',
                  filters.category === cat.key ? 'bg-gov-blue/10 text-gov-blue font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                ]"
                @click="selectCategory(cat.key)"
              >
                <div :class="['w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', cat.color]">
                  <component :is="cat.icon" class="w-4 h-4 text-white" />
                </div>
                <span>{{ cat.name }}</span>
              </button>
            </div>

            <div class="px-5 py-4 border-t border-neutral-100">
              <h3 class="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <Users class="w-4 h-4 text-gov-blue" />
                按事项类型
              </h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in serviceTypes"
                  :key="t.key"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filters.type === t.key
                      ? 'bg-gov-blue text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  ]"
                  @click="selectType(filters.type === t.key ? '' : t.key)"
                >
                  <component :is="t.icon" class="w-3.5 h-3.5" />
                  {{ t.name }}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main class="flex-1 min-w-0">
          <div class="flex flex-col gap-3 mb-4">
            <div class="flex items-center justify-between">
              <div class="text-sm text-neutral-500">
                <span class="text-neutral-800 font-medium">{{ activeDepartmentName }}</span>
                <span class="mx-2">·</span>
                共 <span class="text-gov-blue font-semibold">{{ total }}</span> 项服务
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-neutral-500">排序：</span>
                <select
                  v-model="sortBy"
                  class="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-600 outline-none bg-white hover:border-gov-blue/50 transition-colors cursor-pointer"
                  @change="handleSortChange(sortBy)"
                >
                  <option value="relevance">相关度优先</option>
                  <option value="applyCount">办理量最多</option>
                  <option value="satisfaction">满意度最高</option>
                  <option value="timeLimit">办理时限最短</option>
                </select>
              </div>
            </div>
            <div v-if="activeFilters.length > 0" class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-neutral-500">当前筛选：</span>
              <span
                v-for="tag in activeFilters"
                :key="tag.key"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-gov-blue/10 text-gov-blue rounded-full text-xs font-medium"
              >
                {{ tag.label }}：{{ tag.value }}
                <button class="hover:text-gov-blue-dark" @click="removeFilter(tag.key)">
                  <X class="w-3 h-3" />
                </button>
              </span>
              <button class="text-xs text-neutral-500 hover:text-gov-blue transition-colors" @click="resetFilters">
                清除全部
              </button>
            </div>
          </div>

          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div v-for="i in 6" :key="i" class="card animate-pulse">
              <div class="h-5 bg-neutral-200 rounded w-3/4 mb-3"></div>
              <div class="h-4 bg-neutral-100 rounded w-1/2 mb-4"></div>
              <div class="space-y-2">
                <div class="h-3 bg-neutral-100 rounded w-full"></div>
                <div class="h-3 bg-neutral-100 rounded w-5/6"></div>
              </div>
              <div class="h-9 bg-neutral-100 rounded-lg mt-4"></div>
            </div>
          </div>

          <div v-else-if="services.length === 0" class="card text-center py-16">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <Search class="w-10 h-10 text-neutral-300" />
            </div>
            <p class="text-neutral-500 mb-2">暂无匹配的服务事项</p>
            <button class="btn-secondary mt-2" @click="resetFilters">清除筛选条件</button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              v-for="service in sortedServices"
              :key="service.id"
              class="card card-hover cursor-pointer group"
              @click="goToDetail(service.id)"
            >
              <div class="flex items-start gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-gov-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gov-blue/20 transition-colors">
                  <Building2 class="w-5 h-5 text-gov-blue" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-base font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors line-clamp-1">
                      <span v-html="highlightKeyword(service.name)"></span>
                    </h4>
                    <div v-if="service.hotLevel >= 4" class="flex items-center gap-0.5 flex-shrink-0">
                      <Flame class="w-4 h-4 text-accent-orange" />
                    </div>
                  </div>
                  <p class="text-xs text-neutral-500 mt-0.5">{{ service.departmentName }}</p>
                </div>
              </div>

              <p class="text-sm text-neutral-600 line-clamp-2 mb-4 min-h-[40px]">
                <span v-html="highlightKeyword(service.description)"></span>
              </p>

              <div class="flex flex-wrap gap-1.5 mb-4">
                <span v-if="service.workDays === '即时办结'" class="tag tag-success">
                  <Clock class="w-3 h-3 mr-0.5" />
                  即办件
                </span>
                <span v-else class="tag tag-primary">
                  <Clock class="w-3 h-3 mr-0.5" />
                  {{ service.workDays }}
                </span>
                <span class="tag tag-warning">
                  <Star class="w-3 h-3 mr-0.5" />
                  满意度 {{ service.satisfaction }}%
                </span>
                <span v-if="service.onlineApply" class="tag tag-orange">在线可办</span>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div class="flex items-center gap-3 text-xs text-neutral-500">
                  <span class="flex items-center gap-1">
                    <Flame class="w-3.5 h-3.5 text-accent-orange" />
                    {{ service.applyCount.toLocaleString() }}人已办
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="service.onlineApply"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gov-gradient rounded-lg hover:shadow-card-hover transition-all"
                    @click.stop="router.push(`/apply/${service.id}`)"
                  >
                    立即办理
                    <ChevronRight class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="inline-flex items-center gap-1 text-sm font-medium text-gov-blue group-hover:gap-2 transition-all"
                    @click.stop="goToDetail(service.id)"
                  >
                    查看详情
                    <ChevronRight class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="flex justify-center mt-8">
            <div class="flex items-center gap-1">
              <button
                :disabled="pagination.page <= 1"
                class="px-3 py-1.5 rounded-lg text-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="onPageChange(pagination.page - 1)"
              >
                上一页
              </button>
              <button
                v-for="p in Math.min(5, totalPages)"
                :key="p"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                  pagination.page === p
                    ? 'bg-gov-blue text-white'
                    : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                ]"
                @click="onPageChange(p)"
              >
                {{ p }}
              </button>
              <span v-if="totalPages > 5" class="text-neutral-400 px-2">...</span>
              <button
                :disabled="pagination.page >= totalPages"
                class="px-3 py-1.5 rounded-lg text-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="onPageChange(pagination.page + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
