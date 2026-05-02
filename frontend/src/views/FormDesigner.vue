<template>
  <div class="form-designer-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="component-panel">
          <template #header>
            <div class="panel-header-title">
              <el-icon :size="18" color="#409eff"><Box /></el-icon>
              <span>组件库</span>
            </div>
          </template>
          <div class="component-list">
            <div
              v-for="component in componentList"
              :key="component.type"
              class="component-item"
              draggable="true"
              @dragstart="handleDragStart($event, component)"
            >
              <div class="component-icon-wrap" :style="{ background: component.color }">
                <el-icon :size="18">{{ component.icon }}</el-icon>
              </div>
              <div class="component-info">
                <span class="component-name">{{ component.label }}</span>
                <span class="component-desc">{{ component.desc }}</span>
              </div>
            </div>
          </div>

          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon :size="14"><Document /></el-icon>
              快速模板
            </span>
          </el-divider>
          <div class="template-list">
            <div
              v-for="template in templateList"
              :key="template.id"
              class="template-item"
              @click="useTemplate(template)"
            >
              <div class="template-icon" :style="{ background: template.color }">
                <el-icon :size="20">{{ template.icon }}</el-icon>
              </div>
              <div class="template-info">
                <span class="template-name">{{ template.name }}</span>
                <span class="template-desc">{{ template.fields.length }} 个字段</span>
              </div>
              <el-button type="primary" link size="small" class="template-btn">
                使用
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="designer-panel">
          <template #header>
            <div class="panel-header">
              <div class="panel-header-title">
                <el-icon :size="18" color="#67c23a"><EditPen /></el-icon>
                <span>设计画布</span>
              </div>
              <div class="header-actions">
                <el-button type="primary" size="small" @click="handleSave" :loading="saving">
                  <el-icon><Document /></el-icon>
                  保存
                </el-button>
                <el-button type="success" size="small" @click="handleSaveAndPublish" :loading="publishing">
                  <el-icon><CircleCheck /></el-icon>
                  保存并发布
                </el-button>
                <el-button size="small" @click="handlePreview">
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="basic-info-section">
            <div class="section-title">
              <el-icon :size="16"><InfoFilled /></el-icon>
              基本信息
            </div>
            <el-form :model="formBasicInfo" label-position="top" class="basic-info-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="表单名称" required>
                    <el-input 
                      v-model="formBasicInfo.name" 
                      placeholder="请输入表单名称" 
                      class="styled-input"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="表单编码" required>
                    <el-input 
                      v-model="formBasicInfo.code" 
                      placeholder="请输入表单编码（英文）" 
                      :disabled="!!formId"
                      class="styled-input"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="表单描述">
                <el-input 
                  v-model="formBasicInfo.description" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="请输入表单描述，用于说明表单用途"
                  class="styled-input"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="canvas-section">
            <div class="section-title">
              <el-icon :size="16"><Collection /></el-icon>
              表单字段
            </div>
            <div
              class="canvas-area"
              @dragover.prevent
              @drop="handleDrop"
            >
              <el-empty
                v-if="formFields.length === 0"
                description="从左侧拖拽组件到这里开始设计"
                :image-size="80"
              >
                <template #description>
                  <div class="empty-hint">
                    <p>从左侧拖拽组件到这里开始设计</p>
                    <p class="empty-sub-hint">或直接使用上方快速模板</p>
                  </div>
                </template>
              </el-empty>
              <div v-else class="form-fields">
                <div
                  v-for="(field, index) in formFields"
                  :key="field.field_name"
                  class="field-item"
                  :class="{ active: selectedField?.field_name === field.field_name }"
                  @click="selectField(field)"
                >
                  <div class="field-header">
                    <div class="field-type-badge" :style="{ background: getFieldColor(field.field_type) }">
                      <el-icon :size="12">{{ getFieldIcon(field.field_type) }}</el-icon>
                    </div>
                    <span class="field-label">
                      {{ field.field_label }}
                      <span v-if="field.is_required" class="required">*</span>
                    </span>
                    <div class="field-actions">
                      <el-button type="primary" link size="small" @click.stop="moveField(index, -1)" :disabled="index === 0">
                        <el-icon><Top /></el-icon>
                      </el-button>
                      <el-button type="primary" link size="small" @click.stop="moveField(index, 1)" :disabled="index === formFields.length - 1">
                        <el-icon><Bottom /></el-icon>
                      </el-button>
                      <el-button type="danger" link size="small" @click.stop="removeField(index)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  <div class="field-preview">
                    <render-field :field="field" :readonly="true" v-model="field._previewValue" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="property-panel">
          <template #header>
            <div class="panel-header-title">
              <el-icon :size="18" color="#e6a23c"><Setting /></el-icon>
              <span>属性配置</span>
            </div>
          </template>
          <div v-if="selectedField" class="property-content">
            <div class="property-section">
              <div class="property-section-title">基本属性</div>
              <el-form label-position="top" label-width="100%">
                <el-form-item label="字段名称">
                  <el-input v-model="selectedField.field_name" placeholder="请输入字段名称（英文）" />
                </el-form-item>
                <el-form-item label="显示标签">
                  <el-input v-model="selectedField.field_label" placeholder="请输入显示标签" />
                </el-form-item>
                <el-form-item label="必填">
                  <el-switch v-model="selectedField.is_required" active-color="#409eff" />
                </el-form-item>
                <el-form-item label="唯一校验">
                  <el-switch v-model="selectedField.is_unique" active-color="#409eff" />
                </el-form-item>
                <el-form-item label="默认值">
                  <el-input v-model="selectedField.default_value" placeholder="请输入默认值" />
                </el-form-item>
              </el-form>
            </div>
            
            <template v-if="['select', 'radio', 'checkbox'].includes(selectedField.field_type)">
              <el-divider />
              <div class="property-section">
                <div class="property-section-title">选项配置</div>
                <div class="options-editor">
                  <div v-for="(opt, idx) in selectedField.options" :key="idx" class="option-item">
                    <div class="option-index">{{ idx + 1 }}</div>
                    <div class="option-inputs">
                      <el-input v-model="opt.label" placeholder="显示文本" size="small" class="option-input-label" />
                      <el-input v-model="opt.value" placeholder="存储值" size="small" class="option-input-value" />
                    </div>
                    <el-button type="danger" link size="small" @click="selectedField.options.splice(idx, 1)" class="option-delete">
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <el-button type="primary" class="add-option-btn" size="small" @click="addOption(selectedField)">
                    <el-icon><Plus /></el-icon>
                    添加选项
                  </el-button>
                </div>
              </div>
            </template>

            <el-divider />
            <div class="property-section">
              <div class="property-section-title">校验规则</div>
              <el-form label-position="top">
                <el-form-item label="最小长度">
                  <el-input-number
                    v-model="selectedField.validation_rules.minLength"
                    :min="0"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="最大长度">
                  <el-input-number
                    v-model="selectedField.validation_rules.maxLength"
                    :min="0"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="正则表达式">
                  <el-input v-model="selectedField.validation_rules.pattern" placeholder="请输入正则表达式" />
                </el-form-item>
              </el-form>
            </div>
          </div>
          <el-empty v-else description="请选择一个字段进行编辑" :image-size="60">
            <template #description>
              <div class="empty-property-hint">
                点击画布中的字段进行编辑
              </div>
            </template>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showPreview" title="表单预览" width="700px" class="preview-dialog">
      <template #header>
        <div class="dialog-header">
          <el-icon :size="18" color="#409eff"><View /></el-icon>
          <span>表单预览</span>
        </div>
      </template>
      <div class="preview-form">
        <div class="preview-header">
          <h3>{{ formBasicInfo.name || '未命名表单' }}</h3>
          <p v-if="formBasicInfo.description" class="preview-description">{{ formBasicInfo.description }}</p>
        </div>
        <el-divider />
        <el-form :model="previewData" label-width="140px" class="preview-inner-form">
          <div v-for="field in formFields" :key="field.field_name" class="preview-field">
            <el-form-item :label="field.field_label" :required="field.is_required">
              <render-field :field="field" v-model="previewData[field.field_name]" />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formApi } from '@/api'
