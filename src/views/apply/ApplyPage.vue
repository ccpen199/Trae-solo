<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Building2,
  User,
  Sparkles,
  Upload,
  QrCode,
  Star,
  Clock,
  ArrowRight,
  Edit3,
  AlertCircle,
  FileCheck,
  Download,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Zap
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import DynamicForm, { type FormSchema, type FormFieldConfig } from '@/components/form-engine/DynamicForm.vue'
import type { ServiceItem, ApplicationFormField } from '@/types'
import { getServiceById } from '@/api/services'
import { createApplication } from '@/api/application'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(0)
const loading = ref(false)
const submitting = ref(false)
const service = ref<ServiceItem | null>(null)
const dynamicFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)

const steps = [
  { key: 0, name: '填写信息', desc: '填写申请信息' },
  { key: 1, name: '上传材料', desc: '上传办理材料' },
  { key: 2, name: '确认提交', desc: '确认信息并提交' },
  { key: 3, name: '办理完成', desc: '申请提交成功' }
]

const formSchema = computed<FormSchema>(() => ({
  groups: [
    {
      key: 'applicant',
      title: '申请人信息',
      description: '系统已为您自动填充，如有误可点击修改',
      icon: UserCheck,
      fields: [
        {
          key: 'realName',
          label: '姓名',
          type: 'text',
          placeholder: '请输入真实姓名',
          required: true,
          prefill: {
            enabled: true,
            source: '实名认证系统',
            value: userStore.userInfo?.realName,
            autoApplied: true
          },
          rules: [{ required: true, message: '请输入姓名' }]
        },
        {
          key: 'idCard',
          label: '身份证号',
          type: 'text',
          placeholder: '请输入18位身份证号码',
          required: true,
          prefill: {
            enabled: true,
            source: '实名认证系统',
            value: userStore.userInfo?.idCard,
            autoApplied: true
          },
          rules: [{ required: true, message: '请输入身份证号' }, { type: 'idcard' }]
        },
        {
          key: 'phone',
          label: '手机号码',
          type: 'text',
          placeholder: '请输入手机号码',
          required: true,
          prefill: {
            enabled: true,
            source: '账户绑定信息',
            value: userStore.userInfo?.phone,
            autoApplied: true
          },
          rules: [{ required: true, message: '请输入手机号' }, { type: 'phone' }]
        },
        {
          key: 'email',
          label: '电子邮箱',
          type: 'text',
          placeholder: '请输入电子邮箱（选填）',
          required: false,
          prefill: {
            enabled: true,
            source: '账户信息',
            value: userStore.userInfo?.email,
            autoApplied: true
          },
          rules: [{ type: 'email' }]
        },
        {
          key: 'address',
          label: '联系地址',
          type: 'address',
          required: true,
          prefill: {
            enabled: true,
            source: '社保系统',
            autoApplied: true
          }
        }
      ]
    },
    {
      key: 'business',
      title: '业务信息',
      description: '请填写业务相关信息',
      icon: FileText,
      fields: [
        {
          key: 'applyReason',
          label: '申请事由',
          type: 'select',
          placeholder: '请选择申请事由',
          required: true,
          options: [
            { label: '首次申请', value: 'first' },
            { label: '变更信息', value: 'change' },
            { label: '补办', value: 'reissue' },
            { label: '注销', value: 'cancel' }
          ]
        },
        {
          key: 'applyType',
          label: '办理方式',
          type: 'radio',
          required: true,
          options: [
            { label: '邮寄送达', value: 'mail' },
            { label: '窗口自取', value: 'pickup' }
          ],
          defaultValue: 'mail'
        },
        {
          key: 'urgent',
          label: '是否加急',
          type: 'radio',
          required: false,
          options: [
            { label: '普通办理', value: 'normal' },
            { label: '加急办理', value: 'urgent' }
          ],
          defaultValue: 'normal'
        },
        {
          key: 'remark',
          label: '备注说明',
          type: 'textarea',
          placeholder: '如有其他说明请在此填写（选填）',
          required: false,
          rows: 3
        }
      ]
    }
  ],
  materialsEnabled: false
}))

const formData = reactive<Record<string, any>>({})
const uploadedFiles = ref<any[]>([])

