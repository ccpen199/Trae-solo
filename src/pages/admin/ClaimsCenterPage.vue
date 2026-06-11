<template>
  <div class="space-y-5 h-[calc(100vh-10rem)] flex flex-col">
    <div class="grid grid-cols-4 gap-4 flex-shrink-0">
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <component :is="icons.Clock" class="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div class="stat-number text-xl">{{ submittedCount }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </div>
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.FileSearch" class="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <div class="stat-number text-xl">{{ reviewingCount }}</div>
            <div class="stat-label">审核中</div>
          </div>
        </div>
      </div>
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <component :is="icons.CheckCircle" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div class="stat-number text-xl">{{ approvedCount }}</div>
            <div class="stat-label">已赔付</div>
          </div>
        </div>
      </div>
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-alert-50 flex items-center justify-center">
            <component :is="icons.Banknote" class="w-5 h-5 text-alert-500" />
          </div>
          <div>
            <div class="stat-number text-xl text-alert-600">¥{{ formatNumber(totalClaimAmount) }}</div>
            <div class="stat-label">本月索赔总额</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex gap-5 min-h-0">
      <div class="w-2/5 card-base flex flex-col overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 class="font-semibold text-gray-900">理赔申请列表</h3>
          <span class="text-xs text-gray-500">共 {{ claims.length }} 条</span>
        </div>
        <div class="flex-1 overflow-auto">
          <table class="w-full">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">运单号</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">破损类型</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">索赔金额</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">状态</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">提交时间</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="claim in claims"
                :key="claim.id"
                @click="selectClaim(claim)"
                class="border-b border-gray-50 cursor-pointer transition-colors"
                :class="selectedClaim?.id === claim.id ? 'bg-brand-50' : 'hover:bg-gray-50'"
              >
                <td class="py-3 px-4 text-sm font-medium text-brand-600">{{ claim.waybillNo }}</td>
                <td class="py-3 px-4 text-sm text-gray-700">{{ claim.damageType }}</td>
                <td class="py-3 px-4 text-sm font-din font-semibold text-gray-900">¥{{ formatNumber(claim.claimAmount) }}</td>
                <td class="py-3 px-4">
                  <span :class="statusClass(claim.status)" class="badge">{{ statusText(claim.status) }}</span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{{ claim.createdAt }}</td>
                <td class="py-3 px-4">
                  <button class="text-xs text-brand-500 hover:text-brand-600">查看</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex-1 card-base flex flex-col overflow-hidden">
        <div v-if="selectedClaim" class="flex-1 flex flex-col overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <h3 class="font-semibold text-gray-900">理赔详情 · {{ selectedClaim.waybillNo }}</h3>
              <span :class="statusClass(selectedClaim.status)" class="badge">{{ statusText(selectedClaim.status) }}</span>
            </div>
            <span class="text-xs text-gray-500">提交于 {{ selectedClaim.createdAt }}</span>
          </div>

          <div class="flex-1 overflow-auto">
            <div class="grid grid-cols-2 gap-0 h-full">
              <div class="border-r border-gray-100 p-5 space-y-5">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-gray-900">OCR运单识别</span>
                      <span class="badge badge-success flex items-center gap-1">
                        <component :is="icons.Scan" class="w-3 h-3" />
                        已识别 {{ (selectedClaim.ocrResult?.confidence || 0) * 100 }}%
                      </span>
                    </div>
                    <button class="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                      <component :is="icons.RefreshCw" class="w-3 h-3" />
                      重新识别
                    </button>
                  </div>
                  <div class="aspect-[4/3] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 rounded-xl border border-amber-200 p-4 relative overflow-hidden">
                    <div class="absolute inset-2 border-2 border-dashed border-amber-300 rounded-lg"></div>
                    <div class="relative h-full flex flex-col justify-between py-2">
                      <div class="text-center">
                        <div class="text-lg font-bold text-amber-800">德邦大件物流运单</div>
                        <div class="text-xs text-amber-600">DEPPON HEAVY LOGISTICS</div>
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div class="text-amber-600">运单号</div>
                          <div class="font-semibold text-amber-900">{{ selectedClaim.ocrResult?.waybillNo }}</div>
                        </div>
                        <div>
                          <div class="text-amber-600">运费</div>
                          <div class="font-semibold text-amber-900">¥{{ selectedClaim.ocrResult?.freight }}</div>
                        </div>
                        <div>
                          <div class="text-amber-600">发货人</div>
                          <div class="font-semibold text-amber-900">{{ selectedClaim.ocrResult?.senderName }}</div>
                        </div>
                        <div>
                          <div class="text-amber-600">收货人</div>
                          <div class="font-semibold text-amber-900">{{ selectedClaim.ocrResult?.receiverName }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-900">破损照片</span>
                    <button class="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                      <component :is="icons.Upload" class="w-3 h-3" />
                      上传
                    </button>
                  </div>
                  <div class="grid grid-cols-3 gap-3">
                    <div
                      v-for="i in 3"
                      :key="i"
                      class="aspect-square rounded-lg bg-gradient-to-br from-rose-100 via-red-50 to-orange-100 border border-rose-200 relative overflow-hidden cursor-pointer group"
                    >
                      <div class="absolute inset-0 flex items-center justify-center">
                        <component :is="icons.Camera" class="w-8 h-8 text-rose-400" />
                      </div>
                      <div class="absolute top-2 right-2 w-5 h-5 bg-alert-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <component :is="icons.Pencil" class="w-3 h-3 text-white" />
                      </div>
                      <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                        破损点{{ i }} · 点击标注
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-900">维修发票</span>
                    <button class="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                      <component :is="icons.Plus" class="w-3 h-3" />
                      添加发票
                    </button>
                  </div>
                  <div class="space-y-2">
                    <div
                      v-for="(invoice, idx) in repairInvoices"
                      :key="idx"
                      class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div class="w-12 h-12 rounded bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                        <component :is="icons.FileText" class="w-6 h-6 text-green-600" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900">{{ invoice.invoiceNo }}</div>
                        <div class="text-xs text-gray-500">{{ invoice.invoiceDate }}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-din font-semibold text-brand-600">¥{{ formatNumber(invoice.amount) }}</div>
                      </div>
                      <button class="text-gray-400 hover:text-red-500">
                        <component :is="icons.Trash2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div class="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                    <span class="text-sm text-gray-600">发票累计金额</span>
                    <span class="text-lg font-din font-bold text-brand-600">¥{{ formatNumber(totalInvoiceAmount) }}</span>
                  </div>
                </div>
              </div>

              <div class="p-5 space-y-5">
                <div class="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div class="flex items-center gap-2 mb-3">
                    <component :is="icons.Sparkles" class="w-5 h-5 text-green-600" />
                    <span class="font-semibold text-gray-900">OCR自动识别信息</span>
                    <span class="badge badge-success ml-auto">已自动回填</span>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label class="text-xs text-gray-500">运单号</label>
                      <div class="font-medium text-gray-900 mt-0.5">{{ selectedClaim.ocrResult?.waybillNo }}</div>
                    </div>
                    <div>
                      <label class="text-xs text-gray-500">货物名称</label>
                      <div class="font-medium text-gray-900 mt-0.5">{{ selectedClaim.ocrResult?.cargoName }}</div>
                    </div>
                    <div>
                      <label class="text-xs text-gray-500">发货人</label>
                      <div class="font-medium text-gray-900 mt-0.5">{{ selectedClaim.ocrResult?.senderName }} {{ selectedClaim.ocrResult?.senderPhone }}</div>
                    </div>
                    <div>
                      <label class="text-xs text-gray-500">收货人</label>
                      <div class="font-medium text-gray-900 mt-0.5">{{ selectedClaim.ocrResult?.receiverName }} {{ selectedClaim.ocrResult?.receiverPhone }}</div>
                    </div>
                    <div>
                      <label class="text-xs text-gray-500">货物数量</label>
                      <div class="font-medium text-gray-900 mt-0.5">{{ selectedClaim.ocrResult?.cargoQuantity }} 件</div>
                    </div>
                    <div>
                      <label class="text-xs text-gray-500">申报货值</label>
                      <div class="font-medium text-brand-600 mt-0.5">¥{{ formatNumber(selectedClaim.ocrResult?.declaredValue || 0) }}</div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="label-base">破损类型</label>
                    <input type="text" :value="selectedClaim.damageType" class="input-base" readonly />
                  </div>
                  <div>
                    <label class="label-base">破损描述</label>
                    <textarea rows="3" :value="selectedClaim.damageDescription" class="input-base resize-none" readonly></textarea>
                  </div>
                  <div>
                    <label class="label-base">客户索赔金额 (元)</label>
                    <input type="text" :value="'¥' + formatNumber(selectedClaim.claimAmount)" class="input-base font-din" readonly />
                  </div>
                </div>

                <div class="bg-alert-50 rounded-xl p-4 border border-alert-100">
                  <div class="flex items-center gap-2 mb-4">
                    <component :is="icons.Calculator" class="w-5 h-5 text-alert-600" />
                    <span class="font-semibold text-gray-900">理算金额计算器</span>
                  </div>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="text-sm text-gray-600">申报货值</label>
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-900">¥</span>
                        <input v-model.number="calcForm.declaredValue" type="number" class="input-base py-1.5 w-32 text-sm text-right font-din" />
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <label class="text-sm text-gray-600">货值赔付比例</label>
                      <div class="flex items-center gap-2">
                        <el-select v-model="calcForm.valueRatio" size="small" class="w-32">
                          <el-option label="100% (全损)" :value="1" />
                          <el-option label="70% (严重)" :value="0.7" />
                          <el-option label="50% (中度)" :value="0.5" />
                          <el-option label="30% (轻微)" :value="0.3" />
                        </el-select>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <label class="text-sm text-gray-600">破损程度系数</label>
                      <div class="flex items-center gap-2">
                        <input v-model.number="calcForm.damageDegree" type="number" step="0.1" min="0" max="1" class="input-base py-1.5 w-32 text-sm text-right font-din" />
                        <span class="text-sm text-gray-500">(0~1)</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <label class="text-sm text-gray-600">免赔额</label>
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-900">¥</span>
                        <input v-model.number="calcForm.deductible" type="number" class="input-base py-1.5 w-32 text-sm text-right font-din" />
                      </div>
                    </div>
                    <div class="pt-3 border-t border-alert-200">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">建议赔付金额</span>
                        <div class="text-2xl font-din font-bold text-alert-600">¥{{ formatNumber(calculatedAmount) }}</div>
                      </div>
                      <div class="text-xs text-gray-500 mt-1 text-right">
                        计算公式：货值 × 赔付比例 × 破损程度 - 免赔额
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="label-base">审核备注</label>
                  <textarea v-model="reviewComment" rows="3" placeholder="请输入审核意见..." class="input-base resize-none"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
            <div class="text-sm">
              <span class="text-gray-500">最终赔付金额：</span>
              <span class="text-xl font-din font-bold text-brand-600 ml-1">¥{{ formatNumber(calculatedAmount) }}</span>
            </div>
            <div class="flex gap-3">
              <button class="px-6 py-2 border border-red-200 text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <component :is="icons.XCircle" class="w-4 h-4" />
                驳回申请
              </button>
              <button class="btn-primary flex items-center gap-1.5">
                <component :is="icons.CheckCircle" class="w-4 h-4" />
                审核通过
              </button>
            </div>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <component :is="icons.FileText" class="w-10 h-10 text-gray-400" />
            </div>
            <p class="text-gray-500">请从左侧列表选择一条理赔申请</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Clock, FileSearch, CheckCircle, Banknote, Scan, RefreshCw, Upload, Camera, Pencil,
  FileText, Trash2, Sparkles, Calculator, XCircle, Plus
} from 'lucide-vue-next'
import { mockClaims } from '@/mock'
import type { ClaimRequest, InvoiceItem } from '@/types'

