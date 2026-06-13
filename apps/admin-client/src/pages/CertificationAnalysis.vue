<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { Calendar } from 'lucide-vue-next';
import { adminApi } from '@/api/admin';
import { formatPercent, formatDate } from '@shared/utils';
import type { PassRateTrendPoint } from '@shared/types/admin';

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const timeRange = ref(30);
const trendData = ref<PassRateTrendPoint[]>([]);
const loading = ref(false);

const timeRangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
];

const trendChartOption = computed(() => {
  const dates = trendData.value.map((d) => d.date);
  const passRateData = trendData.value.map((d) => d.passRate);

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 12 },
      formatter(params: any) {
        const p = params[0];
        return `${p.axisValue}<br/>通过率: <b>${p.value}%</b>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
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
      min: (value: { min: number }) => Math.floor(value.min / 10) * 10,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#999', fontSize: 11, formatter: '{value}%' },
    },
    series: [
      {
        name: '通过率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: passRateData,
        areaStyle: { color: 'rgba(10,92,175,0.12)' },
        lineStyle: { color: '#0A5CAF', width: 2 },
        itemStyle: { color: '#0A5CAF' },
      },
    ],
  };
});

async function fetchTrend() {
  loading.value = true;
  try {
    trendData.value = await adminApi.getPassRateTrend(timeRange.value);
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

function handleTimeRangeChange(val: number) {
  timeRange.value = val;
  fetchTrend();
}

onMounted(fetchTrend);
</script>

<template>
  <div class="space-y-5">
    <div class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-800">认证通过率趋势</h3>
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-gray-400" />
          <div class="flex gap-1">
            <button
              v-for="opt in timeRangeOptions"
              :key="opt.value"
              class="px-3 py-1 rounded text-xs transition-colors"
              :class="timeRange === opt.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              @click="handleTimeRangeChange(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

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
      <h3 class="text-base font-semibold text-gray-800 mb-4">数据明细</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm table-striped">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-gray-500 font-medium">日期</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">总数</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">成功</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">失败</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">锁定</th>
              <th class="text-right py-3 px-4 text-gray-500 font-medium">通过率</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in trendData"
              :key="item.date"
              class="border-b border-gray-100"
            >
              <td class="py-3 px-4">{{ formatDate(item.date) }}</td>
              <td class="py-3 px-4 text-right tabular-nums">{{ item.totalCount }}</td>
              <td class="py-3 px-4 text-right tabular-nums text-success">{{ item.successCount }}</td>
              <td class="py-3 px-4 text-right tabular-nums text-danger">{{ item.failCount }}</td>
              <td class="py-3 px-4 text-right tabular-nums text-yellow-600">{{ item.lockedCount }}</td>
              <td class="py-3 px-4 text-right tabular-nums font-medium">
                {{ formatPercent(item.passRate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
