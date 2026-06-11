<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  ShieldCheck,
  KeyRound,
  TestTubeDiagonal,
  Rocket,
  ShoppingCart,
  LayoutGrid,
  Warehouse,
  Code2,
  MoreHorizontal,
  Upload,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  Gauge,
  HelpCircle,
  ArrowRight,
  Info,
  AlertCircle,
  FileCheck,
  Sparkles
} from 'lucide-vue-next'
import { ElMessage, ElUpload, type UploadRawFile, type UploadFile } from 'element-plus'
import { mockScenarioOptions, mockValueAddedServices, mockApplyProcess, mockFaqList } from '@/mock'

const icons = {
  FileText,
  ShieldCheck,
  KeyRound,
  TestTubeDiagonal,
  Rocket,
  ShoppingCart,
  LayoutGrid,
  Warehouse,
  Code2,
  MoreHorizontal,
  Upload,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  Gauge,
  HelpCircle,
  ArrowRight,
  Info,
  AlertCircle,
  FileCheck,
  Sparkles
}

const formData = ref({
  enterpriseName: '',
  creditCode: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  scenarios: [] as string[],
  dailyCallVolume: 1000,
  valueAddedServices: [] as string[],
  agreeToTerms: false
})

const licenseFile = ref<UploadFile | null>(null)
const licensePreviewUrl = ref('')
const expandedFaq = ref<string | null>(null)
const isSubmitting = ref(false)

const scenarioIconMap: Record<string, any> = {
  ShoppingCart,
  LayoutGrid,
  Warehouse,
  Code2,
  MoreHorizontal
}

const estimatedMonthlyOrders = computed(() => {
  const daily = formData.value.dailyCallVolume
  const estimated = Math.floor(daily * 0.4 * 30)
  return estimated.toLocaleString()
})

const toggleScenario = (id: string) => {
  const idx = formData.value.scenarios.indexOf(id)
  if (idx > -1) {
    formData.value.scenarios.splice(idx, 1)
  } else {
    formData.value.scenarios.push(id)
  }
}

const toggleValueAdded = (id: string) => {
  const idx = formData.value.valueAddedServices.indexOf(id)
  if (idx > -1) {
    formData.value.valueAddedServices.splice(idx, 1)
  } else {
    formData.value.valueAddedServices.push(id)
  }
}

const toggleFaq = (question: string) => {
  expandedFaq.value = expandedFaq.value === question ? null : question
}

const beforeLicenseUpload = (rawFile: UploadRawFile) => {
  const isImage = rawFile.type.startsWith('image/') || rawFile.name.endsWith('.pdf')
  if (!isImage) {
    ElMessage.error('营业执照仅支持图片或PDF格式')
    return false
  }
  const isLt10M = rawFile.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

const handleLicenseChange = (file: UploadFile) => {
  if (file.raw) {
    licenseFile.value = file
    if (file.raw.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        licensePreviewUrl.value = e.target?.result as string
      }
      reader.readAsDataURL(file.raw)
    }
    ElMessage.success('营业执照上传成功')
  }
}

const removeLicense = () => {
  licenseFile.value = null
  licensePreviewUrl.value = ''
}

const faqByCategory = computed(() => {
  const result: Record<string, typeof mockFaqList> = {}
  mockFaqList.forEach((faq) => {
    if (!result[faq.category]) {
      result[faq.category] = []
    }
    result[faq.category].push(faq)
  })
  return result
})

const isFormValid = computed(() => {
  return (
    formData.value.enterpriseName.trim() !== '' &&
    formData.value.creditCode.trim() !== '' &&
    formData.value.contactName.trim() !== '' &&
    formData.value.contactPhone.trim() !== '' &&
    formData.value.contactEmail.trim() !== '' &&
    licenseFile.value !== null &&
    formData.value.scenarios.length > 0 &&
    formData.value.agreeToTerms
  )
})

