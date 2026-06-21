<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Clock,
  Wrench,
  CheckCircle,
  AlertCircle,
  UserCheck,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import {
  getRectificationRecords,
  confirmRectificationSatisfied,
  applyReview
} from '@/api/tickets'
import type { RectificationRecord } from '@/types'

const props = defineProps<{
  ticketId: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'updated'): void
}>()

const loading = ref(false)
const record = ref<RectificationRecord | null>(null)
const showReviewDialog = ref(false)
const reviewReason = ref('')
const submittingReview = ref(false)

const timelineItems = computed(() => {
  if (!record.value) return []
  
  const items = [
    {
      status: 'trigger',
      title: '差评触发',
      description: record.value.triggerReason,
      icon: AlertCircle,
      color: 'text-accent-red',
      bgColor: 'bg-accent-red',
      done: true,
      time: record.value.createTime
    },
    {
      status: 'received',
      title: '责任单位签收',
      description: `${record.value.responsibleDept}已签收整改任务`,
      icon: UserCheck,
      color: 'text-accent-orange',
      bgColor: 'bg-accent-orange',
      done: record.value.status !== 'pending',
      time: record.value.status !== 'pending' ? record.value.createTime : undefined
    }
  ]

  if (record.value.plan) {
    items.push({
      status: 'plan',
      title: '制定整改方案',
      description: record.value.plan,
      icon: FileCheck,
      color: 'text-gov-blue',
      bgColor: 'bg-gov-blue',
      done: true,
      time: record.value.createTime
    })
  }

  if (record.value.progress) {
    items.push({
      status: 'implement',
      title: '实施整改',
      description: record.value.progress,
      icon: Wrench,
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue',
      done: true,
      time: record.value.completeTime || record.value.deadline
    })
  }

  if (record.value.result) {
    items.push({
      status: 'complete',
      title: '整改完成',
      description: record.value.result,
      icon: CheckCircle,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green',
      done: true,
      time: record.value.completeTime
    })
  }

  if (record.value.userSatisfied !== undefined) {
    items.push({
      status: 'verify',
      title: '回访验证',
      description: record.value.userSatisfied ? '用户确认满意' : '用户不满意，申请复查',
      icon: record.value.userSatisfied ? ThumbsUp : ThumbsDown,
      color: record.value.userSatisfied ? 'text-accent-green' : 'text-accent-red',
      bgColor: record.value.userSatisfied ? 'bg-accent-green' : 'bg-accent-red',
      done: true,
      time: record.value.verifyTime
    })
  }

  return items
})

const deadlineText = computed(() => {
  if (!record.value) return ''
  return `整改时限：${record.value.deadline}`
})

