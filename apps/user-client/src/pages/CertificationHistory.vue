<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { certificationApi } from '@/api/certification';
import { formatDate } from '@shared/utils';
import type { CertificationHistoryItem } from '@shared/types/certification';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Monitor, Building2 } from 'lucide-vue-next';

const historyList = ref<CertificationHistoryItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 10;
const loading = ref(false);

const totalPages = computed(() => Math.ceil(total.value / pageSize));

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  SUCCESS: { label: '通过', class: 'bg-green-50 text-green-600', icon: CheckCircle2 },
  FAILED: { label: '未通过', class: 'bg-red-50 text-red-600', icon: XCircle },
};

const channelConfig: Record<string, { label: string; icon: any }> = {
  ONLINE: { label: '线上', icon: Monitor },
  OFFLINE: { label: '线下', icon: Building2 },
};

async function fetchHistory() {
  loading.value = true;
  try {
    const res = await certificationApi.getHistory(currentPage.value, pageSize);
    historyList.value = res.list;
    total.value = res.total;
  } catch {
    historyList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function goPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchHistory();
}

onMounted(fetchHistory);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">认证记录</h1>

    <div class="card-base overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-primary-50/50 text-gray-600">
                <th class="text-left py-3 px-4 font-medium">认证日期</th>
                <th class="text-center py-3 px-4 font-medium">认证渠道</th>
                <th class="text-center py-3 px-4 font-medium">认证结果</th>
                <th class="text-left py-3 px-4 font-medium">失败原因</th>
              </tr>
            </thead>
            <tbody class="table-zebra">
              <tr v-if="!historyList.length">
                <td colspan="4" class="text-center py-12 text-gray-400">暂无认证记录</td>
              </tr>
              <tr
                v-for="item in historyList"
                :key="item.id"
                class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td class="py-3 px-4 font-medium text-gray-700">{{ formatDate(item.date) }}</td>
                <td class="py-3 px-4 text-center">
                  <span class="inline-flex items-center gap-1 text-gray-600">
                    <component :is="channelConfig[item.channel]?.icon" class="w-3.5 h-3.5" />
                    {{ channelConfig[item.channel]?.label }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[item.status]?.class]">
                    <component :is="statusConfig[item.status]?.icon" class="w-3 h-3" />
                    {{ statusConfig[item.status]?.label }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-xs">
                  {{ item.failReason || '--' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span class="text-xs text-gray-500">共 {{ total }} 条记录</span>
          <div class="flex items-center gap-1">
            <button
              class="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              :disabled="currentPage <= 1"
              @click="goPage(currentPage - 1)"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-sm text-gray-600 px-2">{{ currentPage }} / {{ totalPages }}</span>
            <button
              class="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              :disabled="currentPage >= totalPages"
              @click="goPage(currentPage + 1)"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
