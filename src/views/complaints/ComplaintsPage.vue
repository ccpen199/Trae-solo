<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  MessageSquare,
  Search,
  Plus,
  Clock,
  CheckCircle,
  MessageCircle,
  Star,
  Filter,
  ChevronRight,
  AlertCircle,
  FileText,
  ThumbsUp,
  HelpCircle,
  HandHeart,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Wrench,
  RotateCcw,
  Eye,
  Image as ImageIcon,
  Calendar,
  Building2,
  AlertTriangle,
  GripVertical
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTicketList, cancelTicket, getReviewRecords } from '@/api/tickets'
import { getDepartmentList } from '@/api/services'
import EvaluationDialog from '@/components/evaluation/EvaluationDialog.vue'
import RectificationTracker from '@/components/evaluation/RectificationTracker.vue'
import type { Ticket, TicketStatus, TicketType, TicketPriority, Department, ReviewRecord } from '@/types'

const router = useRouter()
const searchValue = ref('')
const activeTab = ref<string>('all')
const showDetailDialog = ref(false)
const currentTicket = ref<Ticket | null>(null)
const showEvaluationDialog = ref(false)
const showRectificationDialog = ref(false)
const showReviewDialog = ref(false)
const reviewRecords = ref<ReviewRecord[]>([])
const showFilterPanel = ref(false)
const loading = ref(false)

const filterForm = ref({
  type: '' as TicketType | '',
  departmentId: '',
  dateRange: [] as any[],
  priority: '' as TicketPriority | ''
})

const tickets = ref<Ticket[]>([])
const departments = ref<Department[]>([])

const tabs = [
  { key: 'all', label: '全部', icon: MessageSquare },
  { key: 'pending', label: '待受理', icon: Clock },
  { key: 'processing', label: '处理中', icon: AlertCircle },
  { key: 'replied', label: '已回复', icon: MessageCircle },
  { key: 'evaluating', label: '待评价', icon: Star },
  { key: 'evaluated', label: '已评价', icon: CheckCircle },
  { key: 'archived', label: '已归档', icon: FileText }
]

const typeInfoMap: Record<TicketType, { label: string; icon: any; class: string }> = {
  complaint: { label: '投诉', icon: AlertCircle, class: 'tag-danger' },
  suggestion: { label: '建议', icon: ThumbsUp, class: 'tag-primary' },
  consultation: { label: '咨询', icon: HelpCircle, class: 'tag-warning' },
  help: { label: '求助', icon: HandHeart, class: 'tag-purple' },
  praise: { label: '表扬', icon: ThumbsUp, class: 'tag-success' }
}

const statusInfoMap: Record<TicketStatus, { label: string; color: string; bgColor: string; step: number }> = {
  pending: { label: '待受理', color: 'text-accent-yellow', bgColor: 'bg-accent-yellow', step: 1 },
  assigned: { label: '已分拨', color: 'text-accent-orange', bgColor: 'bg-accent-orange', step: 2 },
  accepted: { label: '受理中', color: 'text-gov-blue', bgColor: 'bg-gov-blue', step: 2 },
  processing: { label: '处理中', color: 'text-gov-blue', bgColor: 'bg-gov-blue', step: 3 },
  replied: { label: '已回复', color: 'text-accent-green', bgColor: 'bg-accent-green', step: 4 },
  evaluating: { label: '待评价', color: 'text-accent-purple', bgColor: 'bg-accent-purple', step: 4 },
  rectifying: { label: '整改中', color: 'text-accent-red', bgColor: 'bg-accent-red', step: 5 },
  reviewing: { label: '复查中', color: 'text-accent-orange', bgColor: 'bg-accent-orange', step: 6 },
  completed: { label: '已完成', color: 'text-accent-green', bgColor: 'bg-accent-green', step: 5 },
  closed: { label: '已关闭', color: 'text-neutral-500', bgColor: 'bg-neutral-500', step: 5 },
  archived: { label: '已归档', color: 'text-neutral-400', bgColor: 'bg-neutral-400', step: 7 }
}

