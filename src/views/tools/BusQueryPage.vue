<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { EChartsOption } from 'echarts'
import {
  ArrowLeft,
  Bus,
  Search,
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

type QueryType = 'line' | 'station' | 'realTime'
const activeTab = ref<QueryType>('line')

const lineForm = reactive({
  lineNumber: '',
})

const stationForm = reactive({
  stationName: '',
})

const realTimeForm = reactive({
  lineNumber: '',
  stationName: '',
})

const searched = ref(false)
const loading = ref(false)

interface BusLine {
  id: string
  name: string
  startStation: string
  endStation: string
  firstBus: string
  lastBus: string
  price: string
  interval: string
  stations: string[]
}

interface BusStation {
  id: string
  name: string
  lines: string[]
  address: string
}

interface ArrivalInfo {
  lineName: string
  direction: string
  nextBus: {
    plateNumber: string
    distanceStations: number
    distanceMeters: number
    arriveTime: number
  } | null
  followingBus?: {
    plateNumber: string
    distanceStations: number
    arriveTime: number
  } | null
  currentStation?: string
}

const mockLines: BusLine[] = [
  {
    id: 'b1',
    name: '1路',
    startStation: '火车站',
    endStation: '政务中心',
    firstBus: '06:00',
    lastBus: '22:00',
    price: '2元',
    interval: '8-12分钟',
    stations: ['火车站', '汽车站', '人民公园', '市政府', '百货大楼', '中心医院', '文化广场', '政务中心'],
  },
  {
    id: 'b2',
    name: '2路',
    startStation: '大学城',
    endStation: '工业开发区',
    firstBus: '06:30',
    lastBus: '21:30',
    price: '2元',
    interval: '10-15分钟',
    stations: ['大学城', '体育中心', '图书馆', '博物馆', '人民广场', '商业步行街', '工业开发区'],
  },
  {
    id: 'b3',
    name: '3路',
    startStation: '汽车东站',
    endStation: '西山公园',
    firstBus: '06:00',
    lastBus: '21:00',
    price: '1元',
    interval: '15-20分钟',
    stations: ['汽车东站', '农贸市场', '第二中学', '儿童乐园', '中医院', '西山公园'],
  },
  {
    id: 'b11',
    name: '11路',
    startStation: '高新区',
    endStation: '老城区',
    firstBus: '06:00',
    lastBus: '22:30',
    price: '2元',
    interval: '6-10分钟',
    stations: ['高新区', '科技园区', '创业大厦', '金融中心', '市政府', '人民医院', '老城区'],
  },
]

const mockStations: BusStation[] = [
  {
    id: 's1',
    name: '市政府站',
    lines: ['1路', '11路', '快1线'],
    address: '抚州市临川区赣东大道市政府门口',
  },
  {
    id: 's2',
    name: '人民公园站',
    lines: ['1路', '3路', '5路'],
    address: '抚州市临川区公园路人民公园南门',
  },
  {
    id: 's3',
    name: '文化广场站',
    lines: ['1路', '2路', '7路', '9路'],
    address: '抚州市临川区临川大道文化广场东侧',
  },
  {
    id: 's4',
    name: '中心医院站',
    lines: ['1路', '4路', '6路'],
    address: '抚州市临川区文昌大道中心医院门诊楼前',
  },
]

const searchResults = ref<BusLine[]>([])
const stationResults = ref<BusStation[]>([])
const arrivalResults = ref<ArrivalInfo[]>([])

function searchLines() {
  if (!lineForm.lineNumber.trim()) {
    ElMessage.warning('请输入公交线路号')
    return
  }
  loading.value = true
  setTimeout(() => {
    const keyword = lineForm.lineNumber.trim()
    searchResults.value = mockLines.filter((l) => l.name.includes(keyword))
    searched.value = true
    loading.value = false
    if (searchResults.value.length === 0) {
      ElMessage.info('未找到相关公交线路')
    }
  }, 600)
}

function searchStations() {
  if (!stationForm.stationName.trim()) {
    ElMessage.warning('请输入站点名称')
    return
  }
  loading.value = true
  setTimeout(() => {
    const keyword = stationForm.stationName.trim()
    stationResults.value = mockStations.filter((s) => s.name.includes(keyword))
    searched.value = true
    loading.value = false
    if (stationResults.value.length === 0) {
      ElMessage.info('未找到相关站点')
    }
  }, 600)
}

function queryRealTime() {
  if (!realTimeForm.lineNumber.trim()) {
    ElMessage.warning('请输入公交线路号')
    return
  }
  loading.value = true
  setTimeout(() => {
    arrivalResults.value = [
      {
        lineName: realTimeForm.lineNumber + '路',
        direction: '开往政务中心方向',
        nextBus: {
          plateNumber: '赣F·12345',
          distanceStations: 2,
          distanceMeters: 800,
          arriveTime: 5,
        },
        followingBus: {
          plateNumber: '赣F·67890',
          distanceStations: 5,
          arriveTime: 12,
        },
        currentStation: '人民公园站',
      },
      {
        lineName: realTimeForm.lineNumber + '路',
        direction: '开往火车站方向',
        nextBus: {
          plateNumber: '赣F·54321',
          distanceStations: 3,
          distanceMeters: 1200,
          arriveTime: 8,
        },
        currentStation: '百货大楼站',
      },
    ]
    searched.value = true
    loading.value = false
    ElMessage.success('实时信息已更新')
  }, 800)
}

function refreshRealTime() {
  queryRealTime()
}

function goBack() {
  router.push('/tools')
}

function getStatusColor(arriveTime: number) {
  if (arriveTime <= 3) return 'text-accent-green'
  if (arriveTime <= 8) return 'text-gov-blue'
  return 'text-neutral-500'
}

function getStatusBg(arriveTime: number) {
  if (arriveTime <= 3) return 'bg-accent-green/10'
  if (arriveTime <= 8) return 'bg-gov-blue/10'
  return 'bg-neutral-100'
}
</script>

<template>
  <div class="container py-8">
    <button @click="goBack" class="flex items-center gap-2 text-neutral-500 hover:text-gov-blue mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4" />
      <span>返回工具列表</span>
    </button>

    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Bus class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-800">公交查询</h1>
      </div>
      <p class="text-neutral-500 ml-13">查询公交线路、站点信息和实时到站</p>
    </div>

    <div class="card mb-6">
      <div class="flex border-b border-neutral-100 -mx-5 -mt-5 mb-5 px-5">
        <button
          @click="activeTab = 'line'; searched = false"
          :class="[
            'py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'line' ? 'border-gov-blue text-gov-blue' : 'border-transparent text-neutral-500 hover:text-neutral-700',
          ]"
        >
          <Bus class="w-4 h-4 inline mr-1.5" />
          线路查询
        </button>
        <button
          @click="activeTab = 'station'; searched = false"
          :class="[
            'py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'station' ? 'border-gov-blue text-gov-blue' : 'border-transparent text-neutral-500 hover:text-neutral-700',
          ]"
        >
          <MapPin class="w-4 h-4 inline mr-1.5" />
          站点查询
        </button>
        <button
          @click="activeTab = 'realTime'; searched = false"
          :class="[
            'py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'realTime' ? 'border-gov-blue text-gov-blue' : 'border-transparent text-neutral-500 hover:text-neutral-700',
          ]"
        >
          <Clock class="w-4 h-4 inline mr-1.5" />
          实时到站
        </button>
      </div>

      <div v-if="activeTab === 'line'">
        <div class="flex gap-3 mb-4">
          <div class="flex-1 relative">
            <el-input v-model="lineForm.lineNumber" placeholder="请输入公交线路号，如：1、11" class="w-full" @keyup.enter="searchLines">
              <template #prefix>
                <Bus class="w-4 h-4 text-neutral-400" />
              </template>
            </el-input>
          </div>
          <button @click="searchLines" :disabled="loading" class="btn-primary px-6 flex items-center gap-2">
            <Search v-if="!loading" class="w-4 h-4" />
            <RefreshCw v-else class="w-4 h-4 animate-spin" />
            查询
          </button>
        </div>

        <div class="text-sm text-neutral-500 mb-4">
          <span class="text-neutral-400">热门线路：</span>
          <button
            v-for="line in ['1路', '2路', '11路', '快1线']"
            :key="line"
            @click="lineForm.lineNumber = line.replace(/[^\d]/g, ''); searchLines()"
            class="ml-2 px-2 py-0.5 bg-neutral-100 hover:bg-gov-blue/10 hover:text-gov-blue rounded transition-colors"
          >
            {{ line }}
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'station'">
        <div class="flex gap-3 mb-4">
          <div class="flex-1 relative">
            <el-input v-model="stationForm.stationName" placeholder="请输入站点名称，如：市政府、人民公园" class="w-full" @keyup.enter="searchStations">
              <template #prefix>
                <MapPin class="w-4 h-4 text-neutral-400" />
              </template>
            </el-input>
          </div>
          <button @click="searchStations" :disabled="loading" class="btn-primary px-6 flex items-center gap-2">
            <Search v-if="!loading" class="w-4 h-4" />
            <RefreshCw v-else class="w-4 h-4 animate-spin" />
            查询
          </button>
        </div>

        <div class="text-sm text-neutral-500 mb-4">
          <span class="text-neutral-400">热门站点：</span>
          <button
            v-for="station in ['市政府', '人民公园', '文化广场']"
            :key="station"
            @click="stationForm.stationName = station; searchStations()"
            class="ml-2 px-2 py-0.5 bg-neutral-100 hover:bg-gov-blue/10 hover:text-gov-blue rounded transition-colors"
          >
            {{ station }}
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'realTime'">
        <div class="flex gap-3 mb-4">
          <div class="flex-1">
            <label class="block text-xs text-neutral-500 mb-1">公交线路</label>
            <el-input v-model="realTimeForm.lineNumber" placeholder="线路号，如：1、11" class="w-full" />
          </div>
          <div class="flex-1">
            <label class="block text-xs text-neutral-500 mb-1">上车站点</label>
            <el-input v-model="realTimeForm.stationName" placeholder="站点名称，选填" class="w-full" />
          </div>
          <div class="flex items-end">
            <button @click="queryRealTime" :disabled="loading" class="btn-primary px-6 flex items-center gap-2">
              <Search v-if="!loading" class="w-4 h-4" />
              <RefreshCw v-else class="w-4 h-4 animate-spin" />
              查询
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="searched && activeTab === 'line'">
      <div v-if="searchResults.length === 0" class="card text-center py-12">
        <AlertCircle class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p class="text-neutral-500">未找到相关公交线路</p>
        <p class="text-sm text-neutral-400 mt-1">请检查线路号是否正确</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="line in searchResults"
          :key="line.id"
          class="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gov-blue/10 rounded-xl flex items-center justify-center">
                <span class="text-lg font-bold text-gov-blue">{{ line.name }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-semibold text-neutral-800">{{ line.startStation }}</span>
                  <ChevronRight class="w-4 h-4 text-neutral-400" />
                  <span class="font-semibold text-neutral-800">{{ line.endStation }}</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-neutral-500">
                  <span class="flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5" />
                    {{ line.firstBus }}-{{ line.lastBus }}
                  </span>
                  <span>票价：{{ line.price }}</span>
                  <span>发车间隔：{{ line.interval }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-neutral-50 rounded-lg p-4">
            <p class="text-sm text-neutral-500 mb-2">途经站点（共 {{ line.stations.length }} 站）</p>
            <div class="flex items-center flex-wrap gap-1">
              <div
                v-for="(station, index) in line.stations"
                :key="station"
                class="flex items-center"
              >
                <span class="text-sm text-neutral-600">{{ station }}</span>
                <span v-if="index < line.stations.length - 1" class="text-neutral-300 mx-1">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="searched && activeTab === 'station'">
      <div v-if="stationResults.length === 0" class="card text-center py-12">
        <AlertCircle class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p class="text-neutral-500">未找到相关站点</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="station in stationResults"
          :key="station.id"
          class="card hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-accent-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin class="w-5 h-5 text-accent-green" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-neutral-800 mb-1">{{ station.name }}</h4>
              <p class="text-sm text-neutral-500 mb-3 flex items-center gap-1">
                <Navigation class="w-3.5 h-3.5" />
                {{ station.address }}
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="line in station.lines"
                  :key="line"
                  class="px-2.5 py-1 bg-gov-blue/10 text-gov-blue text-xs rounded-md font-medium"
                >
                  {{ line }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="searched && activeTab === 'realTime'">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-neutral-700">实时到站信息</h3>
        <button @click="refreshRealTime" :disabled="loading" class="text-sm text-gov-blue flex items-center gap-1">
          <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
          刷新
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="(arrival, index) in arrivalResults"
          :key="index"
          class="card"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gov-blue rounded-xl flex items-center justify-center">
                <Bus class="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 class="font-semibold text-neutral-800">{{ arrival.lineName }}</h4>
                <p class="text-sm text-neutral-500">{{ arrival.direction }}</p>
              </div>
            </div>
            <div v-if="arrival.nextBus" :class="['px-4 py-2 rounded-lg text-center', getStatusBg(arrival.nextBus.arriveTime)]">
              <p :class="['text-2xl font-bold', getStatusColor(arrival.nextBus.arriveTime)]">
                {{ arrival.nextBus.arriveTime }}
                <span class="text-sm font-normal">分钟</span>
              </p>
              <p class="text-xs text-neutral-500">下一班</p>
            </div>
          </div>

          <div v-if="arrival.nextBus" class="bg-neutral-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <CheckCircle class="w-4 h-4 text-accent-green" />
                <span class="text-sm font-medium text-neutral-700">下一班：{{ arrival.nextBus.plateNumber }}</span>
              </div>
              <span class="text-sm text-neutral-500">距本站 {{ arrival.nextBus.distanceStations }} 站 / {{ arrival.nextBus.distanceMeters }}米</span>
            </div>

            <div v-if="arrival.followingBus" class="flex items-center justify-between pt-3 border-t border-neutral-200">
              <div class="flex items-center gap-2">
                <Clock class="w-4 h-4 text-neutral-400" />
                <span class="text-sm text-neutral-600">后续班：{{ arrival.followingBus.plateNumber }}</span>
              </div>
              <span class="text-sm text-neutral-500">{{ arrival.followingBus.arriveTime }} 分钟后到达</span>
            </div>

            <div v-if="arrival.currentStation" class="mt-3 pt-3 border-t border-neutral-200">
              <p class="text-sm text-neutral-500">
                <span class="text-neutral-400">当前位置：</span>
                <span class="text-gov-blue font-medium">{{ arrival.currentStation }}</span>
              </p>
            </div>
          </div>

          <div v-else class="bg-neutral-50 rounded-lg p-4 text-center">
            <XCircle class="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p class="text-sm text-neutral-500">暂无到站信息</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
