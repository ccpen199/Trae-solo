<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="$router.back()" class="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl font-bold text-white">{{ service?.name || '办事步骤配置' }}</h1>
            <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">{{ service?.departmentName?.replace('抚州市', '') }}</span>
            <span v-if="isPublished" class="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">已发布</span>
            <span v-else class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">草稿</span>
          </div>
          <p class="text-neutral-400 text-sm">可视化配置办事流程步骤，支持拖拽排序</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="showPreview = true" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex items-center gap-2">
          <Eye class="w-4 h-4" />
          预览
        </button>
        <button @click="resetSteps" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex items-center gap-2">
          <RotateCcw class="w-4 h-4" />
          重置
        </button>
        <button @click="addStep" class="btn-secondary flex items-center gap-2">
          <Plus class="w-4 h-4" />
          添加步骤
        </button>
        <button @click="saveSteps" class="btn-primary flex items-center gap-2">
          <Save class="w-4 h-4" />
          保存配置
        </button>
        <button v-if="!isPublished" @click="publishSteps" class="btn-primary !bg-green-600 hover:!bg-green-500 flex items-center gap-2">
          <Send class="w-4 h-4" />
          发布
        </button>
        <button v-else @click="unpublishSteps" class="btn-secondary !bg-yellow-600/20 !text-yellow-400 !border-yellow-600/30 hover:!bg-yellow-600/30 flex items-center gap-2">
          <Archive class="w-4 h-4" />
          撤销发布
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 space-y-6">
        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-white font-semibold flex items-center gap-2">
              <Workflow class="w-4 h-4 text-cyan-400" />
              步骤流程图
              <span class="text-xs text-neutral-500 ml-2">（拖拽调整顺序，点击编辑详情）</span>
            </h3>
            <div class="flex items-center gap-2">
              <button @click="batchAssign" class="text-xs px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1">
                <Users class="w-3.5 h-3.5" /> 批量调整责任人
              </button>
              <button @click="exportConfig" class="text-xs px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1">
                <Download class="w-3.5 h-3.5" /> 导出
              </button>
              <button @click="importConfig" class="text-xs px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1">
                <Upload class="w-3.5 h-3.5" /> 导入
              </button>
            </div>
          </div>

          <div v-if="steps.length === 0" class="text-center py-16">
            <ClipboardList class="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p class="text-neutral-400 mb-3">暂无步骤配置</p>
            <button @click="addStep" class="btn-primary !px-5">添加第一个步骤</button>
          </div>

          <div v-else class="overflow-x-auto pb-4">
            <div class="flex items-start gap-2 min-w-max">
              <template v-for="(step, index) in steps" :key="step.id">
                <div
                  class="relative flex-shrink-0 w-56 cursor-pointer group"
                  draggable="true"
                  @dragstart="onDragStart(index, $event)"
                  @dragover.prevent
                  @drop="onDrop(index)"
                  @click="openStepDetail(step)"
                >
                  <div class="bg-neutral-700/40 rounded-xl border border-neutral-700/60 hover:border-cyan-500/50 transition-all p-4 hover:shadow-lg hover:shadow-cyan-500/10"
                    :class="{ 'ring-2 ring-cyan-500 border-cyan-500/50': selectedStep?.id === step.id }">
                    <div class="flex items-center justify-between mb-3">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                        :class="getStepGradient(index)">
                        {{ index + 1 }}
                      </div>
                      <div class="flex items-center gap-1">
                        <span v-if="step.isKeyNode" class="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">关键节点</span>
                        <span v-if="step.isSkippable" class="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">可跳过</span>
                      </div>
                    </div>

                    <h4 class="text-white font-medium text-sm mb-1 truncate">{{ step.title || '未命名步骤' }}</h4>
                    <p class="text-xs text-neutral-500 mb-3 line-clamp-2 h-8">{{ step.description || '暂无描述' }}</p>

                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-xs text-neutral-400">
                        <UserCog class="w-3.5 h-3.5 text-cyan-400" />
                        <span class="truncate">{{ step.role || step.assignee || '未分配' }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-neutral-400">
                        <Clock class="w-3.5 h-3.5 text-yellow-400" />
                        <span>{{ formatDuration(step.expectedDuration, step.durationUnit) }}</span>
                      </div>
                      <div v-if="step.checkPoints && step.checkPoints.length > 0" class="flex items-center gap-2 text-xs text-neutral-400">
                        <CheckCircle class="w-3.5 h-3.5 text-green-400" />
                        <span>{{ step.checkPoints.length }} 个审核要点</span>
                      </div>
                    </div>

                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button @click.stop="moveStep(index, -1)" v-if="index > 0"
                        class="w-6 h-6 rounded bg-neutral-600/80 hover:bg-neutral-500 flex items-center justify-center text-white">
                        <ChevronLeft class="w-3 h-3" />
                      </button>
                      <button @click.stop="moveStep(index, 1)" v-if="index < steps.length - 1"
                        class="w-6 h-6 rounded bg-neutral-600/80 hover:bg-neutral-500 flex items-center justify-center text-white">
                        <ChevronRight class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="index < steps.length - 1" class="flex-shrink-0 flex items-center pt-8">
                  <div class="w-6 h-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-500/50"></div>
                  <ChevronRight class="w-4 h-4 text-blue-500/50 -ml-1" />
                </div>
              </template>

              <div class="flex-shrink-0 w-56 h-full flex items-center justify-center">
                <button @click="addStep" class="w-full h-32 rounded-xl border-2 border-dashed border-neutral-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 flex flex-col items-center justify-center text-neutral-500 hover:text-cyan-400 transition-colors">
                  <Plus class="w-6 h-6 mb-1" />
                  <span class="text-xs">添加步骤</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Timer class="w-4 h-4 text-orange-400" />
            办理时间轴预览
            <span class="text-xs text-neutral-500 ml-2">（模拟一个办件走完所有步骤）</span>
          </h3>
          <div class="relative">
            <div class="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-500 to-green-500"></div>
            <div class="space-y-4">
              <div v-for="(step, index) in steps" :key="'tl-' + step.id" class="relative pl-10">
                <div class="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white z-10"
                  :class="getStepGradient(index)">
                  {{ index + 1 }}
                </div>
                <div class="bg-neutral-700/30 rounded-lg p-3 border border-neutral-700/50">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-white text-sm font-medium">{{ step.title || `步骤${index + 1}` }}</span>
                    <span class="text-xs text-neutral-400">{{ formatDuration(step.expectedDuration, step.durationUnit) }}</span>
                  </div>
                  <div class="text-xs text-neutral-500">
                    责任人：{{ step.role || step.assignee || '待分配' }}
                    <span v-if="step.isKeyNode" class="ml-2 text-red-400">· 关键节点</span>
                  </div>
                  <div v-if="index === 0" class="text-xs text-cyan-400 mt-1">预计第 1 天开始</div>
                  <div v-else class="text-xs text-neutral-500 mt-1">
                    预计第 {{ getStartDay(index) }} 天开始
                  </div>
                </div>
              </div>
            </div>
            <div class="pl-10 pt-2">
              <div class="flex items-center gap-2 text-sm">
                <span class="text-green-400 font-medium">总计：{{ totalDurationText }}</span>
                <span class="text-neutral-500">·</span>
                <span class="text-neutral-400">{{ steps.length }} 个步骤</span>
                <span class="text-neutral-500">·</span>
                <span class="text-yellow-400">{{ keyNodeCount }} 个关键节点</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Info class="w-4 h-4 text-blue-400" />
            流程统计
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-neutral-400 text-sm">步骤总数</span>
              <span class="text-white font-bold text-xl">{{ steps.length }}</span>
            </div>
            <div class="h-px bg-neutral-700/50"></div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-400 text-sm">预计总时长</span>
              <span class="text-blue-400 font-bold text-xl">{{ totalDurationText }}</span>
            </div>
            <div class="h-px bg-neutral-700/50"></div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-400 text-sm">关键节点</span>
              <span class="text-red-400 font-bold text-xl">{{ keyNodeCount }}</span>
            </div>
            <div class="h-px bg-neutral-700/50"></div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-400 text-sm">可跳过步骤</span>
              <span class="text-yellow-400 font-bold text-xl">{{ skippableCount }}</span>
            </div>
            <div class="h-px bg-neutral-700/50"></div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-400 text-sm">平均每步时长</span>
              <span class="text-cyan-400 font-bold text-xl">{{ avgStepDurationText }}</span>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb class="w-4 h-4 text-yellow-400" />
            配置说明
          </h3>
          <ul class="space-y-2.5 text-sm text-neutral-400">
            <li class="flex items-start gap-2">
              <span class="text-blue-400 mt-0.5">•</span>
              拖拽步骤卡片可调整顺序
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-400 mt-0.5">•</span>
              点击步骤卡片可编辑详细信息
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-400 mt-0.5">•</span>
              关键节点不可跳过，需重点审核
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-400 mt-0.5">•</span>
              修改后需发布才会在线上生效
            </li>
          </ul>
        </div>
      </div>
    </div>

    <el-drawer v-model="detailDrawerVisible" title="步骤详情" direction="rtl" size="560px"
      :destroy-on-close="true" class="!bg-neutral-900">
      <div v-if="selectedStep" class="space-y-5">
        <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
          <h4 class="text-white font-semibold mb-4 flex items-center gap-2">
            <FileText class="w-4 h-4 text-blue-400" />
            基本信息
          </h4>
          <div class="space-y-3">
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">步骤名称 <span class="text-red-400">*</span></label>
              <el-input v-model="selectedStep.title" placeholder="请输入步骤名称" />
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">步骤描述</label>
              <el-input v-model="selectedStep.description" type="textarea" :rows="2" placeholder="请输入步骤描述" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm text-neutral-400 block mb-1.5">排序号</label>
                <el-input-number v-model="selectedStep.step" :min="1" :max="steps.length" class="!w-full" size="default" />
              </div>
              <div>
                <label class="text-sm text-neutral-400 block mb-1.5">负责角色</label>
                <el-select v-model="selectedStep.role" placeholder="选择角色" class="!w-full">
                  <el-option label="受理人" value="受理人" />
                  <el-option label="审核人" value="审核人" />
                  <el-option label="审批人" value="审批人" />
                  <el-option label="制证人" value="制证人" />
                  <el-option label="系统自动" value="system" />
                </el-select>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
          <h4 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock class="w-4 h-4 text-yellow-400" />
            时限设置
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">预计时长</label>
              <el-input-number v-model="selectedStep.expectedDuration" :min="0" :precision="1" class="!w-full" />
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">时间单位</label>
              <el-select v-model="selectedStep.durationUnit" class="!w-full">
                <el-option label="分钟" value="minute" />
                <el-option label="小时" value="hour" />
                <el-option label="工作日" value="day" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
          <h4 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Settings class="w-4 h-4 text-purple-400" />
            节点属性
          </h4>
          <div class="space-y-3">
            <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/50">
              <div class="flex items-center gap-2">
                <Star class="w-4 h-4 text-red-400" />
                <span class="text-sm text-white">关键节点</span>
              </div>
              <el-switch v-model="selectedStep.isKeyNode" size="small" />
            </label>
            <label class="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/50">
              <div class="flex items-center gap-2">
                <SkipForward class="w-4 h-4 text-yellow-400" />
                <span class="text-sm text-white">可跳过</span>
              </div>
              <el-switch v-model="selectedStep.isSkippable" size="small" />
            </label>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
          <h4 class="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-cyan-400" />
            办理条件
          </h4>
          <el-input v-model="selectedStep.preConditions" type="textarea" :rows="2"
            placeholder="请输入该步骤的前置办理条件" />
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-white font-semibold flex items-center gap-2">
              <CheckCircle class="w-4 h-4 text-green-400" />
              审核要点
            </h4>
            <button @click="addCheckPoint" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" /> 添加
            </button>
          </div>
          <div v-if="!selectedStep.checkPoints || selectedStep.checkPoints.length === 0" class="text-center py-6 text-neutral-500 text-sm">
            暂无审核要点，点击上方「添加」按钮添加
          </div>
          <div v-else class="space-y-2">
            <div v-for="(point, idx) in selectedStep.checkPoints" :key="idx"
              class="flex items-center gap-2 p-2 rounded-lg bg-neutral-700/30 border border-neutral-700/50">
              <span class="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs flex-shrink-0">{{ idx + 1 }}</span>
              <el-input v-model="selectedStep.checkPoints[idx]" class="flex-1" size="small" placeholder="审核要点" />
              <button @click="removeCheckPoint(idx)" class="text-red-400 hover:text-red-300">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-white font-semibold flex items-center gap-2">
              <FileCheck class="w-4 h-4 text-orange-400" />
              输出物
            </h4>
            <button @click="addOutput" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" /> 添加
            </button>
          </div>
          <div v-if="!selectedStep.outputs || selectedStep.outputs.length === 0" class="text-center py-6 text-neutral-500 text-sm">
            暂无输出物，点击上方「添加」按钮添加
          </div>
          <div v-else class="space-y-2">
            <div v-for="(output, idx) in selectedStep.outputs" :key="idx"
              class="flex items-center gap-2 p-2 rounded-lg bg-neutral-700/30 border border-neutral-700/50">
              <FileText class="w-4 h-4 text-orange-400 flex-shrink-0" />
              <el-input v-model="selectedStep.outputs[idx]" class="flex-1" size="small" placeholder="输出物名称" />
              <button @click="removeOutput(idx)" class="text-red-400 hover:text-red-300">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button @click="moveStepUp" class="flex-1 btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex items-center justify-center gap-2">
            <ChevronUp class="w-4 h-4" /> 上移
          </button>
          <button @click="moveStepDown" class="flex-1 btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex items-center justify-center gap-2">
            <ChevronDown class="w-4 h-4" /> 下移
          </button>
          <button @click="deleteCurrentStep" class="flex-1 btn-secondary !bg-red-500/10 !text-red-400 !border-red-500/30 hover:!bg-red-500/20 flex items-center justify-center gap-2">
            <Trash2 class="w-4 h-4" /> 删除
          </button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="showPreview" title="流程图预览" width="900px" class="!bg-neutral-900" :close-on-click-modal="false">
      <div class="p-4">
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-white mb-2">{{ service?.name }} - 办理流程图</h3>
          <p class="text-neutral-400 text-sm">共 {{ steps.length }} 个步骤，预计总时长 {{ totalDurationText }}</p>
        </div>
        <div class="overflow-x-auto pb-4">
          <div class="flex items-start justify-center gap-2 min-w-max">
            <template v-for="(step, index) in steps" :key="'preview-' + step.id">
              <div class="flex-shrink-0 w-48">
                <div class="bg-neutral-700/40 rounded-xl border border-neutral-700/60 p-4 text-center">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm mx-auto mb-2"
                    :class="getStepGradient(index)">
                    {{ index + 1 }}
                  </div>
                  <h4 class="text-white font-medium text-sm mb-1">{{ step.title || '未命名步骤' }}</h4>
                  <p class="text-xs text-neutral-500 mb-2">{{ step.role || step.assignee || '未分配' }}</p>
                  <div class="text-xs text-cyan-400">{{ formatDuration(step.expectedDuration, step.durationUnit) }}</div>
                </div>
              </div>
              <div v-if="index < steps.length - 1" class="flex-shrink-0 flex items-center pt-8">
                <ChevronRight class="w-5 h-5 text-cyan-500" />
              </div>
            </template>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showPreview = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600">关闭</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft, Plus, Save, RotateCcw, Workflow, ClipboardList,
  GripVertical, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Trash2,
  UserCog, Clock, FileCheck, CheckCircle, Settings, Info, Lightbulb,
  Eye, Send, Archive, Users, Download, Upload,
  FileText, AlertCircle, SkipForward, Star, X, Timer
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getServiceById } from '@/api/services'
import { generateId } from '@/utils'
import type { ServiceItem, ServiceStepDetail } from '@/types'