const priorityInfoMap: Record<TicketPriority, { label: string; class: string }> = {
  urgent: { label: '紧急', class: 'bg-accent-red/10 text-accent-red border border-accent-red/20' },
  high: { label: '高', class: 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20' },
  medium: { label: '中', class: 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20' },
  low: { label: '低', class: 'bg-neutral-100 text-neutral-500 border border-neutral-200' }
}

const filteredTickets = computed<Ticket[]>(() => {
  let result = [...tickets.value]
  
  if (activeTab.value === 'pending') {
    result = result.filter((t) => t.status === 'pending' || t.status === 'assigned')
  } else if (activeTab.value === 'processing') {
    result = result.filter((t) => t.status === 'accepted' || t.status === 'processing')
  } else if (activeTab.value === 'replied') {
    result = result.filter((t) => t.status === 'replied')
  } else if (activeTab.value === 'evaluating') {
    result = result.filter((t) => t.status === 'replied' || t.status === 'evaluating')
  } else if (activeTab.value === 'evaluated') {
    result = result.filter((t) => t.rating !== undefined || t.status === 'completed' || t.status === 'rectifying' || t.status === 'reviewing')
  } else if (activeTab.value === 'archived') {
    result = result.filter((t) => t.status === 'archived' || t.status === 'closed')
  }
  
  if (searchValue.value.trim()) {
    const keyword = searchValue.value.trim().toLowerCase()
    result = result.filter(
      (t) => t.title.toLowerCase().includes(keyword) || 
             t.content.toLowerCase().includes(keyword) ||
             t.ticketNo.toLowerCase().includes(keyword)
    )
  }
  
  if (filterForm.value.type) {
    result = result.filter(t => t.type === filterForm.value.type)
  }
  
  if (filterForm.value.departmentId) {
    result = result.filter(t => t.departmentId === filterForm.value.departmentId)
  }
  
  if (filterForm.value.priority) {
    result = result.filter(t => t.priority === filterForm.value.priority)
  }
  
  return result.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime())
})

function getProgressPercent(ticket: Ticket) {
  return (ticket.currentStep / ticket.totalSteps) * 100
}

function formatRemaining(hours?: number) {
  if (hours === undefined || hours === null) return '-'
  if (hours >= 24) return `${Math.floor(hours / 24)}天${hours % 24}小时`
  return `${hours}小时`
}

function getSlaStatus(ticket: Ticket) {
  if (ticket.isOverdue) return 'overdue'
  if ((ticket.remainingHours || 0) <= 12) return 'warning'
  return 'normal'
}

function goToNewComplaint() {
  router.push('/complaints/new')
}

async function openDetail(ticket: Ticket) {
  currentTicket.value = ticket
  showDetailDialog.value = true
  
  if (ticket.status === 'reviewing') {
    const res = await getReviewRecords(ticket.id)
    reviewRecords.value = res.data
  }
}

function closeDetail() {
  showDetailDialog.value = false
  currentTicket.value = null
}

function openEvaluation() {
  showEvaluationDialog.value = true
}

function openRectification() {
  showRectificationDialog.value = true
}

async function handleEvaluationSuccess() {
  showEvaluationDialog.value = false
  ElMessage.success('评价提交成功！')
  await loadTickets()
  if (currentTicket.value) {
    const idx = tickets.value.findIndex(t => t.id === currentTicket.value!.id)
    if (idx >= 0) {
      currentTicket.value = tickets.value[idx]
    }
  }
}

async function handleRectificationUpdated() {
  await loadTickets()
  if (currentTicket.value) {
    const idx = tickets.value.findIndex(t => t.id === currentTicket.value!.id)
    if (idx >= 0) {
      currentTicket.value = tickets.value[idx]
    }
  }
}

async function handleCancelTicket() {
  if (!currentTicket.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要撤销该诉求吗？撤销后将无法恢复。',
      '撤销诉求',
      {
        confirmButtonText: '确定撤销',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cancelTicket(currentTicket.value.id, '用户主动撤销')
    ElMessage.success('诉求已撤销')
    closeDetail()
    await loadTickets()
  } catch (e) {
    // 用户取消
  }
}

function canCancel(ticket: Ticket) {
  return ticket.status === 'pending' || ticket.status === 'assigned'
}

function resetFilters() {
  filterForm.value = {
    type: '',
    departmentId: '',
    dateRange: [],
    priority: ''
  }
  loadTickets()
}

async function loadTickets() {
  loading.value = true
  try {
    const res = await getTicketList({
      page: 1,
      pageSize: 50,
      keyword: searchValue.value || undefined,
      type: filterForm.value.type || undefined,
      departmentId: filterForm.value.departmentId || undefined,
      priority: filterForm.value.priority || undefined
    })
    tickets.value = res.data.list
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadDepartments() {
  try {
    const res = await getDepartmentList()
    departments.value = res.data
  } catch (e) {
    console.error(e)
  }
}

watch(activeTab, () => {
  loadTickets()
})

onMounted(() => {
  loadTickets()
  loadDepartments()
})
</script>

<template>
  <div class="container py-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gov-gradient flex items-center justify-center">
            <MessageSquare class="w-5 h-5 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-800">诉求中心</h1>
        </div>
        <p class="text-neutral-500 ml-13">提交您的诉求，我们将尽快为您处理</p>
      </div>
      <button @click="goToNewComplaint" class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" />
        新增诉求
      </button>
    </div>

    <div class="card mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1 max-w-md">
          <Search class="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchValue"
            type="text"
            placeholder="搜索诉求标题、内容或工单号..."
            @keyup.enter="loadTickets"
            class="w-full pl-12 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 transition-all"
          />
        </div>
        <button 
          @click="showFilterPanel = !showFilterPanel"
          :class="['btn-secondary flex items-center gap-2', showFilterPanel ? '!border-gov-blue !text-gov-blue' : '']"
        >
          <Filter class="w-4 h-4" />
          高级筛选
        </button>
      </div>
      
      <div v-if="showFilterPanel" class="mt-4 pt-4 border-t border-neutral-100">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-neutral-600 mb-1.5">诉求类型</label>
            <select 
              v-model="filterForm.type" 
              class="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-gov-blue text-sm"
            >
              <option value="">全部类型</option>
              <option value="complaint">投诉</option>
              <option value="suggestion">建议</option>
              <option value="consultation">咨询</option>
              <option value="help">求助</option>
              <option value="praise">表扬</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-neutral-600 mb-1.5">责任部门</label>
            <select 
              v-model="filterForm.departmentId" 
              class="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-gov-blue text-sm"
            >
              <option value="">全部部门</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.shortName }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-neutral-600 mb-1.5">紧急程度</label>
            <select 
              v-model="filterForm.priority" 
              class="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-gov-blue text-sm"
            >
              <option value="">全部</option>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button @click="loadTickets" class="flex-1 btn-primary !py-2 text-sm">
              查询
            </button>
            <button @click="resetFilters" class="flex-1 btn-secondary !py-2 text-sm">
              <RotateCcw class="w-3.5 h-3.5 inline mr-1" />
              重置
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="flex flex-wrap gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
            activeTab === tab.key
              ? 'bg-gov-gradient text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-gov-blue',
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card text-center py-16">
      <div class="w-8 h-8 border-2 border-gov-blue/30 border-t-gov-blue rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-neutral-500">加载中...</p>
    </div>

    <div v-else-if="filteredTickets.length === 0" class="card text-center py-16">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
        <FileText class="w-8 h-8 text-neutral-400" />
      </div>
      <p class="text-neutral-500">暂无相关诉求</p>
      <button @click="goToNewComplaint" class="mt-4 btn-primary">
        <Plus class="w-4 h-4 inline mr-1" />
        提交新诉求
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="ticket in filteredTickets"
        :key="ticket.id"
        @click="openDetail(ticket)"
        class="card card-hover cursor-pointer group"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span :class="['tag', typeInfoMap[ticket.type].class]">
              <component :is="typeInfoMap[ticket.type].icon" class="w-3 h-3 mr-1" />
              {{ typeInfoMap[ticket.type].label }}
            </span>
            <span v-if="ticket.isKeySupervision" class="tag tag-danger">
              <AlertTriangle class="w-3 h-3 mr-1" />
              重点督办
            </span>
            <span :class="['text-xs px-2 py-0.5 rounded-full', priorityInfoMap[ticket.priority].class]">
              {{ priorityInfoMap[ticket.priority].label }}
            </span>
            <span class="text-xs text-neutral-400 font-mono">{{ ticket.ticketNo }}</span>
          </div>
          <span :class="['text-sm font-medium flex items-center gap-1', statusInfoMap[ticket.status].color]">
            <span
              class="w-2 h-2 rounded-full"
              :class="statusInfoMap[ticket.status].bgColor"
              :style="{ opacity: ticket.status === 'processing' || ticket.status === 'rectifying' ? 1 : 1 }"
            ></span>
            {{ statusInfoMap[ticket.status].label }}
          </span>
        </div>

        <h3 class="text-base font-semibold text-neutral-800 group-hover:text-gov-blue transition-colors mb-2">
          {{ ticket.title }}
        </h3>
        <p class="text-sm text-neutral-500 text-ellipsis-2 mb-4">{{ ticket.content }}</p>

        <div class="mb-4">
          <div class="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
            <span>处理进度（{{ ticket.currentStep }}/{{ ticket.totalSteps }}步）</span>
            <span>{{ Math.round(getProgressPercent(ticket)) }}%</span>
          </div>
          <div class="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gov-gradient rounded-full transition-all duration-500"
              :style="{ width: `${getProgressPercent(ticket)}%` }"
            ></div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div class="flex items-center gap-4 text-xs text-neutral-500">
            <span class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              {{ ticket.submitTime }}
            </span>
            <span v-if="ticket.departmentName" class="flex items-center gap-1">
              <Building2 class="w-3.5 h-3.5" />
              {{ ticket.departmentName.replace('抚州市', '').replace('国家税务总局', '') }}
            </span>
            <span 
              v-if="!['completed', 'closed', 'archived'].includes(ticket.status)"
              class="flex items-center gap-1"
              :class="{
                'text-accent-red font-medium': getSlaStatus(ticket) === 'overdue',
                'text-accent-yellow font-medium': getSlaStatus(ticket) === 'warning'
              }"
            >
              <GripVertical class="w-3.5 h-3.5" />
              {{ ticket.isOverdue ? '已超时' : `剩${formatRemaining(ticket.remainingHours)}` }}
            </span>
          </div>
          <div class="flex items-center gap-1 text-sm text-gov-blue opacity-0 group-hover:opacity-100 transition-opacity">
            查看详情
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>

        <div v-if="ticket.rating" class="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2">
          <span class="text-xs text-neutral-500">您的评价：</span>
          <div class="flex items-center gap-0.5">
            <Star
              v-for="i in 5"
              :key="i"
              :class="[
                'w-4 h-4',
                i <= ticket.rating ? 'text-accent-yellow fill-accent-yellow' : 'text-neutral-300',
              ]"
            />
          </div>
          <span v-if="ticket.comment" class="text-xs text-neutral-500 ml-2 line-clamp-1">{{ ticket.comment }}</span>
        </div>

        <div v-else-if="ticket.status === 'replied' || ticket.status === 'evaluating'" class="mt-3 pt-3 border-t border-neutral-100">
          <span class="text-sm text-gov-blue hover:underline flex items-center gap-1">
            <Star class="w-4 h-4" />
            服务已回复，请评价
          </span>
        </div>
        
        <div v-else-if="ticket.status === 'rectifying'" class="mt-3 pt-3 border-t border-neutral-100">
          <span class="text-sm text-accent-red flex items-center gap-1">
            <Wrench class="w-4 h-4" />
            整改进行中，点击查看进度
          </span>
        </div>
      </div>
    </div>

    <div v-if="filteredTickets.length > 10" class="flex justify-center mt-8">
      <el-pagination
        :page-size="10"
        layout="prev, pager, next"
        :total="filteredTickets.length"
        background
      />
    </div>

    <el-dialog
      v-model="showDetailDialog"
      :title="currentTicket?.title || '诉求详情'"
      width="720px"
      :close-on-click-modal="false"
      class="complaint-detail-dialog"
    >
      <div v-if="currentTicket" class="space-y-6 -mt-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span :class="['tag', typeInfoMap[currentTicket.type].class]">
              {{ typeInfoMap[currentTicket.type].label }}
            </span>
            <span :class="['text-xs px-2 py-0.5 rounded-full', priorityInfoMap[currentTicket.priority].class]">
              {{ priorityInfoMap[currentTicket.priority].label }}
            </span>
            <span v-if="currentTicket.isKeySupervision" class="tag tag-danger">重点督办</span>
          </div>
          <span :class="['text-sm font-medium', statusInfoMap[currentTicket.status].color]">
            {{ statusInfoMap[currentTicket.status].label }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-xl">
          <div class="flex items-start gap-2">
            <FileText class="w-4 h-4 text-neutral-400 mt-0.5" />
            <div>
              <p class="text-xs text-neutral-500">工单号</p>
              <p class="text-sm font-medium text-neutral-700 font-mono">{{ currentTicket.ticketNo }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <Calendar class="w-4 h-4 text-neutral-400 mt-0.5" />
            <div>
              <p class="text-xs text-neutral-500">提交时间</p>
              <p class="text-sm text-neutral-700">{{ currentTicket.submitTime }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <Building2 class="w-4 h-4 text-neutral-400 mt-0.5" />
            <div>
              <p class="text-xs text-neutral-500">责任部门</p>
              <p class="text-sm text-neutral-700">{{ currentTicket.departmentName || '待分配' }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <Clock class="w-4 h-4 text-neutral-400 mt-0.5" />
            <div>
              <p class="text-xs text-neutral-500">回复时限</p>
              <p class="text-sm" :class="currentTicket.isOverdue ? 'text-accent-red font-medium' : 'text-neutral-700'">
                {{ currentTicket.isOverdue ? '已超时' : `${currentTicket.slaHours}小时内回复` }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-neutral-700 mb-2">诉求内容</h4>
          <div class="p-4 bg-neutral-50 rounded-xl text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {{ currentTicket.content }}
          </div>
          <div v-if="currentTicket.attachments && currentTicket.attachments.length > 0" class="mt-3">
            <p class="text-xs text-neutral-500 mb-2">附件图片</p>
            <div class="flex gap-2 flex-wrap">
              <div 
                v-for="(att, idx) in currentTicket.attachments" 
                :key="idx"
                class="w-20 h-20 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200"
              >
                <ImageIcon class="w-6 h-6 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentTicket.location || !currentTicket.anonymous" class="grid grid-cols-2 gap-4">
          <div v-if="currentTicket.location" class="flex items-start gap-2 p-3 bg-neutral-50 rounded-xl">
            <MapPin class="w-4 h-4 text-neutral-400 mt-0.5" />
            <div>
              <p class="text-xs text-neutral-500">位置信息</p>
              <p class="text-sm text-neutral-700">{{ currentTicket.location }}</p>
            </div>
          </div>
          <div v-if="!currentTicket.anonymous" class="flex items-start gap-2 p-3 bg-neutral-50 rounded-xl">
            <User class="w-4 h-4 text-neutral-400 mt-0.5" />
            <div>
              <p class="text-xs text-neutral-500">联系方式</p>
              <p class="text-sm text-neutral-700">{{ currentTicket.userName }}</p>
              <p class="text-xs text-neutral-500">{{ currentTicket.phone }}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <Clock class="w-4 h-4 text-gov-blue" />
            处理时间轴
          </h4>
          <div class="relative pl-2">
            <div
              v-for="(item, idx) in currentTicket.timeline"
              :key="item.id"
              class="relative pl-8 pb-5 last:pb-0"
            >
              <div 
                v-if="idx < currentTicket.timeline.length - 1"
                class="absolute left-3 top-6 w-0.5 h-full bg-neutral-200"
              ></div>
              <div 
                class="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center"
                :class="statusInfoMap[item.status]?.bgColor || 'bg-gov-blue'"
              >
                <CheckCircle v-if="['completed', 'replied', 'closed', 'archived'].includes(item.status)" class="w-3.5 h-3.5 text-white" />
                <Clock v-else class="w-3.5 h-3.5 text-white" />
              </div>
              <div class="pt-0.5">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-neutral-800">{{ item.title }}</span>
                  <span class="text-xs text-neutral-400">{{ item.time }}</span>
                </div>
                <p class="text-sm text-neutral-600 leading-relaxed">{{ item.description }}</p>
                <div v-if="item.operator" class="text-xs text-neutral-400 mt-1">
                  {{ item.operator }} · {{ item.operatorRole }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentTicket.replies && currentTicket.replies.length > 0">
          <h4 class="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <MessageCircle class="w-4 h-4 text-accent-green" />
            官方回复
          </h4>
          <div class="space-y-3">
            <div 
              v-for="reply in currentTicket.replies" 
              :key="reply.id"
              class="p-4 bg-accent-green/5 border border-accent-green/20 rounded-xl"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-accent-green">{{ reply.operator }}</span>
                <span class="text-xs text-neutral-400">{{ reply.time }}</span>
              </div>
              <p class="text-sm text-neutral-600 leading-relaxed">{{ reply.content }}</p>
            </div>
          </div>
        </div>

        <div v-if="reviewRecords.length > 0">
          <h4 class="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <RotateCcw class="w-4 h-4 text-accent-orange" />
            复查记录
          </h4>
          <div class="space-y-2">
            <div 
              v-for="record in reviewRecords" 
              :key="record.id"
              class="p-3 bg-accent-orange/5 border border-accent-orange/20 rounded-xl"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-accent-orange">
                  {{ record.status === 'pending' ? '待受理' : record.status === 'reviewing' ? '复查中' : '已复查' }}
                </span>
                <span class="text-xs text-neutral-400">{{ record.applyTime }}</span>
              </div>
              <p class="text-sm text-neutral-600">复查原因：{{ record.reason }}</p>
              <p v-if="record.reviewRemark" class="text-sm text-neutral-500 mt-1">复查结果：{{ record.reviewRemark }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            v-if="currentTicket.status === 'replied' || currentTicket.status === 'evaluating'"
            @click="openEvaluation"
            class="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Star class="w-4 h-4" />
            去评价
          </button>
          
          <button
            v-if="currentTicket.status === 'rectifying'"
            @click="openRectification"
            class="flex-1 btn-secondary !border-accent-red !text-accent-red hover:!bg-accent-red/5 flex items-center justify-center gap-2"
          >
            <Wrench class="w-4 h-4" />
            查看整改进度
          </button>
          
          <button
            v-if="currentTicket.status === 'completed' && currentTicket.rating && currentTicket.rating > 2"
            class="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <RotateCcw class="w-4 h-4" />
            申请复查
          </button>
          
          <button
            v-if="canCancel(currentTicket)"
            @click="handleCancelTicket"
            class="btn-secondary !border-neutral-300 !text-neutral-500 hover:!bg-neutral-50 flex items-center justify-center gap-2"
          >
            <X class="w-4 h-4" />
            撤销诉求
          </button>
        </div>
      </div>
    </el-dialog>

    <EvaluationDialog
      v-model:visible="showEvaluationDialog"
      :ticket-id="currentTicket?.id || ''"
      :source-name="currentTicket?.title"
      :source-no="currentTicket?.ticketNo"
      @success="handleEvaluationSuccess"
    />

    <RectificationTracker
      v-model:visible="showRectificationDialog"
      :ticket-id="currentTicket?.id || ''"
      @updated="handleRectificationUpdated"
    />
  </div>
</template>

<style scoped>
.complaint-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
