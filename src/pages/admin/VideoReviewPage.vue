<template>
  <div class="space-y-5">
    <div class="card-base p-4">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div>
          <label class="label-base text-xs">审核状态</label>
          <el-select v-model="filters.status" placeholder="全部状态" class="w-full" size="default">
            <el-option label="全部状态" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </div>
        <div>
          <label class="label-base text-xs">作业类型</label>
          <el-select v-model="filters.operationType" placeholder="全部类型" class="w-full">
            <el-option label="全部类型" value="" />
            <el-option label="装车" value="loading" />
            <el-option label="卸车" value="unloading" />
          </el-select>
        </div>
        <div>
          <label class="label-base text-xs">车牌号</label>
          <input v-model="filters.plateNo" type="text" placeholder="输入车牌号" class="input-base py-2 text-sm" />
        </div>
        <div>
          <label class="label-base text-xs">开始时间</label>
          <input v-model="filters.startDate" type="date" class="input-base py-2 text-sm" />
        </div>
        <div>
          <label class="label-base text-xs">结束时间</label>
          <input v-model="filters.endDate" type="date" class="input-base py-2 text-sm" />
        </div>
        <div class="flex gap-2">
          <button class="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2">
            <component :is="icons.Search" class="w-4 h-4" />
            搜索
          </button>
          <button class="btn-ghost border border-gray-200 py-2" @click="resetFilters">
            <component :is="icons.RotateCcw" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <component :is="icons.Clock" class="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div class="stat-number text-xl">{{ pendingCount }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </div>
      </div>
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <component :is="icons.Eye" class="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <div class="stat-number text-xl">{{ reviewingCount }}</div>
            <div class="stat-label">审核中</div>
          </div>
        </div>
      </div>
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <component :is="icons.CheckCircle" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div class="stat-number text-xl">{{ approvedCount }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </div>
      </div>
      <div class="stat-card py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-alert-50 flex items-center justify-center">
            <component :is="icons.Sparkles" class="w-5 h-5 text-alert-500" />
          </div>
          <div>
            <div class="text-sm font-semibold text-alert-600">AI智能抽检</div>
            <div class="stat-label">抽检覆盖率 85%</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="video in filteredVideos"
        :key="video.id"
        @click="openDetail(video)"
        class="card-base overflow-hidden cursor-pointer group"
      >
        <div class="relative aspect-video bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 overflow-hidden">
          <svg class="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 225" fill="none">
            <rect x="50" y="80" width="120" height="60" rx="4" fill="white" opacity="0.3" />
            <rect x="200" y="60" width="80" height="100" rx="4" fill="white" opacity="0.2" />
            <circle cx="320" cy="120" r="30" fill="white" opacity="0.15" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
              <component :is="icons.Play" class="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span class="bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded">
              {{ formatDuration(video.duration) }}
            </span>
            <span
              class="badge"
              :class="statusClass(video.status)"
            >
              {{ statusText(video.status) }}
            </span>
          </div>
          <div class="absolute top-3 right-3">
            <div class="bg-alert-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <component :is="icons.Cpu" class="w-3 h-3" />
              AI {{ video.aiScore }}分
            </div>
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold text-gray-900">{{ video.waybillNo }}</div>
            <span class="badge badge-info">
              {{ video.operationType === 'loading' ? '装车' : '卸车' }}
            </span>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span class="flex items-center gap-1">
              <component :is="icons.Truck" class="w-4 h-4" />
              {{ video.vehiclePlate }}
            </span>
            <span class="flex items-center gap-1">
              <component :is="icons.User" class="w-4 h-4" />
              {{ video.driverName }}
            </span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in video.tags"
              :key="tag"
              class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {{ tag }}
            </span>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            上传时间：{{ video.uploadedAt }}
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      :title="currentVideo?.waybillNo || '视频审核详情'"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentVideo" class="space-y-5">
        <div class="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
          <svg class="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 450" fill="none">
            <rect x="80" y="150" width="250" height="150" rx="6" fill="white" opacity="0.4" />
            <rect x="400" y="100" width="180" height="220" rx="6" fill="white" opacity="0.3" />
            <circle cx="680" cy="225" r="60" fill="white" opacity="0.2" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <button class="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all">
              <component :is="icons.Play" class="w-10 h-10 text-white ml-1.5" />
            </button>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-white text-xs">00:00</span>
              <div class="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div class="h-full w-1/3 bg-brand-500 rounded-full"></div>
              </div>
              <span class="text-white text-xs">{{ formatDuration(currentVideo.duration) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <button class="text-white hover:text-brand-300">
                  <component :is="icons.Play" class="w-5 h-5" />
                </button>
                <button class="text-white hover:text-brand-300">
                  <component :is="icons.Volume2" class="w-5 h-5" />
                </button>
                <el-select v-model="playbackSpeed" size="small" class="w-20">
                  <el-option label="0.5x" :value="0.5" />
                  <el-option label="1.0x" :value="1" />
                  <el-option label="1.5x" :value="1.5" />
                  <el-option label="2.0x" :value="2" />
                </el-select>
              </div>
              <div class="flex items-center gap-2">
                <button class="flex items-center gap-1 text-white text-xs hover:text-brand-300">
                  <component :is="icons.Camera" class="w-4 h-4" />
                  关键帧截图
                </button>
                <button class="flex items-center gap-1 text-white text-xs hover:text-brand-300">
                  <component :is="icons.Maximize" class="w-4 h-4" />
                  全屏
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-4">
            <div class="bg-alert-50 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <component :is="icons.Sparkles" class="w-5 h-5 text-alert-500" />
                <span class="font-semibold text-gray-900">AI智能抽检结果</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="relative w-20 h-20">
                  <svg class="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#FED7AA" stroke-width="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#FF6A00" stroke-width="8"
                      :stroke-dasharray="`${currentVideo.aiScore * 2.01} 201`" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="font-din text-xl font-bold text-alert-600">{{ currentVideo.aiScore }}</span>
                  </div>
                </div>
                <div class="flex-1 space-y-1.5 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">包装完整性</span>
                    <span class="text-green-600 font-medium">正常</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">吊装规范性</span>
                    <span class="text-green-600 font-medium">正常</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">固定牢靠性</span>
                    <span :class="currentVideo.aiScore < 70 ? 'text-alert-600 font-medium' : 'text-green-600 font-medium'">
                      {{ currentVideo.aiScore < 70 ? '需关注' : '正常' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-500 text-xs mb-1">运单号</div>
                <div class="font-semibold text-gray-900">{{ currentVideo.waybillNo }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-500 text-xs mb-1">车牌号</div>
                <div class="font-semibold text-gray-900">{{ currentVideo.vehiclePlate }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-500 text-xs mb-1">司机</div>
                <div class="font-semibold text-gray-900">{{ currentVideo.driverName }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-500 text-xs mb-1">作业类型</div>
                <div class="font-semibold text-gray-900">{{ currentVideo.operationType === 'loading' ? '装车作业' : '卸车作业' }}</div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label-base">审核意见</label>
              <textarea
                v-model="reviewComment"
                placeholder="请输入审核意见，如发现问题请详细描述..."
                rows="5"
                class="input-base resize-none"
              ></textarea>
            </div>
            <div v-if="currentVideo.reviewComment" class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">上次审核意见 ({{ currentVideo.reviewer }})</div>
              <div class="text-sm text-gray-700">{{ currentVideo.reviewComment }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">
            上传于 {{ currentVideo?.uploadedAt }}
          </span>
          <div class="flex gap-3">
            <button class="px-6 py-2 border border-red-200 text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5">
              <component :is="icons.XCircle" class="w-4 h-4" />
              驳回
            </button>
            <button class="btn-primary flex items-center gap-1.5">
              <component :is="icons.CheckCircle" class="w-4 h-4" />
              审核通过
            </button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Search, RotateCcw, Clock, Eye, CheckCircle, Play, Truck, User, Cpu, Sparkles,
  Volume2, Camera, Maximize, XCircle
} from 'lucide-vue-next'
import { mockVideoReviews } from '@/mock'
import type { VideoReviewItem } from '@/types'

const icons = {
  Search, RotateCcw, Clock, Eye, CheckCircle, Play, Truck, User, Cpu, Sparkles,
  Volume2, Camera, Maximize, XCircle
}

const filters = reactive({
  status: '',
  operationType: '',
  plateNo: '',
  startDate: '',
  endDate: ''
})

const detailVisible = ref(false)
const currentVideo = ref<VideoReviewItem | null>(null)
const reviewComment = ref('')
const playbackSpeed = ref(1)

const videos = mockVideoReviews

const pendingCount = computed(() => videos.filter(v => v.status === 'pending').length)
const reviewingCount = computed(() => videos.filter(v => v.status === 'reviewing').length)
const approvedCount = computed(() => videos.filter(v => v.status === 'approved').length)

const filteredVideos = computed(() => {
  return videos.filter(v => {
    if (filters.status && v.status !== filters.status) return false
    if (filters.operationType && v.operationType !== filters.operationType) return false
    if (filters.plateNo && !v.vehiclePlate.includes(filters.plateNo)) return false
    return true
  })
})

function resetFilters() {
  filters.status = ''
  filters.operationType = ''
  filters.plateNo = ''
  filters.startDate = ''
  filters.endDate = ''
}

function openDetail(video: VideoReviewItem) {
  currentVideo.value = video
  reviewComment.value = video.reviewComment || ''
  detailVisible.value = true
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待审核',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  return map[status] || status
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'badge-warning',
    reviewing: 'badge-info',
    approved: 'badge-success',
    rejected: 'badge-danger'
  }
  return map[status] || 'badge-info'
}
</script>
