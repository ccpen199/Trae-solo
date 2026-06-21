<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import FormFieldRenderer, { type FormFieldConfig } from './FormFieldRenderer.vue'

export type { FormFieldConfig }
import MaterialUpload from './MaterialUpload.vue'
import { User } from 'lucide-vue-next'

export interface FormGroup {
  key: string
  title: string
  description?: string
  icon?: any
  fields: FormFieldConfig[]
}

export interface FormSchema {
  groups: FormGroup[]
  materialsEnabled?: boolean
}

const props = defineProps<{
  schema: FormSchema
  modelValue?: Record<string, any>
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', data: Record<string, any>): void
  (e: 'validate', valid: boolean, errors: Record<string, string>): void
  (e: 'submit', data: Record<string, any>): void
  (e: 'materialsChange', files: any[]): void
}>()

const userStore = useUserStore()
const formData = reactive<Record<string, any>>({})
const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})

const allFields = computed(() => {
  const fields: FormFieldConfig[] = []
  props.schema.groups.forEach(g => fields.push(...g.fields))
  return fields
})

function initDefaultValues() {
  const user = userStore.userInfo
  const prefillMap: Record<string, any> = {
    realName: user?.realName,
    idCard: user?.idCard,
    phone: user?.phone,
    email: user?.email || '',
    address: user?.address || { province: '江西省', city: '抚州市', detail: '' },
    gender: user?.gender,
    birthDate: user?.birthDate
  }

  allFields.value.forEach(field => {
    if (props.modelValue && props.modelValue[field.key] !== undefined) {
      formData[field.key] = props.modelValue[field.key]
    } else if (field.prefill?.autoApplied && field.prefill.value !== undefined) {
      formData[field.key] = field.prefill.value
    } else if (field.prefill?.autoApplied && prefillMap[field.key] !== undefined) {
      formData[field.key] = prefillMap[field.key]
    } else if (field.defaultValue !== undefined) {
      formData[field.key] = field.defaultValue
    } else if (field.type === 'checkbox') {
      formData[field.key] = []
    } else if (field.type === 'address') {
      formData[field.key] = { province: '', city: '', detail: '' }
    } else {
      formData[field.key] = ''
    }
  })

  setTimeout(() => {
    emit('update:modelValue', { ...formData })
  }, 0)
}

function validateField(field: FormFieldConfig): string {
  const value = formData[field.key]

  if (field.required) {
    if (field.type === 'checkbox') {
      if (!value || value.length === 0) return `${field.label}不能为空`
    } else if (field.type === 'address') {
      if (!value?.province || !value?.city || !value?.detail) return `${field.label}请填写完整`
    } else {
      if (value === '' || value === null || value === undefined) return `${field.label}不能为空`
    }
  }

  if (field.rules) {
    for (const rule of field.rules) {
      if (rule.type === 'phone' && value) {
        if (!/^1[3-9]\d{9}$/.test(String(value))) return '请输入正确的手机号'
      }
      if (rule.type === 'idcard' && value) {
        if (!/(^\d{15}$)|(^\d{17}(\d|X|x)$)/.test(String(value))) return '请输入正确的身份证号'
      }
      if (rule.type === 'email' && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return '请输入正确的邮箱地址'
      }
      if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
        return `${field.label}至少${rule.min}个字符`
      }
      if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
        return `${field.label}最多${rule.max}个字符`
      }
      if (rule.pattern && value && !rule.pattern.test(String(value))) {
        return rule.message || `${field.label}格式不正确`
      }
    }
  }

  return ''
}

function validateAll(): boolean {
  let valid = true
  allFields.value.forEach(field => {
    const err = validateField(field)
    errors[field.key] = err
    touched[field.key] = true
    if (err) valid = false
  })
  emit('validate', valid, { ...errors })
  return valid
}

function onFieldUpdate(key: string, value: any) {
  formData[key] = value
  touched[key] = true
  const field = allFields.value.find(f => f.key === key)
  if (field) {
    errors[key] = validateField(field)
  }
  emit('update:modelValue', { ...formData })
}

function onFieldBlur(key: string) {
  touched[key] = true
  const field = allFields.value.find(f => f.key === key)
  if (field) {
    errors[key] = validateField(field)
  }
}

function onPrefill(key: string) {
  const field = allFields.value.find(f => f.key === key)
  if (!field || !field.prefill) return

  const user = userStore.userInfo
  if (!user) return

  const prefillMap: Record<string, any> = {
    realName: user.realName,
    idCard: user.idCard,
    phone: user.phone,
    email: user.email || '',
    address: user.address,
    gender: user.gender,
    birthDate: user.birthDate
  }

  if (prefillMap[key] !== undefined) {
    onFieldUpdate(key, prefillMap[key])
  }
}

function submitForm() {
  if (validateAll()) {
    emit('submit', { ...formData })
  }
}

function onMaterialsChange(files: any[]) {
  emit('materialsChange', files)
}

onMounted(() => {
  initDefaultValues()
})

defineExpose({
  validate: validateAll,
  getData: () => ({ ...formData }),
  submit: submitForm,
  reset: initDefaultValues
})
</script>

<template>
  <div class="dynamic-form">
    <div
      v-for="group in schema.groups"
      :key="group.key"
      class="mb-8 last:mb-0"
    >
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
        <div v-if="group.icon" class="w-8 h-8 rounded-lg bg-gov-blue/10 flex items-center justify-center">
          <component :is="group.icon" class="w-4 h-4 text-gov-blue" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-neutral-800">{{ group.title }}</h3>
          <p v-if="group.description" class="text-xs text-neutral-500 mt-0.5">{{ group.description }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <div
          v-for="field in group.fields"
          :key="field.key"
          :class="field.type === 'textarea' || field.type === 'address' ? 'md:col-span-2' : ''"
        >
          <FormFieldRenderer
            :field="field"
            :model-value="formData[field.key]"
            @update:model-value="onFieldUpdate(field.key, $event)"
            @prefill="onPrefill"
            @blur="onFieldBlur(field.key)"
          />
          <p
            v-if="touched[field.key] && errors[field.key]"
            class="text-xs text-accent-red mt-1.5 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors[field.key] }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="schema.materialsEnabled" class="mt-8">
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
        <div class="w-8 h-8 rounded-lg bg-gov-blue/10 flex items-center justify-center">
          <User class="w-4 h-4 text-gov-blue" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-neutral-800">申请材料</h3>
          <p class="text-xs text-neutral-500 mt-0.5">请上传办理所需的相关材料</p>
        </div>
      </div>
      <MaterialUpload @update:model-value="onMaterialsChange" />
    </div>
  </div>
</template>
