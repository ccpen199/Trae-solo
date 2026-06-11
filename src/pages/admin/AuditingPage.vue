<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">对账单总数</div>
            <div class="stat-number mt-2">{{ summary.total }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.ReceiptText" class="w-6 h-6 text-brand-500" />
          </div>
        </div>
        <span class="badge badge-info mt-3">2026-05 账期</span>
      </div>

      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">待确认</div>
            <div class="stat-number mt-2 text-alert-600">{{ summary.unconfirmed }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-alert-50 flex items-center justify-center">
            <component :is="icons.AlertTriangle" class="w-6 h-6 text-alert-500" />
          </div>
        </div>
        <span class="text-sm text-gray-500 mt-3">需财务核对差异</span>
      </div>

      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">已确认金额</div>
            <div class="stat-number mt-2 text-green-600">¥{{ formatCurrency(summary.confirmedAmount) }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <component :is="icons.CheckCircle" class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <span class="badge badge-success mt-3">可进入结算</span>
      </div>

      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">差异金额</div>
            <div class="stat-number mt-2 text-red-600">¥{{ formatCurrency(summary.totalDifference) }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <component :is="icons.Scale" class="w-6 h-6 text-red-500" />
          </div>
        </div>
        <span class="text-sm text-gray-500 mt-3">按运单明细定位</span>
      </div>
    </div>

    <div class="card-base p-5">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold text-gray-900">客户对账单</h3>
          <p class="text-xs text-gray-500 mt-0.5">从账单列表进入运单明细，可确认或驳回本期账单</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <component :is="icons.Search" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input v-model="keyword" class="input-base py-2 pl-9 text-sm w-56" placeholder="搜索客户或对账单号" />
          </div>
          <select v-model="statusFilter" class="input-base py-2 text-sm w-36">
            <option value="">全部状态</option>
            <option value="unconfirmed">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="rejected">已驳回</option>
          </select>
          <button class="btn-secondary inline-flex items-center gap-2" @click="fetchStatements">
            <component :is="icons.RefreshCw" class="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      <div class="mt-5 overflow-x-auto rounded-lg border border-gray-100">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">对账单</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">客户</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">订单数</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">账单金额</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">差异</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">状态</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="py-10 text-center text-gray-400">正在加载对账数据...</td>
            </tr>
            <tr
              v-for="statement in filteredStatements"
              v-else
              :key="statement.id"
              class="border-t border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="text-sm font-semibold text-gray-900">{{ statement.statementNo }}</div>
                <div class="text-xs text-gray-500">{{ statement.createdAt }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm text-gray-900">{{ statement.customerName }}</div>
                <div class="text-xs text-gray-500">{{ statement.customerId }}</div>
              </td>
              <td class="py-3 px-4 text-sm text-gray-700">{{ statement.orderCount }}</td>
              <td class="py-3 px-4 text-sm font-din font-semibold text-gray-900">¥{{ formatCurrency(statement.totalAmount) }}</td>
              <td class="py-3 px-4 text-sm font-din" :class="statement.difference > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'">
                ¥{{ formatCurrency(statement.difference) }}
              </td>
              <td class="py-3 px-4">
                <span class="badge" :class="statusClass(statement.status)">{{ statusText(statement.status) }}</span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button class="text-xs text-brand-600 hover:underline" @click="openDetail(statement.id)">查看详情</button>
                  <button
                    v-if="statement.status !== 'confirmed'"
                    class="text-xs text-green-600 hover:underline"
                    @click="confirmStatement(statement.id)"
                  >
                    确认
                  </button>
                  <button
                    v-if="statement.status === 'unconfirmed'"
                    class="text-xs text-red-600 hover:underline"
                    @click="rejectStatement(statement.id)"
                  >
                    驳回
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div class="card-base p-5 xl:col-span-2 min-h-[22rem]">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-semibold text-gray-900">运单明细</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ selectedStatement ? selectedStatement.statementNo : '请选择一张对账单' }}</p>
          </div>
          <span v-if="selectedStatement" class="badge" :class="statusClass(selectedStatement.status)">
            {{ statusText(selectedStatement.status) }}
          </span>
        </div>

        <div v-if="!selectedStatement" class="h-72 flex flex-col items-center justify-center text-gray-400">
          <component :is="icons.FileSearch" class="w-12 h-12 mb-3 opacity-40" />
          <p class="text-sm">点击“查看详情”加载运单明细</p>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="text-xs text-gray-500">客户</div>
              <div class="text-sm font-semibold text-gray-900 mt-1">{{ selectedStatement.customerName }}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="text-xs text-gray-500">账期</div>
              <div class="text-sm font-semibold text-gray-900 mt-1">{{ selectedStatement.month }}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="text-xs text-gray-500">总金额</div>
              <div class="text-sm font-semibold text-gray-900 mt-1">¥{{ formatCurrency(selectedStatement.totalAmount) }}</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3">
              <div class="text-xs text-gray-500">驳回原因</div>
              <div class="text-sm font-semibold text-gray-900 mt-1 truncate">{{ selectedStatement.rejectReason || '-' }}</div>
            </div>
          </div>

          <div class="overflow-x-auto rounded-lg border border-gray-100">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">运单号</th>
                  <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">货物</th>
                  <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">线路</th>
                  <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">报价</th>
                  <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">实收</th>
                  <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">差异</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in selectedStatement.details || []" :key="detail.orderNo" class="border-t border-gray-50">
                  <td class="py-3 px-4">
                    <div class="text-sm font-medium text-brand-600">{{ detail.waybillNo }}</div>
                    <div class="text-xs text-gray-500">{{ detail.orderNo }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="text-sm text-gray-900">{{ detail.cargoDescription }}</div>
                    <div class="text-xs text-gray-500">{{ detail.weight }}kg / {{ detail.volume }}m³</div>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-700">{{ detail.origin }} → {{ detail.destination }}</td>
                  <td class="py-3 px-4 text-sm text-gray-700">¥{{ formatCurrency(detail.quotedAmount) }}</td>
                  <td class="py-3 px-4 text-sm text-gray-700">¥{{ formatCurrency(detail.actualAmount) }}</td>
                  <td class="py-3 px-4 text-sm" :class="detail.difference > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'">
                    ¥{{ formatCurrency(detail.difference) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card-base p-5">
        <div class="mb-4">
          <h3 class="font-semibold text-gray-900">审计日志</h3>
          <p class="text-xs text-gray-500 mt-0.5">确认、驳回、导出与系统同步记录</p>
        </div>
        <div class="space-y-3 max-h-[28rem] overflow-auto">
          <div v-for="log in auditLogs" :key="log.id" class="border-l-2 border-brand-100 pl-3 py-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-gray-900">{{ log.action }}</span>
              <span class="text-xs text-gray-400">{{ log.operator }}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">{{ log.detail }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ log.timestamp }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  AlertTriangle,
  CheckCircle,
  FileSearch,
  ReceiptText,
  RefreshCw,
  Scale,
  Search
} from 'lucide-vue-next'
import { auditingApi } from '@/api'

type StatementStatus = 'unconfirmed' | 'confirmed' | 'rejected'

interface StatementDetail {
  orderNo: string
  waybillNo: string
  serviceType: string
  cargoDescription: string
  weight: number
  volume: number
  origin: string
  destination: string
  quotedAmount: number
  actualAmount: number
  difference: number
}

interface Statement {
  id: string
  statementNo: string
  customerName: string
  customerId: string
  orderCount: number
  totalAmount: number
  confirmedAmount: number
  difference: number
  status: StatementStatus
  month: string
  rejectReason?: string
  createdAt: string
  details?: StatementDetail[]
}

interface AuditLog {
  id: string
  operator: string
  action: string
  detail: string
  timestamp: string
}

const icons = { AlertTriangle, CheckCircle, FileSearch, ReceiptText, RefreshCw, Scale, Search }

const loading = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const statements = ref<Statement[]>([])
const selectedStatement = ref<Statement | null>(null)
const auditLogs = ref<AuditLog[]>([])

const summary = reactive({
  total: 0,
  unconfirmed: 0,
  confirmed: 0,
  rejected: 0,
  totalAmount: 0,
  confirmedAmount: 0,
  totalDifference: 0
})

const filteredStatements = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  if (!word) return statements.value

  return statements.value.filter(statement =>
    statement.statementNo.toLowerCase().includes(word) ||
    statement.customerName.toLowerCase().includes(word) ||
    statement.customerId.toLowerCase().includes(word)
  )
})

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusText(status: StatementStatus) {
  return {
    unconfirmed: '待确认',
    confirmed: '已确认',
    rejected: '已驳回'
  }[status]
}

function statusClass(status: StatementStatus) {
  return {
    unconfirmed: 'badge-warning',
    confirmed: 'badge-success',
    rejected: 'badge-danger'
  }[status]
}

async function fetchStatements() {
  loading.value = true
  try {
    const response = await auditingApi.listStatements({
      status: statusFilter.value || undefined,
      month: '2026-05'
    }) as any
    const data = response.data
    statements.value = data.list || []
    Object.assign(summary, {
      total: data.total || 0,
      unconfirmed: data.unconfirmed || 0,
      confirmed: data.confirmed || 0,
      rejected: data.rejected || 0,
      totalAmount: data.totalAmount || 0,
      confirmedAmount: data.confirmedAmount || 0,
      totalDifference: data.totalDifference || 0
    })
  } catch (error: any) {
    ElMessage.error(error?.message || '对账数据加载失败')
  } finally {
    loading.value = false
  }
}

async function fetchLogs() {
  try {
    const response = await auditingApi.listLogs() as any
    auditLogs.value = response.data?.list || []
  } catch {
    auditLogs.value = []
  }
}

async function openDetail(id: string) {
  try {
    const response = await auditingApi.getStatement(id) as any
    selectedStatement.value = response.data
  } catch (error: any) {
    ElMessage.error(error?.message || '对账单详情加载失败')
  }
}

async function confirmStatement(id: string) {
  try {
    await auditingApi.confirmStatement(id)
    ElMessage.success('对账确认成功')
    await fetchStatements()
    await fetchLogs()
    await openDetail(id)
  } catch (error: any) {
    ElMessage.error(error?.message || '对账确认失败')
  }
}

async function rejectStatement(id: string) {
  try {
    await auditingApi.rejectStatement(id, '复验发现账单差异，退回客户重新确认')
    ElMessage.success('对账已驳回')
    await fetchStatements()
    await fetchLogs()
    await openDetail(id)
  } catch (error: any) {
    ElMessage.error(error?.message || '对账驳回失败')
  }
}

onMounted(async () => {
  await fetchStatements()
  await fetchLogs()
  if (statements.value.length > 0) {
    await openDetail(statements.value[0].id)
  }
})
</script>