const applyReasonLabel = computed(() => {
  const field = formSchema.value.groups[1]?.fields[0] as FormFieldConfig
  return field.options?.find((o: any) => o.value === formData.applyReason)?.label || '-'
})
const signatureData = ref('')
const isDrawing = ref(false)
const signatureCanvas = ref<HTMLCanvasElement | null>(null)

const submitResult = reactive({
  applyNo: '',
  submitTime: '',
  deadline: '',
  qrCodeUrl: ''
})

const rating = reactive({
  overall: 0,
  speed: 0,
  attitude: 0,
  quality: 0,
  content: '',
  tags: [] as string[]
})

const ratingTags = ['效率高', '服务好', '流程清晰', '便捷快速', '材料简单', '体验良好']

const licenseAvailable = ref<Record<string, boolean>>({})
const callingLicense = ref<string | null>(null)

async function callLicense(matName: string) {
  callingLicense.value = matName
  await new Promise(resolve => setTimeout(resolve, 1500))
  licenseAvailable.value[matName] = true
  ElMessage.success(`已成功调阅电子证照：${matName}`)
  callingLicense.value = null
}

function isMaterialUploaded(matName: string): boolean {
  return uploadedFiles.value.some(f => f.name.includes(matName.slice(0, 3))) || licenseAvailable.value[matName]
}

const requiredMaterialsCount = computed(() => {
  return service.value?.materials.filter(m => m.required).length || 0
})

const uploadedRequiredCount = computed(() => {
  if (!service.value) return 0
  return service.value.materials.filter(m => m.required && isMaterialUploaded(m.name)).length
})

