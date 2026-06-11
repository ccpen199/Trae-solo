<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">已对接平台</div>
            <div class="stat-number mt-2">3</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <component :is="icons.Link" class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="badge badge-success flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            连接正常
          </span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">在网车辆数</div>
            <div class="stat-number mt-2">{{ onlineCount }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.Truck" class="w-6 h-6 text-brand-500" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="text-sm text-gray-500">入网率 <span class="font-semibold text-brand-600">{{ onlineRate }}%</span></span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">离线车辆</div>
            <div class="stat-number mt-2">{{ offlineCount }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-alert-50 flex items-center justify-center">
            <component :is="icons.WifiOff" class="w-6 h-6 text-alert-500" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="badge badge-warning">需关注</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-label">数据延迟</div>
            <div class="stat-number mt-2">≤ 30<span class="text-base text-gray-500 ml-1">秒</span></div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <component :is="icons.Activity" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span class="badge badge-success">实时同步</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="card-base lg:col-span-2 flex flex-col">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">车辆监控列表</h3>
            <p class="text-xs text-gray-500 mt-0.5">数据来源：交通运输部货运车辆动态监控平台</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <component :is="icons.Search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input v-model="searchKeyword" type="text" placeholder="搜索车牌号/司机" class="input-base py-2 pl-9 pr-4 text-sm w-48" />
            </div>
            <el-select v-model="statusFilter" size="default" class="w-32">
              <el-option label="全部状态" value="" />
              <el-option label="运行中" value="running" />
              <el-option label="空闲" value="idle" />
              <el-option label="维护中" value="maintenance" />
              <el-option label="离线" value="offline" />
            </el-select>
          </div>
        </div>
        <div class="flex-1 overflow-auto">
          <table class="w-full">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">车牌</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">车型</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">司机</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">最大载重</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">状态</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">当前速度</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">位置</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">上报时间</th>
                <th class="text-left text-xs font-medium text-gray-500 py-3 px-4">对接</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="vehicle in filteredVehicles"
                :key="vehicle.plateNo"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <component :is="icons.Truck" class="w-4 h-4 text-brand-500" />
                    </div>
                    <span class="text-sm font-semibold text-gray-900">{{ vehicle.plateNo }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-700">{{ vehicle.vehicleType }}</td>
                <td class="py-3 px-4">
                  <div class="text-sm text-gray-900">{{ vehicle.driverName }}</div>
                  <div class="text-xs text-gray-500">{{ vehicle.driverPhone }}</div>
                </td>
                <td class="py-3 px-4 text-sm font-din text-gray-900">{{ vehicle.maxWeight }}t</td>
                <td class="py-3 px-4">
                  <span :class="vehicleStatusClass(vehicle.status)" class="badge flex items-center gap-1">
                    <span v-if="vehicle.status === 'running'" class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {{ vehicleStatusText(vehicle.status) }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span v-if="vehicle.currentSpeed !== undefined" class="text-sm font-din font-semibold text-gray-900">
                    {{ vehicle.currentSpeed }} <span class="text-xs font-normal text-gray-500">km/h</span>
                  </span>
                  <span v-else class="text-sm text-gray-400">-</span>
                </td>
                <td class="py-3 px-4">
                  <div v-if="vehicle.currentLocation" class="flex items-center gap-1 text-sm text-gray-700">
                    <component :is="icons.MapPin" class="w-3.5 h-3.5 text-gray-400" />
                    <span class="max-w-32 truncate">{{ vehicle.currentLocation }}</span>
                  </div>
                  <span v-else class="text-sm text-gray-400">-</span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{{ vehicle.lastUpdateTime }}</td>
                <td class="py-3 px-4">
                  <span v-if="vehicle.transportPlatformConnected" class="badge badge-success flex items-center gap-1 w-fit">
                    <component :is="icons.Check" class="w-3 h-3" />
                    已对接
                  </span>
                  <span v-else class="badge badge-danger flex items-center gap-1 w-fit">
                    <component :is="icons.X" class="w-3 h-3" />
                    未对接
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-5 flex flex-col">
        <div class="card-base p-5 flex-shrink-0">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-gray-900">平台对接配置</h3>
              <p class="text-xs text-gray-500 mt-0.5">交通运输部货运平台接入参数</p>
            </div>
            <span class="badge badge-success flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              运行中
            </span>
          </div>
          <div class="space-y-4">
            <div>
              <label class="label-base text-xs">API地址</label>
              <div class="flex items-center gap-2">
                <input type="text" value="https://api.mot.gov.cn/vehicle/v1" class="input-base py-2 text-sm bg-gray-50" readonly />
                <button class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <component :is="icons.Copy" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="label-base text-xs">接入凭证 (AppKey)</label>
              <input type="text" value="DEPPON-HV-2026-88991" class="input-base py-2 text-sm bg-gray-50 font-mono" readonly />
            </div>
            <div>
              <label class="label-base text-xs">数据同步间隔</label>
              <el-select v-model="syncInterval" size="default" class="w-full">
                <el-option label="15 秒" :value="15" />
                <el-option label="30 秒" :value="30" />
                <el-option label="60 秒" :value="60" />
                <el-option label="5 分钟" :value="300" />
              </el-select>
            </div>
            <div class="flex gap-2 pt-2">
              <button class="btn-ghost border border-gray-200 flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
                <component :is="icons.RefreshCw" class="w-4 h-4" />
                测试连接
              </button>
              <button class="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
                <component :is="icons.Save" class="w-4 h-4" />
                保存配置
              </button>
            </div>
          </div>
        </div>

        <div class="card-base flex-1 flex flex-col overflow-hidden min-h-0">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 class="font-semibold text-gray-900">实时数据上报日志</h3>
              <p class="text-xs text-gray-500 mt-0.5">最近上报记录</p>
            </div>
            <button class="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
              <component :is="icons.Download" class="w-3 h-3" />
              导出
            </button>
          </div>
          <div class="flex-1 overflow-auto p-4 space-y-3 font-mono text-xs">
            <div
              v-for="(log, idx) in dataLogs"
              :key="idx"
              class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span
                class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                :class="log.type === 'success' ? 'bg-green-500' : log.type === 'warning' ? 'bg-alert-500' : 'bg-red-500'"
              ></span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">{{ log.time }}</span>
                  <span class="text-gray-700">[{{ log.plateNo }}]</span>
                </div>
                <div class="text-gray-600 mt-0.5">{{ log.message }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Link, Truck, WifiOff, Activity, Search, MapPin, Check, X, Copy, RefreshCw, Save, Download
} from 'lucide-vue-next'
import { mockVehicles } from '@/mock'
import dayjs from 'dayjs'

const icons = { Link, Truck, WifiOff, Activity, Search, MapPin, Check, X, Copy, RefreshCw, Save, Download }

const vehicles = mockVehicles
const searchKeyword = ref('')
const statusFilter = ref('')
const syncInterval = ref(30)

const onlineCount = computed(() => vehicles.filter(v => v.onlineStatus === 'online').length)
const offlineCount = computed(() => vehicles.filter(v => v.onlineStatus === 'offline').length)
const onlineRate = computed(() => Math.round((onlineCount.value / vehicles.length) * 100))

const filteredVehicles = computed(() => {
  return vehicles.filter(v => {
    if (statusFilter.value && v.status !== statusFilter.value) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      return v.plateNo.toLowerCase().includes(kw) || v.driverName.includes(kw)
    }
    return true
  })
})

const dataLogs = reactive([
  { time: dayjs().format('HH:mm:ss'), plateNo: '粤B·A8888', type: 'success', message: '上报位置/速度/状态数据成功 (G4京港澳高速, 72km/h)' },
  { time: dayjs().subtract(8, 'second').format('HH:mm:ss'), plateNo: '沪B·D9999', type: 'success', message: '上报位置/速度/状态数据成功 (G2京沪高速, 65km/h)' },
  { time: dayjs().subtract(15, 'second').format('HH:mm:ss'), plateNo: '京A·F6666', type: 'success', message: '上报心跳数据成功 (空闲状态)' },
  { time: dayjs().subtract(22, 'second').format('HH:mm:ss'), plateNo: '粤B·C5555', type: 'warning', message: '设备超时未上报，已超过2分钟' },
  { time: dayjs().subtract(30, 'second').format('HH:mm:ss'), plateNo: '粤B·A8888', type: 'success', message: '上报位置/速度/状态数据成功' },
  { time: dayjs().subtract(45, 'second').format('HH:mm:ss'), plateNo: '沪B·D9999', type: 'success', message: '上报位置/速度/状态数据成功' },
  { time: dayjs().subtract(1, 'minute').format('HH:mm:ss'), plateNo: '京A·F6666', type: 'success', message: '上报心跳数据成功' },
  { time: dayjs().subtract(90, 'second').format('HH:mm:ss'), plateNo: '粤B·A8888', type: 'success', message: '上报位置/速度/状态数据成功' }
])

function vehicleStatusText(status: string): string {
  const map: Record<string, string> = {
    running: '运行中',
    idle: '空闲',
    maintenance: '维护中',
    offline: '离线'
  }
  return map[status] || status
}

function vehicleStatusClass(status: string): string {
  const map: Record<string, string> = {
    running: 'badge-success',
    idle: 'badge-info',
    maintenance: 'badge-warning',
    offline: 'badge-danger'
  }
  return map[status] || 'badge-info'
}
</script>
