<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Edit3, Check, Sparkles } from 'lucide-vue-next'
import SmartPrefillTag from './SmartPrefillTag.vue'
import type { OptionItem } from '@/types'

export interface FormFieldOption {
  label: string
  value: string | number
}

export interface FormFieldConfig {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'radio' | 'checkbox' | 'address' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: FormFieldOption[] | OptionItem[]
  defaultValue?: string | number | boolean | string[]
  min?: number
  max?: number
  step?: number
  rows?: number
  accept?: string
  multiple?: boolean
  prefill?: {
    enabled: boolean
    source: string
    value?: string | number
    autoApplied?: boolean
  }
  rules?: Array<{
    required?: boolean
    message?: string
    pattern?: RegExp
    min?: number
    max?: number
    type?: 'email' | 'phone' | 'idcard' | 'number' | 'string'
  }>
}

const props = defineProps<{
  field: FormFieldConfig
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'prefill', key: string): void
}>()

const isEditing = ref(false)
const errorMessage = ref('')

const isPrefilled = computed(() => {
  return props.field.prefill?.enabled && props.field.prefill?.autoApplied && props.modelValue
})

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function handlePrefill() {
  if (props.field.prefill?.value !== undefined) {
    emit('update:modelValue', props.field.prefill.value)
  }
  emit('prefill', props.field.key)
  isEditing.value = false
}

function toggleEdit() {
  isEditing.value = !isEditing.value
}

function validate() {
  if (!props.field.rules || props.field.rules.length === 0) {
    errorMessage.value = ''
    return true
  }

  const val = props.modelValue

  for (const rule of props.field.rules) {
    if (rule.required && (!val || (typeof val === 'string' && !val.trim()))) {
      errorMessage.value = rule.message || '此字段为必填项'
      return false
    }

    if (val && rule.type) {
      if (rule.type === 'phone' && !/^1[3-9]\d{9}$/.test(val)) {
        errorMessage.value = '请输入正确的手机号码'
        return false
      }
      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errorMessage.value = '请输入正确的邮箱地址'
        return false
      }
      if (rule.type === 'idcard' && !/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(val)) {
        errorMessage.value = '请输入正确的身份证号码'
        return false
      }
    }

    if (val && rule.pattern && !rule.pattern.test(val)) {
      errorMessage.value = rule.message || '格式不正确'
      return false
    }

    if (val && rule.min !== undefined && String(val).length < rule.min) {
      errorMessage.value = `最少需要 ${rule.min} 个字符`
      return false
    }

    if (val && rule.max !== undefined && String(val).length > rule.max) {
      errorMessage.value = `最多允许 ${rule.max} 个字符`
      return false
    }
  }

  errorMessage.value = ''
  return true
}

