<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BookOpen,
  Package,
  Truck,
  ShieldAlert,
  Car,
  Download,
  ChevronRight,
  ChevronDown,
  Send,
  Copy,
  Check,
  Lock,
  Play,
  Folder,
  FolderOpen,
  Code2,
  Coffee,
  Hexagon,
  Terminal,
  FileCode
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { mockApiEndpoints, mockSdkDownloads } from '@/mock'
import type { ApiEndpoint, ApiParam } from '@/types'

const icons = {
  BookOpen,
  Package,
  Truck,
  ShieldAlert,
  Car,
  Download,
  ChevronRight,
  ChevronDown,
  Send,
  Copy,
  Check,
  Lock,
  Play,
  Folder,
  FolderOpen,
  Code2,
  Coffee,
  Hexagon,
  Terminal,
  FileCode
}

const apiCategories = [
  { key: '订单管理', icon: 'Package' },
  { key: '运输监控', icon: 'Truck' },
  { key: '理赔服务', icon: 'ShieldAlert' },
  { key: '车辆管理', icon: 'Car' }
]

const expandedCategories = ref<string[]>(['订单管理'])
const selectedEndpoint = ref<ApiEndpoint>(mockApiEndpoints[0])
const copiedField = ref<string | null>(null)
const debugToken = ref('')
const debugParams = ref<Record<string, any>>({})
const debugResponse = ref<any>(null)
const isDebugLoading = ref(false)

const endpointsByCategory = computed(() => {
  const result: Record<string, ApiEndpoint[]> = {}
  mockApiEndpoints.forEach((ep) => {
    if (!result[ep.category]) {
      result[ep.category] = []
    }
    result[ep.category].push(ep)
  })
  return result
})

const getMethodClass = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-green-500 text-white'
    case 'POST':
      return 'bg-brand-500 text-white'
    case 'PUT':
      return 'bg-alert-500 text-white'
    case 'DELETE':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getMethodBgLight = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'POST':
      return 'bg-brand-50 text-brand-600 border-brand-200'
    case 'PUT':
      return 'bg-alert-50 text-alert-600 border-alert-200'
    case 'DELETE':
      return 'bg-red-50 text-red-600 border-red-200'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

const toggleCategory = (category: string) => {
  const idx = expandedCategories.value.indexOf(category)
  if (idx > -1) {
    expandedCategories.value.splice(idx, 1)
  } else {
    expandedCategories.value.push(category)
  }
}

const selectEndpoint = (ep: ApiEndpoint) => {
  selectedEndpoint.value = ep
  debugParams.value = {}
  debugResponse.value = null
  ep.params.forEach((p) => {
    if (p.example !== undefined) {
      debugParams.value[p.name] = p.example
    }
  })
}

const formatJson = (obj: any) => {
  return JSON.stringify(obj, null, 2)
}

const copyToClipboard = async (text: string, field: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    ElMessage.success('复制成功')
    setTimeout(() => {
      copiedField.value = null
    }, 2000)
  } catch {
    ElMessage.error('复制失败')
  }
}

const sendDebugRequest = () => {
  isDebugLoading.value = true
  setTimeout(() => {
    debugResponse.value = {
      code: 200,
      message: 'success',
      requestId: 'req_' + Date.now(),
      timestamp: new Date().toISOString(),
      data: selectedEndpoint.value.responseExample?.data || {}
    }
    isDebugLoading.value = false
    ElMessage.success('调试请求已发送')
  }, 800)
}

const getParamTypeTag = (type: string) => {
  const colors: Record<string, string> = {
    string: 'bg-blue-50 text-blue-600',
    integer: 'bg-purple-50 text-purple-600',
    number: 'bg-purple-50 text-purple-600',
    object: 'bg-amber-50 text-amber-600',
    array: 'bg-teal-50 text-teal-600',
    boolean: 'bg-pink-50 text-pink-600'
  }
  return colors[type] || 'bg-gray-50 text-gray-600'
}

const getParamPositionTag = (pos: string) => {
  const colors: Record<string, string> = {
    header: 'bg-gray-100 text-gray-700',
    path: 'bg-indigo-50 text-indigo-600',
    query: 'bg-cyan-50 text-cyan-600',
    body: 'bg-orange-50 text-orange-600'
  }
  return colors[pos] || 'bg-gray-50 text-gray-600'
}

