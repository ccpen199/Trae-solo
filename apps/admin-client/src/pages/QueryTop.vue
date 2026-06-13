<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next';
import { adminApi } from '@/api/admin';
import { formatPercent, formatNumber } from '@shared/utils';
import type { QueryTopItem, QueryTopTrend } from '@shared/types/admin';

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent]);

const topItems = ref<QueryTopItem[]>([]);
const loading = ref(true);

const barChartOption = computed(() => {
  const sorted = [...topItems.value].sort((a, b) => a.queryCount - b.queryCount);
  const names = sorted.map((d) => d.itemName);
  const values = sorted.map((d) => d.queryCount);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#999', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#666', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 20,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#0A5CAF' },
              { offset: 1, color: '#1890FF' },
            ],
          },
        },
      },
    ],
  };
});

function getTrendIcon(trend: QueryTopTrend) {
  if (trend === 'UP') return TrendingUp;
  if (trend === 'DOWN') return TrendingDown;
  return Minus;
}

function getTrendColor(trend: QueryTopTrend) {
  if (trend === 'UP') return 'text-success';
  if (trend === 'DOWN') return 'text-danger';
  return 'text-gray-400';
}

async function fetchData() {
  loading.value = true;
  try {
    topItems.value = await adminApi.getQueryTop();
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="space-y-5">
    <div class="bg-white rounded-lg shadow-sm p-5">
      <h3 class="text-base font-semibold text-gray-800 mb-4">高频查询 TOP10</h3>
      <v-chart
        v-if="topItems.length"
        :option="barChartOption"
        autoresize
        style="height: 400px"
      />
      <div v-else-if="!loading" class="h-[400px] flex items-center justify-center text-gray-400 text-sm">
        暂无数据
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-5">
      <h3 class="text-base font-semibold text-gray-800 mb-4">排名详情</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-gray-500 font-medium w-16">排名</th>
              <th class="text-left py-3 px-4 text-gray-500 font-medium">查询事项</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">查询次数</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">占比</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium w-28">环比变化</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in topItems"
              :key="item.rank"
              class="border-b border-gray-100"
            >
              <td class="py-3 px-4">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                  :class="item.rank <= 3
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600'"
                >
                  {{ item.rank }}
                </span>
              </td>
              <td class="py-3 px-4 font-medium text-gray-800">{{ item.itemName }}</td>
              <td class="py-3 px-4 text-right tabular-nums">{{ formatNumber(item.queryCount) }}</td>
              <td class="py-3 px-4 text-right tabular-nums">{{ formatPercent(item.percentage) }}</td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <component
                    :is="getTrendIcon(item.trend)"
                    class="w-3.5 h-3.5"
                    :class="getTrendColor(item.trend)"
                  />
                  <span
                    class="tabular-nums text-xs font-medium"
                    :class="getTrendColor(item.trend)"
                  >
                    {{ item.momChange > 0 ? '+' : '' }}{{ formatPercent(item.momChange) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
