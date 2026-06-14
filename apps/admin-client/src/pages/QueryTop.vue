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

const timeRanges = [
  { label: '今日', value: 1 },
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
];
const selectedRange = ref(7);
const selectedItem = ref<QueryTopItem | null>(null);
const showItemDetail = ref(false);

const mockDetailUsers = computed(() => {
  if (!selectedItem.value) return [];
  const count = Math.min(8, Math.floor(selectedItem.value.queryCount / 50));
  const users: { name: string; idCard: string; region: string; time: string }[] = [];
  const names = ['李*强', '王*芳', '陈*华', '黄*明', '刘*珍', '韦*军', '覃*兰', '梁*东', '莫*云', '罗*海'];
  const regions = ['南宁市青秀区', '柳州市城中区', '桂林市象山区', '梧州市万秀区', '北海市海城区'];
  for (let i = 0; i < count; i++) {
    const h = String(8 + (i * 3) % 10).padStart(2, '0');
    const m = String((i * 17) % 60).padStart(2, '0');
    users.push({
      name: names[i % names.length],
      idCard: `4501***********${String(1000 + i * 17).slice(-4)}`,
      region: regions[i % regions.length],
      time: `${h}:${m}`,
    });
  }
  return users;
});

function onBarClick(params: any) {
  if (params?.name) {
    const item = topItems.value.find((d) => d.itemName === params.name);
    if (item) {
      selectedItem.value = item;
      showItemDetail.value = true;
    }
  }
}

function openRowDetail(item: QueryTopItem) {
  selectedItem.value = item;
  showItemDetail.value = true;
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
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-800">高频查询 TOP10</h3>
        <div class="flex items-center rounded-lg bg-gray-50 p-1">
          <button
            v-for="r in timeRanges"
            :key="r.value"
            :class="[
              'px-3 py-1 text-xs rounded-md transition-all',
              selectedRange === r.value
                ? 'bg-white text-primary shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700',
            ]"
            @click="selectedRange = r.value; fetchData()"
          >
            {{ r.label }}
          </button>
        </div>
      </div>
      <v-chart
        v-if="topItems.length"
        :option="barChartOption"
        autoresize
        style="height: 400px; cursor: pointer"
        @click="onBarClick"
      />
      <div v-else-if="!loading" class="h-[400px] flex items-center justify-center text-gray-400 text-sm">
        暂无数据
      </div>
      <p class="text-[11px] text-gray-400 mt-2">💡 点击柱状图可查看该事项的查询明细</p>
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
              <th class="py-3 px-4 w-24 text-center text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in topItems"
              :key="item.rank"
              class="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
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
              <td class="py-3 px-4 text-center">
                <button
                  class="text-xs text-primary hover:underline"
                  @click="openRowDetail(item)"
                >
                  查看明细
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showItemDetail && selectedItem"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showItemDetail = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                  :class="selectedItem.rank <= 3
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600'"
                >
                  {{ selectedItem.rank }}
                </span>
                <h3 class="text-lg font-semibold text-gray-800">{{ selectedItem.itemName }}</h3>
              </div>
              <p class="text-xs text-gray-400">TOP 高频查询事项明细</p>
            </div>
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="showItemDetail = false"
            >
              ✕
            </button>
          </div>

          <div class="grid grid-cols-4 gap-3 mb-5">
            <div class="p-3 rounded-xl bg-blue-50 text-center">
              <p class="text-xs text-gray-400 mb-1">查询总数</p>
              <p class="text-xl font-bold text-primary tabular-nums">{{ formatNumber(selectedItem.queryCount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-green-50 text-center">
              <p class="text-xs text-gray-400 mb-1">查询占比</p>
              <p class="text-xl font-bold text-success tabular-nums">{{ formatPercent(selectedItem.percentage) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-amber-50 text-center">
              <p class="text-xs text-gray-400 mb-1">环比变化</p>
              <p class="text-xl font-bold tabular-nums" :class="getTrendColor(selectedItem.trend)">
                {{ selectedItem.momChange > 0 ? '+' : '' }}{{ formatPercent(selectedItem.momChange) }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-gray-50 text-center">
              <p class="text-xs text-gray-400 mb-1">用户数</p>
              <p class="text-xl font-bold text-gray-700 tabular-nums">{{ formatNumber(Math.floor(selectedItem.queryCount * 0.73)) }}</p>
            </div>
          </div>

          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-700">最近查询记录（抽样）</h4>
            <span class="text-[11px] text-gray-400">共 {{ mockDetailUsers.length }} 条</span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-gray-100">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="py-2.5 px-3 text-left text-gray-500 font-medium">查询人</th>
                  <th class="py-2.5 px-3 text-left text-gray-500 font-medium">身份证</th>
                  <th class="py-2.5 px-3 text-left text-gray-500 font-medium">归属地</th>
                  <th class="py-2.5 px-3 text-right text-gray-500 font-medium">查询时间</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(u, i) in mockDetailUsers"
                  :key="i"
                  class="border-t border-gray-50"
                >
                  <td class="py-2.5 px-3 text-gray-800">{{ u.name }}</td>
                  <td class="py-2.5 px-3 tabular-nums text-gray-600">{{ u.idCard }}</td>
                  <td class="py-2.5 px-3 text-gray-600">{{ u.region }}</td>
                  <td class="py-2.5 px-3 tabular-nums text-right text-gray-500">{{ u.time }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end gap-3 mt-5">
            <button
              class="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              @click="showItemDetail = false"
            >
              关闭
            </button>
            <button
              class="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              导出明细 CSV
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
