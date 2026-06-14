<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { socialInsuranceApi } from '@/api/socialInsurance';
import { formatCurrency } from '@shared/utils';
import { useAuthStore } from '@/stores/auth';
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
import { ChevronLeft, ChevronRight, Filter, RefreshCw, CheckCircle2, Shield, User, TrendingUp, AlertCircle } from 'lucide-vue-next';

const authStore = useAuthStore();

use([BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

const activeInsurance = ref<InsuranceType>('PENSION');
const activeSubTab = ref<'payments' | 'benefits' | 'compare'>('payments');
const queryRange = ref<QueryRange>('MONTHLY');
const currentPage = ref(1);
const pageSize = 10;
const retryCount = ref(0);
const fetchError = ref('');

const balance = ref<AccountBalance | null>(null);
const payments = ref<PaginatedResponse<PaymentDetail> | null>(null);
const benefits = ref<PaginatedResponse<BenefitRecord> | null>(null);
const compareData = ref<CompareChartData[]>([]);
const loading = ref(false);

const isVerified = computed(() => {
  return !!balance.value
    && !!payments.value?.list?.length
    && !!benefits.value?.list?.length
    && compareData.value.length > 0;
});

function ensureAuth() {
  if (!localStorage.getItem('token')) {
    authStore.demoLogin();
  }
  if (!authStore.userInfo) {
    authStore.demoLogin();
  }
}

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

const compareDimension = ref<'YOY' | 'MOM'>('YOY');

const compareChartOption = computed(() => {
  if (!compareData.value.length) return {};
  const months = compareData.value.map((d) => d.period);
  const currentValues = compareData.value.map((d) => d.currentValue);
  const baseValues = compareData.value.map((d) =>
    compareDimension.value === 'YOY' ? d.yoyValue : d.momValue
  );
  const changes = compareData.value.map((d) =>
    compareDimension.value === 'YOY' ? d.yoyChange : d.momChange
  );
  const baseLabel = compareDimension.value === 'YOY' ? '去年同期' : '上月数据';
  const changeLabel = compareDimension.value === 'YOY' ? '同比变化率' : '环比变化率';

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
          const isRate = p.seriesName.includes('变化率');
          const unit = isRate ? '%' : '元';
          let val = isRate ? p.value.toFixed(1) : formatCurrency(p.value);
          const arrow = isRate
            ? (p.value >= 0 ? ' ↑' : ' ↓')
            : '';
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            ${p.marker}
            <span>${p.seriesName}：</span>
            <span style="font-weight:600;color:${isRate ? (p.value >= 0 ? '#52C41A' : '#F5222D') : '#333'}">${val}${unit}${arrow}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      data: ['当期缴费', baseLabel, changeLabel],
      bottom: 0,
      textStyle: { color: '#666' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '14%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#666', rotate: 30, fontSize: 10 },
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
        barWidth: '18%',
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
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#999', type: 'dashed' },
          data: [{ type: 'average', name: '平均' }],
        },
      },
      {
        name: baseLabel,
        type: 'bar',
        data: baseValues,
        barWidth: '18%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#B7EB8F' },
              { offset: 1, color: '#52C41A' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
          opacity: 0.7,
        },
      },
      {
        name: changeLabel,
        type: 'line',
        yAxisIndex: 1,
        data: changes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#FAAD14', width: 2.5 },
        itemStyle: { color: '#FAAD14' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250,173,20,0.25)' },
              { offset: 1, color: 'rgba(250,173,20,0.02)' },
            ],
          },
        },
        markArea: {
          silent: true,
          itemStyle: { opacity: 0.08 },
          data: [[{ yAxis: 0, itemStyle: { color: '#F5222D' } }, {}]],
        },
      },
    ],
  };
});

