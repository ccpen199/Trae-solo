<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Search,
  Users,
  Bell,
} from 'lucide-vue-next';
import { adminApi } from '@/api/admin';
import { formatPercent, formatNumber } from '@shared/utils';
import type { DashboardSummary, PassRateTrendPoint } from '@shared/types/admin';

use([CanvasRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const summary = ref<DashboardSummary | null>(null);
const trendData = ref<PassRateTrendPoint[]>([]);
const loading = ref(true);

const trendChartOption = computed(() => {
  const dates = trendData.value.map((d) => d.date);
  const successData = trendData.value.map((d) => d.successCount);
  const failData = trendData.value.map((d) => d.failCount);
  const lockedData = trendData.value.map((d) => d.lockedCount);

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 12 },
    },
    legend: {
      data: ['成功', '失败', '锁定'],
      bottom: 0,
      textStyle: { fontSize: 12, color: '#666' },
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
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#999', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#999', fontSize: 11 },
    },
    series: [
      {
        name: '成功',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: successData,
        areaStyle: { color: 'rgba(10,92,175,0.15)' },
        lineStyle: { color: '#0A5CAF', width: 2 },
        itemStyle: { color: '#0A5CAF' },
      },
      {
        name: '失败',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: failData,
        areaStyle: { color: 'rgba(245,34,45,0.08)' },
        lineStyle: { color: '#F5222D', width: 2 },
        itemStyle: { color: '#F5222D' },
      },
      {
        name: '锁定',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: lockedData,
        areaStyle: { color: 'rgba(250,173,20,0.08)' },
        lineStyle: { color: '#FAAD14', width: 2 },
        itemStyle: { color: '#FAAD14' },
      },
    ],
  };
});

async function fetchData() {
  loading.value = true;
  try {
    const [summaryRes, trendRes] = await Promise.all([
      adminApi.getSummary(),
      adminApi.getPassRateTrend(30),
    ]);
    summary.value = summaryRes;
    trendData.value = trendRes;
  } catch {
    // handle error silently for demo
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="data-card data-card-primary p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">今日认证数</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
              {{ summary ? formatNumber(summary.todayCertCount) : '-' }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShieldCheck class="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <div class="data-card data-card-accent p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">今日通过率</p>
            <div class="flex items-baseline gap-2">
              <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
                {{ summary ? formatPercent(summary.todayCertPassRate) : '-' }}
              </p>
              <TrendingUp v-if="summary && summary.todayCertPassRate >= 90" class="w-4 h-4 text-success" />
              <TrendingDown v-else-if="summary" class="w-4 h-4 text-danger" />
            </div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp class="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>

      <div class="data-card data-card-success p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">今日查询量</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
              {{ summary ? formatNumber(summary.todayQueryCount) : '-' }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Search class="w-5 h-5 text-success" />
          </div>
        </div>
      </div>

      <div class="data-card data-card-danger p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">近7日活跃用户</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
              {{ summary ? formatNumber(summary.activeUsers7d) : '-' }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Users class="w-5 h-5 text-danger" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">认证通过率趋势（近30天）</h3>
        <v-chart
          v-if="trendData.length"
          :option="trendChartOption"
          autoresize
          style="height: 350px"
        />
        <div v-else-if="!loading" class="h-[350px] flex items-center justify-center text-gray-400 text-sm">
          暂无数据
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-800">待提醒人员</h3>
          <Bell class="w-4 h-4 text-gray-400" />
        </div>
        <div class="text-center py-8">
          <p class="text-4xl font-bold text-primary tabular-nums">
            {{ summary?.pendingReminderCount ?? '-' }}
          </p>
          <p class="text-sm text-gray-500 mt-2">人待发送认证提醒</p>
        </div>
        <div class="space-y-3 mt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">逾期30天以上</span>
            <span class="font-medium text-danger">{{ Math.floor((summary?.pendingReminderCount ?? 0) * 0.35) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: 35%"></div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">逾期15-30天</span>
            <span class="font-medium text-yellow-600">{{ Math.floor((summary?.pendingReminderCount ?? 0) * 0.4) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: 40%; background: linear-gradient(to right, #FAAD14, #FFC53D)"></div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">逾期7-15天</span>
            <span class="font-medium text-accent">{{ Math.floor((summary?.pendingReminderCount ?? 0) * 0.25) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: 25%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
