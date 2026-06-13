<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Search } from 'lucide-vue-next';
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

onMounted(fetchLogs);
</script>

<template>
  <div class="space-y-5">
    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center gap-2 mb-4">
        <Search class="w-4 h-4 text-gray-500" />
        <h3 class="text-base font-semibold text-gray-800">筛选条件</h3>
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
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-800">
          审计日志（共 {{ total }} 条）
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-3 text-gray-500 font-medium">时间</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">用户</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">操作</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">模块</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">IP</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">设备</th>
              <th class="text-center py-3 px-3 text-gray-500 font-medium">结果</th>
              <th class="text-left py-3 px-3 text-gray-500 font-medium">详情</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="py-8 text-center text-gray-400">加载中...</td>
            </tr>
            <tr v-else-if="!logs.length">
              <td colspan="8" class="py-8 text-center text-gray-400">暂无数据</td>
            </tr>
            <tr
              v-for="log in logs"
              :key="log.id"
              class="border-b border-gray-100"
            >
              <td class="py-3 px-3 text-gray-500 whitespace-nowrap">{{ formatDateTime(log.timestamp) }}</td>
              <td class="py-3 px-3">{{ log.userNameMasked }}</td>
              <td class="py-3 px-3">{{ log.operation }}</td>
              <td class="py-3 px-3">
                <span class="status-tag status-tag-info">{{ AuditModuleMap[log.module] }}</span>
              </td>
              <td class="py-3 px-3 tabular-nums text-gray-500">{{ log.ip }}</td>
              <td class="py-3 px-3 text-gray-500 max-w-[200px] truncate">{{ log.deviceInfo }}</td>
              <td class="py-3 px-3 text-center">
                <span
                  class="status-tag"
                  :class="log.result === 'SUCCESS' ? 'status-tag-success' : 'status-tag-danger'"
                >
                  {{ log.result === 'SUCCESS' ? '成功' : '失败' }}
                </span>
              </td>
              <td class="py-3 px-3 text-gray-500 max-w-[200px] truncate" :title="log.detail">
                {{ log.detail }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
