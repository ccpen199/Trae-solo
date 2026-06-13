<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { socialInsuranceApi } from '@/api/socialInsurance';
import { formatCurrency } from '@shared/utils';
import type {
  InsuranceType,
  QueryRange,
  AccountBalance,
  PaymentDetail,
  BenefitRecord,
  CompareChartData,
  PaginatedResponse,
} from '@shared/types/social-insurance';
import {
  InsuranceTypeMap,
  InsuranceTypeShortMap,
  PaymentStatusMap,
  BenefitStatusMap,
} from '@shared/types/social-insurance';
import { use } from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-vue-next';

use([BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

const activeInsurance = ref<InsuranceType>('PENSION');
const activeSubTab = ref<'payments' | 'benefits' | 'compare'>('payments');
const queryRange = ref<QueryRange>('MONTHLY');
const currentPage = ref(1);
const pageSize = 10;

const balance = ref<AccountBalance | null>(null);
const payments = ref<PaginatedResponse<PaymentDetail> | null>(null);
const benefits = ref<PaginatedResponse<BenefitRecord> | null>(null);
const compareData = ref<CompareChartData[]>([]);
const loading = ref(false);

const insuranceTypes: InsuranceType[] = ['PENSION', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY'];

const subTabs = [
  { key: 'payments' as const, label: '缴费明细' },
  { key: 'benefits' as const, label: '待遇发放' },
  { key: 'compare' as const, label: '同比环比' },
];

const totalPages = computed(() => {
  if (activeSubTab.value === 'payments' && payments.value) {
    return Math.ceil(payments.value.total / pageSize);
  }
  if (activeSubTab.value === 'benefits' && benefits.value) {
    return Math.ceil(benefits.value.total / pageSize);
  }
  return 1;
});

const paymentStatusClass = (status: PaymentDetail['status']): string => {
  const map: Record<string, string> = {
    PAID: 'bg-green-50 text-green-600',
    UNPAID: 'bg-gray-50 text-gray-500',
    ARREARS: 'bg-red-50 text-red-600',
  };
  return map[status] || '';
};

const benefitStatusClass = (status: BenefitRecord['status']): string => {
  const map: Record<string, string> = {
    ISSUED: 'bg-green-50 text-green-600',
    PENDING: 'bg-amber-50 text-amber-600',
    FAILED: 'bg-red-50 text-red-600',
  };
  return map[status] || '';
};

const compareChartOption = computed(() => {
  if (!compareData.value.length) return {};
  const months = compareData.value.map((d) => d.period);
  const currentValues = compareData.value.map((d) => d.currentValue);
  const yoyValues = compareData.value.map((d) => d.yoyValue);
  const yoyChanges = compareData.value.map((d) => d.yoyChange);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#E6F2FF',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: (params: any[]) => {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          const unit = p.seriesName === '同比变化率' ? '%' : '元';
          const val = p.seriesName === '同比变化率' ? p.value.toFixed(1) : formatCurrency(p.value);
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            ${p.marker}
            <span>${p.seriesName}：</span>
            <span style="font-weight:600">${val}${unit}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      data: ['当期缴费', '去年同期', '同比变化率'],
      bottom: 0,
      textStyle: { color: '#666' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#666' },
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999' },
      },
      {
        type: 'value',
        name: '变化率(%)',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#999', formatter: '{value}%' },
      },
    ],
    series: [
      {
        name: '当期缴费',
        type: 'bar',
        data: currentValues,
        barWidth: '20%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890FF' },
              { offset: 1, color: '#0A5CAF' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '去年同期',
        type: 'bar',
        data: yoyValues,
        barWidth: '20%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#91D5FF' },
              { offset: 1, color: '#69C0FF' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '同比变化率',
        type: 'line',
        yAxisIndex: 1,
        data: yoyChanges,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#FAAD14', width: 2 },
        itemStyle: { color: '#FAAD14' },
      },
    ],
  };
});

async function fetchData() {
  loading.value = true;
  try {
    balance.value = await socialInsuranceApi.getBalance(activeInsurance.value);

    if (activeSubTab.value === 'payments') {
      payments.value = await socialInsuranceApi.getPayments(
        activeInsurance.value,
        queryRange.value,
        currentPage.value,
        pageSize
      );
    } else if (activeSubTab.value === 'benefits') {
      benefits.value = await socialInsuranceApi.getBenefits(
        activeInsurance.value,
        currentPage.value,
        pageSize
      );
    } else {
      const year = new Date().getFullYear();
      compareData.value = await socialInsuranceApi.getCompareChart(activeInsurance.value, year);
    }
  } catch {
    balance.value = null;
    payments.value = null;
    benefits.value = null;
    compareData.value = [];
  } finally {
    loading.value = false;
  }
}

function switchInsurance(type: InsuranceType) {
  activeInsurance.value = type;
  currentPage.value = 1;
  fetchData();
}

function switchSubTab(tab: 'payments' | 'benefits' | 'compare') {
  activeSubTab.value = tab;
  currentPage.value = 1;
  fetchData();
}

function switchRange(range: QueryRange) {
  queryRange.value = range;
  currentPage.value = 1;
  fetchData();
}

function goPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchData();
}

