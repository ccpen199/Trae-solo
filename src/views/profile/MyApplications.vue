<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
  Circle,
  Calendar,
  Building2,
  Eye,
  MessageCircle,
  Download,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Star,
  ThumbsUp,
  ThumbsDown,
  FileX,
  Shield,
  X,
  CheckCircle2,
  Clock3,
} from 'lucide-vue-next'
import { mockApplications } from '@/mock/data/applications'
import type { Application, ApplicationStatus } from '@/types'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const searchValue = ref('')
const activeStatus = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentApp = ref<Application | null>(null)
const detailTab = ref('timeline')

const evaluationForm = reactive({
  rating: 0,
  speed: 0,
  attitude: 0,
  quality: 0,
  content: '',
  tags: [] as string[]
})

const evaluationTags = ['效率高', '服务好', '流程清晰', '便捷快速', '材料简单', '体验良好', '有待改进']

const rectificationInfo = reactive({
  hasRectification: false,
  status: 'processing' as 'processing' | 'completed',
  content: '',
  handler: '',
  handleTime: '',
  reply: ''
})

function resetEvaluationForm() {
  evaluationForm.rating = 0
  evaluationForm.speed = 0
  evaluationForm.attitude = 0
  evaluationForm.quality = 0
  evaluationForm.content = ''
  evaluationForm.tags = []
}

function submitEvaluation() {
  if (evaluationForm.rating === 0) {
    ElMessage.warning('请选择评分')
    return
  }
  ElMessage.success('评价提交成功！')
  if (currentApp.value) {
    currentApp.value.rating = evaluationForm.rating
    currentApp.value.comment = evaluationForm.content
  }
  detailTab.value = 'evaluation'
}

type StatusTabKey = 'all' | 'pending' | 'processing' | 'completed' | 'rejected' | 'review'

const statusTabs: { key: StatusTabKey; label: string; icon: any }[] = [
  { key: 'all', label: '全部', icon: FileText },
  { key: 'pending', label: '待受理', icon: Clock },
  { key: 'processing', label: '办理中', icon: RotateCcw },
  { key: 'completed', label: '已办结', icon: CheckCircle },
  { key: 'rejected', label: '已退回', icon: XCircle },
  { key: 'review', label: '待评价', icon: Star },
]

const applications = ref<Application[]>(mockApplications.filter(a => a.userId === 'u_001'))

const statusConfig: Record<string, { color: string; bg: string; tag: string; text: string }> = {
  draft: { color: 'text-neutral-600', bg: 'bg-neutral-100', tag: 'tag-default', text: '草稿' },
  submitted: { color: 'text-accent-yellow', bg: 'bg-accent-yellow/10', tag: 'tag-warning', text: '待受理' },
  accepted: { color: 'text-gov-blue', bg: 'bg-gov-blue/10', tag: 'tag-primary', text: '已受理' },
  reviewing: { color: 'text-gov-blue', bg: 'bg-gov-blue/10', tag: 'tag-primary', text: '审核中' },
  supplement: { color: 'text-accent-orange', bg: 'bg-accent-orange/10', tag: 'tag-warning', text: '待补件' },
  approved: { color: 'text-accent-green', bg: 'bg-accent-green/10', tag: 'tag-success', text: '已通过' },
  rejected: { color: 'text-accent-red', bg: 'bg-accent-red/10', tag: 'tag-danger', text: '已退回' },
  completed: { color: 'text-accent-green', bg: 'bg-accent-green/10', tag: 'tag-success', text: '已办结' },
  cancelled: { color: 'text-neutral-500', bg: 'bg-neutral-100', tag: 'tag-default', text: '已取消' },
}

function getStatusInfo(status: ApplicationStatus) {
  return statusConfig[status] || statusConfig.submitted
}

function getNextStepText(app: Application) {
  const steps: Partial<Record<ApplicationStatus, string>> = {
    draft: '请完善申请信息后提交',
    submitted: '请等待窗口工作人员受理',
    accepted: '您的申请已受理，正在审核中',
    reviewing: '您的申请正在审核，请耐心等待',
    supplement: '请补充相关材料后重新提交',
    approved: '您的申请已通过，正在制作结果文件',
    completed: '办件已完成，请查收结果文件',
    rejected: '您的申请未通过，可查看原因后重新申请',
  }
  return steps[app.status] || '请等待处理'
}