const route = useRoute()
const service = ref<ServiceItem | null>(null)
const originalSteps = ref<ServiceStepDetail[]>([])
const steps = ref<ServiceStepDetail[]>([])
const selectedStep = ref<ServiceStepDetail | null>(null)
const detailDrawerVisible = ref(false)
const showPreview = ref(false)
const isPublished = ref(false)
let dragIndex = -1

const getStepGradient = (index: number) => {
  const gradients = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-cyan-500 to-cyan-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-emerald-500 to-emerald-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-pink-500 to-pink-600'
  ]
  return gradients[index % gradients.length]
}

const formatDuration = (duration?: number, unit?: string) => {
  if (!duration || duration <= 0) return '即时办结'
  const unitMap: Record<string, string> = { minute: '分钟', hour: '小时', day: '工作日' }
  return `${duration} ${unitMap[unit || 'day']}`
}

const totalDurationDays = computed(() => {
  let totalMinutes = 0
  steps.value.forEach(s => {
    const dur = s.expectedDuration || 0
    switch (s.durationUnit) {
      case 'minute': totalMinutes += dur; break
      case 'hour': totalMinutes += dur * 60; break
      case 'day': totalMinutes += dur * 8 * 60; break
      default: totalMinutes += dur * 8 * 60
    }
  })
  return totalMinutes / (8 * 60)
})

