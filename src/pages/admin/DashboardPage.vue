<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">今日订单</div>
            <div class="stat-number mt-2">{{ stats.todayOrders }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.Package" class="w-6 h-6 text-brand-500" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="flex items-center gap-1 text-green-600 text-sm font-medium">
            <component :is="icons.TrendingUp" class="w-4 h-4" />
            12.5%
          </span>
          <span class="text-gray-400 text-sm">较昨日</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">今日营收</div>
            <div class="stat-number mt-2">¥{{ formatNumber(stats.todayRevenue) }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <component :is="icons.Banknote" class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="flex items-center gap-1 text-green-600 text-sm font-medium">
            <component :is="icons.TrendingUp" class="w-4 h-4" />
            8.3%
          </span>
          <span class="text-gray-400 text-sm">较昨日</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">在途车辆</div>
            <div class="stat-number mt-2">{{ stats.activeVehicles }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <component :is="icons.Truck" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="flex items-center gap-1 text-gray-500 text-sm font-medium">
            <component :is="icons.Minus" class="w-4 h-4" />
            持平
          </span>
          <span class="text-gray-400 text-sm">较昨日</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">待处理告警</div>
            <div class="stat-number mt-2">{{ stats.pendingAlerts }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-alert-50 flex items-center justify-center">
            <component :is="icons.AlertTriangle" class="w-6 h-6 text-alert-500" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="flex items-center gap-1 text-red-600 text-sm font-medium">
            <component :is="icons.TrendingUp" class="w-4 h-4" />
            2条
          </span>
          <span class="text-gray-400 text-sm">较昨日新增</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="stat-card cursor-pointer hover:shadow-lg transition-all duration-300" @click="router.push('/admin/vehicles')">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">异常车辆监控</div>
            <div class="stat-number mt-2 text-red-600">异常车辆3辆</div>
            <div class="text-xs text-red-500 mt-1 font-medium">离线超时2h</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <component :is="icons.AlertTriangle" class="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span class="text-xs text-gray-400">需及时处理</span>
          <span class="text-xs text-red-500 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            查看详情
            <component :is="icons.ChevronRight" class="w-3 h-3" />
          </span>
        </div>
      </div>
      <div class="stat-card cursor-pointer hover:shadow-lg transition-all duration-300" @click="router.push('/enterprise/api-docs')">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">ERP直连订单</div>
            <div class="stat-number mt-2 text-blue-600">今日同步328单</div>
            <div class="text-xs text-blue-500 mt-1 font-medium">成功率99.2%</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <component :is="icons.Link2" class="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span class="text-xs text-gray-400">实时同步中</span>
          <span class="text-xs text-blue-500 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            查看详情
            <component :is="icons.ChevronRight" class="w-3 h-3" />
          </span>
        </div>
      </div>
      <div class="stat-card cursor-pointer hover:shadow-lg transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">客户权限管理</div>
            <div class="stat-number mt-2 text-purple-600">授权企业256家</div>
            <div class="text-xs text-purple-500 mt-1 font-medium">5级角色体系</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <component :is="icons.Users" class="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span class="text-xs text-gray-400">权限配置</span>
          <span class="text-xs text-purple-500 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            查看详情
            <component :is="icons.ChevronRight" class="w-3 h-3" />
          </span>
        </div>
      </div>
      <div class="stat-card cursor-pointer hover:shadow-lg transition-all duration-300" @click="router.push('/admin/auditing')">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">对账审计中心</div>
            <div class="stat-number mt-2 text-orange-600">待对账12笔</div>
            <div class="text-xs text-orange-500 mt-1 font-medium">差异率1.2%</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <component :is="icons.FileCheck" class="w-6 h-6 text-orange-500" />
          </div>
        </div>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span class="text-xs text-gray-400">财务审计</span>
          <span class="text-xs text-orange-500 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            查看详情
            <component :is="icons.ChevronRight" class="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="card-base p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">周订单趋势</h3>
            <p class="text-xs text-gray-500 mt-0.5">近7天订单数与营收对比</p>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-brand-500"></span>
              订单数
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-alert-500"></span>
              营收
            </span>
          </div>
        </div>
        <div ref="trendChartRef" class="h-72"></div>
      </div>
      <div class="card-base p-5">
        <div class="mb-4">
          <h3 class="text-base font-semibold text-gray-900">服务类型占比</h3>
          <p class="text-xs text-gray-500 mt-0.5">本月各服务类型订单分布</p>
        </div>
        <div ref="pieChartRef" class="h-72"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="card-base p-5">
        <div class="mb-4">
          <h3 class="text-base font-semibold text-gray-900">告警类型分布</h3>
          <p class="text-xs text-gray-500 mt-0.5">近30天各类告警数量统计</p>
        </div>
        <div ref="alertChartRef" class="h-64"></div>
      </div>
      <div class="card-base p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">实时在途车辆</h3>
            <p class="text-xs text-gray-500 mt-0.5">当前正在运输的车辆状态</p>
          </div>
          <router-link to="/admin/vehicles" class="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
            查看全部
            <component :is="icons.ChevronRight" class="w-3 h-3" />
          </router-link>
        </div>
        <div class="space-y-3 max-h-64 overflow-auto">
          <div
            v-for="vehicle in runningVehicles"
            :key="vehicle.plateNo"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <component :is="icons.Truck" class="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">{{ vehicle.plateNo }}</div>
                <div class="text-xs text-gray-500">{{ vehicle.currentLocation }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-din font-bold text-gray-900">{{ vehicle.currentSpeed }} <span class="text-xs font-normal text-gray-500">km/h</span></div>
              <span class="badge badge-success">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                运行中
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-base p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">最新告警</h3>
          <p class="text-xs text-gray-500 mt-0.5">需及时处理的运输异常事件</p>
        </div>
        <button class="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
          处理全部
          <component :is="icons.ChevronRight" class="w-3 h-3" />
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">级别</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">类型</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">运单号</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">位置</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">告警信息</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">时间</th>
              <th class="text-left text-xs font-medium text-gray-500 py-3 px-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="alert in alerts"
              :key="alert.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-2">
                <span :class="alert.level === 'critical' ? 'badge badge-danger' : 'badge badge-warning'">
                  {{ alert.level === 'critical' ? '严重' : '预警' }}
                </span>
              </td>
              <td class="py-3 px-2 text-sm text-gray-700">{{ alertTypeMap[alert.type] }}</td>
              <td class="py-3 px-2 text-sm font-medium text-brand-600">{{ alert.waybillNo }}</td>
              <td class="py-3 px-2 text-sm text-gray-700">{{ alert.location }}</td>
              <td class="py-3 px-2 text-sm text-gray-600 max-w-xs truncate">{{ alert.message }}</td>
              <td class="py-3 px-2 text-sm text-gray-500">{{ alert.timestamp }}</td>
              <td class="py-3 px-2">
                <button
                  v-if="!alert.acknowledged"
                  class="text-xs text-brand-500 hover:text-brand-600 font-medium hover:underline"
                  @click="router.push(`/tracking?waybillNo=${alert.waybillNo}`)"
                >
                  确认处理
                </button>
                <span v-else class="text-xs text-gray-400">已处理</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { Package, Banknote, Truck, AlertTriangle, TrendingUp, Minus, ChevronRight, Link2, Users, FileCheck } from 'lucide-vue-next'
import { mockDashboardStats, mockAlerts, mockVehicles } from '@/mock'
import { useRouter } from 'vue-router'

const icons = { Package, Banknote, Truck, AlertTriangle, TrendingUp, Minus, ChevronRight, Link2, Users, FileCheck }
const router = useRouter()

const stats = mockDashboardStats
const alerts = mockAlerts
const runningVehicles = computed(() => mockVehicles.filter(v => v.status === 'running'))

const alertTypeMap: Record<string, string> = {
  temperature: '温度告警',
  humidity: '湿度告警',
  vibration: '震动告警',
  geo: '地理围栏'
}

const trendChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
const alertChartRef = ref<HTMLElement | null>(null)

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

onMounted(() => {
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      grid: { left: 40, right: 60, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: stats.weeklyOrderTrend.map(d => d.date),
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#9CA3AF', fontSize: 12 }
      },
      yAxis: [
        {
          type: 'value',
          name: '订单数',
          nameTextStyle: { color: '#9CA3AF', fontSize: 11 },
          splitLine: { lineStyle: { color: '#F3F4F6' } },
          axisLabel: { color: '#9CA3AF', fontSize: 12 }
        },
        {
          type: 'value',
          name: '营收(万)',
          nameTextStyle: { color: '#9CA3AF', fontSize: 11 },
          splitLine: { show: false },
          axisLabel: { color: '#9CA3AF', fontSize: 12, formatter: (v: number) => (v / 10000).toFixed(0) }
        }
      ],
      series: [
        {
          name: '订单数',
          type: 'bar',
          data: stats.weeklyOrderTrend.map(d => d.count),
          itemStyle: { color: '#0052D9', borderRadius: [4, 4, 0, 0] },
          barWidth: 24
        },
        {
          name: '营收',
          type: 'line',
          yAxisIndex: 1,
          data: stats.weeklyOrderTrend.map(d => d.revenue),
          smooth: true,
          lineStyle: { color: '#FF6A00', width: 3 },
          itemStyle: { color: '#FF6A00' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 106, 0, 0.25)' },
              { offset: 1, color: 'rgba(255, 106, 0, 0)' }
            ])
          }
        }
      ]
    })
  }

  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#6B7280', fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: stats.serviceDistribution,
        color: ['#0052D9', '#4787F7', '#FF6A00', '#75A5F9']
      }]
    })
  }

  if (alertChartRef.value) {
    const chart = echarts.init(alertChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: stats.alertDistribution.map(d => d.type),
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#9CA3AF', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#F3F4F6' } },
        axisLabel: { color: '#9CA3AF', fontSize: 12 }
      },
      series: [{
        type: 'bar',
        data: stats.alertDistribution.map(d => ({
          value: d.count,
          itemStyle: { color: d.level === 'critical' ? '#EF4444' : '#FF6A00', borderRadius: [4, 4, 0, 0] }
        })),
        barWidth: 32
      }]
    })
  }
})
</script>
