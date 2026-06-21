<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  HelpCircle,
  HandHeart,
  Building2,
  MapPin,
  Upload,
  X,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Send,
  Sparkles,
  FileText,
  Clock,
  List,
  RefreshCw,
  PhoneCall,
  MessageCircle
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import type { TicketType, ReplyMethod } from '@/types'
import { ElMessage, ElUpload } from 'element-plus'
import { createTicket, testDispatchRule } from '@/api/tickets'
import { mockUserProfile } from '@/mock/data/profile'
import { mockDepartments } from '@/mock/data/services'

const router = useRouter()
const submitting = ref(false)
const submitted = ref(false)
const createdTicket = ref<any>(null)

const typeList: { key: TicketType; label: string; icon: any; color: string }[] = [
  { key: 'complaint', label: '投诉', icon: AlertCircle, color: 'from-rose-500 to-red-600' },
  { key: 'suggestion', label: '建议', icon: ThumbsUp, color: 'from-blue-500 to-indigo-600' },
  { key: 'consultation', label: '咨询', icon: HelpCircle, color: 'from-amber-500 to-orange-600' },
  { key: 'help', label: '求助', icon: HandHeart, color: 'from-emerald-500 to-teal-600' },
  { key: 'praise', label: '表扬', icon: ThumbsUp, color: 'from-pink-500 to-rose-600' },
]

const replyMethods: { key: ReplyMethod; label: string; icon: any }[] = [
  { key: 'phone', label: '电话', icon: PhoneCall },
  { key: 'sms', label: '短信', icon: MessageSquare },
  { key: 'message', label: '站内信', icon: MessageCircle },
]

const districtOptions = [
  { value: 'linchuan', label: '临川区' },
  { value: 'dongxiang', label: '东乡区' },
  { value: 'nancheng', label: '南城县' },
  { value: 'nanfeng', label: '南丰县' },
  { value: 'lichuan', label: '黎川县' },
  { value: 'chongren', label: '崇仁县' },
  { value: 'lean', label: '乐安县' },
  { value: 'yihuang', label: '宜黄县' },
  { value: 'jinxi', label: '金溪县' },
  { value: 'guixi', label: '贵溪市' },
  { value: 'yushan', label: '玉山县' },
]

const form = reactive({
  type: 'complaint' as TicketType,
  category: '',
  departmentId: '',
  departmentName: '',
  title: '',
  content: '',
  location: '',
  district: '',
  anonymous: false,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  replyMethod: 'message' as ReplyMethod,
})

const uploadedImages = ref<string[]>([])
const locating = ref(false)
const autoDispatchResult = ref<{ matched: boolean; deptName: string; deptId: string } | null>(null)
const dispatching = ref(false)

const recommendedDept = computed(() => {
  if (!form.title && !form.content) return null
  const text = (form.title + ' ' + form.content).toLowerCase()
  
  for (const dept of mockDepartments) {
    const keywords = getDeptKeywords(dept.id)
    if (keywords.some((k) => text.includes(k))) {
      return { value: dept.id, label: dept.name }
    }
  }
  return null
})

const titleCharCount = computed(() => form.title.length)
const contentCharCount = computed(() => form.content.length)

const canSubmit = computed(() => {
  if (!form.title.trim() || form.title.length < 5) return false
  if (!form.content.trim() || form.content.length < 20) return false
  if (!form.anonymous) {
    if (!form.contactName.trim()) return false
    if (!form.contactPhone.trim()) return false
  }
  return true
})

