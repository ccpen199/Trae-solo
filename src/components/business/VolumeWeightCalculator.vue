<template>
  <div class="card-base p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
      <component :is="icons.Scale" class="w-5 h-5 text-brand-500" />
      体积重自动换算
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div class="label-base">货物尺寸 (cm)</div>
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              type="number"
              v-model.number="length"
              class="input-base"
              placeholder="长"
              min="0"
              @input="calculate"
            />
            <div class="text-xs text-gray-400 mt-1 text-center">长</div>
          </div>
          <span class="text-gray-400 text-lg">×</span>
          <div class="flex-1">
            <input
              type="number"
              v-model.number="width"
              class="input-base"
              placeholder="宽"
              min="0"
              @input="calculate"
            />
            <div class="text-xs text-gray-400 mt-1 text-center">宽</div>
          </div>
          <span class="text-gray-400 text-lg">×</span>
          <div class="flex-1">
            <input
              type="number"
              v-model.number="height"
              class="input-base"
              placeholder="高"
              min="0"
              @input="calculate"
            />
            <div class="text-xs text-gray-400 mt-1 text-center">高</div>
          </div>
        </div>

        <div class="mt-5">
          <label class="label-base">实际重量 (kg)</label>
          <input
            type="number"
            v-model.number="actualWeight"
            class="input-base"
            placeholder="请输入实际重量"
            min="0"
            step="0.01"
            @input="calculate"
          />
        </div>

        <div class="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
          <div class="text-xs text-brand-600 font-medium mb-1">换算公式</div>
          <div class="text-xs text-gray-600 font-mono">
            体积重(kg) = 长 × 宽 × 高(cm) ÷ 6000
          </div>
          <div class="text-xs text-gray-600 font-mono mt-1">
            计费重量 = max(实际重量, 体积重)
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl p-6 text-white">
        <div class="space-y-5">
          <div class="flex justify-between items-center">
            <span class="text-brand-100 text-sm">体积重</span>
            <span class="font-din text-3xl font-bold">{{ volumeWeight.toFixed(2) }} <span class="text-base font-normal">kg</span></span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-brand-100 text-sm">实际重量</span>
            <span class="font-din text-2xl font-semibold opacity-90">{{ actualWeight.toFixed(2) }} <span class="text-sm font-normal">kg</span></span>
          </div>
          <div class="h-px bg-white/20 my-2"></div>
          <div class="flex justify-between items-center">
            <div>
              <span class="text-brand-100 text-sm block">计费重量</span>
              <span class="text-xs text-brand-200 mt-0.5 block">{{ chargeBasis }}</span>
            </div>
            <span class="font-din text-4xl font-bold">{{ chargeWeight.toFixed(2) }} <span class="text-lg font-normal">kg</span></span>
          </div>

          <div v-if="isOversize || isOverweight" class="mt-4 p-3 rounded-lg bg-white/10 border border-white/20">
            <div class="text-sm font-medium text-warning-300 flex items-center gap-2 mb-2">
              <component :is="icons.AlertTriangle" class="w-4 h-4" />
              大件货物判定
            </div>
            <div class="text-xs space-y-1 text-brand-100">
              <div v-if="isOverweight">✦ 单票实际重量 {{ actualWeight }}kg 超过 50kg 大件标准</div>
              <div v-if="isOversize">✦ 单边长度 {{ maxDimension }}cm 超过 1.8m 大件标准</div>
              <div class="pt-1 text-brand-200">将收取大件附加费</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Scale, AlertTriangle } from 'lucide-vue-next'
import { calculateVolumeWeight, calculateChargeWeight, isOversize as checkOversize, isOverweight as checkOverweight } from '@/utils/logistics'

const icons = { Scale, AlertTriangle }

const props = defineProps<{
  modelLength?: number
  modelWidth?: number
  modelHeight?: number
  modelActualWeight?: number
}>()

const emit = defineEmits<{
  (e: 'change', payload: { length: number; width: number; height: number; actualWeight: number; volumeWeight: number; chargeWeight: number }): void
}>()

const length = ref(props.modelLength ?? 120)
const width = ref(props.modelWidth ?? 80)
const height = ref(props.modelHeight ?? 100)
const actualWeight = ref(props.modelActualWeight ?? 150)
const volumeWeight = ref(0)
const chargeWeight = ref(0)

const maxDimension = computed(() => Math.max(length.value, width.value, height.value))
const isOversize = computed(() => checkOversize(length.value, width.value, height.value))
const isOverweight = computed(() => checkOverweight(actualWeight.value))
const chargeBasis = computed(() => {
  if (volumeWeight.value > actualWeight.value) return '按体积重计费'
  if (actualWeight.value > volumeWeight.value) return '按实际重量计费'
  return '两者相等'
})

function calculate() {
  volumeWeight.value = calculateVolumeWeight(length.value, width.value, height.value)
  chargeWeight.value = calculateChargeWeight(actualWeight.value, volumeWeight.value)
  emit('change', {
    length: length.value,
    width: width.value,
    height: height.value,
    actualWeight: actualWeight.value,
    volumeWeight: volumeWeight.value,
    chargeWeight: chargeWeight.value
  })
}

watch([() => props.modelLength, () => props.modelWidth, () => props.modelHeight, () => props.modelActualWeight], () => {
  if (props.modelLength !== undefined) length.value = props.modelLength
  if (props.modelWidth !== undefined) width.value = props.modelWidth
  if (props.modelHeight !== undefined) height.value = props.modelHeight
  if (props.modelActualWeight !== undefined) actualWeight.value = props.modelActualWeight
  calculate()
})

onMounted(calculate)
</script>
