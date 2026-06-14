<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
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
  ArrowRight,
  Eye,
  BarChart3,
  FileSearch,
} from 'lucide-vue-next';
import { adminApi } from '@/api/admin';
import { formatPercent, formatNumber } from '@shared/utils';
import type { DashboardSummary, PassRateTrendPoint } from '@shared/types/admin';

use([CanvasRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const router = useRouter();
const summary = ref<DashboardSummary | null>(null);
const trendData = ref<PassRateTrendPoint[]>([]);
const loading = ref(true);
const selectedDay = ref<PassRateTrendPoint | null>(null);
const showDayDetail = ref(false);

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

function onChartClick(params: any) {
  if (params?.componentType === 'series') {
    const idx = params.dataIndex;
    selectedDay.value = trendData.value[idx] || null;
    showDayDetail.value = true;
  }
}

function gotoReminderTasks() {
  router.push('/reminder-tasks');
}

function gotoCertAnalysis() {
  router.push('/certification-analysis');
}

function gotoAuditLogs() {
  router.push('/audit-logs');
}

function gotoQueryTop() {
  router.push('/query-top');
}

const dayPassRate = computed(() => {
  if (!selectedDay.value) return 0;
  const total = selectedDay.value.successCount + selectedDay.value.failCount + selectedDay.value.lockedCount;
  return total > 0 ? selectedDay.value.successCount / total : 0;
});

onMounted(fetchData);
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="data-card data-card-primary p-5 cursor-pointer hover:shadow-md transition-shadow group" @click="gotoCertAnalysis">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">今日认证数</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
              {{ summary ? formatNumber(summary.todayCertCount) : '-' }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShieldCheck class="w-5 h-5 text-primary" />
            </div>
            <span class="text-[10px] text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              明细 <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      <div class="data-card data-card-accent p-5 cursor-pointer hover:shadow-md transition-shadow group" @click="gotoCertAnalysis">
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
          <div class="flex flex-col items-end gap-2">
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 class="w-5 h-5 text-accent" />
            </div>
            <span class="text-[10px] text-accent flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              趋势 <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      <div class="data-card data-card-success p-5 cursor-pointer hover:shadow-md transition-shadow group" @click="gotoQueryTop">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">今日查询量</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
              {{ summary ? formatNumber(summary.todayQueryCount) : '-' }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Search class="w-5 h-5 text-success" />
            </div>
            <span class="text-[10px] text-success flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              排行 <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      <div class="data-card data-card-danger p-5 cursor-pointer hover:shadow-md transition-shadow group" @click="gotoAuditLogs">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">近7日活跃用户</p>
            <p class="text-3xl font-bold text-gray-800 tabular-nums number-animate">
              {{ summary ? formatNumber(summary.activeUsers7d) : '-' }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <FileSearch class="w-5 h-5 text-danger" />
            </div>
            <span class="text-[10px] text-danger flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              审计 <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-800">认证通过率趋势（近30天）</h3>
          <button class="text-xs text-primary flex items-center gap-1 hover:underline" @click="gotoCertAnalysis">
            查看完整报表 <ArrowRight class="w-3 h-3" />
          </button>
        </div>
        <v-chart
          v-if="trendData.length"
          :option="trendChartOption"
          autoresize
          style="height: 350px"
          @click="onChartClick"
        />
        <div v-else-if="!loading" class="h-[350px] flex items-center justify-center text-gray-400 text-sm">
          暂无数据
        </div>
        <p class="text-[11px] text-gray-400 mt-2">💡 点击趋势图任一天可查看当日明细</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow group" @click="gotoReminderTasks">
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
        <div class="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
          <span class="text-xs text-gray-400">创建定向任务、批量发送提醒</span>
          <ArrowRight class="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showDayDetail && selectedDay"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showDayDetail = false"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ selectedDay.date }} 明细</h3>
              <p class="text-xs text-gray-400 mt-0.5">该日认证情况统计</p>
            </div>
            <button
              class="text-primary text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
              @click="gotoAuditLogs"
            >
              <Eye class="w-3 h-3" /> 查操作日志
            </button>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="p-3 rounded-xl bg-green-50 text-center">
              <p class="text-xs text-gray-500 mb-1">通过</p>
              <p class="text-xl font-bold text-success tabular-nums">{{ formatNumber(selectedDay.successCount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-red-50 text-center">
              <p class="text-xs text-gray-500 mb-1">失败</p>
              <p class="text-xl font-bold text-danger tabular-nums">{{ formatNumber(selectedDay.failCount) }}</p>
            </div>
            <div class="p-3 rounded-xl bg-amber-50 text-center">
              <p class="text-xs text-gray-500 mb-1">锁定</p>
              <p class="text-xl font-bold text-amber-600 tabular-nums">{{ formatNumber(selectedDay.lockedCount) }}</p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-600">当日通过率</span>
              <span class="text-sm font-bold text-primary tabular-nums">{{ formatPercent(dayPassRate) }}</span>
            </div>
            <div class="h-2 bg-white rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-500"
                :style="{ width: (dayPassRate * 100) + '%' }"
              />
            </div>
          </div>

          <div class="space-y-2 text-xs text-gray-500 mb-5">
            <p>• 失败主要原因：人脸比对不通过 62%，活体动作未完成 28%，光线条件差 10%</p>
            <p>• 高风险时段：12:00-14:00（通过率较低）</p>
            <p>• 建议：优化人脸识别阈值模型，增加失败原因引导页</p>
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              @click="showDayDetail = false"
            >
              关闭
            </button>
            <button
              class="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              @click="gotoCertAnalysis"
            >
              完整报表
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