function getDeptKeywords(deptId: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'd_001': ['社保', '养老', '就业', '工伤', '失业', '人社', '五险', '养老保险', '失业保险'],
    'd_002': ['医保', '报销', '医疗', '看病', '住院', '医保卡', '医疗保险', '新农合'],
    'd_003': ['教育', '学校', '入学', '体育', '老师', '学生', '学区', '报名', '幼儿园'],
    'd_004': ['公积金', '住房', '贷款', '提取', '房贷', '公积金贷款'],
    'd_005': ['交通', '驾驶证', '车辆', '运输', '车管所', '违章', '驾照', '行驶证'],
    'd_006': ['文化', '旅游', '广电', '文物', '景区', '图书馆', '博物馆'],
    'd_007': ['民政', '低保', '救助', '婚姻', '结婚', '离婚', '殡葬', '养老', '福利院'],
    'd_008': ['税务', '税收', '发票', '纳税', '个税', '增值税', '税务局'],
    'd_009': ['市场', '营业执照', '消费', '食品', '投诉', '价格', '物业', '乱收费'],
    'd_010': ['公安', '户籍', '身份证', '违章', '治安', '报警', '派出所', '走失', '盗窃'],
    'd_011': ['不动产', '房产', '土地', '规划', '过户', '房产证', '不动产登记'],
    'd_012': ['城管', '市容', '噪音', '卫生', '道路', '施工', '违建', '广场舞', '摆摊', '城市管理'],
  }
  return keywordMap[deptId] || []
}

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    if (uploadedImages.value.length >= 9) {
      ElMessage.warning('最多上传9张图片')
      return
    }
    uploadedImages.value.push(e.target?.result as string)
  }
  reader.readAsDataURL(file)
  return false
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1)
}

function getLocation() {
  locating.value = true
  setTimeout(() => {
    form.location = '抚州市临川区赣东大道与临川大道交叉口附近'
    form.district = 'linchuan'
    locating.value = false
    ElMessage.success('定位成功')
  }, 800)
}

