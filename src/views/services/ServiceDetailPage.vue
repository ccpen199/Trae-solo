<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Building2,
  Clock,
  Star,
  Flame,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  UserCheck,
  FileCheck,
  BadgeCheck,
  ChevronDown,
  ThumbsUp,
  MessageSquare,
  Share2,
  RefreshCw
} from 'lucide-vue-next'
import type { ServiceItem, Evaluation } from '@/types'
import { getServiceById } from '@/api/services'
import { getEvaluationList } from '@/api/application'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const service = ref<ServiceItem | null>(null)
const activeTab = ref('guide')
const expandedFaq = ref<number | null>(null)
const evaluationsLoading = ref(false)
const evaluations = ref<Evaluation[]>([])
const evaluationTotal = ref(0)

const tabs = [
  { key: 'guide', name: '办事指南' },
  { key: 'materials', name: '申请材料' },
  { key: 'process', name: '办理流程' },
  { key: 'faq', name: '常见问题' },
  { key: 'reviews', name: '评价' }
]

const handleLocations = [
  { name: '抚州市政务服务中心', address: '抚州市临川区文昌大道1290号', workHours: '周一至周五 09:00-17:00', phone: '0794-12345' },
  { name: '临川区政务服务中心', address: '抚州市临川区广场西路1号', workHours: '周一至周五 09:00-17:00', phone: '0794-8222391' },
]

const faqList = [
  { q: '办理该服务需要本人到场吗？', a: '大部分业务支持全程网办，无需本人到场。如需核验身份，系统会提示您进行人脸识别或到窗口核验。' },
  { q: '申请材料需要提交原件吗？', a: '在线办理可上传电子版材料（扫描件或照片），窗口办理需携带原件及复印件。' },
  { q: '办理进度如何查询？', a: '提交申请后，可在"我的办件"中实时查询办理进度，系统也会通过短信通知您重要节点。' },
  { q: '申请被退回怎么办？', a: '请根据退回原因补充或修改材料后重新提交，如有疑问可拨打咨询电话。' },
  { q: '可以委托他人代办吗？', a: '部分业务支持代办，需提供授权委托书及代办人身份证，具体请查看办事指南或咨询热线。' },
  { q: '电子证照是否有效？', a: '通过本平台调用的电子证照与纸质证照具有同等法律效力，可直接用于业务办理。' }
]

interface ReviewItem {
  id: string
  user: string
  rating: number
  time: string
  content: string
  tags: string[]
  replyContent?: string
  replyTime?: string
}

const reviewList: ReviewItem[] = [
  { id: '1', user: '张**', rating: 5, time: '2026-06-15', content: '办理流程很清晰，在线提交材料后很快就审核通过了，效率很高！', tags: ['效率高', '服务好'] },
  { id: '2', user: '李**', rating: 5, time: '2026-06-10', content: '材料清单列得很详细，一次就提交成功了，省去了跑窗口的麻烦。', tags: ['流程清晰', '便捷'] },
  { id: '3', user: '王**', rating: 4, time: '2026-06-05', content: '整体体验不错，就是上传文件时格式要求可以再明确一些。', tags: ['体验良好'], replyContent: '感谢您的宝贵建议，我们已优化上传提示。', replyTime: '2026-06-06' },
  { id: '4', user: '刘**', rating: 5, time: '2026-06-01', content: '电子证照调用非常方便，不用带证件也能办事，点赞！', tags: ['便捷', '电子证照好用'] },
  { id: '5', user: '陈**', rating: 3, time: '2026-05-28', content: '审核时间比预期长了一点，但结果是好的。', tags: ['有待改进'] }
]

const ratingDistribution = computed(() => {
  const dist = [0, 0, 0, 0, 0]
  reviewList.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      dist[r.rating - 1]++
    }
  })
  return dist.reverse()
})

const avgRating = computed(() => {
  if (reviewList.length === 0) return 0
  return reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
})

const satisfactionPercent = computed(() => {
  const goodCount = reviewList.filter(r => r.rating >= 4).length
  return reviewList.length > 0 ? Math.round((goodCount / reviewList.length) * 100) : 0
})