const getSdkIcon = (lang: string) => {
  const map: Record<string, string> = {
    Java: 'Coffee',
    Python: 'Hexagon',
    'Node.js': 'Terminal',
    PHP: 'FileCode'
  }
  return map[lang] || 'Code2'
}

const downloadSdk = (lang: string) => {
  ElMessage.success(`正在下载 ${lang} SDK...`)
}
</script>

<template>
  <div class="min-h-screen bg-bg-50">
    <div class="bg-gradient-to-r from-brand-600 to-brand-700 text-white py-8">
      <div class="page-container !py-0">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <component :is="icons.BookOpen" class="w-8 h-8" />
              <h1 class="text-2xl font-bold">企业API文档中心</h1>
            </div>
            <p class="text-brand-100 text-sm">全面、清晰的接口文档，帮助您快速接入德邦大件物流开放平台，覆盖订单、运输、理赔、车辆全流程</p>
          </div>
          <div class="flex items-center gap-3">
            <div
              v-for="sdk in mockSdkDownloads"
              :key="sdk.language"
              class="group cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2.5 rounded-lg transition-all"
              @click="downloadSdk(sdk.language)"
            >
              <div class="flex items-center gap-2">
                <component :is="icons[getSdkIcon(sdk.language) as keyof typeof icons]" class="w-4 h-4" />
                <span class="text-sm font-medium">{{ sdk.language }} SDK</span>
                <component :is="icons.Download" class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </div>
              <div class="text-[10px] text-brand-100/80 mt-0.5">v{{ sdk.version }} · {{ sdk.size }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-container">
      <div class="flex gap-6 flex-col lg:flex-row">
        <aside class="w-full lg:w-72 flex-shrink-0">
          <div class="card-base sticky top-20">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <component :is="icons.Folder" class="w-4 h-4 text-brand-500" />
                接口分类
              </h3>
            </div>
            <div class="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div v-for="cat in apiCategories" :key="cat.key" class="mb-1">
                <div
                  class="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  @click="toggleCategory(cat.key)"
                >
                  <component
                    :is="expandedCategories.includes(cat.key) ? icons.ChevronDown : icons.ChevronRight"
                    class="w-4 h-4 text-gray-400"
                  />
                  <component :is="icons[cat.icon as keyof typeof icons]" class="w-4 h-4 text-brand-500" />
                  <span class="text-sm font-medium text-gray-700 flex-1">{{ cat.key }}</span>
                  <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {{ endpointsByCategory[cat.key]?.length || 0 }}
                  </span>
                </div>
                <div v-if="expandedCategories.includes(cat.key)" class="ml-4 mt-1 space-y-0.5">
                  <div
                    v-for="ep in endpointsByCategory[cat.key]"
                    :key="ep.path"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                    :class="selectedEndpoint.path === ep.path ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50 text-gray-600'"
                    @click="selectEndpoint(ep)"
                  >
                    <span
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[36px] text-center"
                      :class="getMethodClass(ep.method)"
                    >{{ ep.method }}</span>
                    <span class="text-xs truncate flex-1">{{ ep.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main class="flex-1 min-w-0 space-y-6">
          <div class="card-base p-6">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div class="flex items-center gap-3 flex-wrap">
                <span
                  class="text-sm font-bold px-3 py-1.5 rounded-md border"
                  :class="getMethodBgLight(selectedEndpoint.method)"
                >{{ selectedEndpoint.method }}</span>
                <code class="text-sm font-mono bg-gray-50 px-3 py-1.5 rounded-md text-gray-800 border border-gray-200">
                  {{ selectedEndpoint.path }}
                </code>
              </div>
              <button
                class="btn-ghost text-sm flex items-center gap-1.5"
                @click="copyToClipboard(selectedEndpoint.path, 'path')"
              >
                <component :is="copiedField === 'path' ? icons.Check : icons.Copy" class="w-4 h-4" />
                {{ copiedField === 'path' ? '已复制' : '复制路径' }}
              </button>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ selectedEndpoint.name }}</h2>
            <p class="text-gray-600 text-sm leading-relaxed">{{ selectedEndpoint.description }}</p>
          </div>

          <div class="card-base p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <component :is="icons.Lock" class="w-4 h-4 text-brand-500" />
              请求参数
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="text-left px-4 py-3 font-medium text-gray-700">参数名</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-700">类型</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-700">必填</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-700">位置</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-700">描述</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-700">示例值</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="param in selectedEndpoint.params" :key="param.name" class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                      <code class="font-mono text-brand-600 font-medium">{{ param.name }}</code>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-xs px-2 py-0.5 rounded font-mono" :class="getParamTypeTag(param.type)">
                        {{ param.type }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        v-if="param.required"
                        class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 font-medium"
                      >必填</span>
                      <span v-else class="text-xs text-gray-400">可选</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-xs px-2 py-0.5 rounded font-medium" :class="getParamPositionTag(param.in)">
                        {{ param.in }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ param.description }}</td>
                    <td class="px-4 py-3">
                      <code v-if="param.example !== undefined" class="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {{ typeof param.example === 'object' ? JSON.stringify(param.example) : param.example }}
                      </code>
                      <span v-else class="text-gray-300">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="selectedEndpoint.requestExample" class="card-base p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <component :is="icons.Code2" class="w-4 h-4 text-brand-500" />
                请求示例
              </h3>
              <button
                class="btn-ghost text-sm flex items-center gap-1.5"
                @click="copyToClipboard(formatJson(selectedEndpoint.requestExample), 'request')"
              >
                <component :is="copiedField === 'request' ? icons.Check : icons.Copy" class="w-4 h-4" />
                {{ copiedField === 'request' ? '已复制' : '复制代码' }}
              </button>
            </div>
            <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
<code class="font-mono">{{ formatJson(selectedEndpoint.requestExample) }}</code></pre>
          </div>

          <div class="card-base p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <component :is="icons.Code2" class="w-4 h-4 text-green-500" />
                响应示例
              </h3>
              <button
                class="btn-ghost text-sm flex items-center gap-1.5"
                @click="copyToClipboard(formatJson(selectedEndpoint.responseExample), 'response')"
              >
                <component :is="copiedField === 'response' ? icons.Check : icons.Copy" class="w-4 h-4" />
                {{ copiedField === 'response' ? '已复制' : '复制代码' }}
              </button>
            </div>
            <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
<code class="font-mono">{{ formatJson(selectedEndpoint.responseExample) }}</code></pre>
          </div>

          <div class="card-base p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <component :is="icons.Play" class="w-4 h-4 text-brand-500" />
              在线调试
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="label-base flex items-center gap-1.5">
                    <component :is="icons.Lock" class="w-3.5 h-3.5 text-gray-400" />
                    访问 Token (Bearer)
                  </label>
                  <input
                    v-model="debugToken"
                    type="text"
                    class="input-base font-mono text-sm"
                    placeholder="请输入您的访问Token，沙箱环境可留空"
                  />
                </div>
                <div>
                  <label class="label-base">请求参数</label>
                  <div class="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <template v-for="param in selectedEndpoint.params" :key="param.name">
                      <div v-if="param.in !== 'header' || param.name === 'Authorization'" class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-xs text-gray-700 min-w-[120px]">{{ param.name }}</span>
                          <span
                            v-if="param.required"
                            class="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500"
                          >必填</span>
                        </div>
                        <input
                          v-if="param.type !== 'object' && param.type !== 'array'"
                          v-model="debugParams[param.name]"
                          type="text"
                          class="input-base text-sm py-1.5"
                          :placeholder="param.description"
                        />
                        <textarea
                          v-else
                          v-model="debugParams[param.name]"
                          rows="2"
                          class="input-base text-sm py-1.5 font-mono text-xs"
                          placeholder="请输入JSON格式"
                        />
                      </div>
                    </template>
                  </div>
                </div>
                <button
                  class="btn-primary w-full flex items-center justify-center gap-2"
                  :disabled="isDebugLoading"
                  @click="sendDebugRequest"
                >
                  <component :is="icons.Send" class="w-4 h-4" />
                  {{ isDebugLoading ? '请求中...' : '发送调试请求' }}
                </button>
              </div>
              <div>
                <label class="label-base">响应结果</label>
                <div class="bg-slate-900 rounded-lg border border-gray-200 min-h-[320px] overflow-hidden">
                  <div v-if="debugResponse" class="p-4">
                    <pre class="text-slate-100 text-xs font-mono leading-relaxed overflow-x-auto">
<code>{{ formatJson(debugResponse) }}</code></pre>
                  </div>
                  <div v-else class="flex flex-col items-center justify-center h-[320px] text-gray-500">
                    <component :is="icons.Code2" class="w-10 h-10 text-gray-300 mb-3" />
                    <p class="text-sm">点击「发送调试请求」查看响应结果</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