const totalDurationText = computed(() => {
  const days = totalDurationDays.value
  if (days === 0) return '即时办结'
  if (days < 1) {
    const hours = Math.ceil(days * 8)
    return `${hours}小时`
  }
  return `${days.toFixed(1)}个工作日`
})

const avgStepDurationText = computed(() => {
  if (steps.value.length === 0) return '0'
  const avg = totalDurationDays.value / steps.value.length
  if (avg < 1 / 8) {
    return `${Math.ceil(avg * 8 * 60)}分钟`
  }
  if (avg < 1) {
    return `${(avg * 8).toFixed(1)}小时`
  }
  return `${avg.toFixed(2)}个工作日`
})

const keyNodeCount = computed(() => steps.value.filter(s => s.isKeyNode).length)
const skippableCount = computed(() => steps.value.filter(s => s.isSkippable).length)

const getStartDay = (index: number) => {
  let days = 0
  for (let i = 0; i < index; i++) {
    const s = steps.value[i]
    const dur = s.expectedDuration || 0
    switch (s.durationUnit) {
      case 'minute': days += dur / (8 * 60); break
      case 'hour': days += dur / 8; break
      case 'day': days += dur; break
      default: days += dur
    }
  }
  return Math.max(1, Math.ceil(days) + 1)
}

