<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowLeft,
  CreditCard,
  Eye,
  Download,
  Share2,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  IdCard,
  Heart,
  Car,
  Users,
  FileText,
  Building2,
  GraduationCap,
  QrCode,
  ChevronRight,
  X,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchValue = ref('')
const activeFilter = ref('all')
const previewLicense = ref<License | null>(null)
const showPreview = ref(false)

type LicenseStatus = 'valid' | 'expiring' | 'expired'

interface License {
  id: string
  name: string
  type: string
  icon: any
  gradient: string
  licenseNo: string
  holder: string
  issueDate: string
  expireDate: string
  issueDept: string
  status: LicenseStatus
  statusText: string
}

const licenses: License[] = [
  {
    id: '1',
    name: '中华人民共和国居民身份证',
    type: '身份证件',
    icon: IdCard,
    gradient: 'from-blue-600 to-indigo-700',
    licenseNo: '362501********0012',
    holder: '张伟',
    issueDate: '2020-05-12',
    expireDate: '2040-05-12',
    issueDept: '抚州市公安局临川分局',
    status: 'valid',
    statusText: '有效',
  },
  {
    id: '2',
    name: '中华人民共和国社会保障卡',
    type: '社保',
    icon: CreditCard,
    gradient: 'from-emerald-600 to-teal-700',
    licenseNo: 'SF3625**********12',
    holder: '张伟',
    issueDate: '2019-08-20',
    expireDate: '2029-08-20',
    issueDept: '抚州市人力资源和社会保障局',
    status: 'valid',
    statusText: '有效',
  },
  {
    id: '3',
    name: '医疗保险电子凭证',
    type: '医保',
    icon: Heart,
    gradient: 'from-rose-500 to-red-600',
    licenseNo: 'YB3625**********88',
    holder: '张伟',
    issueDate: '2020-01-15',
    expireDate: '长期有效',
    issueDept: '抚州市医疗保障局',
    status: 'valid',
    statusText: '有效',
  },
  {
    id: '4',
    name: '中华人民共和国机动车驾驶证',
    type: '交通',
    icon: Car,
    gradient: 'from-amber-600 to-orange-700',
    licenseNo: '362501********0012',
    holder: '张伟',
    issueDate: '2018-03-10',
    expireDate: '2026-07-25',
    issueDept: '抚州市公安局交通警察支队',
    status: 'expiring',
    statusText: '即将到期',
  },
  {
    id: '5',
    name: '中华人民共和国结婚证',
    type: '民政',
    icon: Users,
    gradient: 'from-pink-500 to-rose-600',
    licenseNo: 'J361002-2022-001234',
    holder: '张伟 & 李娜',
    issueDate: '2022-05-20',
    expireDate: '长期有效',
    issueDept: '抚州市临川区民政局',
    status: 'valid',
    statusText: '有效',
  },
  {
    id: '6',
    name: '不动产权证书',
    type: '不动产',
    icon: Building2,
    gradient: 'from-violet-600 to-purple-700',
    licenseNo: '赣(2023)抚州市不动产权第0012345号',
    holder: '张伟',
    issueDate: '2023-06-18',
    expireDate: '2088-06-17',
    issueDept: '抚州市自然资源局',
    status: 'valid',
    statusText: '有效',
  },
  {
    id: '7',
    name: '普通高等学校毕业证书',
    type: '学历',
    icon: GraduationCap,
    gradient: 'from-cyan-600 to-blue-700',
    licenseNo: '104051202405001234',
    holder: '张伟',
    issueDate: '2024-06-30',
    expireDate: '长期有效',
    issueDept: '东华理工大学',
    status: 'valid',
    statusText: '有效',
  },
  {
    id: '8',
    name: '中华人民共和国护照',
    type: '出入境',
    icon: FileText,
    gradient: 'from-slate-700 to-slate-900',
    licenseNo: 'E12345678',
    holder: '张伟',
    issueDate: '2021-09-01',
    expireDate: '2031-08-31',
    issueDept: '江西省公安厅出入境管理局',
    status: 'valid',
    statusText: '有效',
  },
]