onMounted(fetchData);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">社保权益查询</h1>

    <div class="flex items-center gap-2 mb-6">
      <div class="inline-flex bg-primary-50 rounded-full p-1">
        <button
          v-for="type in insuranceTypes"
          :key="type"
          :class="[
            'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
            activeInsurance === type
              ? 'bg-gov-gradient text-white shadow-md'
              : 'text-primary hover:bg-white',
          ]"
          @click="switchInsurance(type)"
        >
          {{ InsuranceTypeShortMap[type] }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <div v-if="balance" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="card-base p-6 border-l-4 border-primary">
          <p class="text-sm text-gray-500 mb-1">个人账户余额</p>
          <p class="text-3xl font-bold text-primary tabular-nums">
            {{ formatCurrency(balance.personalAccount) }}
          </p>
          <p class="text-xs text-gray-400 mt-2">更新于 {{ balance.updatedAt }}</p>
        </div>
        <div class="card-base p-6 border-l-4 border-accent">
          <p class="text-sm text-gray-500 mb-1">统筹账户余额</p>
          <p class="text-3xl font-bold text-accent tabular-nums">
            {{ formatCurrency(balance.pooledAccount) }}
          </p>
          <p class="text-xs text-gray-400 mt-2">更新于 {{ balance.updatedAt }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-4">
        <button
          v-for="tab in subTabs"
          :key="tab.key"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-btn transition-all duration-200',
            activeSubTab === tab.key
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
          ]"
          @click="switchSubTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeSubTab === 'payments'" class="card-base overflow-hidden">
        <div class="flex items-center gap-3 p-4 border-b border-gray-100">
          <Filter class="w-4 h-4 text-gray-400" />
          <div class="inline-flex bg-gray-100 rounded-btn p-0.5">
            <button
              v-for="range in (['MONTHLY', 'QUARTERLY', 'YEARLY'] as QueryRange[])"
              :key="range"
              :class="[
                'px-3 py-1 text-xs rounded-md transition-colors',
                queryRange === range
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
              @click="switchRange(range)"
            >
              {{ range === 'MONTHLY' ? '按月' : range === 'QUARTERLY' ? '按季' : '按年' }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-primary-50/50 text-gray-600">
                <th class="text-left py-3 px-4 font-medium">费款所属期</th>
                <th class="text-right py-3 px-4 font-medium">缴费基数</th>
                <th class="text-right py-3 px-4 font-medium">个人缴费</th>
                <th class="text-right py-3 px-4 font-medium">单位缴费</th>
                <th class="text-right py-3 px-4 font-medium">合计</th>
                <th class="text-center py-3 px-4 font-medium">状态</th>
              </tr>
            </thead>
            <tbody class="table-zebra">
              <tr v-if="!payments?.list.length">
                <td colspan="6" class="text-center py-12 text-gray-400">暂无缴费记录</td>
              </tr>
              <tr
                v-for="(row, idx) in payments?.list"
                :key="idx"
                class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td class="py-3 px-4 font-medium text-gray-700">{{ row.period }}</td>
                <td class="py-3 px-4 text-right tabular-nums">{{ formatCurrency(row.paymentBase) }}</td>
                <td class="py-3 px-4 text-right tabular-nums text-primary">{{ formatCurrency(row.personalAmount) }}</td>
                <td class="py-3 px-4 text-right tabular-nums">{{ formatCurrency(row.companyAmount) }}</td>
                <td class="py-3 px-4 text-right tabular-nums font-semibold">{{ formatCurrency(row.totalAmount) }}</td>
                <td class="py-3 px-4 text-center">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', paymentStatusClass(row.status)]">
                    {{ PaymentStatusMap[row.status] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span class="text-xs text-gray-500">共 {{ payments?.total }} 条</span>
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
      </div>

      <div v-if="activeSubTab === 'benefits'" class="card-base overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-primary-50/50 text-gray-600">
                <th class="text-left py-3 px-4 font-medium">发放日期</th>
                <th class="text-left py-3 px-4 font-medium">项目</th>
                <th class="text-right py-3 px-4 font-medium">金额</th>
                <th class="text-left py-3 px-4 font-medium">到账账户</th>
                <th class="text-center py-3 px-4 font-medium">状态</th>
              </tr>
            </thead>
            <tbody class="table-zebra">
              <tr v-if="!benefits?.list.length">
                <td colspan="5" class="text-center py-12 text-gray-400">暂无待遇发放记录</td>
              </tr>
              <tr
                v-for="(row, idx) in benefits?.list"
                :key="idx"
                class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td class="py-3 px-4 font-medium text-gray-700">{{ row.issueDate }}</td>
                <td class="py-3 px-4 text-gray-600">{{ row.itemName }}</td>
                <td class="py-3 px-4 text-right tabular-nums font-semibold text-primary">
                  {{ formatCurrency(row.amount) }}
                </td>
                <td class="py-3 px-4 text-gray-500">{{ row.bankAccountMasked }}</td>
                <td class="py-3 px-4 text-center">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', benefitStatusClass(row.status)]">
                    {{ BenefitStatusMap[row.status] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span class="text-xs text-gray-500">共 {{ benefits?.total }} 条</span>
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
      </div>

      <div v-if="activeSubTab === 'compare'" class="card-base p-6">
        <h3 class="text-base font-semibold text-gray-800 mb-4">
          {{ InsuranceTypeMap[activeInsurance] }} - 同比环比分析
        </h3>
        <div v-if="compareData.length" class="h-[400px]">
          <VChart :option="compareChartOption" autoresize />
        </div>
        <div v-else class="text-center py-12 text-gray-400">暂无同比环比数据</div>
      </div>
    </template>
  </div>
</template>
