<template>
  <div class="form-submit-container">
    <el-card class="submit-card">
      <template #header>
        <div class="card-header">
          <span>{{ formInfo?.name || '表单填报' }}</span>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="!formInfo" class="empty-container">
        <el-empty description="表单不存在或未发布" />
      </div>

      <el-form
        v-else
        ref="submitFormRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
        class="submit-form"
      >
        <div class="form-info">
          <h2>{{ formInfo.name }}</h2>
          <p v-if="formInfo.description" class="form-desc">{{ formInfo.description }}</p>
        </div>

        <el-divider />

        <div v-for="field in formInfo.fields" :key="field.field_name">
          <el-form-item
            :label="field.field_label"
            :prop="field.field_name"
            :required="field.is_required"
          >
            <render-field
              :field="field"
              v-model="formData[field.field_name]"
            />
          </el-form-item>
        </div>

        <el-divider />

        <el-form-item class="form-actions">
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            <el-icon><CircleCheck /></el-icon>
            提交表单
          </el-button>
          <el-button @click="handleSaveDraft" :loading="saving">
            <el-icon><Document /></el-icon>
            保存草稿
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { formApi, submissionApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const saving = ref(false)
const formCode = computed(() => route.params.code as string)
const formInfo = ref<any>(null)
const submitFormRef = ref<FormInstance>()

const formData = reactive<Record<string, any>>({})
const formRules = reactive<FormRules>({})

const loadForm = async () => {
  loading.value = true
  try {
    const result = await formApi.getPublished(formCode.value)
    formInfo.value = result
    
    result.fields.forEach((field: any) => {
      if (field.default_value !== undefined && field.default_value !== null) {
        formData[field.field_name] = field.default_value
      }
      
      if (field.is_required) {
        formRules[field.field_name] = [
          { required: true, message: `请填写${field.field_label}`, trigger: 'blur' }
        ]
      }
    })
  } catch (error) {
    console.error('Load form error:', error)
    ElMessage.error('加载表单失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await submitFormRef.value?.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    await submissionApi.create({
      form_code: formCode.value,
      data: { ...formData },
      save_as_draft: false
    })
    ElMessage.success('提交成功')
    router.push('/submissions')
  } catch (error: any) {
    console.error('Submit error:', error)
    if (error.response?.data?.detail?.errors) {
      const errors = error.response.data.detail.errors
      if (errors.field_errors) {
        Object.keys(errors.field_errors).forEach(key => {
          const fieldErrors = errors.field_errors[key]
          if (fieldErrors.length > 0) {
            ElMessage.error(fieldErrors[0].message)
          }
        })
      }
    }
  } finally {
    submitting.value = false
  }
}