function getRemainingDays(deadline: string) {
  const now = new Date()
  const dead = new Date(deadline)
  const diff = Math.ceil((dead.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function canContinue(app: Application) {
  return ['draft', 'supplement', 'submitted'].includes(app.status)
}

function getContinueText(status: ApplicationStatus) {
  if (status === 'draft') return '继续填写'
  if (status === 'supplement') return '补充材料'
  return '查看进度'
}

const filteredApplications = computed(() => {
  let list = applications.value
  
  if (activeStatus.value === 'all') {
  } else if (activeStatus.value === 'pending') {
    list = list.filter(a => a.status === 'submitted')
  } else if (activeStatus.value === 'processing') {
    list = list.filter(a => ['accepted', 'reviewing', 'supplement', 'approved'].includes(a.status))
  } else if (activeStatus.value === 'completed') {
    list = list.filter(a => a.status === 'completed')
  } else if (activeStatus.value === 'rejected') {
    list = list.filter(a => a.status === 'rejected')
  } else if (activeStatus.value === 'review') {
    list = list.filter(a => a.status === 'completed' && !a.rating)
  }
  
  if (searchValue.value.trim()) {
    const keyword = searchValue.value.trim().toLowerCase()
    list = list.filter(a =>
      a.serviceName.toLowerCase().includes(keyword) ||
      a.applyNo.toLowerCase().includes(keyword) ||
      a.departmentName.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredApplications.value.slice(start, start + pageSize.value)
})

const statusCounts = computed(() => ({
  all: applications.value.length,
  pending: applications.value.filter(a => a.status === 'submitted').length,
  processing: applications.value.filter(a => ['accepted', 'reviewing', 'supplement', 'approved'].includes(a.status)).length,
  completed: applications.value.filter(a => a.status === 'completed').length,
  rejected: applications.value.filter(a => a.status === 'rejected').length,
  review: applications.value.filter(a => a.status === 'completed' && !a.rating).length,
}))

function goBack() {
  router.back()
}

function openDetail(app: Application) {
  currentApp.value = app
  detailVisible.value = true
  detailTab.value = 'timeline'
  resetEvaluationForm()

  if (app.rating && app.rating <= 2) {
    rectificationInfo.hasRectification = true
    rectificationInfo.status = 'processing'
    rectificationInfo.content = '针对您反馈的问题，我们已安排专人跟进处理，将在3个工作日内给出整改方案。'
    rectificationInfo.handler = '李主管'
    rectificationInfo.handleTime = '2024-01-15 10:30'
    rectificationInfo.reply = ''
  } else {
    rectificationInfo.hasRectification = false
  }
}

function handleContinue(app: Application) {
  if (app.status === 'draft' || app.status === 'supplement') {
    router.push(`/apply/${app.serviceId}?appId=${app.id}`)
  } else {
    openDetail(app)
  }
}

function handleEvaluate(app: Application) {
  ElMessage.info('评价功能开发中')
}

function handleDownloadReceipt(app: Application) {
  ElMessage.success('回执下载中...')
}

function handleReapply(app: Application) {
  ElMessage.info('正在跳转到重新申请页面...')
}

function handleCancel(app: Application) {
  ElMessage.warning('撤销申请功能开发中')
}

watch([searchValue, activeStatus, pageSize], () => {
  currentPage.value = 1
})

watch(filteredApplications, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
})

onMounted(() => {
  const status = route.query.status as string
  if (status) {
    activeStatus.value = status
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div class="container h-16 flex items-center gap-4">
        <button @click="goBack" class="p-2 -ml-2 text-neutral-500 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold text-neutral-800">我的办件</h1>
        <div class="ml-auto flex items-center gap-2">
          <span class="text-sm text-neutral-500">共 <span class="text-gov-blue font-semibold">{{ applications.length }}</span> 条记录</span>
        </div>
      </div>
    </header>

    <div class="container py-6">
      <div class="card mb-5">
        <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div class="relative flex-1">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              v-model="searchValue"
              type="text"
              placeholder="搜索办件名称、编号、办理部门..."
              class="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 transition-all placeholder:text-neutral-400"
            />
          </div>
          <button class="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-neutral-200 text-neutral-600 hover:border-gov-blue hover:text-gov-blue hover:bg-gov-blue-50 transition-all">
            <Filter class="w-5 h-5" />
            筛选
          </button>
        </div>
      </div>

      <div class="card mb-5 -mx-0">
        <div class="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeStatus === tab.key
                ? 'bg-gov-gradient text-white shadow-md'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            ]"
            @click="activeStatus = tab.key"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
            <span
              :class="[
                'text-xs px-1.5 py-0.5 rounded-full',
                activeStatus === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-500'
              ]"
            >
              {{ statusCounts[tab.key as keyof typeof statusCounts] }}
            </span>
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="app in paginatedApplications"
          :key="app.id"
          class="card card-hover overflow-hidden"
        >
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base font-semibold text-neutral-800 cursor-pointer hover:text-gov-blue transition-colors" @click="openDetail(app)">
                  {{ app.serviceName }}
                </h3>
                <span :class="['tag', getStatusInfo(app.status).tag]">{{ getStatusInfo(app.status).text }}</span>
                <span v-if="app.status === 'supplement'" class="tag tag-warning flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3" />
                  需补件
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-xs text-neutral-500 flex-wrap">
                <span class="flex items-center gap-1">
                  <FileText class="w-3.5 h-3.5" />
                  受理号：{{ app.applyNo }}
                </span>
                <span class="flex items-center gap-1">
                  <Building2 class="w-3.5 h-3.5" />
                  {{ app.departmentName }}
                </span>
                <span class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5" />
                  提交时间：{{ app.submitTime?.slice(0, 16) }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 p-4 bg-neutral-50 rounded-xl">
            <div>
              <p class="text-xs text-neutral-500 mb-1">当前步骤</p>
              <p class="text-sm font-medium text-neutral-800">第 {{ app.currentStep }} / {{ app.totalSteps }} 步</p>
            </div>
            <div v-if="app.status !== 'completed' && app.status !== 'rejected' && app.status !== 'cancelled'">
              <p class="text-xs text-neutral-500 mb-1">剩余时限</p>
              <p :class="[
                'text-sm font-medium',
                getRemainingDays(app.deadline) <= 3 ? 'text-accent-red' :
                getRemainingDays(app.deadline) <= 7 ? 'text-accent-orange' : 'text-neutral-800'
              ]">
                <Clock class="w-3.5 h-3.5 inline mr-1" />
                还剩 {{ getRemainingDays(app.deadline) }} 个工作日
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 mb-1">下一步</p>
              <p class="text-sm font-medium text-gov-blue">{{ getNextStepText(app) }}</p>
            </div>
          </div>

          <div class="mb-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-neutral-600">办理进度</span>
              <span class="text-sm" :class="getStatusInfo(app.status).color">
                完成 {{ Math.round((app.currentStep / app.totalSteps) * 100) }}%
              </span>
            </div>
            <div class="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                class="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                :class="[
                  app.status === 'completed' || app.status === 'approved' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                  app.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                  'bg-gradient-to-r from-blue-400 to-blue-600'
                ]"
                :style="{ width: `${Math.round((app.currentStep / app.totalSteps) * 100)}%` }"
              ></div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-neutral-100 -mx-6 px-6">
            <div class="flex items-center gap-2">
              <button
                v-if="canContinue(app)"
                @click="handleContinue(app)"
                class="btn-primary !py-2 !px-4 text-sm flex items-center gap-1.5"
              >
                {{ getContinueText(app.status) }}
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="app.status === 'rejected'"
                @click="handleReapply(app)"
                class="btn-primary !py-2 !px-4 text-sm"
              >
                重新提交
              </button>
              <button
                v-if="app.status === 'submitted'"
                @click="handleCancel(app)"
                class="btn-secondary !py-2 !px-4 text-sm"
              >
                撤销申请
              </button>
            </div>
            <div class="flex items-center gap-1">
              <button
                v-if="app.status === 'completed' && !app.rating"
                @click="handleEvaluate(app)"
                class="flex items-center gap-1.5 px-3 py-2 text-sm text-accent-orange hover:bg-accent-orange/5 rounded-lg transition-colors"
              >
                <Star class="w-4 h-4" />
                去评价
              </button>
              <button
                v-else-if="app.status === 'completed' && app.rating"
                class="flex items-center gap-1.5 px-3 py-2 text-sm text-accent-green hover:bg-accent-green/5 rounded-lg transition-colors"
              >
                <Star class="w-4 h-4 fill-current" />
                已评价
              </button>
              <button
                @click="handleDownloadReceipt(app)"
                class="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors"
              >
                <Download class="w-4 h-4" />
                回执
              </button>
              <button
                @click="openDetail(app)"
                class="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors"
              >
                <Eye class="w-4 h-4" />
                详情
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredApplications.length === 0" class="card text-center py-16">
          <div class="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <FileText class="w-10 h-10 text-neutral-300" />
          </div>
          <p class="text-neutral-500 mb-2">暂无符合条件的办件记录</p>
          <p class="text-sm text-neutral-400">试试其他筛选条件或清空搜索关键词</p>
        </div>
      </div>

      <div v-if="filteredApplications.length > 0" class="flex justify-center mt-8">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredApplications.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      width="760px"
      :close-on-click-modal="false"
      class="application-detail-dialog"
    >
      <template #header>
        <div class="flex items-center justify-between pr-6">
          <div>
            <h3 class="text-lg font-semibold text-neutral-800">办件详情</h3>
          </div>
        </div>
      </template>

      <div v-if="currentApp" class="space-y-5">
        <div class="p-5 bg-gradient-to-r from-gov-blue/5 to-indigo-50 rounded-2xl border border-gov-blue/10">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h4 class="text-base font-semibold text-neutral-800 mb-1">{{ currentApp.serviceName }}</h4>
              <p class="text-xs text-neutral-500">受理号：{{ currentApp.applyNo }}</p>
              <p class="text-xs text-neutral-500 mt-0.5">{{ currentApp.departmentName }}</p>
            </div>
            <span :class="['tag !text-sm !px-3 !py-1', getStatusInfo(currentApp.status).tag]">
              {{ getStatusInfo(currentApp.status).text }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gov-blue/10">
            <div>
              <p class="text-xs text-neutral-500 mb-1">提交时间</p>
              <p class="text-sm font-medium text-neutral-800">{{ currentApp.submitTime?.slice(0, 16) }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 mb-1">承诺办结</p>
              <p class="text-sm font-medium text-neutral-800">{{ currentApp.deadline?.slice(0, 10) }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 mb-1">当前进度</p>
              <p class="text-sm font-medium text-gov-blue">第 {{ currentApp.currentStep }}/{{ currentApp.totalSteps }} 步</p>
            </div>
          </div>
        </div>

        <div v-if="currentApp.supplementNotice" class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div class="flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-800 mb-1">补件通知</p>
              <p class="text-sm text-amber-700">{{ currentApp.supplementNotice }}</p>
            </div>
          </div>
        </div>

        <div v-if="currentApp.rejectReason" class="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div class="flex items-start gap-3">
            <XCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-800 mb-1">驳回原因</p>
              <p class="text-sm text-red-700">{{ currentApp.rejectReason }}</p>
            </div>
          </div>
        </div>

        <div v-if="currentApp.resultNotice" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div class="flex items-start gap-3">
            <FileCheck class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-emerald-800 mb-1">办理结果</p>
              <p class="text-sm text-emerald-700">{{ currentApp.resultNotice }}</p>
            </div>
          </div>
        </div>

        <div class="border-b border-neutral-200">
          <div class="flex gap-6">
            <button
              v-for="tab in [
                { key: 'timeline', label: '办理进度' },
                { key: 'info', label: '申请信息' },
                { key: 'materials', label: '材料清单' },
                { key: 'evaluation', label: '评价' }
              ]"
              :key="tab.key"
              :class="[
                'pb-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                detailTab === tab.key
                  ? 'text-gov-blue border-gov-blue'
                  : 'text-neutral-500 border-transparent hover:text-neutral-700'
              ]"
              @click="detailTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div v-show="detailTab === 'timeline'" class="pt-2">
          <div class="relative">
            <div class="absolute left-3.5 top-2 bottom-2 w-px bg-gradient-to-b from-blue-300 via-blue-200 to-neutral-200"></div>
            <div class="space-y-1">
              <div
                v-for="(step, idx) in currentApp.timeline"
                :key="step.id"
                class="relative flex items-start gap-3 py-2.5"
              >
                <div
                  :class="[
                    'relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                    idx < currentApp.currentStep
                      ? idx === currentApp.currentStep - 1
                        ? 'bg-gov-gradient shadow-lg ring-4 ring-blue-100'
                        : 'bg-accent-green'
                      : 'bg-white border-2 border-neutral-200'
                  ]"
                >
                  <CheckCircle2
                    v-if="idx < currentApp.currentStep && idx !== currentApp.currentStep - 1"
                    class="w-3.5 h-3.5 text-white"
                  />
                  <Clock3
                    v-else-if="idx === currentApp.currentStep - 1"
                    class="w-3.5 h-3.5 text-white animate-pulse"
                  />
                  <Circle
                    v-else
                    class="w-2 h-2 text-neutral-300"
                    fill="#D1D5DB"
                  />
                </div>
                <div class="flex-1 pb-1">
                  <div class="flex items-center justify-between">
                    <span
                      :class="[
                        'text-sm font-medium',
                        idx < currentApp.currentStep ? 'text-neutral-800' : 'text-neutral-400'
                      ]"
                    >
                      {{ step.title }}
                    </span>
                    <span v-if="step.time" class="text-xs text-neutral-400">{{ step.time?.slice(5, 16) }}</span>
                  </div>
                  <p :class="['text-xs mt-0.5', idx < currentApp.currentStep ? 'text-neutral-500' : 'text-neutral-400']">
                    {{ step.description }}
                  </p>
                  <p v-if="step.operator" :class="['text-xs mt-1', idx < currentApp.currentStep ? 'text-neutral-400' : 'text-neutral-300']">
                    操作人：{{ step.operator }}（{{ step.operatorRole }}）
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="detailTab === 'info'" class="pt-2 space-y-4">
          <div class="p-4 bg-neutral-50 rounded-xl">
            <h5 class="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <User class="w-4 h-4 text-gov-blue" />
              申请人信息
            </h5>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-neutral-500 mb-0.5">姓名</p>
                <p class="text-sm text-neutral-800">{{ currentApp.userName }}</p>
              </div>
              <div>
                <p class="text-xs text-neutral-500 mb-0.5">身份证号</p>
                <p class="text-sm text-neutral-800">{{ currentApp.idCard }}</p>
              </div>
              <div>
                <p class="text-xs text-neutral-500 mb-0.5">联系电话</p>
                <p class="text-sm text-neutral-800">{{ currentApp.phone }}</p>
              </div>
            </div>
          </div>

          <div class="p-4 bg-neutral-50 rounded-xl">
            <h5 class="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <FileText class="w-4 h-4 text-gov-blue" />
              业务表单信息
            </h5>
            <div class="space-y-2.5">
              <div
                v-for="field in currentApp.formData"
                :key="field.key"
                class="flex items-start justify-between gap-4"
              >
                <span class="text-xs text-neutral-500 flex-shrink-0">{{ field.label || field.key }}</span>
                <span class="text-sm text-neutral-800 text-right">
                  {{ Array.isArray(field.value) ? field.value.join('、') : field.value || '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-show="detailTab === 'materials'" class="pt-2">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-neutral-50 text-left">
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 rounded-tl-lg">材料名称</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 w-20">是否必填</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 w-24">状态</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 w-24 rounded-tr-lg">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="mat in currentApp.materials"
                  :key="mat.id"
                  class="border-b border-neutral-100 last:border-0"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <FileText class="w-4 h-4 text-gov-blue" />
                      <span class="text-sm text-neutral-800">{{ mat.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span v-if="mat.required" class="tag tag-danger !text-xs">必填</span>
                    <span v-else class="tag tag-primary !text-xs">选填</span>
                  </td>
                  <td class="px-4 py-3">
                    <span v-if="mat.status === 'approved'" class="inline-flex items-center gap-1 text-xs text-accent-green font-medium">
                      <CheckCircle2 class="w-3.5 h-3.5" />
                      已通过
                    </span>
                    <span v-else-if="mat.status === 'uploaded'" class="inline-flex items-center gap-1 text-xs text-gov-blue font-medium">
                      <Clock class="w-3.5 h-3.5" />
                      待审核
                    </span>
                    <span v-else-if="mat.status === 'rejected'" class="inline-flex items-center gap-1 text-xs text-accent-red font-medium">
                      <FileX class="w-3.5 h-3.5" />
                      需重传
                    </span>
                    <span v-else class="text-xs text-neutral-400">未上传</span>
                  </td>
                  <td class="px-4 py-3">
                    <button
                      v-if="mat.url"
                      class="text-xs text-gov-blue hover:underline"
                      @click="ElMessage.info('正在预览材料...')"
                    >
                      查看
                    </button>
                    <span v-else class="text-xs text-neutral-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-show="detailTab === 'evaluation'" class="pt-2 space-y-4">
          <template v-if="currentApp.rating">
            <div class="p-5 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border border-orange-100">
              <div class="flex items-center gap-4 mb-4">
                <div class="flex items-center gap-1">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    class="w-6 h-6"
                    :class="i <= (currentApp.rating || 0) ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'"
                  />
                </div>
                <span class="text-2xl font-bold text-accent-orange">{{ currentApp.rating }}.0</span>
              </div>
              <p v-if="currentApp.comment" class="text-sm text-neutral-700 leading-relaxed">
                {{ currentApp.comment }}
              </p>
            </div>

            <div v-if="rectificationInfo.hasRectification" class="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div class="flex items-center gap-2 mb-3">
                <Shield class="w-5 h-5 text-gov-blue" />
                <h5 class="text-sm font-semibold text-neutral-800">整改跟踪</h5>
                <span :class="[
                  'tag ml-auto',
                  rectificationInfo.status === 'completed' ? 'tag-success' : 'tag-primary'
                ]">
                  {{ rectificationInfo.status === 'completed' ? '已完成' : '处理中' }}
                </span>
              </div>
              <p class="text-sm text-neutral-700 mb-3">{{ rectificationInfo.content }}</p>
              <div class="flex items-center gap-4 text-xs text-neutral-500">
                <span>责任人：{{ rectificationInfo.handler }}</span>
                <span>处理时间：{{ rectificationInfo.handleTime }}</span>
              </div>
              <div v-if="rectificationInfo.reply" class="mt-3 p-3 bg-white rounded-xl border border-blue-100">
                <p class="text-xs font-medium text-gov-blue mb-1">官方回复</p>
                <p class="text-xs text-neutral-600">{{ rectificationInfo.reply }}</p>
              </div>
            </div>
          </template>

          <template v-else-if="currentApp.status === 'completed'">
            <div class="p-5 bg-neutral-50 rounded-2xl">
              <h5 class="text-base font-semibold text-neutral-800 mb-4 text-center">
                对本次办理服务进行评价
              </h5>

              <div class="space-y-4 mb-6">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-600">综合评分</span>
                  <div class="flex items-center gap-1">
                    <button
                      v-for="i in 5"
                      :key="i"
                      type="button"
                      class="p-0.5"
                      @click="evaluationForm.rating = i"
                    >
                      <Star
                        class="w-6 h-6 transition-colors"
                        :class="i <= evaluationForm.rating ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 justify-center mb-4">
                <button
                  v-for="tag in evaluationTags"
                  :key="tag"
                  type="button"
                  :class="[
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    evaluationForm.tags.includes(tag)
                      ? 'bg-gov-blue text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-gov-blue hover:text-gov-blue'
                  ]"
                  @click="evaluationForm.tags.includes(tag)
                    ? evaluationForm.tags = evaluationForm.tags.filter(t => t !== tag)
                    : evaluationForm.tags.push(tag)"
                >
                  {{ tag }}
                </button>
              </div>

              <textarea
                v-model="evaluationForm.content"
                class="input-base resize-none w-full"
                rows="3"
                placeholder="请输入您的评价内容（选填）"
              ></textarea>

              <button class="btn-primary w-full mt-4" @click="submitEvaluation">
                提交评价
              </button>
            </div>
          </template>

          <template v-else>
            <div class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                <Star class="w-8 h-8 text-neutral-300" />
              </div>
              <p class="text-sm text-neutral-500">办件完成后可进行评价</p>
            </div>
          </template>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-neutral-100 -mx-6 px-6 -mb-6">
          <div class="flex items-center gap-2">
            <button
              v-if="currentApp.status === 'submitted'"
              @click="handleCancel(currentApp)"
              class="btn-secondary !py-2 !px-4 text-sm"
            >
              撤销申请
            </button>
            <button
              v-if="currentApp.status === 'supplement'"
              @click="handleContinue(currentApp)"
              class="btn-primary !py-2 !px-4 text-sm"
            >
              补充材料
            </button>
            <button
              @click="handleDownloadReceipt(currentApp)"
              class="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1.5"
            >
              <Download class="w-4 h-4" />
              查看回执
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="canContinue(currentApp)"
              @click="handleContinue(currentApp)"
              class="btn-primary flex items-center gap-2"
            >
              {{ getContinueText(currentApp.status) }}
              <ArrowRight class="w-4 h-4" />
            </button>
            <button
              v-if="currentApp.status === 'rejected'"
              @click="handleReapply(currentApp)"
              class="btn-primary"
            >
              重新申请
            </button>
            <button class="btn-secondary" @click="detailVisible = false">
              关闭
            </button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
