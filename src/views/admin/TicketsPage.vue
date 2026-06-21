<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Search,
  Clock,
  Loader,
  CheckCircle,
  AlertTriangle,
  Paperclip,
  Star,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Send,
  ArrowLeftRight,
  Clock as ClockIcon,
  Flag,
  XCircle,
  Settings,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Play,
  TestTube,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  AlertCircle,
  Wrench,
  X,
  Tag,
  FileText
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTicketList,
  getTicketStats,
  replyTicket,
  assignTicket,
  acceptTicket,
  extendTicketDeadline,
  setTicketPriority,
  setKeySupervision,
  getDispatchRules,
  createDispatchRule,
  updateDispatchRule,
  deleteDispatchRule,
  testDispatchRule
} from '@/api/tickets'
import { getDepartmentList } from '@/api/services'
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketType,
  Department,
  DispatchRule
} from '@/types'

const activeTab = ref<'tickets' | 'rules'>('tickets')

const ticketList = ref<Ticket[]>([])
const departments = ref<Department[]>([])
const drawerVisible = ref(false)
const currentTicket = ref<Ticket | null>(null)
const replyContent = ref('')
const submittingReply = ref(false)

const assignDepartment = ref('')
const assignPerson = ref('')

const showAssignDialog = ref(false)
const showExtendDialog = ref(false)
const showPriorityDialog = ref(false)

const extendHours = ref(24)
const extendReason = ref('')

const newPriority = ref<TicketPriority>('medium')

const ticketStats = reactive({
  pending: 0,
  processing: 0,
  completed: 0,
  overdue: 0,
  pendingEvaluation: 0,
  badReview: 0
})

const filters = reactive({
  keyword: '',
  departmentId: '',
  status: '',
  priority: '',
  isOverdue: false,
  dateRange: [] as any
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const quickReplyTemplates = [
  { id: 1, text: '您好，您反映的问题我们已受理，将尽快安排专人处理，请耐心等待。' },
  { id: 2, text: '感谢您的反馈，我们已将您的诉求转至相关部门处理，预计3个工作日内给予答复。' },
  { id: 3, text: '您好，经核实，您反映的问题属实，我们已责令相关单位限期整改。' },
  { id: 4, text: '您好，非常抱歉给您带来不便。我们已关注到该问题，正在积极协调解决。' },
  { id: 5, text: '感谢您对我们工作的监督和支持，我们将持续改进服务质量。' }
]

const handlers = ref([
  { id: 'h_001', name: '赵六', dept: '市人社局', deptId: 'd_001' },
  { id: 'h_002', name: '郑十', dept: '市医保局', deptId: 'd_002' },
  { id: 'h_003', name: '钱主任', dept: '市公积金中心', deptId: 'd_004' },
  { id: 'h_004', name: '孙队长', dept: '市城管局', deptId: 'd_012' },
  { id: 'h_005', name: '李警官', dept: '市公安局', deptId: 'd_010' },
  { id: 'h_006', name: '刘科长', dept: '市市监局', deptId: 'd_009' }
])

const filteredHandlers = computed(() => {
  if (!assignDepartment.value) return handlers.value
  return handlers.value.filter(h => h.deptId === assignDepartment.value)
})

const getTypeLabel = (type: TicketType) => {
  const map: Record<TicketType, string> = {
    complaint: '投诉', suggestion: '建议', consultation: '咨询', help: '求助', praise: '表扬'
  }
  return map[type] || type
}

const getTypeClass = (type: TicketType) => {
  const map: Record<TicketType, string> = {
    complaint: 'bg-red-500/20 text-red-400',
    suggestion: 'bg-blue-500/20 text-blue-400',
    consultation: 'bg-purple-500/20 text-purple-400',
    help: 'bg-pink-500/20 text-pink-400',
    praise: 'bg-green-500/20 text-green-400'
  }
  return map[type] || 'bg-neutral-500/20 text-neutral-400'
}

const getPriorityLabel = (p: TicketPriority) => {
  const map: Record<TicketPriority, string> = { urgent: '紧急', high: '高', medium: '中', low: '低' }
  return map[p] || '中'
}

const getPriorityClass = (p: TicketPriority) => {
  const map: Record<TicketPriority, string> = {
    urgent: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400'
  }
  return map[p] || map.medium
}

const getStatusLabel = (s: TicketStatus) => {
  const map: Record<TicketStatus, string> = {
    pending: '待分配',
    assigned: '已分配',
    accepted: '已受理',
    processing: '处理中',
    replied: '已回复',
    evaluating: '待评价',
    rectifying: '整改中',
    reviewing: '复查中',
    completed: '已完成',
    closed: '已关闭',
    archived: '已归档'
  }
  return map[s] || s
}

const getStatusClass = (s: TicketStatus) => {
  const map: Record<TicketStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    assigned: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-cyan-500/20 text-cyan-400',
    processing: 'bg-blue-500/20 text-blue-400',
    replied: 'bg-purple-500/20 text-purple-400',
    evaluating: 'bg-pink-500/20 text-pink-400',
    rectifying: 'bg-red-500/20 text-red-400',
    reviewing: 'bg-orange-500/20 text-orange-400',
    completed: 'bg-green-500/20 text-green-400',
    closed: 'bg-neutral-500/20 text-neutral-400',
    archived: 'bg-gray-500/20 text-gray-400'
  }
  return map[s] || map.pending
}

const formatRemaining = (hours?: number) => {
  if (hours === undefined || hours === null) return '-'
  if (hours >= 24) return `${Math.floor(hours / 24)}天${hours % 24}时`
  return `${hours}小时`
}

const getSlaClass = (ticket: Ticket) => {
  if (ticket.isOverdue) return 'text-red-400'
  if ((ticket.remainingHours || 0) <= 12) return 'text-yellow-400'
  return 'text-green-400'
}

const setStatusFilter = (status: string, key: keyof typeof ticketStats) => {
  filters.status = filters.status === status ? '' : (status as TicketStatus)
  filters.isOverdue = key === 'overdue' ? !filters.isOverdue : false
  if (key === 'overdue') {
    filters.status = ''
  }
  pagination.page = 1
  loadTickets()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.departmentId = ''
  filters.status = ''
  filters.priority = ''
  filters.isOverdue = false
  filters.dateRange = []
  pagination.page = 1
  loadTickets()
}

const loadTickets = async () => {
  try {
    const res = await getTicketList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      departmentId: filters.departmentId || undefined,
      status: (filters.status as TicketStatus) || undefined,
      priority: (filters.priority as TicketPriority) || undefined,
      isOverdue: filters.isOverdue || undefined,
      dateFrom: filters.dateRange?.[0] ? String(filters.dateRange[0]) : undefined,
      dateTo: filters.dateRange?.[1] ? String(filters.dateRange[1]) : undefined
    })
    ticketList.value = res.data.list
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  }
}