const handleSaveDraft = async () => {
  saving.value = true
  try {
    await submissionApi.create({
      form_code: formCode.value,
      data: { ...formData },
      save_as_draft: true
    })
    ElMessage.success('草稿保存成功')
  } catch (error) {
    console.error('Save draft error:', error)
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  submitFormRef.value?.resetFields()
  formInfo.value?.fields.forEach((field: any) => {
    if (field.default_value !== undefined && field.default_value !== null) {
      formData[field.field_name] = field.default_value
    } else {
      formData[field.field_name] = undefined
    }
  })
}

const RenderField = defineComponent({
  name: 'RenderField',
  props: {
    field: {
      type: Object as () => any,
      required: true
    },
    modelValue: [String, Number, Boolean, Array, Date],
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleChange = (val: any) => {
      emit('update:modelValue', val)
    }

    return () => {
      const { field, modelValue, readonly } = props
      const disabled = readonly

      if (disabled) {
        const value = modelValue
        const displayValue = (() => {
          if (value === null || value === undefined || value === '') {
            return <span class="disabled-placeholder">请选择{field.field_label}</span>
          }
          if (Array.isArray(value) && field.options?.length > 0) {
            const labels = value.map((v: any) => {
              const opt = field.options.find((o: any) => o.value === v)
              return opt ? opt.label : v
            })
            return <span class="disabled-value">{labels.join('、')}</span>
          }
          if (field.options?.length > 0 && typeof value === 'string') {
            const opt = field.options.find((o: any) => o.value === value)
            return <span class="disabled-value">{opt ? opt.label : value}</span>
          }
          if (typeof value === 'boolean') {
            return <span class="disabled-value">{value ? '是' : '否'}</span>
          }
          return <span class="disabled-value">{String(value)}</span>
        })()
        
        return (
          <div class="disabled-field">
            {displayValue}
          </div>
        )
      }

      switch (field.field_type) {
        case 'textarea':
          return h('el-input', {
            type: 'textarea',
            modelValue,
            disabled,
            placeholder: `请输入${field.field_label}`,
            rows: 4,
            'onUpdate:modelValue': handleChange
          })
        case 'number':
          return h('el-input-number', {
            modelValue,
            disabled,
            controlsPosition: 'right',
            style: 'width: 100%',
            'onUpdate:modelValue': handleChange
          })
        case 'select':
          return h('el-select', {
            modelValue,
            disabled,
            placeholder: `请选择${field.field_label}`,
            style: 'width: 100%',
            clearable: true,
            'onUpdate:modelValue': handleChange
          }, {
            default: () => (field.options || []).map((opt: any) => 
              h('el-option', { key: opt.value, label: opt.label, value: opt.value })
            )
          })
        case 'radio':
          return h('el-radio-group', {
            modelValue,
            disabled,
            'onUpdate:modelValue': handleChange
          }, {
            default: () => (field.options || []).map((opt: any) => 
              h('el-radio', { key: opt.value, label: opt.value }, { default: () => opt.label })
            )
          })
        case 'checkbox':
          return h('el-checkbox-group', {
            modelValue: modelValue || [],
            disabled,
            'onUpdate:modelValue': handleChange
          }, {
            default: () => (field.options || []).map((opt: any) => 
              h('el-checkbox', { key: opt.value, label: opt.value }, { default: () => opt.label })
            )
          })
        case 'date':
          return h('el-date-picker', {
            modelValue,
            type: 'date',
            disabled,
            placeholder: `请选择${field.field_label}`,
            style: 'width: 100%',
            format: 'YYYY-MM-DD',
            valueFormat: 'YYYY-MM-DD',
            'onUpdate:modelValue': handleChange
          })
        case 'datetime':
          return h('el-date-picker', {
            modelValue,
            type: 'datetime',
            disabled,
            placeholder: `请选择${field.field_label}`,
            style: 'width: 100%',
            format: 'YYYY-MM-DD HH:mm:ss',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            'onUpdate:modelValue': handleChange
          })
        case 'switch':
          return h('el-switch', {
            modelValue,
            disabled,
            'onUpdate:modelValue': handleChange
          })
        case 'email':
          return h('el-input', {
            modelValue,
            disabled,
            type: 'email',
            placeholder: `请输入${field.field_label}`,
            'onUpdate:modelValue': handleChange
          })
        case 'phone':
          return h('el-input', {
            modelValue,
            disabled,
            placeholder: `请输入${field.field_label}`,
            maxlength: 11,
            'onUpdate:modelValue': handleChange
          })
        case 'text':
        default:
          return h('el-input', {
            modelValue,
            disabled,
            placeholder: `请输入${field.field_label}`,
            'onUpdate:modelValue': handleChange
          })
      }
    }
  }
})

onMounted(() => {
  loadForm()
})
</script>

<style scoped>
.form-submit-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.submit-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.submit-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 30px;
  border-bottom: none;
}

.card-header {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: #909399;
}

.loading-container .is-loading {
  color: #667eea;
}

.form-info {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.form-info h2 {
  font-size: 26px;
  color: #303133;
  margin-bottom: 12px;
  font-weight: 600;
}

.form-desc {
  color: #606266;
  font-size: 15px;
  line-height: 1.6;
}

.submit-form {
  padding: 0 20px;
}

.submit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.submit-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.submit-form :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.submit-form :deep(.el-checkbox) {
  margin-right: 0;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.submit-form :deep(.el-checkbox:hover) {
  background: #ecf5ff;
}

.submit-form :deep(.el-checkbox.is-checked) {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
}

.submit-form :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.submit-form :deep(.el-radio) {
  margin-right: 0;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.submit-form :deep(.el-radio:hover) {
  background: #ecf5ff;
}

.submit-form :deep(.el-radio.is-checked) {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #e4e7ed;
}

.form-actions .el-button {
  padding: 14px 40px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.form-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.form-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.form-actions .el-button:not(.el-button--primary) {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-color: #dcdfe6;
  color: #606266;
}

.form-actions .el-button:not(.el-button--primary):hover {
  border-color: #667eea;
  color: #667eea;
  background: #ecf5ff;
}

.disabled-field {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  color: #606266;
}

.disabled-placeholder {
  color: #c0c4cc;
  font-style: italic;
}

.disabled-value {
  color: #303133;
}
</style>
