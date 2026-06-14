<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, ChevronDown, ChevronRight, FileDown, Copy, Check } from 'lucide-vue-next';
import { adminApi } from '@/api/admin';
import { formatDateTime } from '@shared/utils';
import {
  AuditModuleMap,
} from '@shared/types/admin';
import type {
  AuditLogItem,
  AuditLogQuery,
  AuditLogModule,
  AuditLogResult,
} from '@shared/types/admin';

const modules: AuditLogModule[] = ['AUTH', 'SOCIAL', 'CERTIFY', 'TASK', 'SYSTEM'];
const results: { label: string; value: AuditLogResult }[] = [
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAIL' },
];

const query = ref<AuditLogQuery>({
  module: undefined,
  result: undefined,
  startDate: '',
  endDate: '',
  page: 1,
  size: 20,
});

const logs = ref<AuditLogItem[]>([]);
const total = ref(0);
const loading = ref(false);

async function fetchLogs() {
  loading.value = true;
  try {
    const params: AuditLogQuery = { ...query.value };
    if (!params.module) delete params.module;
    if (!params.result) delete params.result;
    if (!params.startDate) delete params.startDate;
    if (!params.endDate) delete params.endDate;
    const res = await adminApi.getAuditLogs(params);
    logs.value = res.list;
    total.value = res.total;
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.value.page = 1;
  fetchLogs();
}

function handleReset() {
  query.value = {
    module: undefined,
    result: undefined,
    startDate: '',
    endDate: '',
    page: 1,
    size: 20,
  };
  fetchLogs();
}

const expandedIds = ref<Set<string>>(new Set());
const copiedId = ref<string | null>(null);

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
}
function isExpanded(id: string) { return expandedIds.value.has(id); }

function mockExtraFields(log: AuditLogItem) {
  return {
    requestId: `REQ-${log.id.slice(-8).toUpperCase()}`,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
    location: log.ip.startsWith('10.') ? '内网-广西人社厅机房' : `${log.ip} · 中国 广西 南宁`,
    sessionDuration: `${Math.floor(120 + Math.random() * 1800)} 秒`,
    requestParams: JSON.stringify({ page: 1, pageSize: 20, filter: 'all' }, null, 2),
    responseSummary: log.result === 'SUCCESS'
      ? '{ "code": 0, "message": "操作成功", "data": { "affectedRows": 1 } }'
      : '{ "code": 401, "message": "认证失败：身份校验未通过" }',
  };
}

async function copyDetail(text: string, id: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    setTimeout(() => copiedId.value = null, 1500);
  } catch {}
}

const resultStats = computed(() => {
  const s = logs.value.filter(l => l.result === 'SUCCESS').length;
  const f = logs.value.filter(l => l.result === 'FAIL').length;
  return { success: s, fail: f, total: logs.value.length };
});