const submitApplication = () => {
  if (!isFormValid.value) {
    ElMessage.warning('请填写完整的申请信息')
    return
  }
  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    ElMessage.success('申请已提交，请等待审核，我们将在1-3个工作日内联系您')
  }, 1500)
}
</script>

<template>
  <div class="min-h-screen bg-bg-50 py-8">
    <div class="page-container">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <component :is="icons.FileText" class="w-7 h-7 text-brand-500" />
          API对接申请
        </h1>
        <p class="text-gray-500">填写企业信息并提交对接申请，审核通过后即可获取API密钥并开始联调</p>
      </div>

      <div class="flex gap-6 flex-col lg:flex-row">
        <main class="flex-1 min-w-0 space-y-6">
          <div class="card-base p-6">
            <h2 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.Building2" class="w-5 h-5 text-brand-500" />
              企业基本信息
            </h2>
            <div class="form-grid">
              <div>
                <label class="label-base flex items-center gap-1">
                  <component :is="icons.Building2" class="w-3.5 h-3.5 text-gray-400" />
                  企业名称
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.enterpriseName"
                  type="text"
                  class="input-base"
                  placeholder="请输入营业执照上的企业全称"
                />
              </div>
              <div>
                <label class="label-base flex items-center gap-1">
                  <component :is="icons.CreditCard" class="w-3.5 h-3.5 text-gray-400" />
                  统一社会信用代码
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.creditCode"
                  type="text"
                  class="input-base font-mono"
                  placeholder="18位统一社会信用代码"
                  maxlength="18"
                />
              </div>
              <div>
                <label class="label-base flex items-center gap-1">
                  <component :is="icons.User" class="w-3.5 h-3.5 text-gray-400" />
                  联系人
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.contactName"
                  type="text"
                  class="input-base"
                  placeholder="请输入对接联系人姓名"
                />
              </div>
              <div>
                <label class="label-base flex items-center gap-1">
                  <component :is="icons.Phone" class="w-3.5 h-3.5 text-gray-400" />
                  联系电话
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.contactPhone"
                  type="tel"
                  class="input-base"
                  placeholder="请输入手机号码"
                  maxlength="11"
                />
              </div>
              <div class="md:col-span-2">
                <label class="label-base flex items-center gap-1">
                  <component :is="icons.Mail" class="w-3.5 h-3.5 text-gray-400" />
                  企业邮箱
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.contactEmail"
                  type="email"
                  class="input-base"
                  placeholder="请输入企业邮箱（不支持个人邮箱如qq.com、163.com）"
                />
              </div>
            </div>
          </div>

          <div class="card-base p-6">
            <h2 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.FileCheck" class="w-5 h-5 text-brand-500" />
              营业执照上传
              <span class="text-red-500">*</span>
            </h2>
            <div v-if="!licenseFile" class="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:border-brand-400 hover:bg-brand-50/30 transition-all">
              <el-upload
                drag
                :show-file-list="false"
                :before-upload="beforeLicenseUpload"
                :on-change="handleLicenseChange"
                accept="image/*,.pdf"
                class="w-full"
              >
                <div class="flex flex-col items-center justify-center text-gray-500">
                  <component :is="icons.Upload" class="w-12 h-12 text-gray-300 mb-3" />
                  <p class="text-sm font-medium text-gray-700 mb-1">点击或拖拽文件到此处上传</p>
                  <p class="text-xs text-gray-400">支持 JPG、PNG、PDF 格式，文件大小不超过 10MB</p>
                </div>
              </el-upload>
            </div>
            <div v-else class="flex items-start gap-4">
              <div class="relative w-40 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                <img
                  v-if="licensePreviewUrl"
                  :src="licensePreviewUrl"
                  class="w-full h-full object-cover"
                  alt="营业执照预览"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <component :is="icons.FileText" class="w-8 h-8 mb-1" />
                  <span class="text-xs">{{ licenseFile.name }}</span>
                </div>
                <button
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  @click="removeLicense"
                >
                  <component :is="icons.X" class="w-3.5 h-3.5" />
                </button>
              </div>
              <div class="flex-1 py-2">
                <p class="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <component :is="icons.CheckCircle2" class="w-4 h-4 text-green-500" />
                  {{ licenseFile.name }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ (licenseFile.size! / 1024 / 1024).toFixed(2) }} MB · 已上传成功
                </p>
                <button class="text-xs text-brand-500 hover:text-brand-600 mt-2" @click="removeLicense">
                  重新上传
                </button>
              </div>
            </div>
          </div>

          <div class="card-base p-6">
            <h2 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.Sparkles" class="w-5 h-5 text-brand-500" />
              对接场景
              <span class="text-red-500">*</span>
              <span class="text-xs font-normal text-gray-400 ml-1">（可多选）</span>
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div
                v-for="scenario in mockScenarioOptions"
                :key="scenario.id"
                class="cursor-pointer border-2 rounded-xl p-4 transition-all hover:-translate-y-0.5"
                :class="formData.scenarios.includes(scenario.id)
                  ? 'border-brand-500 bg-brand-50 shadow-card-hover'
                  : 'border-gray-200 bg-white hover:border-brand-300'"
                @click="toggleScenario(scenario.id)"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors"
                  :class="formData.scenarios.includes(scenario.id) ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'"
                >
                  <component :is="scenarioIconMap[scenario.icon]" class="w-5 h-5" />
                </div>
                <p class="text-sm font-medium text-gray-800 mb-1">{{ scenario.name }}</p>
                <p class="text-xs text-gray-500 leading-relaxed">{{ scenario.description }}</p>
              </div>
            </div>
          </div>

          <div class="card-base p-6">
            <h2 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.Gauge" class="w-5 h-5 text-brand-500" />
              预计调用量
            </h2>
            <div class="space-y-5">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="text-sm text-gray-700">预计日调用量</label>
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-bold text-brand-600 font-din">
                      {{ formData.dailyCallVolume.toLocaleString() }}
                    </span>
                    <span class="text-sm text-gray-500">次/日</span>
                  </div>
                </div>
                <div class="px-1">
                  <input
                    v-model="formData.dailyCallVolume"
                    type="range"
                    min="100"
                    max="100000"
                    step="100"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                  <div class="flex justify-between text-xs text-gray-400 mt-2">
                    <span>100</span>
                    <span>1,000</span>
                    <span>10,000</span>
                    <span>50,000</span>
                    <span>100,000</span>
                  </div>
                </div>
              </div>
              <div class="bg-brand-50 rounded-lg p-4 flex items-center gap-3">
                <component :is="icons.Info" class="w-5 h-5 text-brand-500 flex-shrink-0" />
                <div class="text-sm">
                  <span class="text-gray-600">按此调用量预估，月订单量约为</span>
                  <span class="font-bold text-brand-600 mx-1">{{ estimatedMonthlyOrders }}</span>
                  <span class="text-gray-600">单，超出免费额度后将按阶梯计费</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-base p-6">
            <h2 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.Sparkles" class="w-5 h-5 text-brand-500" />
              增值服务
              <span class="text-xs font-normal text-gray-400 ml-1">（可选）</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="service in mockValueAddedServices"
                :key="service.id"
                class="cursor-pointer border-2 rounded-xl p-4 transition-all flex items-start gap-3"
                :class="formData.valueAddedServices.includes(service.id)
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-brand-300'"
                @click="toggleValueAdded(service.id)"
              >
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                  :class="formData.valueAddedServices.includes(service.id)
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-gray-300'"
                >
                  <component
                    v-if="formData.valueAddedServices.includes(service.id)"
                    :is="icons.CheckCircle2"
                    class="w-3.5 h-3.5 text-white"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <p class="text-sm font-medium text-gray-800">{{ service.name }}</p>
                    <span class="text-sm font-bold text-brand-600 whitespace-nowrap">{{ service.price }}</span>
                  </div>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ service.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card-base p-6">
            <div class="flex items-start gap-3 mb-6">
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors"
                :class="formData.agreeToTerms ? 'bg-brand-500 border-brand-500' : 'border-gray-300'"
                @click="formData.agreeToTerms = !formData.agreeToTerms"
              >
                <component
                  v-if="formData.agreeToTerms"
                  :is="icons.CheckCircle2"
                  class="w-3.5 h-3.5 text-white"
                />
              </div>
              <div class="text-sm text-gray-600">
                <span>我已阅读并同意</span>
                <a href="#" class="text-brand-500 hover:text-brand-600">《德邦开放平台API服务协议》</a>
                <span>和</span>
                <a href="#" class="text-brand-500 hover:text-brand-600">《企业数据安全保密协议》</a>
                <span>，承诺所提交的所有信息真实有效。</span>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <button
                class="btn-primary min-w-[160px] flex items-center justify-center gap-2"
                :disabled="!isFormValid || isSubmitting"
                @click="submitApplication"
              >
                <component :is="icons.Rocket" class="w-4 h-4" />
                {{ isSubmitting ? '提交中...' : '提交申请' }}
              </button>
              <div v-if="!isFormValid" class="flex items-center gap-1.5 text-xs text-alert-500">
                <component :is="icons.AlertCircle" class="w-3.5 h-3.5" />
                请填写完整必填项
              </div>
            </div>
          </div>

          <div class="card-base p-6">
            <h2 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.HelpCircle" class="w-5 h-5 text-brand-500" />
              常见问题
            </h2>
            <div class="space-y-2">
              <div v-for="(faqs, category) in faqByCategory" :key="category">
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2 mt-4 first:mt-0">
                  {{ category }}
                </p>
                <div
                  v-for="faq in faqs"
                  :key="faq.question"
                  class="border border-gray-100 rounded-lg overflow-hidden"
                >
                  <div
                    class="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    @click="toggleFaq(faq.question)"
                  >
                    <span class="text-sm font-medium text-gray-700 flex-1">{{ faq.question }}</span>
                    <component
                      :is="expandedFaq === faq.question ? icons.ChevronUp : icons.ChevronDown"
                      class="w-4 h-4 text-gray-400 flex-shrink-0"
                    />
                  </div>
                  <div
                    v-if="expandedFaq === faq.question"
                    class="px-4 pb-4 pt-1 border-t border-gray-50"
                  >
                    <p class="text-sm text-gray-600 leading-relaxed">{{ faq.answer }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside class="w-full lg:w-80 flex-shrink-0">
          <div class="card-base p-6 sticky top-20">
            <h3 class="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <component :is="icons.Rocket" class="w-5 h-5 text-brand-500" />
              申请流程指引
            </h3>
            <div class="relative pl-6">
              <div class="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
              <div v-for="(step, idx) in mockApplyProcess" :key="step.title" class="relative pb-8 last:pb-0">
                <div
                  class="absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  :class="idx === 0 ? 'bg-brand-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'"
                >
                  <component :is="icons[step.icon as keyof typeof icons]" class="w-3 h-3" />
                </div>
                <div class="pt-0.5">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="text-sm font-medium text-gray-800">{{ step.title }}</p>
                    <span
                      v-if="step.duration"
                      class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                    >
                      {{ step.duration }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ step.description }}</p>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <p class="text-xs text-gray-500">需要帮助？</p>
              <div class="flex items-center gap-2 text-sm text-gray-700">
                <component :is="icons.Phone" class="w-4 h-4 text-brand-500" />
                <span>400-XXX-XXXX</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-700">
                <component :is="icons.Mail" class="w-4 h-4 text-brand-500" />
                <span>api-support@deppon.com</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-700">
                <component :is="icons.HelpCircle" class="w-4 h-4 text-brand-500" />
                <a href="#" class="text-brand-500 hover:text-brand-600">查看开发者文档</a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