const totalCompareSummary = computed(() => {
  if (!compareData.value.length) return null;
  const currentSum = compareData.value.reduce((s, d) => s + d.currentValue, 0);
  const yoySum = compareData.value.reduce((s, d) => s + d.yoyValue, 0);
  const momSum = compareData.value.reduce((s, d) => s + d.momValue, 0);
  const avgChange = compareData.value.reduce((s, d) => s + (compareDimension.value === 'YOY' ? d.yoyChange : d.momChange), 0) / compareData.value.length;
  const positiveMonths = compareData.value.filter((d) =>
    compareDimension.value === 'YOY' ? d.yoyChange >= 0 : d.momChange >= 0
  ).length;

  return {
    currentSum,
    yoySum,
    momSum,
    avgChange: Math.round(avgChange * 10) / 10,
    positiveMonths,
    totalMonths: compareData.value.length,
  };
});

async function fetchData() {
  loading.value = true;
  fetchError.value = '';
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

    if (!payments.value) {
      payments.value = await socialInsuranceApi.getPayments(activeInsurance.value, queryRange.value, 1, pageSize);
    }
    if (!benefits.value) {
      benefits.value = await socialInsuranceApi.getBenefits(activeInsurance.value, 1, pageSize);
    }
    if (!compareData.value.length) {
      compareData.value = await socialInsuranceApi.getCompareChart(activeInsurance.value, new Date().getFullYear());
    }
  } catch (e: any) {
    retryCount.value++;
    fetchError.value = e?.response?.data?.message || e?.message || '数据加载失败';
    if (retryCount.value < 2) {
      setTimeout(() => fetchData(), 600);
      return;
    }
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
  retryCount.value = 0;
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

onMounted(() => {
  ensureAuth();
  fetchData();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="card-base p-5 mb-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-primary-100">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gov-gradient flex items-center justify-center text-white shadow-md">
            <User class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-gray-800">{{ authStore.userInfo?.nameMasked || '参保人' }}</span>
              <span class="text-sm text-gray-500 tabular-nums">{{ authStore.userInfo?.idCardMasked }}</span>
              <span class="text-xs text-gray-400">{{ authStore.userInfo?.region }}</span>
            </div>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-gray-500">社保卡：<span class="tabular-nums">{{ authStore.userInfo?.socialCardMasked }}</span></span>
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                  authStore.userInfo?.insureStatus === 'NORMAL'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700',
                ]"
              >
                <Shield class="w-3 h-3" />
                {{ authStore.userInfo?.insureStatus === 'NORMAL' ? '正常参保' : '参保状态待确认' }}
              </span>
            </div>
          </div>
        </div>
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm"
          :class="isVerified ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800'"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span class="text-sm font-semibold">
            {{ isVerified ? '权益核验完成' : '数据加载中，核验进行中' }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-bold text-gray-800">社保权益查询</h1>
      <button
        v-if="!loading"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        @click="retryCount = 0; fetchData()"
      >
        <RefreshCw class="w-3 h-3" />
        刷新数据
      </button>
    </div>

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

    <div v-if="fetchError && !loading" class="card-base p-8 mb-6 border-2 border-red-200 bg-red-50">
      <div class="flex flex-col items-center text-center">
        <AlertCircle class="w-12 h-12 text-red-400 mb-3" />
        <p class="text-base font-semibold text-red-700 mb-1">数据加载异常</p>
        <p class="text-sm text-red-500 mb-4">{{ fetchError }}</p>
        <button
          class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-700 transition-colors"
          @click="retryCount = 0; ensureAuth(); fetchData()"
        >
          <RefreshCw class="w-4 h-4" />
          重新加载
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p class="text-sm text-gray-500">正在从国家社保公共服务平台同步数据...</p>
      <p class="text-xs text-gray-400 mt-1">包含缴费明细、待遇发放、账户余额、同比环比</p>
    </div>

    <template v-else>
      <div v-if="balance" class="card-base p-6 mb-6 bg-gradient-to-br from-primary-50 via-white to-accent-50 border border-primary-100">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-gov-gradient flex items-center justify-center text-white">
              {{ InsuranceTypeShortMap[activeInsurance] }}
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">{{ InsuranceTypeMap[activeInsurance] }} - 权益总览</h2>
              <p class="text-xs text-gray-500">截至 {{ balance.updatedAt }}</p>
            </div>
          </div>
          <span v-if="balance.cumulativeMonths" class="px-3 py-1 rounded-full bg-primary-100 text-primary text-xs font-medium">
            累计缴费 {{ balance.cumulativeMonths }} 个月
          </span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-xs text-gray-500 mb-1">个人账户余额</p>
            <p class="text-2xl font-bold text-primary tabular-nums">
              {{ formatCurrency(balance.personalAccount) }}
            </p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-xs text-gray-500 mb-1">统筹账户余额</p>
            <p class="text-2xl font-bold text-accent tabular-nums">
              {{ formatCurrency(balance.pooledAccount) }}
            </p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-xs text-gray-500 mb-1">账户总余额</p>
            <p class="text-2xl font-bold text-gray-800 tabular-nums">
              {{ formatCurrency(balance.personalAccount + balance.pooledAccount) }}
            </p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-xs text-gray-500 mb-1">最近更新</p>
            <p class="text-base font-semibold text-gray-700">
              {{ balance.updatedAt.split(' ')[0] }}
            </p>
          </div>
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

      <div v-if="activeSubTab === 'payments'" class="space-y-4">
        <div v-if="payments?.summary" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="card-base p-3">
            <p class="text-[11px] text-gray-500">本页已缴</p>
            <p class="text-lg font-bold text-success">{{ payments.summary.paidCount }}<span class="text-xs font-normal ml-1">条</span></p>
          </div>
          <div class="card-base p-3">
            <p class="text-[11px] text-gray-500">本页欠缴</p>
            <p class="text-lg font-bold text-danger">{{ payments.summary.arrearsCount }}<span class="text-xs font-normal ml-1">条</span></p>
          </div>
          <div class="card-base p-3">
            <p class="text-[11px] text-gray-500">本页未缴</p>
            <p class="text-lg font-bold text-amber-600">{{ payments.summary.unpaidCount }}<span class="text-xs font-normal ml-1">条</span></p>
          </div>
          <div class="card-base p-3 border-l-2 border-primary">
            <p class="text-[11px] text-gray-500">个人缴费合计</p>
            <p class="text-lg font-bold text-primary tabular-nums">{{ formatCurrency(payments.summary.totalPersonal) }}</p>
          </div>
          <div class="card-base p-3 border-l-2 border-accent">
            <p class="text-[11px] text-gray-500">单位缴费合计</p>
            <p class="text-lg font-bold text-accent tabular-nums">{{ formatCurrency(payments.summary.totalCompany) }}</p>
          </div>
          <div class="card-base p-3 border-l-2 border-gray-700 bg-gradient-to-br from-gray-50 to-white">
            <p class="text-[11px] text-gray-500">本页总金额</p>
            <p class="text-lg font-bold text-gray-800 tabular-nums">{{ formatCurrency(payments.summary.grandTotal) }}</p>
          </div>
        </div>

        <div class="card-base overflow-hidden">
          <div class="flex items-center justify-between gap-3 p-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
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
            <span class="text-xs text-gray-400">共 {{ payments?.total }} 条记录</span>
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
            <span class="text-xs text-gray-500">第 {{ currentPage }} / {{ totalPages }} 页</span>
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
      </div>

      <div v-if="activeSubTab === 'benefits'" class="space-y-4">
        <div v-if="benefits?.summary" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="card-base p-3">
            <p class="text-[11px] text-gray-500">已发放</p>
            <p class="text-lg font-bold text-success">{{ benefits.summary.issuedCount }}<span class="text-xs font-normal ml-1">笔</span></p>
          </div>
          <div class="card-base p-3">
            <p class="text-[11px] text-gray-500">待发放</p>
            <p class="text-lg font-bold text-amber-600">{{ benefits.summary.pendingCount }}<span class="text-xs font-normal ml-1">笔</span></p>
          </div>
          <div class="card-base p-3">
            <p class="text-[11px] text-gray-500">发放失败</p>
            <p class="text-lg font-bold text-danger">{{ benefits.summary.failedCount }}<span class="text-xs font-normal ml-1">笔</span></p>
          </div>
          <div class="card-base p-3 border-l-2 border-primary">
            <p class="text-[11px] text-gray-500">本页累计发放</p>
            <p class="text-lg font-bold text-primary tabular-nums">{{ formatCurrency(benefits.summary.totalAmount) }}</p>
          </div>
        </div>

        <div class="card-base overflow-hidden">
          <div class="flex items-center justify-between gap-3 p-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-800">待遇发放明细</h3>
            <span class="text-xs text-gray-400">共 {{ benefits?.total }} 条记录</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-primary-50/50 text-gray-600">
                  <th class="text-left py-3 px-4 font-medium">发放日期</th>
                  <th class="text-left py-3 px-4 font-medium">所属期</th>
                  <th class="text-left py-3 px-4 font-medium">项目</th>
                  <th class="text-right py-3 px-4 font-medium">金额</th>
                  <th class="text-left py-3 px-4 font-medium">到账账户</th>
                  <th class="text-center py-3 px-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody class="table-zebra">
                <tr v-if="!benefits?.list.length">
                  <td colspan="6" class="text-center py-12 text-gray-400">暂无待遇发放记录</td>
                </tr>
                <tr
                  v-for="(row, idx) in benefits?.list"
                  :key="idx"
                  class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                >
                  <td class="py-3 px-4 font-medium text-gray-700">{{ row.issueDate }}</td>
                  <td class="py-3 px-4 text-gray-500 text-xs">{{ row.period || '--' }}</td>
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
            <span class="text-xs text-gray-500">第 {{ currentPage }} / {{ totalPages }} 页</span>
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
      </div>

      <div v-if="activeSubTab === 'compare'" class="space-y-4">
        <div v-if="totalCompareSummary" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="card-base p-4 bg-gradient-to-br from-primary-50 to-white">
            <p class="text-xs text-gray-500">本年度累计缴费</p>
            <p class="text-xl font-bold text-primary tabular-nums">{{ formatCurrency(totalCompareSummary.currentSum) }}</p>
          </div>
          <div class="card-base p-4 bg-gradient-to-br from-green-50 to-white">
            <p class="text-xs text-gray-500">去年同期累计</p>
            <p class="text-xl font-bold text-success tabular-nums">{{ formatCurrency(totalCompareSummary.yoySum) }}</p>
          </div>
          <div class="card-base p-4 bg-gradient-to-br from-amber-50 to-white">
            <p class="text-xs text-gray-500">平均{{ compareDimension === 'YOY' ? '同比' : '环比' }}变化</p>
            <p class="text-xl font-bold tabular-nums" :class="totalCompareSummary.avgChange >= 0 ? 'text-success' : 'text-danger'">
              {{ totalCompareSummary.avgChange >= 0 ? '+' : '' }}{{ totalCompareSummary.avgChange }}%
            </p>
          </div>
          <div class="card-base p-4 bg-gradient-to-br from-purple-50 to-white">
            <p class="text-xs text-gray-500">正增长月份</p>
            <p class="text-xl font-bold text-purple-600">{{ totalCompareSummary.positiveMonths }}<span class="text-xs font-normal text-gray-500 ml-1">/{{ totalCompareSummary.totalMonths }}个月</span></p>
          </div>
        </div>

        <div class="card-base p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h3 class="text-base font-semibold text-gray-800">
              {{ InsuranceTypeMap[activeInsurance] }} - 同比环比分析
            </h3>
            <div class="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                :class="[
                  'px-4 py-1.5 text-xs font-medium rounded-md transition-all',
                  compareDimension === 'YOY'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ]"
                @click="compareDimension = 'YOY'"
              >
                同比分析
              </button>
              <button
                :class="[
                  'px-4 py-1.5 text-xs font-medium rounded-md transition-all',
                  compareDimension === 'MOM'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ]"
                @click="compareDimension = 'MOM'"
              >
                环比分析
              </button>
            </div>
          </div>
          <div v-if="compareData.length" class="h-[400px]">
            <VChart :option="compareChartOption" autoresize />
          </div>
          <div v-else class="text-center py-12 text-gray-400">暂无同比环比数据</div>
        </div>
      </div>
    </template>
  </div>
</template>