async function fetchService() {
  const id = route.params.serviceId as string
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

function onFormUpdate(data: Record<string, any>) {
  Object.assign(formData, data)
}

function onMaterialsChange(files: any[]) {
  uploadedFiles.value = files
}

async function goNext() {
  if (currentStep.value === 0) {
    if (!dynamicFormRef.value) return
    const valid = dynamicFormRef.value.validate()
    if (!valid) {
      ElMessage.warning('请完善表单信息')
      return
    }
  }
  if (currentStep.value === 1) {
    const requiredMats = service.value?.materials.filter(m => m.required) || []
    if (requiredMats.length > 0 && uploadedFiles.value.length === 0) {
      ElMessage.warning('请上传必要的申请材料')
      return
    }
  }
  if (currentStep.value === 2) {
    if (!signatureData.value) {
      ElMessage.warning('请先完成电子签名')
      return
    }
    await handleSubmit()
    return
  }
  currentStep.value++
}

function goPrev() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function goBack() {
  router.back()
}

async function handleSubmit() {
  if (!service.value) return
  submitting.value = true
  try {
    const user = userStore.userInfo
    const formFields: ApplicationFormField[] = Object.entries(formData).map(([key, value]) => ({
      key,
      label: key,
      value: value as ApplicationFormField['value'],
      type: (typeof value === 'number' ? 'number' : 'text') as ApplicationFormField['type']
    }))

    const res = await createApplication({
      serviceId: service.value.id,
      serviceName: service.value.name,
      departmentId: service.value.departmentId,
      departmentName: service.value.departmentName,
      userId: user?.id || '',
      userName: formData.realName || user?.realName || '',
      idCard: formData.idCard || user?.idCard || '',
      phone: formData.phone || user?.phone || '',
      formData: formFields,
      materials: uploadedFiles.value.map(f => ({
        name: f.name,
        url: f.url,
        required: true
      }))
    })

    if (res.code === 0 && res.data) {
      submitResult.applyNo = res.data.applyNo
      submitResult.submitTime = res.data.submitTime
      submitResult.deadline = res.data.deadline
      submitResult.qrCodeUrl = ''
      currentStep.value = 3
      ElMessage.success('申请提交成功！')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function initSignatureCanvas() {
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = '#1E5AA8'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function startDrawing(e: MouseEvent | TouchEvent) {
  isDrawing.value = true
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = canvas.getBoundingClientRect()
  let x, y
  if (e instanceof TouchEvent) {
    x = e.touches[0].clientX - rect.left
    y = e.touches[0].clientY - rect.top
  } else {
    x = e.clientX - rect.left
    y = e.clientY - rect.top
  }
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = canvas.getBoundingClientRect()
  let x, y
  if (e instanceof TouchEvent) {
    x = e.touches[0].clientX - rect.left
    y = e.touches[0].clientY - rect.top
  } else {
    x = e.clientX - rect.left
    y = e.clientY - rect.top
  }
  ctx.lineTo(x, y)
  ctx.stroke()
}

function stopDrawing() {
  if (isDrawing.value && signatureCanvas.value) {
    signatureData.value = signatureCanvas.value.toDataURL()
  }
  isDrawing.value = false
}

function clearSignature() {
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  signatureData.value = ''
}

function submitRating() {
  if (rating.overall === 0) {
    ElMessage.warning('请先进行评分')
    return
  }
  ElMessage.success('感谢您的评价！')
}

function goToMyApplications() {
  router.push('/my-applications')
}

function goToDetail() {
  router.push(`/services/${service.value?.id}`)
}

watch(currentStep, (val) => {
  if (val === 2) {
    setTimeout(initSignatureCanvas, 100)
  }
})

onMounted(() => {
  fetchService()
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <div class="container py-6">
      <button
        v-if="currentStep < 3"
        class="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-gov-blue mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回
      </button>

      <div v-if="loading" class="card animate-pulse">
        <div class="h-8 bg-neutral-200 rounded w-1/3 mb-6"></div>
        <div class="h-16 bg-neutral-100 rounded-xl mb-6"></div>
        <div class="h-64 bg-neutral-100 rounded-xl"></div>
      </div>

      <template v-else-if="service">
        <div class="card mb-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-gov-blue/10 flex items-center justify-center flex-shrink-0">
              <Building2 class="w-6 h-6 text-gov-blue" />
            </div>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-neutral-800">{{ service.name }}</h1>
              <p class="text-sm text-neutral-500 mt-0.5">{{ service.departmentName }}</p>
              <div class="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                <span class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  承诺时限：{{ service.workDays }}
                </span>
                <span class="flex items-center gap-1">
                  <FileText class="w-4 h-4" />
                  {{ service.chargeStandard }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-6">
          <div class="flex items-center justify-between">
            <div
              v-for="(step, idx) in steps"
              :key="step.key"
              class="flex items-center"
              :class="idx < steps.length - 1 ? 'flex-1' : ''"
            >
              <div class="flex flex-col items-center">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                    currentStep > step.key
                      ? 'bg-accent-green text-white'
                      : currentStep === step.key
                      ? 'bg-gov-gradient text-white shadow-lg'
                      : 'bg-neutral-100 text-neutral-500'
                  ]"
                >
                  <Check v-if="currentStep > step.key" class="w-5 h-5" />
                  <span v-else>{{ step.key + 1 }}</span>
                </div>
                <div class="text-center mt-2">
                  <p
                    :class="[
                      'text-sm font-medium transition-colors',
                      currentStep >= step.key ? 'text-gov-blue' : 'text-neutral-500'
                    ]"
                  >
                    {{ step.name }}
                  </p>
                  <p class="text-xs text-neutral-400 mt-0.5 hidden sm:block">{{ step.desc }}</p>
                </div>
              </div>
              <div
                v-if="idx < steps.length - 1"
                :class="[
                  'flex-1 h-0.5 mx-2 sm:mx-4 mb-8 transition-colors',
                  currentStep > step.key ? 'bg-accent-green' : 'bg-neutral-200'
                ]"
              ></div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 0" class="card">
          <div class="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
            <Sparkles class="w-5 h-5 text-accent-orange" />
            <h2 class="text-lg font-semibold text-neutral-800">填写申请信息</h2>
            <span class="tag tag-warning ml-2">支持智能预填</span>
          </div>
          <DynamicForm
            ref="dynamicFormRef"
            :schema="formSchema"
            @update:model-value="onFormUpdate"
          />
          <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-100">
            <button class="btn-secondary" @click="goBack">取消</button>
            <button class="btn-primary" @click="goNext">
              下一步
              <ChevronRight class="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        <div v-show="currentStep === 1" class="card">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <div class="flex items-center gap-2">
              <Upload class="w-5 h-5 text-gov-blue" />
              <h2 class="text-lg font-semibold text-neutral-800">上传申请材料</h2>
              <span class="tag tag-primary ml-2">
                已完成 {{ uploadedRequiredCount }}/{{ requiredMaterialsCount }} 项必填
              </span>
            </div>
            <button
              type="button"
              class="text-sm text-gov-blue hover:text-gov-blue/80 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gov-blue/5 hover:bg-gov-blue/10 transition-colors"
              @click="ElMessage.info('正在批量调阅电子证照功能开发中')"
            >
              <ShieldCheck class="w-4 h-4" />
              一键调阅电子证照
            </button>
          </div>

          <div class="mb-6 overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-neutral-50 text-left">
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 rounded-tl-xl">材料名称</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 hidden md:table-cell">要求说明</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 w-20">是否必填</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 w-24">状态</th>
                  <th class="px-4 py-3 text-xs font-semibold text-neutral-600 w-40 rounded-tr-xl">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="mat in service.materials"
                  :key="mat.id"
                  class="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                >
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-2.5">
                      <FileText class="w-5 h-5 text-gov-blue flex-shrink-0" />
                  <span class="text-sm font-medium text-neutral-800">{{ mat.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-4 hidden md:table-cell">
                    <p class="text-xs text-neutral-500">格式：{{ mat.format }}</p>
                    <p class="text-xs text-neutral-500 mt-0.5">{{ mat.description }}</p>
                  </td>
                  <td class="px-4 py-4">
                    <span v-if="mat.required" class="tag tag-danger">必填</span>
                    <span v-else class="tag tag-primary">选填</span>
                  </td>
                  <td class="px-4 py-4">
                    <span v-if="licenseAvailable[mat.name]" class="inline-flex items-center gap-1 text-xs text-accent-green font-medium">
                      <ShieldCheck class="w-4 h-4" />
                      已调阅
                    </span>
                    <span v-else-if="isMaterialUploaded(mat.name)" class="inline-flex items-center gap-1 text-xs text-accent-green font-medium">
                      <Check class="w-4 h-4" />
                      已上传
                    </span>
                    <span v-else class="text-xs text-neutral-400">未上传</span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        class="text-xs text-gov-blue hover:text-gov-blue/80 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gov-blue/5 transition-colors"
                        :disabled="callingLicense === mat.name"
                        @click="callLicense(mat.name)"
                      >
                        <template v-if="callingLicense === mat.name">
                          <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 7.010 5.291z"></path>
                          </svg>
                          调阅中
                        </template>
                        <template v-else>
                          <CreditCard class="w-3.5 h-3.5" />
                          调证照
                        </template>
                      </button>
                      <button
                        type="button"
                        class="text-xs text-neutral-500 hover:text-gov-blue inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
                        @click="ElMessage.info('模板下载功能开发中')"
                      >
                        <Download class="w-3.5 h-3.5" />
                        模板
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mb-6">
            <div class="flex items-start gap-3">
              <Zap class="w-5 h-5 text-gov-blue flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-neutral-800">温馨提示</p>
                <p class="text-xs text-neutral-600 mt-0.5">支持电子证照一键调用，无需手动上传材料更快捷；上传材料需清晰可辨，支持 JPG、PNG、PDF 格式</p>
              </div>
            </div>
          </div>

          <DynamicForm
            :schema="{ groups: [], materialsEnabled: true }"
            :model-value="service.materials"
            @materials-change="onMaterialsChange"
          />

          <div class="flex justify-between mt-8 pt-6 border-t border-neutral-100">
            <button class="btn-secondary" @click="goPrev">
              <ArrowLeft class="w-4 h-4 mr-1" />
              上一步
            </button>
            <button class="btn-primary" @click="goNext">
              下一步
              <ChevronRight class="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        <div v-show="currentStep === 2" class="card">
          <div class="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
            <Edit3 class="w-5 h-5 text-gov-blue" />
            <h2 class="text-lg font-semibold text-neutral-800">确认信息并提交</h2>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="p-5 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-neutral-800 flex items-center gap-2">
                  <User class="w-4 h-4 text-gov-blue" />
                  申请人信息
                </h3>
                <button
                  type="button"
                  class="text-xs text-gov-blue hover:text-gov-blue/80 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gov-blue/10 hover:bg-gov-blue/20 transition-colors"
                  @click="currentStep = 0"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                  返回修改
                </button>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">姓名</span>
                  <span class="text-neutral-800 font-medium">{{ formData.realName || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">身份证号</span>
                  <span class="text-neutral-800 font-medium">{{ formData.idCard || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">手机号码</span>
                  <span class="text-neutral-800 font-medium">{{ formData.phone || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">电子邮箱</span>
                  <span class="text-neutral-800 font-medium">{{ formData.email || '-' }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">联系地址</span>
                  <span class="text-neutral-800 font-medium text-right max-w-[200px]">
                    {{ formData.address?.province }} {{ formData.address?.city }} {{ formData.address?.detail }}
                  </span>
                </div>
              </div>
            </div>

            <div class="p-5 bg-gradient-to-br from-green-50/50 to-white rounded-xl border border-green-100">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-neutral-800 flex items-center gap-2">
                  <FileText class="w-4 h-4 text-accent-green" />
                  业务信息
                </h3>
                <button
                  type="button"
                  class="text-xs text-accent-green hover:text-accent-green/80 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
                  @click="currentStep = 0"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                  返回修改
                </button>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">申请事项</span>
                  <span class="text-neutral-800 font-medium">{{ service.name }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">所属部门</span>
                  <span class="text-neutral-800 font-medium">{{ service.departmentName }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">申请事由</span>
                  <span class="text-neutral-800 font-medium">
                    {{ applyReasonLabel }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">办理方式</span>
                  <span class="text-neutral-800 font-medium">
                    {{ formData.applyType === 'mail' ? '邮寄送达' : '窗口自取' }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-500">办理类型</span>
                  <span class="text-neutral-800 font-medium">
                    {{ formData.urgent === 'urgent' ? '加急办理' : '普通办理' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-5 bg-gradient-to-br from-orange-50/50 to-white rounded-xl border border-orange-100 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-neutral-800 flex items-center gap-2">
                <Upload class="w-4 h-4 text-accent-orange" />
                已上传材料
                <span class="tag tag-warning ml-2">
                  共 {{ uploadedFiles.length + Object.keys(licenseAvailable).length }} 份
                </span>
              </h3>
              <button
                type="button"
                class="text-xs text-accent-orange hover:text-accent-orange/80 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
                @click="currentStep = 1"
              >
                <Edit3 class="w-3.5 h-3.5" />
                返回修改
              </button>
            </div>
            <div v-if="uploadedFiles.length === 0 && Object.keys(licenseAvailable).length === 0" class="text-center py-4 text-sm text-neutral-500">
              暂无上传材料
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <span
                v-for="f in uploadedFiles"
                :key="f.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-neutral-200 text-sm text-neutral-700"
              >
                <FileText class="w-4 h-4 text-gov-blue" />
                {{ f.name }}
              </span>
              <span
                v-for="(available, name) in licenseAvailable"
                :key="name"
                v-show="available"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200 text-sm text-accent-green"
              >
                <ShieldCheck class="w-4 h-4" />
                {{ name }}（电子证照）
              </span>
            </div>
          </div>

          <div class="p-5 bg-gov-blue/5 rounded-xl border border-gov-blue/20 mb-6">
            <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Edit3 class="w-4 h-4 text-gov-blue" />
              电子签名
              <span class="tag tag-danger ml-1">必填</span>
            </h3>
            <div
              class="bg-white rounded-xl border-2 border-dashed border-neutral-300 overflow-hidden"
              :class="{ 'border-accent-green': signatureData }"
            >
              <canvas
                ref="signatureCanvas"
                width="600"
                height="150"
                class="w-full touch-none cursor-crosshair"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart="startDrawing"
                @touchmove="draw"
                @touchend="stopDrawing"
              ></canvas>
            </div>
            <div class="flex items-center justify-between mt-3">
              <p class="text-xs text-neutral-500 flex items-center gap-1">
                <AlertCircle class="w-3.5 h-3.5" />
                请在上方区域手写签名，签名将用于电子签章
              </p>
              <button
                type="button"
                class="text-sm text-neutral-600 hover:text-gov-blue transition-colors"
                @click="clearSignature"
              >
                清除签名
              </button>
            </div>
          </div>

          <div class="flex justify-between pt-6 border-t border-neutral-100">
            <button class="btn-secondary" @click="goPrev">
              <ArrowLeft class="w-4 h-4 mr-1" />
              上一步
            </button>
            <button class="btn-primary px-8" :disabled="submitting" @click="goNext">
              <span v-if="submitting">提交中...</span>
              <template v-else>
                确认提交
                <Check class="w-4 h-4 ml-1" />
              </template>
            </button>
          </div>
        </div>

        <div v-show="currentStep === 3" class="card">
          <div class="text-center py-8">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-accent-green/10 flex items-center justify-center">
              <Check class="w-10 h-10 text-accent-green" />
            </div>
            <h2 class="text-2xl font-bold text-neutral-800 mb-2">申请提交成功</h2>
            <p class="text-neutral-500 mb-8">您的申请已成功提交，我们将尽快为您办理</p>

            <div class="max-w-md mx-auto p-6 bg-gradient-to-br from-gov-blue/5 to-white rounded-2xl border border-gov-blue/10 mb-8">
              <div class="flex items-center gap-6">
                <div class="w-28 h-28 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 p-2">
                  <div class="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg">
                    <QrCode class="w-16 h-16 text-neutral-400" />
                  </div>
                </div>
                <div class="flex-1 text-left space-y-3">
                  <div>
                    <p class="text-xs text-neutral-500 mb-0.5">办件编号</p>
                    <p class="text-lg font-bold text-gov-blue font-mono">{{ submitResult.applyNo }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500 mb-0.5">提交时间</p>
                    <p class="text-sm text-neutral-800">{{ submitResult.submitTime }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500 mb-0.5">预计完成时间</p>
                    <p class="text-sm font-medium text-accent-orange">{{ submitResult.deadline }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 bg-neutral-50 rounded-2xl mb-8">
              <h3 class="text-base font-semibold text-neutral-800 mb-4 flex items-center justify-center gap-2">
                <Star class="w-5 h-5 text-accent-orange" />
                对本次办理体验进行评价
              </h3>
              <div class="max-w-md mx-auto">
                <div class="space-y-4 mb-6">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-600">综合评分</span>
                    <div class="flex items-center gap-1">
                      <button
                        v-for="i in 5"
                        :key="i"
                        type="button"
                        class="p-0.5"
                        @click="rating.overall = i"
                      >
                        <Star
                          class="w-6 h-6 transition-colors"
                          :class="i <= rating.overall ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'"
                        />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-600">办理速度</span>
                    <div class="flex items-center gap-1">
                      <button
                        v-for="i in 5"
                        :key="i"
                        type="button"
                        class="p-0.5"
                        @click="rating.speed = i"
                      >
                        <Star
                          class="w-5 h-5 transition-colors"
                          :class="i <= rating.speed ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'"
                        />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-600">服务态度</span>
                    <div class="flex items-center gap-1">
                      <button
                        v-for="i in 5"
                        :key="i"
                        type="button"
                        class="p-0.5"
                        @click="rating.attitude = i"
                      >
                        <Star
                          class="w-5 h-5 transition-colors"
                          :class="i <= rating.attitude ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'"
                        />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-600">办理质量</span>
                    <div class="flex items-center gap-1">
                      <button
                        v-for="i in 5"
                        :key="i"
                        type="button"
                        class="p-0.5"
                        @click="rating.quality = i"
                      >
                        <Star
                          class="w-5 h-5 transition-colors"
                          :class="i <= rating.quality ? 'text-accent-orange fill-accent-orange' : 'text-neutral-300'"
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2 justify-center mb-4">
                  <button
                    v-for="tag in ratingTags"
                    :key="tag"
                    type="button"
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium transition-all',
                      rating.tags.includes(tag)
                        ? 'bg-gov-blue text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-gov-blue hover:text-gov-blue'
                    ]"
                    @click="rating.tags.includes(tag) ? rating.tags = rating.tags.filter(t => t !== tag) : rating.tags.push(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
                <textarea
                  v-model="rating.content"
                  class="input-base resize-none"
                  rows="3"
                  placeholder="请输入您的评价内容（选填）"
                ></textarea>
                <button class="btn-primary w-full mt-4" @click="submitRating">
                  提交评价
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button class="btn-secondary" @click="goToDetail">
                返回服务详情
              </button>
              <button class="btn-secondary" @click="router.push('/services')">
                继续办理其他事项
              </button>
              <button class="btn-primary" @click="goToMyApplications">
                查看我的办件
                <ArrowRight class="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