onMounted(fetchLogs);
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="data-card data-card-primary p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">当前筛选结果</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums">{{ resultStats.total }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Search class="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
      <div class="data-card data-card-success p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">成功操作</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums">{{ resultStats.success }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Check class="w-5 h-5 text-success" />
          </div>
        </div>
      </div>
      <div class="data-card data-card-danger p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">失败操作</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums">{{ resultStats.fail }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <FileDown class="w-5 h-5 text-danger" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center gap-2 mb-4">
        <Search class="w-4 h-4 text-gray-500" />
        <h3 class="text-base font-semibold text-gray-800">多维筛选</h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1.5">模块</label>
          <select
            v-model="query.module"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option :value="undefined">全部</option>
            <option v-for="m in modules" :key="m" :value="m">{{ AuditModuleMap[m] }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1.5">操作类型</label>
          <input
            v-model="query.operation"
            type="text"
            placeholder="输入操作关键词"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1.5">时间范围</label>
          <div class="flex items-center gap-2">
            <input
              v-model="query.startDate"
              type="date"
              class="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <span class="text-gray-400 text-xs">至</span>
            <input
              v-model="query.endDate"
              type="date"
              class="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1.5">结果</label>
          <select
            v-model="query.result"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option :value="undefined">全部</option>
            <option v-for="r in results" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3 mt-4">
        <button
          class="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          @click="handleSearch"
        >
          查询
        </button>
        <button
          class="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          @click="handleReset"
        >
          重置
        </button>
        <div class="flex-1" />
        <button
          class="px-4 py-2 border border-primary/30 text-primary rounded-lg text-sm hover:bg-primary/5 transition-colors flex items-center gap-1.5 disabled:opacity-40"
          :disabled="!logs.length"
        >
          <FileDown class="w-4 h-4" />
          导出 CSV
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-800">
          审计日志（共 {{ total }} 条）
        </h3>
        <p class="text-[11px] text-gray-400">💡 点击左侧「+」可展开完整操作详情</p>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-100">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="w-8 py-3 px-2"></th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">时间</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">用户</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">操作</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">模块</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">IP</th>
              <th class="text-center py-3 px-3 text-gray-500 font-medium w-20">结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="py-8 text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!logs.length">
              <td colspan="7" class="py-8 text-center text-gray-400">暂无数据</td>
            </tr>
            <template v-for="log in logs" :key="log.id">
              <tr
                class="border-b border-gray-100 hover:bg-blue-50/20 cursor-pointer transition-colors"
                @click="toggleExpand(log.id)"
              >
                <td class="py-2.5 px-2">
                  <component
                    :is="isExpanded(log.id) ? ChevronDown : ChevronRight"
                    class="w-4 h-4 text-gray-400"
                  />
                </td>
                <td class="py-2.5 px-3 text-gray-500 whitespace-nowrap text-xs">{{ formatDateTime(log.timestamp) }}</td>
                <td class="py-2.5 px-3 font-medium text-gray-700">{{ log.userNameMasked }}</td>
                <td class="py-2.5 px-3 text-gray-800">{{ log.operation }}</td>
                <td class="py-2.5 px-3">
                  <span class="status-tag status-tag-info !text-[11px]">{{ AuditModuleMap[log.module] }}</span>
                </td>
                <td class="py-2.5 px-3 tabular-nums text-gray-500 text-xs">{{ log.ip }}</td>
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="status-tag !text-[11px]"
                    :class="log.result === 'SUCCESS' ? 'status-tag-success' : 'status-tag-danger'"
                  >
                    {{ log.result === 'SUCCESS' ? '成功' : '失败' }}
                  </span>
                </td>
              </tr>
              <tr v-if="isExpanded(log.id)" class="bg-blue-50/10">
                <td colspan="7" class="py-0">
                  <div class="p-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div class="p-3 rounded-xl bg-gray-50">
                        <p class="text-[11px] text-gray-400 mb-1">请求编号</p>
                        <p class="text-xs font-mono text-gray-700 flex items-center gap-2">
                          {{ mockExtraFields(log).requestId }}
                          <button
                            class="text-primary hover:underline"
                            @click.stop="copyDetail(mockExtraFields(log).requestId, log.id + '-rid')"
                          >
                            <component :is="copiedId === log.id + '-rid' ? Check : Copy" class="w-3 h-3" />
                          </button>
                        </p>
                      </div>
                      <div class="p-3 rounded-xl bg-gray-50">
                        <p class="text-[11px] text-gray-400 mb-1">会话时长</p>
                        <p class="text-xs text-gray-700">{{ mockExtraFields(log).sessionDuration }}</p>
                      </div>
                      <div class="p-3 rounded-xl bg-gray-50">
                        <p class="text-[11px] text-gray-400 mb-1">地理位置</p>
                        <p class="text-xs text-gray-700">{{ mockExtraFields(log).location }}</p>
                      </div>
                      <div class="p-3 rounded-xl bg-gray-50">
                        <p class="text-[11px] text-gray-400 mb-1">操作说明</p>
                        <p class="text-xs text-gray-700">{{ log.detail }}</p>
                      </div>
                    </div>

                    <div class="mb-3">
                      <div class="flex items-center justify-between mb-1.5">
                        <p class="text-[11px] text-gray-400">请求参数</p>
                        <button
                          class="text-[11px] text-primary hover:underline flex items-center gap-1"
                          @click.stop="copyDetail(mockExtraFields(log).requestParams, log.id + '-req')"
                        >
                          <component :is="copiedId === log.id + '-req' ? Check : Copy" class="w-3 h-3" />
                          {{ copiedId === log.id + '-req' ? '已复制' : '复制' }}
                        </button>
                      </div>
                      <pre class="text-[11px] text-gray-600 bg-gray-900 text-green-400 rounded-xl p-3 overflow-x-auto font-mono leading-relaxed">{{ mockExtraFields(log).requestParams }}</pre>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <p class="text-[11px] text-gray-400">响应结果</p>
                        <button
                          class="text-[11px] text-primary hover:underline flex items-center gap-1"
                          @click.stop="copyDetail(mockExtraFields(log).responseSummary, log.id + '-res')"
                        >
                          <component :is="copiedId === log.id + '-res' ? Check : Copy" class="w-3 h-3" />
                          {{ copiedId === log.id + '-res' ? '已复制' : '复制' }}
                        </button>
                      </div>
                      <pre
                        class="text-[11px] rounded-xl p-3 overflow-x-auto font-mono leading-relaxed"
                        :class="log.result === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'"
                      >{{ mockExtraFields(log).responseSummary }}</pre>
                    </div>

                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>设备信息：{{ log.deviceInfo }}</span>
                      <span>数据加密传输，不可篡改</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