watch(
  () => props.modelValue,
  () => {
    if (props.field.rules && props.modelValue !== undefined && props.modelValue !== '') {
      validate()
    } else {
      errorMessage.value = ''
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="form-field">
    <div class="flex items-center justify-between mb-1.5">
      <label class="text-sm font-medium text-neutral-700">
        <span v-if="field.required" class="text-accent-red mr-0.5">*</span>
        {{ field.label }}
      </label>
      <template v-if="isPrefilled && !isEditing">
        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg
                 bg-green-50 text-accent-green border border-green-200
                 hover:bg-green-100 hover:border-green-300
                 transition-all duration-200"
          @click="toggleEdit"
        >
          <Check class="w-3.5 h-3.5" />
          <span>已自动填充 · 来自{{ field.prefill?.source }}</span>
          <Edit3 class="w-3.5 h-3.5 ml-1" />
        </button>
      </template>
      <SmartPrefillTag
        v-else-if="field.prefill?.enabled"
        :source="field.prefill.source"
        @prefill="handlePrefill"
      />
    </div>

    <div class="relative">
      <input
        v-if="field.type === 'text'"
        v-model="value"
        type="text"
        class="input-base transition-all duration-200"
        :class="[
          isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : '',
          errorMessage ? 'border-accent-red focus:border-accent-red focus:ring-2 focus:ring-red-100' : ''
        ]"
        :placeholder="field.placeholder"
        :disabled="field.disabled || (isPrefilled && !isEditing)"
        :readonly="Boolean(isPrefilled && !isEditing)"
      />

      <textarea
        v-else-if="field.type === 'textarea'"
        v-model="value"
        class="input-base resize-none transition-all duration-200"
        :class="[
          isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : '',
          errorMessage ? 'border-accent-red focus:border-accent-red focus:ring-2 focus:ring-red-100' : ''
        ]"
        :placeholder="field.placeholder"
        :disabled="field.disabled || (isPrefilled && !isEditing)"
        :readonly="Boolean(isPrefilled && !isEditing)"
        :rows="field.rows || 3"
      />

      <input
        v-else-if="field.type === 'number'"
        v-model.number="value"
        type="number"
        class="input-base transition-all duration-200"
        :class="[
          isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : '',
          errorMessage ? 'border-accent-red focus:border-accent-red focus:ring-2 focus:ring-red-100' : ''
        ]"
        :placeholder="field.placeholder"
        :disabled="field.disabled || (isPrefilled && !isEditing)"
        :readonly="Boolean(isPrefilled && !isEditing)"
        :min="field.min"
        :max="field.max"
        :step="field.step || 1"
      />

      <select
        v-else-if="field.type === 'select'"
        v-model="value"
        class="input-base appearance-none bg-no-repeat bg-right pr-10 transition-all duration-200"
        style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236B7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E'); background-position: right 12px center;"
        :class="[
          isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : '',
          errorMessage ? 'border-accent-red focus:border-accent-red focus:ring-2 focus:ring-red-100' : ''
        ]"
        :disabled="field.disabled || (isPrefilled && !isEditing)"
      >
        <option value="" disabled>{{ field.placeholder || '请选择' }}</option>
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <input
        v-else-if="field.type === 'date'"
        v-model="value"
        type="date"
        class="input-base transition-all duration-200"
        :class="[
          isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : '',
          errorMessage ? 'border-accent-red focus:border-accent-red focus:ring-2 focus:ring-red-100' : ''
        ]"
        :disabled="field.disabled || (isPrefilled && !isEditing)"
      />

      <div v-else-if="field.type === 'radio'" class="flex flex-wrap gap-4 pt-1">
        <label
          v-for="opt in field.options"
          :key="opt.value"
          class="flex items-center gap-2 cursor-pointer group"
        >
          <input
            type="radio"
            :value="opt.value"
            v-model="value"
            :disabled="field.disabled"
            class="w-4 h-4 accent-gov-blue"
          />
          <span class="text-sm text-neutral-700 group-hover:text-gov-blue transition-colors">{{ opt.label }}</span>
        </label>
      </div>

      <div v-else-if="field.type === 'checkbox'" class="flex flex-wrap gap-4 pt-1">
        <label
          v-for="opt in field.options"
          :key="opt.value"
          class="flex items-center gap-2 cursor-pointer group"
        >
          <input
            type="checkbox"
            :value="opt.value"
            v-model="value"
            :disabled="field.disabled"
            class="w-4 h-4 rounded accent-gov-blue"
          />
          <span class="text-sm text-neutral-700 group-hover:text-gov-blue transition-colors">{{ opt.label }}</span>
        </label>
      </div>

      <div v-else-if="field.type === 'address'" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          v-model="value.province"
          class="input-base appearance-none bg-no-repeat bg-right pr-10 transition-all duration-200"
          style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236B7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E'); background-position: right 12px center;"
          :class="[
            isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : ''
          ]"
          :disabled="field.disabled || (isPrefilled && !isEditing)"
        >
          <option value="">省份</option>
          <option value="江西省">江西省</option>
        </select>
        <select
          v-model="value.city"
          class="input-base appearance-none bg-no-repeat bg-right pr-10 transition-all duration-200"
          style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236B7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E'); background-position: right 12px center;"
          :class="[
            isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : ''
          ]"
          :disabled="field.disabled || (isPrefilled && !isEditing)"
        >
          <option value="">城市</option>
          <option value="抚州市">抚州市</option>
        </select>
        <input
          v-model="value.detail"
          type="text"
          class="input-base sm:col-span-3 transition-all duration-200"
          :class="[
            isPrefilled && !isEditing ? 'bg-green-50/50 border-green-200 text-neutral-600' : ''
          ]"
          placeholder="详细地址"
          :disabled="field.disabled || (isPrefilled && !isEditing)"
          :readonly="Boolean(isPrefilled && !isEditing)"
        />
      </div>

      <div v-else-if="field.type === 'file'" class="relative">
        <label class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-gov-blue hover:bg-gov-blue/5 transition-all duration-200">
          <svg class="w-8 h-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span class="text-sm text-neutral-500">点击或拖拽文件到此处上传</span>
          <span class="text-xs text-neutral-400 mt-1">{{ field.accept || '支持 JPG、PNG、PDF 格式' }}</span>
          <input
            type="file"
            class="hidden"
            :accept="field.accept"
            :multiple="field.multiple"
            :disabled="field.disabled"
          />
        </label>
      </div>
    </div>

    <p v-if="errorMessage" class="mt-1.5 text-xs text-accent-red flex items-center gap-1">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ errorMessage }}
    </p>
  </div>
</template>