const loadStats = async () => {
  try {
    const res = await getTicketStats()
    ticketStats.pending = res.data.pending + res.data.assigned
    ticketStats.processing = res.data.processing
    ticketStats.completed = res.data.completed + res.data.closed
    ticketStats.overdue = res.data.overdue
    ticketStats.pendingEvaluation = res.data.pendingEvaluation
    ticketStats.badReview = res.data.badReview
  } catch (e) {
    console.error(e)
  }
}

const openDrawer = (ticket: Ticket) => {
  currentTicket.value = ticket
  replyContent.value = ''
  drawerVisible.value = true
}

const useQuickReply = (text: string) => {
  replyContent.value = text
}

const submitReply = async () => {
  if (!replyContent.value.trim() || !currentTicket.value) return
  
  submittingReply.value = true
  try {
    await replyTicket(currentTicket.value.id, {
      content: replyContent.value,
      operator: '管理员',
      operatorRole: '平台管理员'
    })
    ElMessage.success('回复提交成功')
    replyContent.value = ''
    await loadTickets()
    await loadStats()
    
    const updated = ticketList.value.find(t => t.id === currentTicket.value?.id)
    if (updated) {
      currentTicket.value = updated
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('回复失败')
  } finally {
    submittingReply.value = false
  }
}

const openAssignDialog = () => {
  showAssignDialog.value = true
  assignDepartment.value = currentTicket.value?.departmentId || ''
  assignPerson.value = ''
}

const handleAssign = async () => {
  if (!assignDepartment.value || !assignPerson.value || !currentTicket.value) {
    ElMessage.warning('请选择部门和处理人')
    return
  }
  
  const dept = departments.value.find(d => d.id === assignDepartment.value)
  const person = handlers.value.find(h => h.id === assignPerson.value)
  
  try {
    await assignTicket(currentTicket.value.id, {
      departmentId: assignDepartment.value,
      departmentName: dept?.name || '',
      assignee: person?.name || '',
      assigneeRole: person?.dept || ''
    })
    
    if (currentTicket.value.status === 'pending') {
      await acceptTicket(currentTicket.value.id, {
        assignee: person?.name || '',
        assigneeRole: person?.dept || ''
      })
    }
    
    ElMessage.success('转派成功')
    showAssignDialog.value = false
    await loadTickets()
    await loadStats()
    
    const updated = ticketList.value.find(t => t.id === currentTicket.value?.id)
    if (updated) {
      currentTicket.value = updated
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('转派失败')
  }
}

const openExtendDialog = () => {
  showExtendDialog.value = true
  extendHours.value = 24
  extendReason.value = ''
}

const handleExtend = async () => {
  if (!extendReason.value.trim() || !currentTicket.value) {
    ElMessage.warning('请填写延期原因')
    return
  }
  
  try {
    await extendTicketDeadline(currentTicket.value.id, extendHours.value, extendReason.value)
    ElMessage.success(`已延长${extendHours.value}小时`)
    showExtendDialog.value = false
    await loadTickets()
    
    const updated = ticketList.value.find(t => t.id === currentTicket.value?.id)
    if (updated) {
      currentTicket.value = updated
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

const openPriorityDialog = () => {
  showPriorityDialog.value = true
  newPriority.value = currentTicket.value?.priority || 'medium'
}

const handleSetPriority = async () => {
  if (!currentTicket.value) return
  
  try {
    await setTicketPriority(currentTicket.value.id, newPriority.value)
    ElMessage.success('优先级已调整')
    showPriorityDialog.value = false
    await loadTickets()
    
    const updated = ticketList.value.find(t => t.id === currentTicket.value?.id)
    if (updated) {
      currentTicket.value = updated
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

const toggleKeySupervision = async () => {
  if (!currentTicket.value) return
  
  const isKey = !currentTicket.value.isKeySupervision
  try {
    await setKeySupervision(currentTicket.value.id, isKey)
    ElMessage.success(isKey ? '已标记为重点督办' : '已取消重点督办')
    await loadTickets()
    
    const updated = ticketList.value.find(t => t.id === currentTicket.value?.id)
    if (updated) {
      currentTicket.value = updated
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

const handleCloseTicket = async () => {
  if (!currentTicket.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要关闭该工单吗？关闭后将无法继续处理。',
      '关闭工单',
      {
        confirmButtonText: '确认关闭',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('工单已关闭')
    drawerVisible.value = false
    await loadTickets()
    await loadStats()
  } catch (e) {
    // 用户取消
  }
}

const dispatchRules = ref<DispatchRule[]>([])
const showRuleDialog = ref(false)
const editingRule = ref<DispatchRule | null>(null)
const ruleForm = reactive({
  name: '',
  keywords: '',
  departmentId: '',
  category: '',
  priority: 1,
  enabled: true
})

const testText = ref('')
const testResult = ref<{ matched: boolean; rule: DispatchRule | null } | null>(null)
const showTestPanel = ref(false)

const loadRules = async () => {
  try {
    const res = await getDispatchRules()
    dispatchRules.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const openCreateRule = () => {
  editingRule.value = null
  ruleForm.name = ''
  ruleForm.keywords = ''
  ruleForm.departmentId = ''
  ruleForm.category = ''
  ruleForm.priority = 1
  ruleForm.enabled = true
  showRuleDialog.value = true
}

const openEditRule = (rule: DispatchRule) => {
  editingRule.value = rule
  ruleForm.name = rule.name
  ruleForm.keywords = rule.keywords.join('、')
  ruleForm.departmentId = rule.departmentId
  ruleForm.category = rule.category || ''
  ruleForm.priority = rule.priority
  ruleForm.enabled = rule.enabled
  showRuleDialog.value = true
}

const saveRule = async () => {
  if (!ruleForm.name.trim() || !ruleForm.keywords.trim() || !ruleForm.departmentId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const dept = departments.value.find(d => d.id === ruleForm.departmentId)
  const keywords = ruleForm.keywords.split(/[、,，\s]+/).filter(k => k.trim())
  
  try {
    if (editingRule.value) {
      await updateDispatchRule(editingRule.value.id, {
        name: ruleForm.name,
        keywords,
        departmentId: ruleForm.departmentId,
        departmentName: dept?.name || '',
        category: ruleForm.category || undefined,
        priority: ruleForm.priority,
        enabled: ruleForm.enabled
      })
      ElMessage.success('规则已更新')
    } else {
      await createDispatchRule({
        name: ruleForm.name,
        keywords,
        departmentId: ruleForm.departmentId,
        departmentName: dept?.name || '',
        category: ruleForm.category || undefined,
        priority: ruleForm.priority,
        enabled: ruleForm.enabled
      })
      ElMessage.success('规则已创建')
    }
    showRuleDialog.value = false
    loadRules()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败')
  }
}

const deleteRule = async (rule: DispatchRule) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则「${rule.name}」吗？`,
      '删除规则',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteDispatchRule(rule.id)
    ElMessage.success('已删除')
    loadRules()
  } catch (e) {
    // 用户取消
  }
}

const runTest = async () => {
  if (!testText.value.trim()) {
    ElMessage.warning('请输入测试内容')
    return
  }
  
  try {
    const res = await testDispatchRule(testText.value)
    testResult.value = res.data
  } catch (e) {
    console.error(e)
  }
}

watch(activeTab, (val) => {
  if (val === 'rules') {
    loadRules()
  }
})

onMounted(async () => {
  await loadTickets()
  await loadStats()
  const deptRes = await getDepartmentList()
  departments.value = deptRes.data
})
</script>

<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-1">工单管理</h1>
      <p class="text-neutral-400 text-sm">处理群众诉求工单，跟踪SLA执行情况</p>
    </div>

    <div class="flex gap-2 mb-6">
      <button
        @click="activeTab = 'tickets'"
        :class="[
          'px-5 py-2 rounded-lg font-medium text-sm transition-all',
          activeTab === 'tickets'
            ? 'bg-gov-blue text-white'
            : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
        ]"
      >
        <FileText class="w-4 h-4 inline mr-2" />
        工单列表
      </button>
      <button
        @click="activeTab = 'rules'"
        :class="[
          'px-5 py-2 rounded-lg font-medium text-sm transition-all',
          activeTab === 'rules'
            ? 'bg-gov-blue text-white'
            : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
        ]"
      >
        <Settings class="w-4 h-4 inline mr-2" />
        分拨规则
      </button>
    </div>

    <div v-show="activeTab === 'tickets'">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div 
          class="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all"
          :class="{ 'ring-2 ring-yellow-500/50': filters.status === 'pending' }"
          @click="setStatusFilter('pending', 'pending')"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">待分配</span>
            <Clock class="w-5 h-5 text-yellow-400" />
          </div>
          <div class="text-2xl font-bold text-yellow-400">{{ ticketStats.pending }}</div>
        </div>
        <div 
          class="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all"
          :class="{ 'ring-2 ring-blue-500/50': filters.status === 'processing' }"
          @click="setStatusFilter('processing', 'processing')"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">处理中</span>
            <Loader class="w-5 h-5 text-blue-400" />
          </div>
          <div class="text-2xl font-bold text-blue-400">{{ ticketStats.processing }}</div>
        </div>
        <div 
          class="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all"
          :class="{ 'ring-2 ring-green-500/50': filters.status === 'completed' }"
          @click="setStatusFilter('completed', 'completed')"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">已完成</span>
            <CheckCircle class="w-5 h-5 text-green-400" />
          </div>
          <div class="text-2xl font-bold text-green-400">{{ ticketStats.completed }}</div>
        </div>
        <div 
          class="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-4 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all"
          :class="{ 'ring-2 ring-red-500/50': filters.isOverdue }"
          @click="setStatusFilter('', 'overdue')"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">已超时</span>
            <AlertTriangle class="w-5 h-5 text-red-400" />
          </div>
          <div class="text-2xl font-bold text-red-400">{{ ticketStats.overdue }}</div>
        </div>
        <div 
          class="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all"
          :class="{ 'ring-2 ring-purple-500/50': filters.status === 'replied' }"
          @click="setStatusFilter('replied', 'pendingEvaluation')"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">待评价</span>
            <Star class="w-5 h-5 text-purple-400" />
          </div>
          <div class="text-2xl font-bold text-purple-400">{{ ticketStats.pendingEvaluation }}</div>
        </div>
        <div 
          class="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-4 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-all"
          @click="setStatusFilter('rectifying', 'badReview')"
          :class="{ 'ring-2 ring-orange-500/50': filters.status === 'rectifying' }"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-neutral-400 text-sm">差评待整改</span>
            <Wrench class="w-5 h-5 text-orange-400" />
          </div>
          <div class="text-2xl font-bold text-orange-400">{{ ticketStats.badReview }}</div>
        </div>
      </div>

      <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 mb-5">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="text-sm text-neutral-400 block mb-1.5">搜索工单</label>
            <el-input v-model="filters.keyword" placeholder="输入工单编号、标题搜索..." clearable>
              <template #prefix><Search class="w-4 h-4 text-neutral-500" /></template>
            </el-input>
          </div>
          <div class="w-44">
            <label class="text-sm text-neutral-400 block mb-1.5">责任部门</label>
            <el-select v-model="filters.departmentId" placeholder="全部部门" clearable class="!w-full">
              <el-option v-for="d in departments" :key="d.id" :label="d.shortName" :value="d.id" />
            </el-select>
          </div>
          <div class="w-32">
            <label class="text-sm text-neutral-400 block mb-1.5">优先级</label>
            <el-select v-model="filters.priority" placeholder="全部" clearable class="!w-full">
              <el-option label="紧急" value="urgent" />
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </div>
          <div class="w-52">
            <label class="text-sm text-neutral-400 block mb-1.5">提交时间</label>
            <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期" class="!w-full" />
          </div>
          <div class="flex gap-2">
            <button @click="loadTickets" class="btn-primary !px-5">查询</button>
            <button @click="resetFilters" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">重置</button>
          </div>
        </div>
      </div>

      <div class="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden">
        <el-table :data="ticketList" class="!bg-transparent" row-key="id"
          :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
          :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
          <el-table-column prop="ticketNo" label="工单编号" width="160" />
          <el-table-column prop="title" label="标题" min-width="220">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <span class="text-xs px-1.5 py-0.5 rounded"
                  :class="getTypeClass(row.type)">
                  {{ getTypeLabel(row.type) }}
                </span>
                <span class="text-white truncate">{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="诉求人" width="100">
            <template #default="{ row }">
              <span>{{ row.anonymous ? '匿名用户' : row.userName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="联系电话" width="120">
            <template #default="{ row }">
              <span class="text-sm text-neutral-400">
                {{ row.anonymous ? '***' : row.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="责任部门" width="140">
            <template #default="{ row }">
              <span class="text-sm text-neutral-400">{{ row.departmentName ? row.departmentName.replace('抚州市', '').replace('国家税务总局', '') : '待分配' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理人" width="90">
            <template #default="{ row }">
              <span class="text-sm text-neutral-400">{{ row.assignee || '待分配' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="70" align="center">
            <template #default="{ row }">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="getPriorityClass(row.priority)">
                {{ getPriorityLabel(row.priority) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="getStatusClass(row.status)">
                {{ getStatusLabel(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="SLA倒计时" width="110" align="center">
            <template #default="{ row }">
              <div v-if="row.status === 'completed' || row.status === 'closed' || row.status === 'archived'" class="text-xs text-neutral-500">
                已关闭
              </div>
              <div :class="getSlaClass(row)">
                <div class="text-sm font-medium">
                  {{ row.isOverdue ? '已超时' : formatRemaining(row.remainingHours) }}
                </div>
                <div class="text-xs opacity-70">{{ row.slaHours }}小时SLA</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="submitTime" label="提交时间" width="150" />
          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <div class="flex items-center justify-center gap-2">
                <button @click="openDrawer(row)" class="text-blue-400 hover:text-blue-300 text-sm">
                  详情
                </button>
                <button @click="openDrawer(row)" class="text-green-400 hover:text-green-300 text-sm">
                  回复
                </button>
                <button @click="openDrawer(row)" class="text-yellow-400 hover:text-yellow-300 text-sm">
                  转派
                </button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="p-4 flex items-center justify-between border-t border-neutral-800">
          <span class="text-sm text-neutral-500">共 {{ pagination.total }} 条记录</span>
          <el-pagination 
            v-model:current-page="pagination.page" 
            v-model:page-size="pagination.pageSize"
            :total="pagination.total" 
            layout="prev, pager, next" 
            background
            @current-change="loadTickets"
          />
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'rules'">
      <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 mb-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">智能分拨规则</h3>
          <div class="flex gap-2">
            <button 
              @click="showTestPanel = !showTestPanel"
              class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-4 text-sm"
            >
              <TestTube class="w-4 h-4 inline mr-1" />
              测试规则
            </button>
            <button @click="openCreateRule" class="btn-primary !px-4 text-sm">
              <Plus class="w-4 h-4 inline mr-1" />
              新增规则
            </button>
          </div>
        </div>

        <div v-if="showTestPanel" class="mb-5 p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
          <div class="flex gap-3 mb-3">
            <el-input 
              v-model="testText" 
              placeholder="输入测试内容，检测会分配到哪个部门..."
              class="flex-1"
            >
              <template #prefix><Search class="w-4 h-4 text-neutral-500" /></template>
            </el-input>
            <button @click="runTest" class="btn-primary !px-6">
              测试
            </button>
          </div>
          <div v-if="testResult" class="p-3 rounded-lg" :class="testResult.matched ? 'bg-green-500/10 border border-green-500/30' : 'bg-neutral-700/50 border border-neutral-600'">
            <p v-if="testResult.matched" class="text-sm">
              <span class="text-green-400 font-medium">匹配成功</span>
              <span class="text-neutral-400 ml-2">→</span>
              <span class="text-white ml-2">{{ testResult.rule?.departmentName }}</span>
              <span class="text-neutral-500 text-xs ml-2">（规则：{{ testResult.rule?.name }}）</span>
            </p>
            <p v-else class="text-sm text-neutral-400">
              未匹配到任何规则，将进入人工分拨
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="rule in dispatchRules"
            :key="rule.id"
            class="p-4 bg-neutral-900/50 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <GripVertical class="w-4 h-4 text-neutral-600 cursor-move" />
                  <span class="font-medium text-white">{{ rule.name }}</span>
                  <span 
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-neutral-600/50 text-neutral-400'"
                  >
                    {{ rule.enabled ? '启用' : '停用' }}
                  </span>
                  <span class="text-xs text-neutral-500">优先级: {{ rule.priority }}</span>
                </div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-neutral-500">关键词：</span>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="kw in rule.keywords.slice(0, 8)" 
                      :key="kw"
                      class="text-xs px-2 py-0.5 bg-neutral-700/50 text-neutral-300 rounded"
                    >
                      {{ kw }}
                    </span>
                    <span v-if="rule.keywords.length > 8" class="text-xs text-neutral-500">
                      +{{ rule.keywords.length - 8 }}个
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-xs text-neutral-500">
                  <span class="flex items-center gap-1">
                    <Building2 class="w-3.5 h-3.5" />
                    {{ rule.departmentName }}
                  </span>
                  <span v-if="rule.category" class="flex items-center gap-1">
                    <Tag class="w-3.5 h-3.5" />
                    {{ rule.category }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="openEditRule(rule)"
                  class="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-700/50 rounded transition-colors"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button 
                  @click="deleteRule(rule)"
                  class="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 rounded transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer v-model="drawerVisible" title="工单详情" size="640px" direction="rtl" class="!bg-neutral-900">
      <template v-if="currentTicket">
        <div class="space-y-5 pb-6">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="text-xs px-2 py-0.5 rounded" :class="getTypeClass(currentTicket.type)">
                  {{ getTypeLabel(currentTicket.type) }}
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full" :class="getPriorityClass(currentTicket.priority)">
                  {{ getPriorityLabel(currentTicket.priority) }}
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full" :class="getStatusClass(currentTicket.status)">
                  {{ getStatusLabel(currentTicket.status) }}
                </span>
                <span v-if="currentTicket.isKeySupervision" class="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  重点督办
                </span>
              </div>
              <h3 class="text-lg font-semibold text-white">{{ currentTicket.title }}</h3>
              <p class="text-sm text-neutral-500 mt-1">{{ currentTicket.ticketNo }} · 提交于 {{ currentTicket.submitTime }}</p>
            </div>
            <div class="text-right">
              <div :class="getSlaClass(currentTicket)" class="text-sm font-medium">
                SLA: {{ currentTicket.isOverdue ? '已超时' : formatRemaining(currentTicket.remainingHours) }}
              </div>
              <p class="text-xs text-neutral-500 mt-1">{{ currentTicket.slaHours }}小时承诺</p>
              <p v-if="currentTicket.extendCount" class="text-xs text-yellow-500 mt-1">
                已延期{{ currentTicket.extendCount }}次
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
            <div>
              <span class="text-xs text-neutral-500 block mb-1">诉求人</span>
              <span class="text-white text-sm">{{ currentTicket.anonymous ? '匿名用户' : currentTicket.userName }}</span>
            </div>
            <div>
              <span class="text-xs text-neutral-500 block mb-1">联系电话</span>
              <span class="text-white text-sm">{{ currentTicket.anonymous ? '***' : currentTicket.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}</span>
            </div>
            <div v-if="currentTicket.email">
              <span class="text-xs text-neutral-500 block mb-1">邮箱</span>
              <span class="text-white text-sm">{{ currentTicket.anonymous ? '***' : currentTicket.email }}</span>
            </div>
            <div>
              <span class="text-xs text-neutral-500 block mb-1">责任部门</span>
              <span class="text-white text-sm">{{ currentTicket.departmentName || '待分配' }}</span>
            </div>
            <div>
              <span class="text-xs text-neutral-500 block mb-1">处理人</span>
              <span class="text-white text-sm">{{ currentTicket.assignee || '待分配' }}</span>
            </div>
            <div>
              <span class="text-xs text-neutral-500 block mb-1">分类</span>
              <span class="text-white text-sm">{{ currentTicket.category }} / {{ currentTicket.subCategory }}</span>
            </div>
            <div v-if="currentTicket.location" class="col-span-2">
              <span class="text-xs text-neutral-500 block mb-1">地点</span>
              <span class="text-white text-sm">{{ currentTicket.location }}</span>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-white mb-2">诉求内容</h4>
            <div class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
              {{ currentTicket.content }}
            </div>
            <div v-if="currentTicket.attachments && currentTicket.attachments.length > 0" class="mt-3">
              <p class="text-xs text-neutral-500 mb-2">附件（{{ currentTicket.attachments.length }}个）</p>
              <div class="flex gap-2 flex-wrap">
                <div 
                  v-for="(att, idx) in currentTicket.attachments" 
                  :key="idx"
                  class="w-16 h-16 rounded-lg bg-neutral-700/50 flex items-center justify-center border border-neutral-600 cursor-pointer hover:border-neutral-500 transition-colors"
                >
                  <ImageIcon class="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock class="w-4 h-4 text-blue-400" />
              处理时间轴
            </h4>
            <el-timeline>
              <el-timeline-item 
                v-for="(event, idx) in currentTicket.timeline.slice().reverse()" 
                :key="event.id"
                :timestamp="event.time"
                type="primary"
                :hollow="false"
              >
                <div class="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                  <div class="text-white font-medium text-sm mb-1">{{ event.title }}</div>
                  <div class="text-neutral-400 text-sm">{{ event.description }}</div>
                  <div v-if="event.operator" class="text-xs text-neutral-500 mt-1">
                    {{ event.operator }} · {{ event.operatorRole }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <div v-if="currentTicket.replies && currentTicket.replies.length > 0">
            <h4 class="text-sm font-semibold text-white mb-3">官方回复记录</h4>
            <div class="space-y-3">
              <div 
                v-for="reply in currentTicket.replies" 
                :key="reply.id"
                class="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-green-400">{{ reply.operator }}</span>
                  <span class="text-xs text-neutral-500">{{ reply.time }}</span>
                </div>
                <p class="text-sm text-neutral-300 leading-relaxed">{{ reply.content }}</p>
              </div>
            </div>
          </div>

          <div v-if="currentTicket.status !== 'completed' && currentTicket.status !== 'closed' && currentTicket.status !== 'archived'">
            <h4 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Send class="w-4 h-4 text-gov-blue" />
              回复工单
            </h4>
            <div class="mb-3">
              <label class="text-xs text-neutral-500 block mb-2">快捷回复</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tpl in quickReplyTemplates"
                  :key="tpl.id"
                  @click="useQuickReply(tpl.text)"
                  class="text-xs px-3 py-1.5 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50 transition-colors"
                >
                  {{ tpl.text.substring(0, 15) }}...
                </button>
              </div>
            </div>
            <el-input 
              v-model="replyContent" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入回复内容..."
              maxlength="2000"
              show-word-limit
            />
            <div class="flex items-center justify-between mt-3">
              <div class="text-xs text-neutral-500">
                回复后将通过站内信通知诉求人
              </div>
              <button 
                @click="submitReply" 
                :disabled="!replyContent.trim() || submittingReply"
                class="btn-primary !px-6 !py-2 text-sm disabled:opacity-50"
              >
                <span v-if="submittingReply" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline mr-2"></span>
                {{ submittingReply ? '发送中...' : '发送回复' }}
              </button>
            </div>
          </div>

          <div class="pt-4 border-t border-neutral-700">
            <h4 class="text-sm font-semibold text-white mb-3">工单操作</h4>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="openAssignDialog"
                class="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-left"
              >
                <ArrowLeftRight class="w-5 h-5 text-blue-400 mb-1" />
                <p class="text-sm text-white">转派工单</p>
                <p class="text-xs text-neutral-500">调整责任部门和处理人</p>
              </button>
              <button 
                @click="openPriorityDialog"
                class="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors text-left"
              >
                <Flag class="w-5 h-5 text-yellow-400 mb-1" />
                <p class="text-sm text-white">调整优先级</p>
                <p class="text-xs text-neutral-500">紧急/高/中/低</p>
              </button>
              <button 
                @click="openExtendDialog"
                class="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors text-left"
              >
                <ClockIcon class="w-5 h-5 text-purple-400 mb-1" />
                <p class="text-sm text-white">延长时限</p>
                <p class="text-xs text-neutral-500">延长SLA处理时间</p>
              </button>
              <button 
                @click="toggleKeySupervision"
                class="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:border-red-500/50 hover:bg-red-500/5 transition-colors text-left"
              >
                <AlertCircle class="w-5 h-5 text-red-400 mb-1" />
                <p class="text-sm text-white">{{ currentTicket.isKeySupervision ? '取消重点督办' : '标记重点督办' }}</p>
                <p class="text-xs text-neutral-500">{{ currentTicket.isKeySupervision ? '取消重点关注' : '列为重点关注工单' }}</p>
              </button>
            </div>
            <button 
              v-if="currentTicket.status !== 'closed'"
              @click="handleCloseTicket"
              class="w-full mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-sm"
            >
              <XCircle class="w-4 h-4 inline mr-2" />
              关闭工单
            </button>
          </div>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="showAssignDialog" title="转派工单" width="480px" :close-on-click-modal="false">
      <div class="space-y-4 py-2">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">责任部门 <span class="text-red-500">*</span></label>
          <el-select v-model="assignDepartment" placeholder="请选择部门" class="!w-full" @change="assignPerson = ''">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">处理人 <span class="text-red-500">*</span></label>
          <el-select v-model="assignPerson" placeholder="请选择处理人" class="!w-full">
            <el-option v-for="h in filteredHandlers" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showAssignDialog = false" class="px-5 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50">取消</button>
          <button @click="handleAssign" class="px-5 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90">确认转派</button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showExtendDialog" title="延长时限" width="480px" :close-on-click-modal="false">
      <div class="space-y-4 py-2">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">延时时长 <span class="text-red-500">*</span></label>
          <el-select v-model="extendHours" class="!w-full">
            <el-option :value="12" label="12小时" />
            <el-option :value="24" label="24小时" />
            <el-option :value="48" label="48小时" />
            <el-option :value="72" label="72小时" />
          </el-select>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">延期原因 <span class="text-red-500">*</span></label>
          <el-input
            v-model="extendReason"
            type="textarea"
            :rows="3"
            placeholder="请说明延期原因..."
            maxlength="200"
            show-word-limit
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showExtendDialog = false" class="px-5 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50">取消</button>
          <button @click="handleExtend" :disabled="!extendReason.trim()" class="px-5 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90 disabled:opacity-50">确认延期</button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showPriorityDialog" title="调整优先级" width="400px" :close-on-click-modal="false">
      <div class="py-4">
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="p in (['urgent', 'high', 'medium', 'low'] as TicketPriority[])"
            :key="p"
            @click="newPriority = p"
            :class="[
              'p-4 rounded-lg border-2 transition-all text-center',
              newPriority === p 
                ? 'border-gov-blue bg-gov-blue/10' 
                : 'border-neutral-200 hover:border-neutral-300'
            ]"
          >
            <span class="text-sm font-medium" :class="newPriority === p ? 'text-gov-blue' : 'text-neutral-700'">
              {{ getPriorityLabel(p) }}
            </span>
          </button>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showPriorityDialog = false" class="px-5 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50">取消</button>
          <button @click="handleSetPriority" class="px-5 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90">确认调整</button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showRuleDialog" :title="editingRule ? '编辑规则' : '新增规则'" width="560px" :close-on-click-modal="false">
      <div class="space-y-4 py-2">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">规则名称 <span class="text-red-500">*</span></label>
          <el-input v-model="ruleForm.name" placeholder="如：社保类问题" />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">关键词 <span class="text-red-500">*</span></label>
          <el-input
            v-model="ruleForm.keywords"
            type="textarea"
            :rows="2"
            placeholder="多个关键词用、或逗号分隔，如：社保、养老、就业"
          />
          <p class="text-xs text-neutral-500 mt-1">输入关键词，命中后将自动分拨到对应部门</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">责任部门 <span class="text-red-500">*</span></label>
          <el-select v-model="ruleForm.departmentId" placeholder="请选择部门" class="!w-full">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">分类</label>
            <el-input v-model="ruleForm.category" placeholder="如：社会保障" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">优先级</label>
            <el-input-number v-model="ruleForm.priority" :min="1" :max="100" class="!w-full" />
          </div>
        </div>
        <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
          <span class="text-sm text-neutral-700">启用规则</span>
          <el-switch v-model="ruleForm.enabled" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showRuleDialog = false" class="px-5 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50">取消</button>
          <button @click="saveRule" class="px-5 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90">保存</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
