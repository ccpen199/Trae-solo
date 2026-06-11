<template>
  <div class="h-[calc(100vh-10rem)] flex gap-5">
    <div class="w-3/5 card-base overflow-hidden flex flex-col">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <component :is="icons.MapPin" class="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div class="text-xs text-gray-500">起点</div>
              <div class="text-sm font-semibold text-gray-900">{{ form.origin }}</div>
            </div>
          </div>
          <component :is="icons.ArrowRight" class="w-5 h-5 text-gray-300" />
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <component :is="icons.Flag" class="w-4 h-4 text-red-600" />
            </div>
            <div>
              <div class="text-xs text-gray-500">终点</div>
              <div class="text-sm font-semibold text-gray-900">{{ form.destination }}</div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            起点
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            终点
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-alert-500"></span>
            限高限重
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-brand-500"></span>
            检查站
          </span>
        </div>
      </div>

      <div class="flex-1 relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
        <svg class="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600" fill="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 800 600" fill="none">
          <path d="M 120 480 Q 250 400 300 320 T 500 180 T 700 100" stroke="#0052D9" stroke-width="4" stroke-dasharray="8 6" fill="none" />
          <path d="M 120 480 Q 200 350 400 300 T 700 100" stroke="#4787F7" stroke-width="3" stroke-dasharray="6 4" fill="none" opacity="0.5" />
          
          <circle cx="120" cy="480" r="14" fill="#10B981" />
          <circle cx="120" cy="480" r="22" fill="none" stroke="#10B981" stroke-width="2" opacity="0.4" />
          <circle cx="120" cy="480" r="30" fill="none" stroke="#10B981" stroke-width="1" opacity="0.2" />
          
          <circle cx="700" cy="100" r="14" fill="#EF4444" />
          <circle cx="700" cy="100" r="22" fill="none" stroke="#EF4444" stroke-width="2" opacity="0.4" />
          <circle cx="700" cy="100" r="30" fill="none" stroke="#EF4444" stroke-width="1" opacity="0.2" />
          
          <circle cx="300" cy="380" r="12" fill="#FF6A00" />
          <circle cx="500" cy="240" r="12" fill="#FF6A00" />
          
          <circle cx="400" cy="300" r="10" fill="#0052D9" />
        </svg>

        <div class="absolute" style="left: 100px; top: 440px;">
          <div class="bg-white rounded-lg px-3 py-2 shadow-lg text-xs">
            <div class="font-semibold text-green-600">深圳起点</div>
            <div class="text-gray-500">南山区物流中心</div>
          </div>
        </div>
        <div class="absolute" style="left: 680px; top: 50px;">
          <div class="bg-white rounded-lg px-3 py-2 shadow-lg text-xs">
            <div class="font-semibold text-red-600">北京终点</div>
            <div class="text-gray-500">朝阳区卸货点</div>
          </div>
        </div>
        <div class="absolute" style="left: 260px; top: 340px;">
          <div class="bg-alert-500 text-white rounded-lg px-2 py-1 shadow-lg text-xs flex items-center gap-1">
            <component :is="icons.Ruler" class="w-3 h-3" />
            限高4.2m
          </div>
        </div>
        <div class="absolute" style="left: 480px; top: 200px;">
          <div class="bg-alert-500 text-white rounded-lg px-2 py-1 shadow-lg text-xs flex items-center gap-1">
            <component :is="icons.Scale" class="w-3 h-3" />
            限重49t
          </div>
        </div>

        <div class="absolute bottom-4 left-4 bg-black/40 backdrop-blur rounded-lg px-3 py-2 text-white text-xs">
          <div class="flex items-center gap-2">
            <component :is="icons.Map" class="w-4 h-4" />
            实时路况 · 正常
          </div>
        </div>
        <div class="absolute bottom-4 right-4 flex flex-col gap-2">
          <button class="w-9 h-9 bg-white/90 rounded-lg flex items-center justify-center text-gray-700 hover:bg-white">
            <component :is="icons.Plus" class="w-4 h-4" />
          </button>
          <button class="w-9 h-9 bg-white/90 rounded-lg flex items-center justify-center text-gray-700 hover:bg-white">
            <component :is="icons.Minus" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="p-4 border-t border-gray-100 bg-gray-50">
        <div class="grid grid-cols-5 gap-4">
          <div>
            <label class="label-base text-xs">起点城市</label>
            <input v-model="form.origin" type="text" class="input-base py-2 text-sm" />
          </div>
          <div>
            <label class="label-base text-xs">终点城市</label>
            <input v-model="form.destination" type="text" class="input-base py-2 text-sm" />
          </div>
          <div>
            <label class="label-base text-xs">车高 (m)</label>
            <input v-model.number="form.vehicleHeight" type="number" step="0.1" class="input-base py-2 text-sm" />
          </div>
          <div>
            <label class="label-base text-xs">车重 (t)</label>
            <input v-model.number="form.vehicleWeight" type="number" step="0.5" class="input-base py-2 text-sm" />
          </div>
          <div>
            <label class="label-base text-xs">车长 (m)</label>
            <input v-model.number="form.vehicleLength" type="number" step="0.1" class="input-base py-2 text-sm" />
          </div>
        </div>
      </div>
    </div>

    <div class="w-2/5 flex flex-col gap-4 overflow-hidden">
      <div class="card-base p-4 flex-shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900">路线方案对比</h3>
          <span class="text-xs text-gray-500">共 {{ routes.length }} 条方案</span>
        </div>
        <div class="space-y-3 max-h-[calc(100vh-28rem)] overflow-auto pr-1">
          <div
            v-for="(route, index) in routes"
            :key="route.id"
            @click="selectedRouteId = route.id"
            class="p-4 rounded-xl border-2 cursor-pointer transition-all"
            :class="selectedRouteId === route.id ? 'border-brand-500 bg-brand-50/50' : 'border-gray-100 bg-white hover:border-gray-200'"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-900">{{ route.name }}</span>
                <span v-if="index === 0" class="badge badge-success">
                  <component :is="icons.Sparkles" class="w-3 h-3 mr-1" />
                  推荐
                </span>
              </div>
              <span
                class="badge"
                :class="route.riskLevel === 'low' ? 'badge-success' : route.riskLevel === 'medium' ? 'badge-warning' : 'badge-danger'"
              >
                {{ riskLevelMap[route.riskLevel] }}
              </span>
            </div>

            <div class="grid grid-cols-4 gap-2 mb-3 text-center">
              <div class="bg-gray-50 rounded-lg py-2">
                <div class="text-lg font-din font-bold text-gray-900">{{ route.distance }}</div>
                <div class="text-xs text-gray-500">公里</div>
              </div>
              <div class="bg-gray-50 rounded-lg py-2">
                <div class="text-lg font-din font-bold text-gray-900">{{ formatDuration(route.duration) }}</div>
                <div class="text-xs text-gray-500">预计时长</div>
              </div>
              <div class="bg-gray-50 rounded-lg py-2">
                <div class="text-lg font-din font-bold text-brand-600">¥{{ route.tollCost }}</div>
                <div class="text-xs text-gray-500">过路费</div>
              </div>
              <div class="bg-gray-50 rounded-lg py-2">
                <div class="text-lg font-din font-bold text-alert-600">¥{{ route.fuelCost }}</div>
                <div class="text-xs text-gray-500">油费</div>
              </div>
            </div>

            <div class="flex items-center gap-4 mb-3 text-xs">
              <span class="flex items-center gap-1 text-gray-600">
                <component :is="icons.AlertTriangle" class="w-3.5 h-3.5 text-alert-500" />
                风险点 {{ route.restrictionCount }} 处
              </span>
              <span class="flex items-center gap-1 text-gray-600">
                <component :is="icons.Ruler" class="w-3.5 h-3.5 text-gray-500" />
                限高风险 {{ route.heightRiskCount }}
              </span>
              <span class="flex items-center gap-1 text-gray-600">
                <component :is="icons.Scale" class="w-3.5 h-3.5 text-gray-500" />
                限重风险 {{ route.weightRiskCount }}
              </span>
            </div>

            <div v-if="selectedRouteId === route.id" class="pt-3 border-t border-gray-100 space-y-2">
              <div class="text-xs font-medium text-gray-700 mb-2">路线途经风险点详情</div>
              <div
                v-for="wp in route.waypoints.filter(w => w.type === 'restriction')"
                :key="wp.name"
                class="flex items-center gap-2 text-xs bg-alert-50 rounded-lg px-3 py-2"
              >
                <div class="w-6 h-6 rounded bg-alert-500 flex items-center justify-center text-white">
                  <component :is="wp.restriction?.type === 'height' ? icons.Ruler : icons.Scale" class="w-3.5 h-3.5" />
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-800">{{ wp.name }}</div>
                  <div class="text-alert-600">
                    {{ wp.restriction?.type === 'height' ? '限高' : '限重' }} {{ wp.restriction?.value }}{{ wp.restriction?.unit }}
                  </div>
                </div>
              </div>
              <div
                v-for="wp in route.waypoints.filter(w => w.type === 'checkpoint')"
                :key="wp.name"
                class="flex items-center gap-2 text-xs bg-brand-50 rounded-lg px-3 py-2"
              >
                <div class="w-6 h-6 rounded bg-brand-500 flex items-center justify-center text-white">
                  <component :is="icons.MapPin" class="w-3.5 h-3.5" />
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-800">{{ wp.name }}</div>
                  <div class="text-brand-600">途经检查点</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-base p-4 flex-shrink-0">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-sm font-semibold text-gray-900">费用汇总</div>
            <div class="text-xs text-gray-500">基于当前选中方案</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-din font-bold text-brand-600">¥{{ selectedRoute?.totalCost || 0 }}</div>
            <div class="text-xs text-gray-500">预计总成本</div>
          </div>
        </div>
        <button class="btn-primary w-full flex items-center justify-center gap-2">
          <component :is="icons.FilePlus" class="w-4 h-4" />
          一键生成派单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  MapPin, Flag, ArrowRight, Ruler, Scale, Map, Plus, Minus, AlertTriangle, Sparkles, FilePlus
} from 'lucide-vue-next'
import { mockRoutePlans } from '@/mock'
import type { RoutePlan } from '@/types'

const icons = { MapPin, Flag, ArrowRight, Ruler, Scale, Map, Plus, Minus, AlertTriangle, Sparkles, FilePlus }

const form = reactive({
  origin: '深圳市',
  destination: '北京市',
  vehicleHeight: 4.2,
  vehicleWeight: 32,
  vehicleLength: 13
})

const routes: RoutePlan[] = mockRoutePlans
const selectedRouteId = ref(routes[0].id)
const selectedRoute = computed(() => routes.find(r => r.id === selectedRouteId.value))

const riskLevelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m}m`
}
</script>
