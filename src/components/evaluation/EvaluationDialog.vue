<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Star, Eye, EyeOff, Send, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { getEvaluationTags, rateTicket } from '@/api/tickets'
import type { EvaluationTag } from '@/types'

const props = defineProps<{
  ticketId: string
  visible: boolean
  sourceName?: string
  sourceNo?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success', data: any): void
  (e: 'cancel'): void
}>()

const submitting = ref(false)
const tags = ref<EvaluationTag[]>([])
const hoverRating = ref(0)

const form = reactive({
  overallRating: 0,
  speedRating: 0,
  attitudeRating: 0,
  qualityRating: 0,
  convenienceRating: 0,
  selectedTags: [] as string[],
  content: '',
  anonymous: false
})

const ratingLabels = ['', '非常不满意', '不满意', '一般', '满意', '非常满意']

const dimensionLabels = [
  { key: 'speedRating', label: '办事效率' },
  { key: 'attitudeRating', label: '服务态度' },
  { key: 'qualityRating', label: '结果满意度' },
  { key: 'convenienceRating', label: '流程便捷度' }
]

const canSubmit = computed(() => {
  return form.overallRating > 0
})

const overallRatingLabel = computed(() => {
  return ratingLabels[form.overallRating] || '请评分'
})

const positiveTags = computed(() => tags.value.filter(t => t.category === 'positive'))
const negativeTags = computed(() => tags.value.filter(t => t.category === 'negative'))
const neutralTags = computed(() => tags.value.filter(t => t.category === 'neutral'))

async function loadTags() {
  try {
    const res = await getEvaluationTags()
    tags.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function setOverallRating(rating: number) {
  form.overallRating = rating
  if (rating >= 4) {
    form.speedRating = form.speedRating || rating
    form.attitudeRating = form.attitudeRating || rating
    form.qualityRating = form.qualityRating || rating
    form.convenienceRating = form.convenienceRating || rating
  }
}

function toggleTag(tagId: string) {
  const idx = form.selectedTags.indexOf(tagId)
  if (idx >= 0) {
    form.selectedTags.splice(idx, 1)
  } else {
    form.selectedTags.push(tagId)
  }
}

function handleClose() {
  emit('update:visible', false)
  emit('cancel')
}

async function handleSubmit() {
  if (!canSubmit.value) {
    ElMessage.warning('请先进行总体评分')
    return
  }

  submitting.value = true
  try {
    const res = await rateTicket(props.ticketId, {
      rating: form.overallRating,
      comment: form.content,
      tags: form.selectedTags,
      speedRating: form.speedRating,
      attitudeRating: form.attitudeRating,
      qualityRating: form.qualityRating,
      convenienceRating: form.convenienceRating,
      anonymous: form.anonymous
    })
    
    ElMessage.success('评价提交成功！')
    emit('update:visible', false)
    emit('success', res.data)
  } catch (e) {
    console.error(e)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.overallRating = 0
  form.speedRating = 0
  form.attitudeRating = 0
  form.qualityRating = 0
  form.convenienceRating = 0
  form.selectedTags = []
  form.content = ''
  form.anonymous = false
}

onMounted(() => {
  loadTags()
})

defineExpose({
  resetForm
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val: boolean) => emit('update:visible', val)"
    title="服务满意度评价"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="evaluation-dialog"
  >
    <div class="space-y-6 py-2">
      <div v-if="sourceName" class="text-center">
        <p class="text-sm text-neutral-500">评价对象</p>
        <p class="font-medium text-neutral-800">{{ sourceName }}</p>
        <p v-if="sourceNo" class="text-xs text-neutral-400">{{ sourceNo }}</p>
      </div>

      <div class="text-center">
        <p class="text-sm text-neutral-500 mb-3">总体满意度</p>
        <div class="flex items-center justify-center gap-2">
          <template v-for="i in 5" :key="i">
            <button
              @click="setOverallRating(i)"
              @mouseenter="hoverRating = i"
              @mouseleave="hoverRating = 0"
              class="p-1 transition-transform hover:scale-110"
            >
              <Star
                :class="[
                  'w-10 h-10 transition-colors',
                  (hoverRating || form.overallRating) >= i
                    ? 'text-accent-yellow fill-accent-yellow'
                    : 'text-neutral-300'
                ]"
              />
            </button>
          </template>
        </div>
        <p class="mt-2 text-sm font-medium" :class="form.overallRating >= 4 ? 'text-accent-green' : form.overallRating >= 2 ? 'text-accent-yellow' : form.overallRating > 0 ? 'text-accent-red' : 'text-neutral-400'">
          {{ overallRatingLabel }}
        </p>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium text-neutral-700">分项评分</p>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="dim in dimensionLabels"
            :key="dim.key"
            class="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
          >
            <span class="text-sm text-neutral-600">{{ dim.label }}</span>
            <div class="flex gap-0.5">
              <template v-for="i in 5" :key="i">
                <button
                  @click="(form as any)[dim.key] = i"
                  class="p-0.5"
                >
                  <Star
                    :class="[
                      'w-4 h-4',
                      (form as any)[dim.key] >= i
                        ? 'text-accent-yellow fill-accent-yellow'
                        : 'text-neutral-300'
                    ]"
                  />
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium text-neutral-700">评价标签 <span class="text-neutral-400 font-normal">（可多选）</span></p>
        
        <div v-if="positiveTags.length > 0" class="space-y-2">
          <div class="flex items-center gap-2">
            <ThumbsUp class="w-4 h-4 text-accent-green" />
            <span class="text-xs text-accent-green">好评标签</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in positiveTags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              :class="[
                'px-3 py-1.5 text-sm rounded-full border transition-all',
                form.selectedTags.includes(tag.id)
                  ? 'bg-accent-green/10 border-accent-green text-accent-green'
                  : 'border-neutral-200 text-neutral-600 hover:border-accent-green/50'
              ]"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>

        <div v-if="negativeTags.length > 0" class="space-y-2">
          <div class="flex items-center gap-2">
            <ThumbsDown class="w-4 h-4 text-accent-red" />
            <span class="text-xs text-accent-red">差评标签</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in negativeTags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              :class="[
                'px-3 py-1.5 text-sm rounded-full border transition-all',
                form.selectedTags.includes(tag.id)
                  ? 'bg-accent-red/10 border-accent-red text-accent-red'
                  : 'border-neutral-200 text-neutral-600 hover:border-accent-red/50'
              ]"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-neutral-700">评价内容 <span class="text-neutral-400 font-normal">（选填）</span></p>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          placeholder="请分享您的真实感受和建议，帮助我们改进服务..."
          maxlength="500"
          show-word-limit
        />
      </div>

      <div class="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
        <div class="flex items-center gap-2">
          <component :is="form.anonymous ? EyeOff : Eye" class="w-4 h-4 text-neutral-500" />
          <span class="text-sm text-neutral-700">匿名评价</span>
        </div>
        <el-switch v-model="form.anonymous" size="small" />
      </div>

      <div v-if="form.overallRating > 0 && form.overallRating <= 2" class="p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
        <p class="text-sm text-accent-red font-medium mb-1">不满意？</p>
        <p class="text-xs text-neutral-600">您的评价将自动触发整改程序，相关部门将在 5 个工作日内完成整改并回访。</p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center gap-3">
        <button
          @click="handleClose"
          class="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit || submitting"
          class="px-5 py-2.5 bg-gov-gradient text-white rounded-xl hover:shadow-lg disabled:opacity-60 transition-all flex items-center gap-2"
        >
          <Send v-if="!submitting" class="w-4 h-4" />
          <span v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ submitting ? '提交中...' : '提交评价' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>