async function handleAutoDispatch() {
  if (!form.title && !form.content) return
  
  dispatching.value = true
  try {
    const text = form.title + ' ' + form.content
    const res = await testDispatchRule(text)
    if (res.data.matched && res.data.rule) {
      autoDispatchResult.value = {
        matched: true,
        deptName: res.data.rule.departmentName,
        deptId: res.data.rule.departmentId
      }
      form.departmentId = res.data.rule.departmentId
      form.departmentName = res.data.rule.departmentName
      form.category = res.data.rule.category || ''
    } else {
      autoDispatchResult.value = {
        matched: false,
        deptName: '',
        deptId: ''
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    dispatching.value = false
  }
}

function useRecommendedDept() {
  if (recommendedDept.value) {
    form.departmentId = recommendedDept.value.value
    form.departmentName = recommendedDept.value.label
  }
}

function insertFormat(format: string) {
  const textarea = document.querySelector('.content-textarea') as HTMLTextAreaElement
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = form.content
  
  let insertText = ''
  switch (format) {
    case 'bold':
      insertText = '**加粗文字**'
      break
    case 'list':
      insertText = '\n• 列表项1\n• 列表项2\n• 列表项3'
      break
    case 'newline':
      insertText = '\n\n'
      break
    case 'number':
      insertText = '\n1. 第一项\n2. 第二项\n3. 第三项'
      break
  }
  
  form.content = value.substring(0, start) + insertText + value.substring(end)
}

async function handleSubmit() {
  if (!canSubmit.value) {
    if (!form.title.trim()) {
      ElMessage.warning('请输入诉求标题')
      return
    }
    if (form.title.length < 5) {
      ElMessage.warning('标题至少5个字符')
      return
    }
    if (!form.content.trim()) {
      ElMessage.warning('请输入诉求内容')
      return
    }
    if (form.content.length < 20) {
      ElMessage.warning('内容至少20个字符')
      return
    }
    if (!form.anonymous && !form.contactName.trim()) {
      ElMessage.warning('请输入联系人姓名或开启匿名')
      return
    }
    if (!form.anonymous && !form.contactPhone.trim()) {
      ElMessage.warning('请输入联系电话或开启匿名')
      return
    }
    return
  }

  submitting.value = true
  try {
    const dept = recommendedDept.value || (form.departmentId ? { value: form.departmentId, label: form.departmentName } : null)
    
    const res = await createTicket({
      type: form.type,
      title: form.title,
      content: form.content,
      category: form.category || getTypeCategory(form.type),
      subCategory: '',
      userId: mockUserProfile.userId,
      userName: form.contactName,
      phone: form.contactPhone,
      email: form.contactEmail,
      location: form.location || undefined,
      anonymous: form.anonymous,
      priority: form.type === 'help' ? 'urgent' : 'medium',
      attachments: uploadedImages.value,
      replyMethod: form.replyMethod,
      departmentId: dept?.value,
      departmentName: dept?.label
    })
    
    createdTicket.value = res.data
    submitted.value = true
    ElMessage.success('诉求提交成功！')
  } catch (e) {
    console.error(e)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function getTypeCategory(type: TicketType): string {
  const map: Record<TicketType, string> = {
    complaint: '投诉举报',
    suggestion: '意见建议',
    consultation: '政策咨询',
    help: '求助服务',
    praise: '表扬感谢'
  }
  return map[type]
}

function goBack() {
  router.push('/complaints')
}

function viewMyComplaints() {
  router.push('/complaints')
}

function continueSubmit() {
  submitted.value = false
  createdTicket.value = null
  form.title = ''
  form.content = ''
  form.location = ''
  uploadedImages.value = []
}

function getEstimatedDays(type: TicketType): number {
  if (type === 'help') return 1
  return 3
}

onMounted(() => {
  form.contactName = mockUserProfile.userName
  form.contactPhone = mockUserProfile.phone
})
</script>

<template>
  <div class="container py-8">
    <button @click="goBack" class="flex items-center gap-2 text-neutral-500 hover:text-gov-blue mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4" />
      <span>返回诉求中心</span>
    </button>

    <div v-if="!submitted">
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gov-gradient flex items-center justify-center">
            <MessageSquare class="w-5 h-5 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-800">提交诉求</h1>
        </div>
        <p class="text-neutral-500 ml-13">请详细描述您的诉求，我们将尽快转办相关部门处理</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <h3 class="section-title">诉求类型</h3>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <button
                v-for="t in typeList"
                :key="t.key"
                @click="form.type = t.key"
                :class="[
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                  form.type === t.key
                    ? 'border-gov-blue bg-gov-blue-50'
                    : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50',
                ]"
              >
                <div
                  :class="[
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center',
                    t.color,
                  ]"
                >
                  <component :is="t.icon" class="w-5 h-5 text-white" />
                </div>
                <span
                  :class="[
                    'text-sm font-medium',
                    form.type === t.key ? 'text-gov-blue' : 'text-neutral-600',
                  ]"
                >
                  {{ t.label }}
                </span>
              </button>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="section-title mb-0">智能分类与分拨</h3>
              <button
                @click="handleAutoDispatch"
                :disabled="dispatching || (!form.title && !form.content)"
                class="text-sm text-gov-blue hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
              >
                <RefreshCw :class="['w-3.5 h-3.5', dispatching && 'animate-spin']" />
                {{ dispatching ? '识别中...' : '智能识别' }}
              </button>
            </div>
            
            <div v-if="autoDispatchResult?.matched" class="p-4 bg-gov-blue-50 rounded-xl mb-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-gov-gradient flex items-center justify-center flex-shrink-0">
                  <Sparkles class="w-4 h-4 text-white" />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gov-blue-dark mb-1">系统智能识别</p>
                  <p class="text-sm text-neutral-700 mb-1">
                    识别为：<span class="font-medium">{{ getTypeCategory(form.type) }}</span>
                  </p>
                  <p class="text-sm text-neutral-700">
                    推荐转至：<span class="font-medium">{{ autoDispatchResult.deptName }}</span>
                  </p>
                </div>
                <span class="text-xs px-3 py-1 bg-accent-green text-white rounded-lg flex items-center gap-1 h-fit">
                  <CheckCircle class="w-3 h-3" />
                  已应用
                </span>
              </div>
            </div>

            <div v-else class="space-y-3">
              <el-select
                v-model="form.departmentId"
                placeholder="请选择归属部门"
                class="w-full"
                filterable
                @change="(val: string) => {
                  const dept = mockDepartments.find(d => d.id === val)
                  form.departmentName = dept?.name || ''
                }"
              >
                <el-option
                  v-for="dept in mockDepartments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
              
              <div v-if="recommendedDept && form.departmentId !== recommendedDept.value" class="flex items-center gap-2 text-sm">
                <Sparkles class="w-4 h-4 text-gov-blue" />
                <span class="text-neutral-500">智能推荐：{{ recommendedDept.label }}</span>
                <button @click="useRecommendedDept" class="text-gov-blue hover:underline">使用推荐</button>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">诉求内容</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  诉求标题 <span class="text-accent-red">*</span>
                </label>
                <div class="relative">
                  <el-input
                    v-model="form.title"
                    placeholder="请简洁描述您的诉求（5-50字）"
                    maxlength="50"
                    class="w-full"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    {{ titleCharCount }}/50
                  </span>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-neutral-700">
                    详细内容 <span class="text-accent-red">*</span>
                  </label>
                  <div class="flex items-center gap-1">
                    <button
                      @click="insertFormat('bold')"
                      class="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="加粗"
                    >
                      <span class="font-bold text-sm">B</span>
                    </button>
                    <button
                      @click="insertFormat('list')"
                      class="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="无序列表"
                    >
                      <List class="w-4 h-4" />
                    </button>
                    <button
                      @click="insertFormat('number')"
                      class="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="有序列表"
                    >
                      <span class="text-sm font-mono">1.</span>
                    </button>
                    <button
                      @click="insertFormat('newline')"
                      class="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="换行"
                    >
                      <span class="text-sm">↵</span>
                    </button>
                  </div>
                </div>
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="8"
                  class="content-textarea"
                  placeholder="请详细描述您的诉求，包括时间、地点、经过、诉求等信息（至少20字）"
                  maxlength="2000"
                />
                <div class="text-right mt-1">
                  <span class="text-xs text-neutral-400">{{ contentCharCount }}/2000</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  图片上传 <span class="text-neutral-400 font-normal">（可选，最多9张）</span>
                </label>
                <div class="flex flex-wrap gap-3">
                  <div
                    v-for="(img, index) in uploadedImages"
                    :key="index"
                    class="relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 group"
                  >
                    <img :src="img" class="w-full h-full object-cover" />
                    <button
                      @click="removeImage(index)"
                      class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <el-upload
                    v-if="uploadedImages.length < 9"
                    :auto-upload="false"
                    :before-upload="beforeUpload"
                    accept="image/*"
                    multiple
                    class="w-24 h-24"
                    drag
                  >
                    <div class="w-24 h-24 rounded-xl border-2 border-dashed border-neutral-300 hover:border-gov-blue transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <Upload class="w-6 h-6 text-neutral-400" />
                      <span class="text-xs text-neutral-400">点击上传</span>
                    </div>
                  </el-upload>
                </div>
                <p class="text-xs text-neutral-400 mt-2">支持 JPG、PNG、GIF 格式，单张不超过 5MB</p>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">位置信息 <span class="text-neutral-400 font-normal">（可选）</span></h3>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <el-select v-model="form.district" placeholder="选择区域" class="w-full">
                  <el-option
                    v-for="d in districtOptions"
                    :key="d.value"
                    :label="d.label"
                    :value="d.value"
                  />
                </el-select>
                <div class="flex gap-2">
                  <el-input
                    v-model="form.location"
                    placeholder="详细地址"
                    class="flex-1"
                  >
                    <template #prefix>
                      <MapPin class="w-4 h-4 text-neutral-400" />
                    </template>
                  </el-input>
                  <button
                    @click="getLocation"
                    :disabled="locating"
                    class="px-4 py-2 bg-gov-blue-50 text-gov-blue rounded-xl hover:bg-gov-blue-100 transition-colors flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
                  >
                    <MapPin :class="['w-4 h-4', locating && 'animate-pulse']" />
                    {{ locating ? '定位中' : '定位' }}
                  </button>
                </div>
              </div>
              <p v-if="form.location" class="text-sm text-neutral-500 flex items-center gap-2">
                <MapPin class="w-4 h-4 text-accent-green" />
                {{ form.location }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <h3 class="section-title">联系方式</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                <div class="flex items-center gap-2">
                  <component :is="form.anonymous ? EyeOff : Eye" class="w-4 h-4 text-neutral-500" />
                  <span class="text-sm text-neutral-700">匿名提交</span>
                </div>
                <el-switch v-model="form.anonymous" size="small" />
              </div>

              <template v-if="!form.anonymous">
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    <User class="w-4 h-4 inline mr-1" />
                    姓名 <span class="text-accent-red">*</span>
                  </label>
                  <el-input v-model="form.contactName" placeholder="请输入姓名" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    <Phone class="w-4 h-4 inline mr-1" />
                    手机号 <span class="text-accent-red">*</span>
                  </label>
                  <el-input v-model="form.contactPhone" placeholder="请输入手机号" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    <Mail class="w-4 h-4 inline mr-1" />
                    邮箱 <span class="text-neutral-400 font-normal">（选填）</span>
                  </label>
                  <el-input v-model="form.contactEmail" placeholder="请输入邮箱" />
                </div>
              </template>
              <p v-else class="text-xs text-neutral-500 bg-gov-blue-50 p-3 rounded-lg">
                匿名提交后，我们将无法联系您反馈处理结果，请谨慎选择。
              </p>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">期望回复方式</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="m in replyMethods"
                :key="m.key"
                @click="form.replyMethod = m.key"
                :class="[
                  'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                  form.replyMethod === m.key
                    ? 'border-gov-blue bg-gov-blue-50'
                    : 'border-neutral-100 hover:border-neutral-200',
                ]"
              >
                <component :is="m.icon" :class="['w-5 h-5', form.replyMethod === m.key ? 'text-gov-blue' : 'text-neutral-400']" />
                <span :class="['text-xs', form.replyMethod === m.key ? 'text-gov-blue font-medium' : 'text-neutral-600']">
                  {{ m.label }}
                </span>
              </button>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-gov-blue-50 to-white">
            <h3 class="section-title mb-3">温馨提示</h3>
            <ul class="space-y-2 text-sm text-neutral-600">
              <li class="flex items-start gap-2">
                <CheckCircle class="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                <span>请如实反映诉求，我们将严格保密您的个人信息</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle class="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                <span>一般诉求将在{{ getEstimatedDays(form.type) }}个工作日内回复</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle class="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                <span>提交后您可以在诉求中心查看处理进度和结果</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle class="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                <span>诉求处理完成后，欢迎对服务进行评价</span>
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-3">
            <button
              @click="handleSubmit"
              :disabled="submitting || !canSubmit"
              class="w-full py-3 bg-gov-gradient text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              <Send v-if="!submitting" class="w-4 h-4" />
              <span v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ submitting ? '提交中...' : '提交诉求' }}
            </button>
            <button
              @click="goBack"
              class="w-full py-3 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-medium hover:bg-neutral-50 transition-all"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="max-w-xl mx-auto">
      <div class="card text-center py-12">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-green/10 flex items-center justify-center">
          <CheckCircle class="w-10 h-10 text-accent-green" />
        </div>
        
        <h2 class="text-2xl font-bold text-neutral-800 mb-2">提交成功！</h2>
        <p class="text-neutral-500 mb-8">您的诉求已成功提交，我们将尽快处理</p>

        <div class="bg-neutral-50 rounded-xl p-6 text-left space-y-4 mb-8">
          <div class="flex items-center justify-between">
            <span class="text-sm text-neutral-500">工单编号</span>
            <span class="text-sm font-medium text-gov-blue">{{ createdTicket?.ticketNo }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-neutral-500">责任部门</span>
            <span class="text-sm font-medium text-neutral-700">{{ createdTicket?.departmentName || '系统分配中' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-neutral-500">预计回复时限</span>
            <span class="text-sm font-medium text-accent-orange flex items-center gap-1">
              <Clock class="w-4 h-4" />
              {{ getEstimatedDays(form.type) }} 个工作日内
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-neutral-500">提交时间</span>
            <span class="text-sm text-neutral-700">{{ createdTicket?.submitTime }}</span>
          </div>
        </div>

        <div class="flex gap-4">
          <button
            @click="viewMyComplaints"
            class="flex-1 py-3 bg-gov-gradient text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <FileText class="w-4 h-4" />
            查看我的诉求
          </button>
          <button
            @click="continueSubmit"
            class="flex-1 py-3 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-medium hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" />
            继续提交
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Plus } from 'lucide-vue-next'
export default {
  components: { Plus }
}
</script>