import type { FormField } from '@/types'

interface ComponentConfig {
  type: string
  label: string
  icon: string
  desc: string
  color: string
}

interface FormTemplate {
  id: string
  name: string
  icon: string
  color: string
  fields: FormField[]
}

const route = useRoute()
const router = useRouter()

const formId = computed(() => route.params.id as string)
const saving = ref(false)
const publishing = ref(false)
const showPreview = ref(false)
const selectedField = ref<FormField | null>(null)
const previewData = ref<Record<string, any>>({})

const componentList: ComponentConfig[] = [
  { type: 'text', label: '单行文本', icon: 'Edit', desc: '输入简短文字', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { type: 'textarea', label: '多行文本', icon: 'Document', desc: '输入长文本内容', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { type: 'number', label: '数字输入', icon: 'Calculator', desc: '输入数值类型', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { type: 'select', label: '下拉选择', icon: 'ArrowDown', desc: '单选下拉列表', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { type: 'radio', label: '单选按钮', icon: 'CircleCheck', desc: '单选按钮组', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { type: 'checkbox', label: '多选框', icon: 'Check', desc: '多选框组', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { type: 'date', label: '日期选择', icon: 'Calendar', desc: '选择日期', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { type: 'datetime', label: '日期时间', icon: 'Clock', desc: '选择日期和时间', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { type: 'switch', label: '开关', icon: 'Switch', desc: '开关选择', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { type: 'email', label: '邮箱', icon: 'Message', desc: '邮箱格式校验', color: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' },
  { type: 'phone', label: '手机号', icon: 'Phone', desc: '手机号格式校验', color: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
]

const templateList: FormTemplate[] = [
  {
    id: 'contact',
    name: '联系表单',
    icon: 'User',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fields: [
      { field_name: 'name', field_label: '姓名', field_type: 'text', is_required: true, is_unique: false, default_value: '', validation_rules: { minLength: 2, maxLength: 50 }, options: [], sort_order: 0 },
      { field_name: 'phone', field_label: '联系电话', field_type: 'phone', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 1 },
      { field_name: 'email', field_label: '电子邮箱', field_type: 'email', is_required: false, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 2 },
      { field_name: 'message', field_label: '留言内容', field_type: 'textarea', is_required: true, is_unique: false, default_value: '', validation_rules: { maxLength: 500 }, options: [], sort_order: 3 },
    ]
  },
  {
    id: 'survey',
    name: '调查问卷',
    icon: 'List',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    fields: [
      { field_name: 'name', field_label: '姓名', field_type: 'text', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 0 },
      { field_name: 'age', field_label: '年龄段', field_type: 'select', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [
        { label: '18岁以下', value: 'under18' },
        { label: '18-25岁', value: '18-25' },
        { label: '26-35岁', value: '26-35' },
        { label: '36-45岁', value: '36-45' },
        { label: '46岁以上', value: 'over46' },
      ], sort_order: 1 },
      { field_name: 'satisfaction', field_label: '满意度', field_type: 'radio', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [
        { label: '非常满意', value: 'excellent' },
        { label: '满意', value: 'good' },
        { label: '一般', value: 'average' },
        { label: '不满意', value: 'poor' },
      ], sort_order: 2 },
      { field_name: 'suggestions', field_label: '改进建议', field_type: 'textarea', is_required: false, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 3 },
    ]
  },
  {
    id: 'registration',
    name: '报名登记表',
    icon: 'EditPen',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    fields: [
      { field_name: 'student_name', field_label: '学生姓名', field_type: 'text', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 0 },
      { field_name: 'gender', field_label: '性别', field_type: 'radio', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ], sort_order: 1 },
      { field_name: 'birthday', field_label: '出生日期', field_type: 'date', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 2 },
      { field_name: 'parent_name', field_label: '家长姓名', field_type: 'text', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 3 },
      { field_name: 'parent_phone', field_label: '联系电话', field_type: 'phone', is_required: true, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 4 },
      { field_name: 'address', field_label: '家庭住址', field_type: 'textarea', is_required: false, is_unique: false, default_value: '', validation_rules: {}, options: [], sort_order: 5 },
    ]
  },
]

const formBasicInfo = reactive({
  name: '',
  code: '',
  description: ''
})

const formFields = ref<FormField[]>([])

const generateFieldName = () => {
  const count = formFields.value.length + 1
  return `field_${count}_${Date.now()}`
}

const createField = (component: ComponentConfig): FormField => {
  return {
    field_name: generateFieldName(),
    field_label: component.label,
    field_type: component.type,
    is_required: false,
    is_unique: false,
    default_value: '',
    validation_rules: {},
    options: ['select', 'radio', 'checkbox'].includes(component.type)
      ? [{ label: '选项一', value: 'option1' }, { label: '选项二', value: 'option2' }]
      : [],
    sort_order: formFields.value.length,
    _previewValue: undefined
  }
}

const getFieldColor = (type: string) => {
  const comp = componentList.find(c => c.type === type)
  return comp?.color || '#409eff'
}

const getFieldIcon = (type: string) => {
  const comp = componentList.find(c => c.type === type)
  return comp?.icon || 'Edit'
}

const handleDragStart = (e: DragEvent, component: ComponentConfig) => {
  e.dataTransfer?.setData('component_type', component.type)
  e.dataTransfer?.setData('component_label', component.label)
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const componentType = e.dataTransfer?.getData('component_type')
  const componentLabel = e.dataTransfer?.getData('component_label')
  
  if (componentType && componentLabel) {
    const component = componentList.find(c => c.type === componentType)
    if (component) {
      const field = createField(component)
      formFields.value.push(field)
      selectedField.value = field
    }
  }
}

const useTemplate = async (template: FormTemplate) => {
  if (formFields.value.length > 0) {
    try {
      await ElMessageBox.confirm(
        '使用模板将覆盖当前的所有字段，是否继续？',
        '确认使用模板',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }
  
  const newFields = template.fields.map((f, index) => ({
    ...f,
    field_name: `field_${index}_${Date.now()}`,
    sort_order: index,
    _previewValue: undefined
  }))
  
  formFields.value = newFields
  selectedField.value = newFields[0] || null
  
  ElMessage.success(`已加载"${template.name}"模板`)
}

const selectField = (field: FormField) => {
  selectedField.value = field
}

const moveField = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= formFields.value.length) return
  
  const temp = formFields.value[index]
  formFields.value[index] = formFields.value[newIndex]
  formFields.value[newIndex] = temp
  
  formFields.value.forEach((f, i) => {
    f.sort_order = i
  })
}

const removeField = (index: number) => {
  formFields.value.splice(index, 1)
  if (selectedField.value && !formFields.value.includes(selectedField.value)) {
    selectedField.value = null
  }
  formFields.value.forEach((f, i) => {
    f.sort_order = i
  })
}

const addOption = (field: FormField) => {
  const idx = field.options.length + 1
  field.options.push({ label: `选项${idx}`, value: `option${idx}` })
}

const handleSave = async () => {
  if (!formBasicInfo.name || !formBasicInfo.code) {
    ElMessage.warning('请填写表单名称和编码')
    return
  }
  
  saving.value = true
  try {
    const data = {
      name: formBasicInfo.name,
      code: formBasicInfo.code,
      description: formBasicInfo.description,
      fields: formFields.value.map(({ _previewValue, ...rest }) => rest)
    }
    
    let result
    if (formId.value) {
      result = await formApi.update(parseInt(formId.value), data)
    } else {
      result = await formApi.create(data)
    }
    
    ElMessage.success('保存成功')
    if (!formId.value && result.id) {
      router.replace(`/forms/design/${result.id}`)
    }
  } catch (error) {
    console.error('Save error:', error)
  } finally {
    saving.value = false
  }
}

const handleSaveAndPublish = async () => {
  await handleSave()
  if (formId.value) {
    publishing.value = true
    try {
      await formApi.publish(parseInt(formId.value))
      ElMessage.success('发布成功')
    } catch (error) {
      console.error('Publish error:', error)
    } finally {
      publishing.value = false
    }
  }
}

const handlePreview = () => {
  previewData.value = {}
  formFields.value.forEach(f => {
    if (f.default_value) {
      previewData.value[f.field_name] = f.default_value
    }
  })
  showPreview.value = true
}

const loadForm = async () => {
  if (formId.value) {
    try {
      const form = await formApi.get(parseInt(formId.value))
      formBasicInfo.name = form.name
      formBasicInfo.code = form.code
      formBasicInfo.description = form.description || ''
      formFields.value = form.fields.map((f: any) => ({
        ...f,
        _previewValue: undefined
      }))
    } catch (error) {
      console.error('Load form error:', error)
    }
  }
}

onMounted(() => {
  loadForm()
})
</script>

<script lang="ts">
import { defineComponent, h } from 'vue'
import type { FormField } from '@/types'

const RenderField = defineComponent({
  name: 'RenderField',
  props: {
    field: {
      type: Object as () => FormField,
      required: true
    },
    modelValue: [String, Number, Boolean, Array],
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
          if (Array.isArray(value) && field.options.length > 0) {
            const labels = value.map(v => {
              const opt = field.options.find(o => o.value === v)
              return opt ? opt.label : v
            })
            return <span class="disabled-value">{labels.join('、')}</span>
          }
          if (field.options.length > 0 && typeof value === 'string') {
            const opt = field.options.find(o => o.value === value)
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
            rows: 3,
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
            default: () => field.options.map(opt => 
              h('el-option', { key: opt.value, label: opt.label, value: opt.value })
            )
          })
        case 'radio':
          return h('el-radio-group', {
            modelValue,
            disabled,
            'onUpdate:modelValue': handleChange
          }, {
            default: () => field.options.map(opt => 
              h('el-radio', { key: opt.value, label: opt.value }, { default: () => opt.label })
            )
          })
        case 'checkbox':
          return h('el-checkbox-group', {
            modelValue: modelValue || [],
            disabled,
            'onUpdate:modelValue': handleChange
          }, {
            default: () => field.options.map(opt => 
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
        case 'phone':
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

export { RenderField }
</script>

<style scoped>
.form-designer-container {
  padding: 0;
}

.panel-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.divider-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 13px;
}

.component-panel,
.designer-panel,
.property-panel {
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.component-panel :deep(.el-card__header),
.designer-panel :deep(.el-card__header),
.property-panel :deep(.el-card__header) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-bottom: 1px solid #dcdfe6;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
}

.component-item:hover {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.component-item:active {
  cursor: grabbing;
}

.component-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.component-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.component-desc {
  font-size: 12px;
  color: #909399;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.template-item:hover {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.template-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.template-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.template-desc {
  font-size: 11px;
  color: #909399;
}

.template-btn {
  margin-right: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.basic-info-section,
.canvas-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.basic-info-form {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.styled-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 6px;
}

.styled-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.canvas-area {
  min-height: 300px;
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  padding: 20px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f7fa 100%);
  position: relative;
}

.canvas-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle, #e4e7ed 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.5;
  pointer-events: none;
}

.empty-hint {
  text-align: center;
}

.empty-hint p {
  color: #909399;
  margin: 4px 0;
}

.empty-sub-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.field-item {
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.field-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.field-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.field-item:hover::before {
  opacity: 1;
}

.field-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.field-item.active::before {
  opacity: 1;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.field-type-badge {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 8px;
}

.field-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  display: flex;
  align-items: center;
  flex: 1;
}

.required {
  color: #f56c6c;
  margin-left: 4px;
  font-weight: bold;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.field-preview {
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.disabled-field {
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
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

.property-section {
  margin-bottom: 16px;
}

.property-section-title {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.property-content {
  padding: 4px;
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.option-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.option-inputs {
  flex: 1;
  display: flex;
  gap: 8px;
}

.option-input-label,
.option-input-value {
  flex: 1;
}

.add-option-btn {
  width: 100%;
  margin-top: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.add-option-btn:hover {
  opacity: 0.9;
}

.empty-property-hint {
  color: #909399;
  font-size: 13px;
}

.preview-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-form {
  padding: 10px;
}

.preview-header {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: #fff;
}

.preview-header h3 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.preview-description {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.preview-inner-form {
  padding: 20px;
}

.preview-field {
  margin-bottom: 20px;
}
</style>