const createStep = (index: number): ServiceStepDetail => ({
  id: generateId(),
  step: index + 1,
  title: '',
  description: '',
  role: '',
  assignee: '',
  expectedDuration: 1,
  durationUnit: 'day',
  isKeyNode: false,
  isSkippable: false,
  preConditions: '',
  checkPoints: [],
  outputs: [],
  formFields: []
})

const addStep = () => {
  const newStep = createStep(steps.value.length)
  steps.value.push(newStep)
  openStepDetail(newStep)
}

const openStepDetail = (step: ServiceStepDetail) => {
  selectedStep.value = step
  detailDrawerVisible.value = true
}

const addCheckPoint = () => {
  if (!selectedStep.value) return
  if (!selectedStep.value.checkPoints) {
    selectedStep.value.checkPoints = []
  }
  selectedStep.value.checkPoints.push('')
}

const removeCheckPoint = (idx: number) => {
  if (!selectedStep.value?.checkPoints) return
  selectedStep.value.checkPoints.splice(idx, 1)
}

const addOutput = () => {
  if (!selectedStep.value) return
  if (!selectedStep.value.outputs) {
    selectedStep.value.outputs = []
  }
  selectedStep.value.outputs.push('')
}

const removeOutput = (idx: number) => {
  if (!selectedStep.value?.outputs) return
  selectedStep.value.outputs.splice(idx, 1)
}