const statusConfig: Record<LicenseStatus, { color: string; bg: string; tag: string; icon: any }> = {
  valid: { color: 'text-accent-green', bg: 'bg-accent-green/10', tag: 'tag-success', icon: CheckCircle },
  expiring: { color: 'text-accent-yellow', bg: 'bg-accent-yellow/10', tag: 'tag-warning', icon: Clock },
  expired: { color: 'text-accent-red', bg: 'bg-accent-red/10', tag: 'tag-danger', icon: AlertTriangle },
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'valid', label: '有效' },
  { key: 'expiring', label: '即将到期' },
]

function goBack() {
  router.back()
}

function openPreview(license: License) {
  previewLicense.value = license
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
  previewLicense.value = null
}

const filteredLicenses = () => {
  let list = licenses
  if (activeFilter.value !== 'all') {
    list = list.filter(l => l.status === activeFilter.value)
  }
  if (searchValue.value.trim()) {
    const keyword = searchValue.value.trim().toLowerCase()
    list = list.filter(l =>
      l.name.toLowerCase().includes(keyword) ||
      l.type.toLowerCase().includes(keyword) ||
      l.licenseNo.toLowerCase().includes(keyword)
    )
  }
  return list
}

const validCount = licenses.filter(l => l.status === 'valid').length
const expiringCount = licenses.filter(l => l.status === 'expiring').length
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div class="container h-16 flex items-center gap-4">
        <button @click="goBack" class="p-2 -ml-2 text-neutral-500 hover:text-gov-blue hover:bg-gov-blue-50 rounded-lg transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold text-neutral-800">我的电子证照</h1>
        <div class="ml-auto flex items-center gap-4">
          <span class="text-sm text-neutral-500">已授权 <span class="text-gov-blue font-semibold">{{ licenses.length }}</span> 张</span>
          <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gov-blue/20 text-gov-blue hover:bg-gov-blue/5 transition-colors text-sm">
            <ShieldCheck class="w-4 h-4" />
            授权管理
          </button>
        </div>
      </div>
    </header>

    <div class="container py-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div class="card !p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <CreditCard class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-sm text-neutral-500">证照总数</p>
            <p class="text-2xl font-bold text-neutral-800 mt-0.5">{{ licenses.length }} 张</p>
          </div>
        </div>
        <div class="card !p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
            <CheckCircle class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-sm text-neutral-500">有效证照</p>
            <p class="text-2xl font-bold text-accent-green mt-0.5">{{ validCount }} 张</p>
          </div>
        </div>
        <div class="card !p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Clock class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-sm text-neutral-500">即将到期</p>
            <p class="text-2xl font-bold text-accent-yellow mt-0.5">{{ expiringCount }} 张</p>
          </div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              v-model="searchValue"
              type="text"
              placeholder="搜索证照名称、类型、编号..."
              class="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 transition-all placeholder:text-neutral-400"
            />
          </div>
          <div class="flex gap-2">
            <button
              v-for="tab in filterTabs"
              :key="tab.key"
              :class="[
                'px-5 py-3 rounded-xl text-sm font-medium transition-all',
                activeFilter === tab.key
                  ? 'bg-gov-gradient text-white shadow-md'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
              ]"
              @click="activeFilter = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredLicenses().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div
          v-for="license in filteredLicenses()"
          :key="license.id"
          class="group cursor-pointer"
          @click="openPreview(license)"
        >
          <div :class="['relative rounded-2xl overflow-hidden shadow-card group-hover:shadow-card-hover group-hover:-translate-y-1 transition-all duration-300 p-5 text-white bg-gradient-to-br', license.gradient]">
            <div class="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10"></div>
            <div class="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 translate-x-1/2"></div>

            <div class="relative flex items-start justify-between mb-6">
              <div class="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <component :is="license.icon" class="w-6 h-6 text-white" />
              </div>
              <span :class="[
                'px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur',
                statusConfig[license.status].bg
              ]">
                <component :is="statusConfig[license.status].icon" class="w-3 h-3 inline mr-1" />
                {{ license.statusText }}
              </span>
            </div>

            <h3 class="relative text-base font-semibold mb-1 leading-snug">{{ license.name }}</h3>
            <p class="relative text-xs text-white/70 mb-5">{{ license.type }}</p>

            <div class="relative space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-white/60">持证人</span>
                <span class="text-white/90 font-medium">{{ license.holder }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">证照号</span>
                <span class="text-white/90 font-medium font-mono text-[11px]">{{ license.licenseNo.slice(0, 8) }}...</span>
              </div>
            </div>

            <div class="relative mt-5 pt-4 border-t border-white/20 flex items-center justify-between">
              <span class="text-xs text-white/60">{{ license.issueDate }} 签发</span>
              <ChevronRight class="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div class="flex items-center justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-500 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors" @click.stop="openPreview(license)">
              <Eye class="w-3.5 h-3.5" />
              预览
            </button>
            <button class="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-500 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors" @click.stop>
              <Download class="w-3.5 h-3.5" />
              下载
            </button>
            <button class="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-500 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors" @click.stop>
              <Share2 class="w-3.5 h-3.5" />
              分享
            </button>
          </div>
        </div>
      </div>

      <div v-else class="card text-center py-16">
        <div class="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <CreditCard class="w-10 h-10 text-neutral-300" />
        </div>
        <p class="text-neutral-500 mb-2">暂无符合条件的电子证照</p>
        <p class="text-sm text-neutral-400">试试其他筛选条件或搜索关键词</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showPreview && previewLicense"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        @click.self="closePreview"
      >
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div :class="['relative p-6 text-white bg-gradient-to-br', previewLicense.gradient]">
            <button
              @click="closePreview"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X class="w-4 h-4 text-white" />
            </button>

            <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10"></div>
            <div class="absolute bottom-0 left-20 w-32 h-32 rounded-full bg-white/5"></div>

            <div class="relative">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <component :is="previewLicense.icon" class="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ previewLicense.name }}</h2>
                  <p class="text-sm text-white/70">{{ previewLicense.type }}</p>
                </div>
              </div>

              <div class="w-36 h-36 rounded-xl bg-white/95 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <QrCode class="w-28 h-28 text-neutral-800" />
              </div>

              <p class="text-center text-sm text-white/80">扫码核验证照真伪</p>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-neutral-50 rounded-xl">
                <p class="text-xs text-neutral-500 mb-1">持证人</p>
                <p class="text-sm font-medium text-neutral-800">{{ previewLicense.holder }}</p>
              </div>
              <div class="p-3 bg-neutral-50 rounded-xl">
                <p class="text-xs text-neutral-500 mb-1">证照状态</p>
                <p class="text-sm font-medium" :class="statusConfig[previewLicense.status].color">
                  <component :is="statusConfig[previewLicense.status].icon" class="w-3.5 h-3.5 inline mr-1" />
                  {{ previewLicense.statusText }}
                </p>
              </div>
              <div class="p-3 bg-neutral-50 rounded-xl">
                <p class="text-xs text-neutral-500 mb-1">证照编号</p>
                <p class="text-sm font-medium text-neutral-800 font-mono">{{ previewLicense.licenseNo }}</p>
              </div>
              <div class="p-3 bg-neutral-50 rounded-xl">
                <p class="text-xs text-neutral-500 mb-1">签发机关</p>
                <p class="text-sm font-medium text-neutral-800">{{ previewLicense.issueDept }}</p>
              </div>
              <div class="p-3 bg-neutral-50 rounded-xl">
                <p class="text-xs text-neutral-500 mb-1">签发日期</p>
                <p class="text-sm font-medium text-neutral-800">{{ previewLicense.issueDate }}</p>
              </div>
              <div class="p-3 bg-neutral-50 rounded-xl">
                <p class="text-xs text-neutral-500 mb-1">有效期至</p>
                <p class="text-sm font-medium" :class="previewLicense.status === 'expiring' ? 'text-accent-yellow' : 'text-neutral-800'">
                  {{ previewLicense.expireDate }}
                </p>
              </div>
            </div>

            <div class="pt-2 border-t border-neutral-100">
              <div class="flex items-center gap-2 p-3 bg-gov-blue/5 rounded-xl">
                <ShieldCheck class="w-5 h-5 text-gov-blue flex-shrink-0" />
                <p class="text-xs text-neutral-600 leading-relaxed">
                  本电子证照与实体证照具有同等法律效力，经国家政务服务平台认证，可在抚州市范围内作为办事凭证和身份核验依据。
                </p>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium">
                <Download class="w-4 h-4" />
                下载证照
              </button>
              <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium">
                <Share2 class="w-4 h-4" />
                证照用印
              </button>
              <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gov-gradient text-white hover:shadow-lg transition-all font-medium">
                <QrCode class="w-4 h-4" />
                亮证
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