async function fetchService() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await getServiceById(id)
    if (res.code === 0) {
      service.value = res.data
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goApply() {
  if (service.value?.onlineApply) {
    router.push(`/apply/${service.value.id}`)
  }
}

function toggleFaq(index: number) {
  expandedFaq.value = expandedFaq.value === index ? null : index
}

function callLicense(matName: string) {
  console.log('调用电子证照:', matName)
}

function downloadTemplate(templateUrl?: string) {
  if (templateUrl) {
    console.log('下载模板:', templateUrl)
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  fetchService()
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="container py-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-gov-blue mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回服务列表
      </button>

      <div v-if="loading" class="card animate-pulse">
        <div class="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-neutral-100 rounded w-1/2 mb-6"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="h-16 bg-neutral-100 rounded-lg"></div>
        </div>
      </div>

      <template v-else-if="service">
        <div class="card mb-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-40 h-40 bg-gov-blue/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="relative">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-14 h-14 rounded-2xl bg-gov-gradient flex items-center justify-center shadow-lg">
                    <Building2 class="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 class="text-2xl font-bold text-neutral-800">{{ service.name }}</h1>
                    <p class="text-sm text-neutral-500 mt-0.5">{{ service.departmentName }}</p>
                  </div>
                </div>
                <p class="text-neutral-600 mb-4">{{ service.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <span v-if="service.onlineApply" class="tag tag-success">
                    <CheckCircle class="w-3 h-3 mr-0.5" />
                    在线可办
                  </span>
                  <span v-if="service.appointment" class="tag tag-primary">
                    <Calendar class="w-3 h-3 mr-0.5" />
                    可预约
                  </span>
                  <span v-if="service.hotLevel >= 4" class="tag tag-warning">
                    <Flame class="w-3 h-3 mr-0.5" />
                    热门服务
                  </span>
                  <span class="tag tag-orange">{{ service.level === 'municipal' ? '市级' : service.level }}</span>
                  <span class="tag tag-primary">
                    <BadgeCheck class="w-3 h-3 mr-0.5" />
                    {{ service.serviceType === 'personal' ? '个人办事' : service.serviceType === 'enterprise' ? '法人办事' : '便民服务' }}
                  </span>
                </div>
              </div>
              <div class="flex-shrink-0">
                <button
                  v-if="service.onlineApply"
                  class="btn-primary text-base px-10 py-3.5 shadow-lg hover:shadow-xl transition-all"
                  @click="goApply"
                >
                  <span class="flex items-center gap-2">
                    <FileCheck class="w-5 h-5" />
                    立即在线办理
                  </span>
                </button>
                <button v-else class="btn-secondary text-base px-10 py-3.5" disabled>
                  暂不支持在线办理
                </button>
                <p class="text-xs text-neutral-400 mt-2 text-center">
                  已有 <span class="text-gov-blue font-medium">{{ service.applyCount.toLocaleString() }}</span> 人申请
                </p>
              </div>
            </div>

            <div class="divider"></div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                <div class="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Clock class="w-4 h-4 text-gov-blue" />
                  承诺时限
                </div>
                <p class="text-lg font-bold text-neutral-800">{{ service.workDays }}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100">
                <div class="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <CreditCard class="w-4 h-4 text-accent-green" />
                  收费标准
                </div>
                <p class="text-lg font-bold text-neutral-800">{{ service.chargeStandard }}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-100">
                <div class="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Star class="w-4 h-4 text-accent-orange" />
                  群众满意度
                </div>
                <p class="text-lg font-bold text-accent-orange">{{ service.satisfaction }}%</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100">
                <div class="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Flame class="w-4 h-4 text-accent-orange" />
                  办件热度
                </div>
                <p class="text-lg font-bold text-neutral-800">{{ service.applyCount.toLocaleString() }} 件</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex border-b border-neutral-200 mb-6 -mx-6 px-6">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="[
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'text-gov-blue border-gov-blue'
                  : 'text-neutral-500 border-transparent hover:text-gov-blue'
              ]"
              @click="activeTab = tab.key"
            >
              {{ tab.name }}
            </button>
          </div>

          <div v-show="activeTab === 'guide'" class="space-y-6">
            <div class="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <CheckCircle class="w-5 h-5 text-accent-green" />
                办理条件
              </h3>
              <ul class="space-y-3">
                <li v-for="(cond, idx) in service.conditions" :key="idx" class="flex items-start gap-3 text-sm text-neutral-700">
                  <span class="w-6 h-6 rounded-full bg-accent-green text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    {{ idx + 1 }}
                  </span>
                  <span class="leading-relaxed">{{ cond }}</span>
                </li>
              </ul>
            </div>

            <div class="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-100">
              <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <AlertCircle class="w-5 h-5 text-accent-yellow" />
                注意事项
              </h3>
              <ul class="space-y-3">
                <li v-for="(notice, idx) in service.notices" :key="idx" class="flex items-start gap-3 text-sm text-neutral-700">
                  <span class="w-6 h-6 rounded-full bg-accent-yellow text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    !
                  </span>
                  <span class="leading-relaxed">{{ notice }}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <MapPin class="w-5 h-5 text-gov-blue" />
                办理地点
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="(loc, idx) in handleLocations"
                  :key="idx"
                  class="p-4 bg-white rounded-xl border border-neutral-200 hover:border-gov-blue/30 hover:shadow-md transition-all"
                >
                  <h4 class="font-medium text-neutral-800 mb-2">{{ loc.name }}</h4>
                  <div class="space-y-2 text-sm text-neutral-600">
                    <div class="flex items-start gap-2">
                      <MapPin class="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                      <span>{{ loc.address }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Calendar class="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span>{{ loc.workHours }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Phone class="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span>{{ loc.phone }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <CreditCard class="w-5 h-5 text-accent-green" />
                收费标准
              </h3>
              <div class="p-4 bg-neutral-50 rounded-xl">
                <p class="text-neutral-700 font-medium">{{ service.chargeStandard }}</p>
                <p class="text-xs text-neutral-500 mt-2">
                  * 收费依据：根据《行政事业性收费管理条例》及相关规定执行
                </p>
              </div>
            </div>

            <div class="p-5 bg-gov-blue/5 rounded-2xl border border-gov-blue/20">
              <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <Phone class="w-5 h-5 text-gov-blue" />
                咨询方式
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div class="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center">
                    <Phone class="w-5 h-5 text-gov-blue" />
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500">咨询电话</p>
                    <p class="font-medium text-neutral-800">0794-12345</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div class="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center">
                    <MessageSquare class="w-5 h-5 text-accent-green" />
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500">在线咨询</p>
                    <p class="font-medium text-neutral-800">智能客服 7×24h</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div class="w-10 h-10 rounded-full bg-accent-orange/10 flex items-center justify-center">
                    <Clock class="w-5 h-5 text-accent-orange" />
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500">工作时间</p>
                    <p class="font-medium text-neutral-800">周一至周五 09:00-17:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'materials'" class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-neutral-500">
                共 <span class="text-gov-blue font-medium">{{ service.materials.length }}</span> 项材料，其中必填 
                <span class="text-accent-red font-medium">{{ service.materials.filter(m => m.required).length }}</span> 项
              </p>
              <button
                class="inline-flex items-center gap-1.5 text-sm text-gov-blue hover:underline"
                @click="goApply"
              >
                <FileCheck class="w-4 h-4" />
                在线办理免交纸质材料
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gradient-to-r from-gov-blue/5 to-transparent text-left">
                    <th class="px-4 py-3 font-medium text-neutral-700 rounded-l-lg">序号</th>
                    <th class="px-4 py-3 font-medium text-neutral-700">材料名称</th>
                    <th class="px-4 py-3 font-medium text-neutral-700">必要性</th>
                    <th class="px-4 py-3 font-medium text-neutral-700">规格要求</th>
                    <th class="px-4 py-3 font-medium text-neutral-700">说明</th>
                    <th class="px-4 py-3 font-medium text-neutral-700 rounded-r-lg">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100">
                  <tr v-for="(mat, idx) in service.materials" :key="mat.id" class="hover:bg-gov-blue/5 transition-colors">
                    <td class="px-4 py-4 text-neutral-600">{{ idx + 1 }}</td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-gov-blue/10 flex items-center justify-center flex-shrink-0">
                          <FileText class="w-4 h-4 text-gov-blue" />
                        </div>
                        <span class="font-medium text-neutral-800">{{ mat.name }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <span v-if="mat.required" class="tag tag-danger !text-xs">必填</span>
                      <span v-else class="tag tag-primary !text-xs">选填</span>
                    </td>
                    <td class="px-4 py-4 text-neutral-600">{{ mat.format }}</td>
                    <td class="px-4 py-4 text-neutral-600 max-w-xs">
                      <p class="line-clamp-2">{{ mat.description }}</p>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-2">
                        <button
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gov-blue bg-gov-blue/10 rounded-lg hover:bg-gov-blue/20 transition-colors"
                          @click="callLicense(mat.name)"
                        >
                          <BadgeCheck class="w-3.5 h-3.5" />
                          调取证照
                        </button>
                        <button
                          v-if="mat.templateUrl"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-accent-green bg-accent-green/10 rounded-lg hover:bg-accent-green/20 transition-colors"
                          @click="downloadTemplate(mat.templateUrl)"
                        >
                          <Download class="w-3.5 h-3.5" />
                          模板下载
                        </button>
                        <button
                          v-if="mat.exampleUrl"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-500 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                          <FileText class="w-3.5 h-3.5" />
                          示例
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-4 bg-accent-orange/5 rounded-xl border border-accent-orange/20">
              <h4 class="text-sm font-medium text-neutral-800 mb-2 flex items-center gap-2">
                <AlertCircle class="w-4 h-4 text-accent-orange" />
                温馨提示
              </h4>
              <ul class="text-xs text-neutral-600 space-y-1.5">
                <li>• 支持电子证照的材料可通过「调取证照」功能直接调用，无需上传</li>
                <li>• 上传的材料需清晰可辨，支持 JPG、PNG、PDF 等格式</li>
                <li>• 每份材料大小不超过 10MB，最多可上传 5 个文件</li>
              </ul>
            </div>
          </div>

          <div v-show="activeTab === 'process'" class="space-y-6">
            <div class="p-4 bg-gov-blue/5 rounded-xl border border-gov-blue/20">
              <p class="text-sm text-neutral-700">
                <span class="font-medium">办理时限：</span>
                法定时限 {{ service.workDays }}，承诺时限 {{ service.workDays }}
              </p>
            </div>

            <div class="relative">
              <div class="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gov-blue via-gov-blue to-neutral-200 -translate-x-1/2"></div>
              <div class="space-y-6">
                <div
                  v-for="(step, idx) in service.steps"
                  :key="step.step"
                  :class="[
                    'relative flex items-start gap-4 md:gap-8',
                    step.step % 2 === 0 ? 'md:flex-row-reverse' : ''
                  ]"
                >
                  <div class="hidden md:block absolute left-1/2 top-6 -translate-x-1/2 z-10">
                    <div class="w-12 h-12 rounded-full bg-gov-gradient text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-white">
                      {{ step.step }}
                    </div>
                  </div>

                  <div class="md:hidden flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-gov-gradient text-white flex items-center justify-center font-semibold shadow-md">
                      {{ step.step }}
                    </div>
                  </div>

                  <div class="flex-1 md:w-1/2 md:flex-none md:max-w-[calc(50%-3rem)]">
                    <div class="card !p-5 !shadow-sm border border-neutral-200 hover:border-gov-blue/30 hover:shadow-md transition-all">
                      <div class="flex items-center justify-between mb-3">
                        <h4 class="text-base font-semibold text-neutral-800">{{ step.title }}</h4>
                        <span class="tag tag-primary">
                          <Clock class="w-3.5 h-3.5 mr-0.5" />
                          {{ step.duration }}
                        </span>
                      </div>
                      <p class="text-sm text-neutral-600 mb-4 leading-relaxed">{{ step.description }}</p>
                      <div class="flex items-center gap-4 pt-3 border-t border-neutral-100">
                        <div class="flex items-center gap-2 text-xs text-neutral-500">
                          <UserCheck class="w-4 h-4 text-gov-blue" />
                          <span>责任人：经办人员</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-neutral-500">
                          <BadgeCheck class="w-4 h-4 text-accent-green" />
                          <span>办理方式：线上/线下</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-5 bg-neutral-50 rounded-2xl">
              <h4 class="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <RefreshCw class="w-4 h-4 text-gov-blue" />
                办理流程说明
              </h4>
              <ul class="text-xs text-neutral-600 space-y-2">
                <li>1. 申请人通过网上办事大厅或政务服务中心提交申请材料</li>
                <li>2. 经办人员对申请材料进行初审，材料齐全的予以受理</li>
                <li>3. 审核人员对申请事项进行审核，符合条件的予以批准</li>
                <li>4. 审批通过后，制作办理结果并通知申请人领取或邮寄送达</li>
              </ul>
            </div>
          </div>

          <div v-show="activeTab === 'faq'" class="space-y-3">
            <div
              v-for="(item, idx) in faqList"
              :key="idx"
              class="border border-neutral-200 rounded-xl overflow-hidden transition-all hover:border-gov-blue/30"
              :class="{ 'shadow-md': expandedFaq === idx }"
            >
              <button
                class="w-full px-5 py-4 bg-neutral-50 hover:bg-neutral-100/80 flex items-center justify-between gap-3 transition-colors text-left"
                @click="toggleFaq(idx)"
              >
                <div class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-gov-blue text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    Q
                  </span>
                  <p class="font-medium text-neutral-800">{{ item.q }}</p>
                </div>
                <ChevronDown
                  class="w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform duration-300"
                  :class="{ 'rotate-180 text-gov-blue': expandedFaq === idx }"
                />
              </button>
              <div
                class="overflow-hidden transition-all duration-300"
                :style="{ maxHeight: expandedFaq === idx ? '500px' : '0', opacity: expandedFaq === idx ? 1 : 0 }"
              >
                <div class="px-5 py-4 flex items-start gap-3 border-t border-neutral-100 bg-white">
                  <span class="w-6 h-6 rounded-full bg-accent-green text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                    A
                  </span>
                  <p class="text-neutral-600 text-sm leading-relaxed">{{ item.a }}</p>
                </div>
              </div>
            </div>

            <div class="text-center pt-4">
              <button class="text-sm text-gov-blue hover:underline inline-flex items-center gap-1">
                <MessageSquare class="w-4 h-4" />
                还有问题？在线咨询
              </button>
            </div>
          </div>

          <div v-show="activeTab === 'reviews'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border border-orange-100 text-center">
                <p class="text-4xl font-bold text-accent-orange mb-1">{{ avgRating.toFixed(1) }}</p>
                <div class="flex items-center justify-center gap-0.5 mb-2">
                  <Star v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.round(avgRating) ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'" />
                </div>
                <p class="text-sm text-neutral-600">综合评分</p>
                <p class="text-xs text-neutral-400 mt-1">共 {{ reviewList.length }} 条评价</p>
              </div>

              <div class="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 text-center">
                <p class="text-4xl font-bold text-accent-green mb-1">{{ satisfactionPercent }}%</p>
                <div class="flex items-center justify-center gap-1 mb-2">
                  <ThumbsUp class="w-5 h-5 text-accent-green" />
                </div>
                <p class="text-sm text-neutral-600">用户满意度</p>
                <p class="text-xs text-neutral-400 mt-1">四星及以上占比</p>
              </div>

              <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 text-center">
                <p class="text-4xl font-bold text-gov-blue mb-1">{{ service.satisfaction }}%</p>
                <div class="flex items-center justify-center gap-1 mb-2">
                  <BadgeCheck class="w-5 h-5 text-gov-blue" />
                </div>
                <p class="text-sm text-neutral-600">官方满意度</p>
                <p class="text-xs text-neutral-400 mt-1">政务服务评测</p>
              </div>
            </div>

            <div class="p-5 bg-white rounded-2xl border border-neutral-200">
              <h3 class="text-base font-semibold text-neutral-800 mb-4">评分分布</h3>
              <div class="space-y-3">
                <div v-for="(count, idx) in ratingDistribution" :key="idx" class="flex items-center gap-3">
                  <span class="text-sm text-neutral-500 w-12 flex-shrink-0">{{ 5 - idx }}星</span>
                  <div class="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-orange-400 to-accent-orange rounded-full transition-all duration-500"
                      :style="{ width: reviewList.length > 0 ? `${(count / reviewList.length) * 100}%` : '0%' }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-neutral-700 w-16 text-right flex-shrink-0">
                    {{ reviewList.length > 0 ? Math.round((count / reviewList.length) * 100) : 0 }}% ({{ count }})
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-neutral-800">用户评价</h3>
                <div class="flex items-center gap-2">
                  <select class="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-600 outline-none bg-white">
                    <option>全部评价</option>
                    <option>好评</option>
                    <option>中评</option>
                    <option>差评</option>
                    <option>有图</option>
                  </select>
                </div>
              </div>

              <div class="space-y-4">
                <div v-for="r in reviewList" :key="r.id" class="p-5 bg-neutral-50 rounded-2xl hover:bg-neutral-100/50 transition-colors">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-gov-gradient flex items-center justify-center text-white font-medium">
                        {{ r.user.charAt(0) }}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-neutral-800">{{ r.user }}</p>
                        <p class="text-xs text-neutral-400">{{ r.time }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-0.5">
                      <Star v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= r.rating ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'" />
                    </div>
                  </div>
                  <p class="text-sm text-neutral-700 leading-relaxed mb-3">{{ r.content }}</p>
                  <div class="flex flex-wrap gap-1.5 mb-3">
                    <span v-for="tag in r.tags" :key="tag" class="text-xs px-2.5 py-1 bg-gov-blue/10 text-gov-blue rounded-full">
                      {{ tag }}
                    </span>
                  </div>
                  <div v-if="r.replyContent" class="mt-3 p-3 bg-white rounded-xl border border-green-100">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-xs font-medium text-accent-green">官方回复</span>
                      <span class="text-xs text-neutral-400">{{ r.replyTime }}</span>
                    </div>
                    <p class="text-xs text-neutral-600 leading-relaxed">{{ r.replyContent }}</p>
                  </div>
                </div>
              </div>

              <div class="text-center pt-4">
                <button class="text-sm text-gov-blue hover:underline">
                  查看更多评价
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-neutral-200 shadow-2xl p-4 md:hidden">
          <div class="container flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-800 line-clamp-1">{{ service.name }}</p>
              <p class="text-xs text-neutral-500">{{ service.departmentName }}</p>
            </div>
            <button
              v-if="service.onlineApply"
              class="btn-primary shadow-lg text-base px-6 py-2.5 flex-shrink-0"
              @click="goApply"
            >
              <span class="flex items-center gap-1.5">
                <FileCheck class="w-4 h-4" />
                立即办理
              </span>
            </button>
            <button v-else class="btn-secondary px-6 py-2.5 flex-shrink-0" disabled>
              暂不可办
            </button>
          </div>
        </div>

        <div class="fixed bottom-6 right-6 z-30 hidden md:block">
          <button
            v-if="service.onlineApply"
            class="btn-primary shadow-2xl text-base px-8 py-3.5 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            @click="goApply"
          >
            <span class="flex items-center gap-2">
              <FileCheck class="w-5 h-5" />
              立即在线办理
            </span>
          </button>
          <p class="text-xs text-neutral-400 mt-2 text-center">
            已办 {{ service.applyCount.toLocaleString() }} 件
          </p>
        </div>

        <button
          v-if="activeTab !== 'guide'"
          class="fixed bottom-24 right-6 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-500 hover:text-gov-blue hover:border-gov-blue transition-all"
          @click="scrollToTop"
        >
          <ChevronRight class="w-5 h-5 -rotate-90" />
        </button>
      </template>
    </div>
  </div>
</template>