const moveStep = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= steps.value.length) return
  const temp = steps.value[index]
  steps.value[index] = steps.value[newIndex]
  steps.value[newIndex] = temp
  steps.value.forEach((s, i) => s.step = i + 1)
}

const moveStepUp = () => {
  if (!selectedStep.value) return
  const idx = steps.value.findIndex(s => s.id === selectedStep.value!.id)
  if (idx > 0) {
    moveStep(idx, -1)
  }
}

const moveStepDown = () => {
  if (!selectedStep.value) return
  const idx = steps.value.findIndex(s => s.id === selectedStep.value!.id)
  if (idx < steps.value.length - 1) {
    moveStep(idx, 1)
  }
}

const deleteCurrentStep = () => {
  if (!selectedStep.value) return
  if (steps.value.length <= 1) {
    ElMessage.warning('至少保留一个步骤')
    return
  }
  ElMessageBox.confirm('确认删除该步骤？', '提示', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const idx = steps.value.findIndex(s => s.id === selectedStep.value!.id)
    if (idx >= 0) {
      steps.value.splice(idx, 1)
      steps.value.forEach((s, i) => s.step = i + 1)
      detailDrawerVisible.value = false
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const onDragStart = (index: number, e: DragEvent) => {
  dragIndex = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

const onDrop = (targetIndex: number) => {
  if (dragIndex < 0 || dragIndex === targetIndex) return
  const moved = steps.value.splice(dragIndex, 1)[0]
  steps.value.splice(targetIndex, 0, moved)
  steps.value.forEach((s, i) => s.step = i + 1)
  dragIndex = -1
}

const resetSteps = () => {
  steps.value = originalSteps.value.map(s => ({ ...s, checkPoints: [...(s.checkPoints || [])], outputs: [...(s.outputs || [])] }))
  ElMessage.info('已重置为初始配置')
}

const saveSteps = () => {
  const invalid = steps.value.find(s => !s.title.trim())
  if (invalid) {
    ElMessage.warning('请填写所有步骤名称')
    return
  }
  ElMessage.success('步骤配置保存成功')
  originalSteps.value = steps.value.map(s => ({
    ...s,
    checkPoints: [...(s.checkPoints || [])],
    outputs: [...(s.outputs || [])]
  }))
}

const publishSteps = () => {
  saveSteps()
  isPublished.value = true
  ElMessage.success('流程已发布')
}

const unpublishSteps = () => {
  ElMessageBox.confirm('确认撤销发布？撤销后线上将使用旧版本流程。', '提示', {
    confirmButtonText: '确认撤销', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    isPublished.value = false
    ElMessage.success('已撤销发布')
  }).catch(() => {})
}

const batchAssign = () => {
  ElMessage.info('批量调整责任人功能')
}

const exportConfig = () => {
  ElMessage.success('配置已导出')
}

const importConfig = () => {
  ElMessage.info('导入配置功能')
}

const loadService = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res = await getServiceById(id)
    service.value = res.data
    if (res.data?.steps && res.data.steps.length > 0) {
      const stepList: ServiceStepDetail[] = res.data.steps.map((s, i) => ({
        id: generateId(),
        step: i + 1,
        title: s.title,
        description: s.description,
        role: '',
        assignee: '',
        expectedDuration: parseDuration(s.duration).value,
        durationUnit: parseDuration(s.duration).unit as 'minute' | 'hour' | 'day',
        isKeyNode: false,
        isSkippable: false,
        preConditions: '',
        checkPoints: [],
        outputs: [],
        formFields: []
      }))
      steps.value = stepList
      originalSteps.value = stepList.map(s => ({ ...s, checkPoints: [...(s.checkPoints || [])], outputs: [...(s.outputs || [])] }))
    }
  } catch (e) {
    console.error(e)
  }
}

const parseDuration = (duration: string) => {
  if (!duration) return { value: 0, unit: 'day' }
  const match = duration.match(/(\d+(?:\.\d+)?)/)
  if (!match) return { value: 0, unit: 'day' }
  const value = parseFloat(match[1])
  if (duration.includes('分钟')) return { value, unit: 'minute' }
  if (duration.includes('小时')) return { value, unit: 'hour' }
  return { value, unit: 'day' }
}

onMounted(() => {
  loadService()
})
</script>