async function loadData() {
  if (!props.ticketId) return
  
  loading.value = true
  try {
    const res = await getRectificationRecords(props.ticketId)
    if (res.data.length > 0) {
      record.value = res.data[0]
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

function openReviewDialog() {
  showReviewDialog.value = true
}

async function handleConfirmSatisfied() {
  if (!record.value) return
  
  try {
    await confirmRectificationSatisfied(record.value.id, true)
    ElMessage.success('感谢您的反馈，我们将持续改进服务')
    emit('updated')
    handleClose()
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败，请重试')
  }
}

async function handleSubmitReview() {
  if (!reviewReason.value.trim()) {
    ElMessage.warning('请填写复查原因')
    return
  }
  
  submittingReview.value = true
  try {
    await applyReview(props.ticketId, reviewReason.value)
    ElMessage.success('复查申请已提交，我们将尽快处理')
    showReviewDialog.value = false
    emit('updated')
    handleClose()
  } catch (e) {
    console.error(e)
    ElMessage.error('申请失败，请重试')
  } finally {
    submittingReview.value = false
  }
}

onMounted(() => {
  if (props.visible) {
    loadData()
  }
})

defineExpose({
  loadData
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val: boolean) => emit('update:visible', val)"
    title="整改进度跟踪"
    width="560px"
    @close="handleClose"
  >
    <div v-if="loading" class="py-12 text-center text-neutral-500">
      <div class="w-8 h-8 border-2 border-gov-blue/30 border-t-gov-blue rounded-full animate-spin mx-auto mb-3"></div>
      加载中...
    </div>
    
    <div v-else-if="!record" class="py-12 text-center text-neutral-500">
      <AlertCircle class="w-12 h-12 mx-auto mb-3 text-neutral-300" />
      暂无整改记录
    </div>
    
    <div v-else class="space-y-6">
      <div class="p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
        <div class="flex items-center gap-2 mb-2">
          <Wrench class="w-5 h-5 text-accent-red" />
          <span class="font-medium text-accent-red">整改进行中</span>
        </div>
        <p class="text-sm text-neutral-600 mb-2">{{ record.triggerReason }}</p>
        <p class="text-xs text-neutral-500 flex items-center gap-1">
          <Clock class="w-3.5 h-3.5" />
          {{ deadlineText }}
        </p>
      </div>

      <div>
        <p class="text-sm font-medium text-neutral-700 mb-4">整改时间轴</p>
        <div class="relative">
          <div
            v-for="(item, idx) in timelineItems"
            :key="item.status"
            class="relative pl-8 pb-6 last:pb-0"
          >
            <div v-if="idx < timelineItems.length - 1"
              class="absolute left-3.5 top-7 w-0.5 h-full"
              :class="item.done ? 'bg-neutral-200' : 'bg-neutral-100'"
            ></div>
            
            <div
              class="absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center"
              :class="item.done ? item.bgColor : 'bg-neutral-200'"
            >
              <component :is="item.icon" class="w-3.5 h-3.5 text-white" />
            </div>
            
            <div class="pt-0.5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-neutral-800">{{ item.title }}</span>
                <span v-if="item.time" class="text-xs text-neutral-400">{{ item.time }}</span>
              </div>
              <p class="text-sm text-neutral-600 leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="record.status === 'completed' && record.userSatisfied === undefined" class="space-y-3 pt-4 border-t border-neutral-100">
        <p class="text-sm font-medium text-neutral-700 text-center">整改已完成，请确认您是否满意</p>
        <div class="flex gap-3">
          <button
            @click="handleConfirmSatisfied"
            class="flex-1 py-2.5 bg-accent-green text-white rounded-xl hover:bg-accent-green/90 transition-colors flex items-center justify-center gap-2"
          >
            <ThumbsUp class="w-4 h-4" />
            确认满意
          </button>
          <button
            @click="openReviewDialog"
            class="flex-1 py-2.5 bg-accent-red text-white rounded-xl hover:bg-accent-red/90 transition-colors flex items-center justify-center gap-2"
          >
            <ThumbsDown class="w-4 h-4" />
            仍不满意
          </button>
        </div>
      </div>
    </div>
  </el-dialog>

  <el-dialog
    v-model="showReviewDialog"
    title="申请复查"
    width="480px"
    :close-on-click-modal="false"
  >
    <div class="space-y-4 py-2">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-2">
          复查原因 <span class="text-accent-red">*</span>
        </label>
        <el-input
          v-model="reviewReason"
          type="textarea"
          :rows="4"
          placeholder="请详细说明您不满意的原因和复查诉求..."
          maxlength="500"
          show-word-limit
        />
      </div>
      <p class="text-xs text-neutral-500 bg-gov-blue-50 p-3 rounded-lg">
        提交复查申请后，相关部门将在 3 个工作日内进行复核处理。
      </p>
    </div>
    <template #footer>
      <div class="flex items-center gap-3">
        <button
          @click="showReviewDialog = false"
          class="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSubmitReview"
          :disabled="submittingReview || !reviewReason.trim()"
          class="px-5 py-2.5 bg-gov-gradient text-white rounded-xl hover:shadow-lg disabled:opacity-60 transition-all"
        >
          {{ submittingReview ? '提交中...' : '提交申请' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>