const icons = {
  Clock, FileSearch, CheckCircle, Banknote, Scan, RefreshCw, Upload, Camera, Pencil,
  FileText, Trash2, Sparkles, Calculator, XCircle, Plus
}

const claims = mockClaims
const selectedClaim = ref<ClaimRequest | null>(null)
const reviewComment = ref('')

const repairInvoices = ref<InvoiceItem[]>([
  { id: 'inv001', invoiceNo: 'FP-2026-0611-0088', invoiceDate: '2026-06-10', amount: 5800, imageUrl: '' },
  { id: 'inv002', invoiceNo: 'FP-2026-0611-0089', invoiceDate: '2026-06-10', amount: 3200, imageUrl: '' }
])

const calcForm = reactive({
  declaredValue: 280000,
  valueRatio: 0.1,
  damageDegree: 0.6,
  deductible: 200
})

const totalInvoiceAmount = computed(() => repairInvoices.value.reduce((s, i) => s + i.amount, 0))
const calculatedAmount = computed(() => {
  const val = calcForm.declaredValue * calcForm.valueRatio * calcForm.damageDegree - calcForm.deductible
  return Math.max(0, Math.round(val))
})

const submittedCount = computed(() => claims.filter(c => c.status === 'submitted').length)
const reviewingCount = computed(() => claims.filter(c => c.status === 'reviewing').length)
const approvedCount = computed(() => claims.filter(c => c.status === 'approved' || c.status === 'paid').length)
const totalClaimAmount = computed(() => claims.reduce((s, c) => s + c.claimAmount, 0))

function selectClaim(claim: ClaimRequest) {
  selectedClaim.value = claim
  if (claim.ocrResult) {
    calcForm.declaredValue = claim.ocrResult.declaredValue
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '待处理',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回',
    paid: '已赔付'
  }
  return map[status] || status
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'badge-info',
    submitted: 'badge-warning',
    reviewing: 'badge-info',
    approved: 'badge-success',
    rejected: 'badge-danger',
    paid: 'badge-success'
  }
  return map[status] || 'badge-info'
}

onMounted(() => {
  if (claims.length > 0) {
    selectClaim(claims[0])
  }
})
</script>
