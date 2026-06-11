<template>
  <div class="space-y-5">
    <div class="card-base p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">大件运输路由规划</h2>
          <p class="text-xs text-gray-500 mt-1">智能规划最优路线，避开限高限重限行区域</p>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            起点
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            终点
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            限高点
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            限重点
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
            限行点
          </span>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label class="label-base text-xs">起点城市</label>
          <el-input v-model="form.origin" placeholder="请输入起点" :prefix-icon="icons.MapPin" size="default" class="mt-1" />
        </div>
        <div>
          <label class="label-base text-xs">终点城市</label>
          <el-input v-model="form.destination" placeholder="请输入终点" :prefix-icon="icons.Flag" size="default" class="mt-1" />
        </div>
        <div>
          <label class="label-base text-xs">货物重量 (kg)</label>
          <el-input-number v-model="form.cargoWeight" :min="0" :step="100" size="default" class="w-full mt-1" />
        </div>
        <div>
          <label class="label-base text-xs">货物体积 (m³)</label>
          <el-input-number v-model="form.cargoVolume" :min="0" :step="0.5" :precision="1" size="default" class="w-full mt-1" />
        </div>
        <div>
          <label class="label-base text-xs">车辆高度 (m)</label>
          <el-input-number v-model="form.vehicleHeight" :min="0" :step="0.1" :precision="1" size="default" class="w-full mt-1" />
        </div>
        <div>
          <label class="label-base text-xs">车辆重量 (t)</label>
          <el-input-number v-model="form.vehicleWeight" :min="0" :step="0.5" :precision="1" size="default" class="w-full mt-1" />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <el-button type="primary" size="default" @click="searchRoutes" :loading="searching">
          <component :is="icons.Search" class="w-4 h-4 mr-1" />
          搜索路线
        </el-button>
      </div>
    </div>

    <div class="flex gap-5">
      <div class="w-2/5 flex flex-col gap-4">
        <div class="card-base p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900">路线方案对比</h3>
            <span class="text-xs text-gray-500">共 {{ routePlans.length }} 条方案</span>
          </div>
          <el-tabs v-model="activeTab" type="card" class="route-tabs">
            <el-tab-pane label="方案列表" name="list">
              <div class="space-y-3 max-h-[calc(100vh-32rem)] overflow-auto pr-1">
                <div
                  v-for="(plan, index) in routePlans"
                  :key="plan.id"
                  @click="selectedPlanId = plan.id"
                  class="p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                  :class="selectedPlanId === plan.id ? 'border-brand-500 bg-brand-50/50' : 'border-gray-100 bg-white hover:border-gray-200'"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        :class="getPlanColorClass(index)"
                      >
                        {{ String.fromCharCode(65 + index) }}
                      </span>
                      <span class="font-semibold text-gray-900">{{ plan.name }}</span>
                      <span v-if="plan.isRecommended" class="badge badge-success">
                        <component :is="icons.Sparkles" class="w-3 h-3 mr-1" />
                        推荐
                      </span>
                    </div>
                    <span
                      class="badge"
                      :class="plan.riskLevel === 'low' ? 'badge-success' : plan.riskLevel === 'medium' ? 'badge-warning' : 'badge-danger'"
                    >
                      {{ riskLevelMap[plan.riskLevel] }}
                    </span>
                  </div>

                  <p class="text-xs text-gray-500 mb-3">{{ plan.description }}</p>

                  <div class="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div class="bg-gray-50 rounded-lg py-2">
                      <div class="text-base font-din font-bold text-gray-900">{{ plan.distance }}</div>
                      <div class="text-xs text-gray-500">总距离(km)</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg py-2">
                      <div class="text-base font-din font-bold text-gray-900">{{ formatDuration(plan.estimatedTime) }}</div>
                      <div class="text-xs text-gray-500">预计时间</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg py-2">
                      <div class="text-base font-din font-bold text-brand-600">¥{{ plan.estimatedCost }}</div>
                      <div class="text-xs text-gray-500">预估费用</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 mb-3 text-xs">
                    <span class="flex items-center gap-1 text-red-600">
                      <component :is="icons.Ruler" class="w-3.5 h-3.5" />
                      限高 {{ plan.heightRestrictionCount }} 处
                    </span>
                    <span class="flex items-center gap-1 text-blue-600">
                      <component :is="icons.Scale" class="w-3.5 h-3.5" />
                      限重 {{ plan.weightRestrictionCount }} 处
                    </span>
                    <span class="flex items-center gap-1 text-yellow-600">
                      <component :is="icons.AlertCircle" class="w-3.5 h-3.5" />
                      限行 {{ plan.trafficRestrictionCount }} 处
                    </span>
                  </div>

                  <div v-if="selectedPlanId === plan.id" class="pt-3 border-t border-gray-100">
                    <div class="text-xs font-medium text-gray-700 mb-2">风险点详情</div>
                    <div class="space-y-2 max-h-48 overflow-auto">
                      <div
                        v-for="point in plan.riskPoints"
                        :key="point.id"
                        class="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                        :class="getRiskPointBgClass(point.type)"
                        @click.stop="selectedRiskPoint = point"
                      >
                        <div
                          class="w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0"
                          :class="getRiskPointColorClass(point.type)"
                        >
                          <component :is="getRiskPointIcon(point.type)" class="w-3.5 h-3.5" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-gray-800">{{ point.location }}</div>
                          <div :class="getRiskPointTextClass(point.type)">
                            {{ point.description }}
                          </div>
                          <div v-if="point.detour" class="text-gray-500 mt-1 flex items-center gap-1">
                            <component :is="icons.Route" class="w-3 h-3" />
                            绕行建议: {{ point.detour }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="方案详情" name="detail">
              <div v-if="selectedPlan" class="space-y-4">
                <div class="bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-gray-900">{{ selectedPlan.name }}</span>
                    <span v-if="selectedPlan.isRecommended" class="badge badge-success">
                      <component :is="icons.Sparkles" class="w-3 h-3 mr-1" />
                      推荐
                    </span>
                  </div>
                  <p class="text-xs text-gray-600">{{ selectedPlan.description }}</p>
                </div>

                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item label="总距离">
                    <span class="font-semibold">{{ selectedPlan.distance }} km</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="预计时间">
                    <span class="font-semibold">{{ formatDuration(selectedPlan.estimatedTime) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="预估费用">
                    <span class="font-semibold text-brand-600">¥{{ selectedPlan.estimatedCost }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="风险等级">
                    <span
                      class="badge"
                      :class="selectedPlan.riskLevel === 'low' ? 'badge-success' : selectedPlan.riskLevel === 'medium' ? 'badge-warning' : 'badge-danger'"
                    >
                      {{ riskLevelMap[selectedPlan.riskLevel] }}
                    </span>
                  </el-descriptions-item>
                </el-descriptions>

                <div>
                  <div class="text-sm font-medium text-gray-700 mb-2">途经主要路段</div>
                  <div class="space-y-2">
                    <div
                      v-for="(segment, idx) in selectedPlan.segments"
                      :key="idx"
                      class="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div class="w-2 h-2 rounded-full bg-brand-500"></div>
                      <span class="flex-1">{{ segment.road }}</span>
                      <span class="text-gray-500">{{ segment.distance }}km</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-12 text-gray-400">
                <component :is="icons.Map" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p class="text-sm">请先选择一个路线方案</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <div class="w-3/5 flex flex-col gap-4">
        <div class="card-base p-4 flex-1 overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900">路线可视化地图</h3>
            <div class="flex items-center gap-2">
              <span v-for="(plan, index) in routePlans" :key="plan.id" class="flex items-center gap-1 text-xs">
                <span
                  class="w-3 h-1 rounded-full"
                  :class="getPlanLineColorClass(index)"
                ></span>
                方案{{ String.fromCharCode(65 + index) }}
              </span>
            </div>
          </div>
          <div class="relative h-[calc(100vh-30rem)] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-xl overflow-hidden">
            <svg class="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600" fill="none">
              <defs>
                <pattern id="grid-routing" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-routing)" />
            </svg>

            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 800 600" fill="none">
              <path
                d="M 100 500 Q 200 450 280 380 T 420 280 T 560 180 T 700 100"
                stroke="#0052D9"
                stroke-width="4"
                stroke-dasharray="8 6"
                fill="none"
                :opacity="selectedPlanId === 'plan-a' ? 1 : 0.3"
              />
              <path
                d="M 100 500 Q 180 420 320 350 T 520 220 T 700 100"
                stroke="#10B981"
                stroke-width="3"
                stroke-dasharray="6 4"
                fill="none"
                :opacity="selectedPlanId === 'plan-b' ? 1 : 0.3"
              />
              <path
                d="M 100 500 Q 250 480 350 420 T 480 350 T 600 250 T 700 100"
                stroke="#F59E0B"
                stroke-width="3"
                stroke-dasharray="4 4"
                fill="none"
                :opacity="selectedPlanId === 'plan-c' ? 1 : 0.3"
              />

              <circle cx="100" cy="500" r="14" fill="#10B981" />
              <circle cx="100" cy="500" r="22" fill="none" stroke="#10B981" stroke-width="2" opacity="0.4" />
              <circle cx="100" cy="500" r="30" fill="none" stroke="#10B981" stroke-width="1" opacity="0.2" />

              <circle cx="700" cy="100" r="14" fill="#EF4444" />
              <circle cx="700" cy="100" r="22" fill="none" stroke="#EF4444" stroke-width="2" opacity="0.4" />
              <circle cx="700" cy="100" r="30" fill="none" stroke="#EF4444" stroke-width="1" opacity="0.2" />

              <g @click="showRiskPointDetail(restrictionPoints[0])" class="cursor-pointer">
                <circle cx="280" cy="380" r="14" fill="#EF4444" />
                <text x="280" y="384" text-anchor="middle" fill="white" font-size="10" font-weight="bold">4.5</text>
              </g>
              <g @click="showRiskPointDetail(restrictionPoints[1])" class="cursor-pointer">
                <circle cx="450" cy="250" r="14" fill="#EF4444" />
                <text x="450" y="254" text-anchor="middle" fill="white" font-size="10" font-weight="bold">4.2</text>
              </g>

              <g @click="showRiskPointDetail(restrictionPoints[2])" class="cursor-pointer">
                <circle cx="350" cy="320" r="14" fill="#3B82F6" />
                <text x="350" y="324" text-anchor="middle" fill="white" font-size="10" font-weight="bold">49t</text>
              </g>
              <g @click="showRiskPointDetail(restrictionPoints[3])" class="cursor-pointer">
                <circle cx="550" cy="150" r="14" fill="#3B82F6" />
                <text x="550" y="154" text-anchor="middle" fill="white" font-size="10" font-weight="bold">30t</text>
              </g>

              <g @click="showRiskPointDetail(restrictionPoints[4])" class="cursor-pointer">
                <circle cx="400" cy="400" r="12" fill="#EAB308" />
              </g>
              <g @click="showRiskPointDetail(restrictionPoints[5])" class="cursor-pointer">
                <circle cx="600" cy="200" r="12" fill="#EAB308" />
              </g>
            </svg>

            <div class="absolute" style="left: 80px; top: 460px;">
              <div class="bg-white rounded-lg px-3 py-2 shadow-lg text-xs">
                <div class="font-semibold text-green-600">{{ form.origin }}</div>
                <div class="text-gray-500">起点物流园</div>
              </div>
            </div>
            <div class="absolute" style="left: 680px; top: 50px;">
              <div class="bg-white rounded-lg px-3 py-2 shadow-lg text-xs">
                <div class="font-semibold text-red-600">{{ form.destination }}</div>
                <div class="text-gray-500">终点卸货区</div>
              </div>
            </div>
            <div class="absolute" style="left: 260px; top: 340px;">
              <div class="bg-red-500 text-white rounded-lg px-2 py-1 shadow-lg text-xs flex items-center gap-1">
                <component :is="icons.Ruler" class="w-3 h-3" />
                限高4.5m
              </div>
            </div>
            <div class="absolute" style="left: 330px; top: 280px;">
              <div class="bg-blue-500 text-white rounded-lg px-2 py-1 shadow-lg text-xs flex items-center gap-1">
                <component :is="icons.Scale" class="w-3 h-3" />
                限重49t
              </div>
            </div>
            <div class="absolute" style="left: 380px; top: 420px;">
              <div class="bg-yellow-500 text-white rounded-lg px-2 py-1 shadow-lg text-xs flex items-center gap-1">
                <component :is="icons.AlertCircle" class="w-3 h-3" />
                8-20点限行
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
        </div>

        <div class="card-base p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div v-if="selectedPlan">
                <div class="text-xs text-gray-500">已选方案</div>
                <div class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <span
                    class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    :class="getPlanColorClass(0)"
                  >
                    {{ selectedPlan.name.charAt(2) }}
                  </span>
                  {{ selectedPlan.name }}
                  <span class="text-brand-600">¥{{ selectedPlan.estimatedCost }}</span>
                </div>
              </div>
              <div v-else class="text-sm text-gray-400">
                请选择一个路线方案
              </div>
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="savePlan" :disabled="!selectedPlan">
                <component :is="icons.Save" class="w-4 h-4 mr-1" />
                保存方案
              </el-button>
              <el-button size="default" @click="exportPDF" :disabled="!selectedPlan">
                <component :is="icons.FileText" class="w-4 h-4 mr-1" />
                导出PDF
              </el-button>
              <el-button type="primary" size="default" @click="dispatchSchedule" :disabled="!selectedPlan">
                <component :is="icons.Send" class="w-4 h-4 mr-1" />
                下发调度
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="riskPointDialogVisible" title="风险点详情" width="500px">
      <div v-if="selectedRiskPoint" class="space-y-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-white"
            :class="getRiskPointColorClass(selectedRiskPoint.type)"
          >
            <component :is="getRiskPointIcon(selectedRiskPoint.type)" class="w-6 h-6" />
          </div>
          <div>
            <div class="font-semibold text-gray-900">{{ selectedRiskPoint.location }}</div>
            <div class="text-sm text-gray-500">{{ selectedRiskPoint.description }}</div>
          </div>
        </div>
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="风险类型">
            <span :class="getRiskPointTextClass(selectedRiskPoint.type)">
              {{ riskTypeMap[selectedRiskPoint.type] }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="限制值">
            <span class="font-semibold">{{ selectedRiskPoint.restriction }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="所属路段" span="2">
            <span>{{ selectedRiskPoint.road }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="bg-yellow-50 rounded-lg p-4">
          <div class="text-sm font-medium text-yellow-800 flex items-center gap-2 mb-1">
            <component :is="icons.Lightbulb" class="w-4 h-4" />
            绕行建议
          </div>
          <p class="text-sm text-yellow-700">{{ selectedRiskPoint.detour }}</p>
        </div>
        <div v-if="selectedRiskPoint.alternativeRoute" class="bg-blue-50 rounded-lg p-4">
          <div class="text-sm font-medium text-blue-800 flex items-center gap-2 mb-1">
            <component :is="icons.Route" class="w-4 h-4" />
            备选路线
          </div>
          <p class="text-sm text-blue-700">{{ selectedRiskPoint.alternativeRoute }}</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="riskPointDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MapPin, Flag, Search, Sparkles, Ruler, Scale, AlertCircle, AlertTriangle,
  Map, Plus, Minus, Save, FileText, Send, Lightbulb, Route
} from 'lucide-vue-next'

const icons = {
  MapPin, Flag, Search, Sparkles, Ruler, Scale, AlertCircle, AlertTriangle,
  Map, Plus, Minus, Save, FileText, Send, Lightbulb, Route
}

interface RiskPoint {
  id: string
  type: 'height' | 'weight' | 'traffic'
  location: string
  description: string
  restriction: string
  road: string
  detour: string
  alternativeRoute?: string
}

interface RouteSegment {
  road: string
  distance: number
}

interface RoutePlan {
  id: string
  name: string
  description: string
  isRecommended: boolean
  distance: number
  estimatedTime: number
  estimatedCost: number
  riskLevel: 'low' | 'medium' | 'high'
  heightRestrictionCount: number
  weightRestrictionCount: number
  trafficRestrictionCount: number
  riskPoints: RiskPoint[]
  segments: RouteSegment[]
}

const form = reactive({
  origin: '上海市',
  destination: '重庆市',
  cargoWeight: 28000,
  cargoVolume: 85.5,
  vehicleHeight: 4.8,
  vehicleWeight: 45
})

const searching = ref(false)
const activeTab = ref('list')
const selectedPlanId = ref('plan-a')
const selectedRiskPoint = ref<RiskPoint | null>(null)
const riskPointDialogVisible = ref(false)

const riskLevelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险'
}

const riskTypeMap: Record<string, string> = {
  height: '限高',
  weight: '限重',
  traffic: '限行'
}

const restrictionPoints: RiskPoint[] = [
  {
    id: 'r1',
    type: 'height',
    location: '南京长江大桥',
    description: '桥梁限高，车辆无法通过',
    restriction: '4.5m',
    road: 'G104国道南京段',
    detour: '建议绕行南京大胜关长江大桥',
    alternativeRoute: '从G25长深高速转S55宁宣高速'
  },
  {
    id: 'r2',
    type: 'height',
    location: '武汉长江二桥',
    description: '城市主干道限高',
    restriction: '4.2m',
    road: '武汉大道江岸段',
    detour: '建议绕行武汉长江隧道或天兴洲长江大桥',
    alternativeRoute: '从三环线绕行，过白沙洲长江大桥'
  },
  {
    id: 'r3',
    type: 'weight',
    location: '宜昌长江大桥',
    description: '大桥限重，超重车辆禁止通行',
    restriction: '49t',
    road: 'G50沪渝高速宜昌段',
    detour: '建议绕行宜万铁路长江大桥',
    alternativeRoute: '从G69银百高速转G5012恩广高速'
  },
  {
    id: 'r4',
    type: 'weight',
    location: '垫江服务区立交',
    description: '立交桥限重，需减速通过',
    restriction: '30t',
    road: 'G42沪蓉高速垫江段',
    detour: '建议从垫江收费站下道绕行',
    alternativeRoute: '走S102省道绕过立交桥'
  },
  {
    id: 'r5',
    type: 'traffic',
    location: '荆州城区主干道',
    description: '早晚高峰禁止大型货车通行',
    restriction: '8:00-20:00限行',
    road: 'G207国道荆州城区段',
    detour: '建议夜间通行或绕行荆州外环高速',
    alternativeRoute: '走G50沪渝高速绕行城区'
  },
  {
    id: 'r6',
    type: 'traffic',
    location: '重庆内环快速路',
    description: '工作日高峰时段货车限行',
    restriction: '7:00-9:00, 17:00-19:30限行',
    road: 'G5001重庆绕城高速以内',
    detour: '建议错峰通行或走绕城高速',
    alternativeRoute: '从G5001绕城高速绕行，避开内环'
  }
]

const routePlans: RoutePlan[] = [
  {
    id: 'plan-a',
    name: '方案A：推荐路线',
    description: '距离最短，避开3处限高，综合最优选择',
    isRecommended: true,
    distance: 1782,
    estimatedTime: 2880,
    estimatedCost: 28500,
    riskLevel: 'low',
    heightRestrictionCount: 0,
    weightRestrictionCount: 2,
    trafficRestrictionCount: 1,
    riskPoints: restrictionPoints.filter(p => p.type !== 'height'),
    segments: [
      { road: 'G2京沪高速', distance: 120 },
      { road: 'G42沪蓉高速', distance: 850 },
      { road: 'G50沪渝高速', distance: 520 },
      { road: 'G69银百高速', distance: 292 }
    ]
  },
  {
    id: 'plan-b',
    name: '方案B：高速优先',
    description: '费用较高，时间最短，全程高速通行',
    isRecommended: false,
    distance: 1920,
    estimatedTime: 2520,
    estimatedCost: 35800,
    riskLevel: 'low',
    heightRestrictionCount: 0,
    weightRestrictionCount: 1,
    trafficRestrictionCount: 0,
    riskPoints: restrictionPoints.filter(p => p.type === 'weight').slice(0, 1),
    segments: [
      { road: 'G15沈海高速', distance: 80 },
      { road: 'G40沪陕高速', distance: 720 },
      { road: 'G50沪渝高速', distance: 680 },
      { road: 'G65包茂高速', distance: 440 }
    ]
  },
  {
    id: 'plan-c',
    name: '方案C：国道优先',
    description: '费用最低，时间最长，避开高速收费',
    isRecommended: false,
    distance: 2150,
    estimatedTime: 4320,
    estimatedCost: 18200,
    riskLevel: 'high',
    heightRestrictionCount: 2,
    weightRestrictionCount: 2,
    trafficRestrictionCount: 2,
    riskPoints: restrictionPoints,
    segments: [
      { road: 'G312国道', distance: 380 },
      { road: 'G206国道', distance: 420 },
      { road: 'G318国道', distance: 680 },
      { road: 'G108国道', distance: 350 },
      { road: 'G210国道', distance: 320 }
    ]
  }
]

const selectedPlan = computed(() => routePlans.find(p => p.id === selectedPlanId.value))

function formatDuration(minutes: number): string {
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) {
    return `${days}天${hours}h${mins}m`
  }
  return `${hours}h${mins}m`
}

function getPlanColorClass(index: number): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500']
  return colors[index] || 'bg-gray-500'
}

function getPlanLineColorClass(index: number): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500']
  return colors[index] || 'bg-gray-500'
}

function getRiskPointBgClass(type: string): string {
  const bgClasses: Record<string, string> = {
    height: 'bg-red-50',
    weight: 'bg-blue-50',
    traffic: 'bg-yellow-50'
  }
  return bgClasses[type] || 'bg-gray-50'
}

function getRiskPointColorClass(type: string): string {
  const colorClasses: Record<string, string> = {
    height: 'bg-red-500',
    weight: 'bg-blue-500',
    traffic: 'bg-yellow-500'
  }
  return colorClasses[type] || 'bg-gray-500'
}

function getRiskPointTextClass(type: string): string {
  const textClasses: Record<string, string> = {
    height: 'text-red-600',
    weight: 'text-blue-600',
    traffic: 'text-yellow-600'
  }
  return textClasses[type] || 'text-gray-600'
}

function getRiskPointIcon(type: string) {
  const iconMap: Record<string, any> = {
    height: Ruler,
    weight: Scale,
    traffic: AlertCircle
  }
  return iconMap[type] || AlertTriangle
}

function searchRoutes() {
  searching.value = true
  setTimeout(() => {
    searching.value = false
    ElMessage.success('路线搜索完成，共找到3条可行方案')
  }, 1500)
}

function showRiskPointDetail(point: RiskPoint) {
  selectedRiskPoint.value = point
  riskPointDialogVisible.value = true
}

function dispatchSchedule() {
  if (!selectedPlan.value) return
  ElMessage.success(`已将【${selectedPlan.value.name}】下发至调度中心`)
}

function savePlan() {
  if (!selectedPlan.value) return
  ElMessage.success(`已保存【${selectedPlan.value.name}】至方案库`)
}

function exportPDF() {
  if (!selectedPlan.value) return
  ElMessage.success(`正在导出【${selectedPlan.value.name}】方案PDF...`)
}
</script>

<style scoped>
.route-tabs :deep(.el-tabs__nav) {
  width: 100%;
}
.route-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
}
</style>
