<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">表单引擎管理</h1>
        <p class="text-neutral-400 text-sm">可视化表单设计器，支持拖拽式字段配置</p>
      </div>
      <div class="flex gap-2">
        <button @click="currentView = 'list'" :class="['px-4 py-2 rounded-lg text-sm transition-colors', currentView === 'list' ? 'bg-gov-blue text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white']">
          模板列表
        </button>
        <button @click="currentView = 'designer'" :class="['px-4 py-2 rounded-lg text-sm transition-colors', currentView === 'designer' ? 'bg-gov-blue text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white']">
          表单设计器
        </button>
      </div>
    </div>

    <div v-if="currentView === 'list'">
      <div class="flex gap-4 items-end mb-5">
        <div class="flex-1">
          <label class="text-sm text-neutral-400 block mb-1.5">搜索模板</label>
          <el-input v-model="searchKeyword" placeholder="输入模板名称搜索..." clearable>
            <template #prefix><Search class="w-4 h-4 text-neutral-500" /></template>
          </el-input>
        </div>
        <button @click="createTemplate" class="btn-primary flex items-center gap-2">
          <Plus class="w-4 h-4" />
          新建模板
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="tpl in filteredTemplates" :key="tpl.id"
             class="bg-neutral-800/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all p-5 group">
          <div class="flex items-start justify-between mb-4">
            <div class="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileText class="w-5 h-5 text-white" />
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="editTemplate(tpl)" class="w-7 h-7 rounded-md bg-neutral-700/50 hover:bg-neutral-600 flex items-center justify-center text-neutral-400 hover:text-white">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button @click="deleteTemplate(tpl)" class="w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <h3 class="text-white font-semibold mb-1.5">{{ tpl.name }}</h3>
          <p class="text-sm text-neutral-500 mb-4 line-clamp-2">{{ tpl.description || '暂无描述' }}</p>
          <div class="flex items-center justify-between pt-4 border-t border-neutral-700/50">
            <div class="flex items-center gap-4 text-xs text-neutral-500">
              <span class="flex items-center gap-1"><Hash class="w-3 h-3" /> {{ tpl.fields.length }}字段</span>
              <span class="flex items-center gap-1"><Eye class="w-3 h-3" /> {{ tpl.usageCount }}次</span>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full"
              :class="tpl.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-neutral-600/30 text-neutral-400'">
              {{ tpl.status === 'published' ? '已发布' : '草稿' }}
            </span>
          </div>
        </div>
        <div @click="createTemplate"
             class="bg-neutral-800/30 rounded-xl border-2 border-dashed border-neutral-700 hover:border-gov-blue hover:bg-gov-blue/5 transition-all p-5 flex flex-col items-center justify-center cursor-pointer min-h-[200px]">
          <div class="w-12 h-12 rounded-full bg-neutral-700/50 flex items-center justify-center mb-3">
            <Plus class="w-6 h-6 text-neutral-500" />
          </div>
          <p class="text-neutral-400 text-sm">新建表单模板</p>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-12 gap-5 h-[calc(100vh-180px)]">
      <div class="col-span-2 bg-neutral-800/50 rounded-xl border border-neutral-800 p-4 overflow-y-auto scrollbar-thin">
        <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <LayoutGrid class="w-4 h-4 text-blue-400" />
          字段组件
        </h3>
        <div class="space-y-2">
          <div v-for="group in fieldGroups" :key="group.name">
            <p class="text-xs text-neutral-500 mb-2 mt-3 first:mt-0">{{ group.name }}</p>
            <div v-for="field in group.fields" :key="field.type"
                 @dragstart="onFieldDragStart(field, $event)" draggable="true"
                 class="flex items-center gap-2.5 p-2.5 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/60 border border-neutral-700/50 hover:border-neutral-600 transition-all cursor-grab mb-2">
              <component :is="field.icon" class="w-4 h-4 text-cyan-400" />
              <span class="text-sm text-neutral-300">{{ field.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-7 bg-neutral-800/50 rounded-xl border border-neutral-800 flex flex-col">
        <div class="flex items-center justify-between px-5 py-3 border-b border-neutral-700/50">
          <div class="flex items-center gap-3">
            <el-input v-model="currentTemplate.name" placeholder="表单名称" class="!w-64 !bg-neutral-700/30" />
            <span class="text-xs text-neutral-500">拖拽左侧组件到画布</span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="previewVisible = true" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-4 !py-1.5 text-sm flex items-center gap-1.5">
              <Eye class="w-3.5 h-3.5" /> 预览
            </button>
            <button @click="saveTemplate" class="btn-primary !px-4 !py-1.5 text-sm flex items-center gap-1.5">
              <Save class="w-3.5 h-3.5" /> 保存
            </button>
          </div>
        </div>
        <div class="flex-1 p-6 overflow-y-auto scrollbar-thin bg-neutral-900/50"
             @dragover.prevent
             @drop="onFieldDrop">
          <div v-if="currentTemplate.fields.length === 0" class="h-full flex flex-col items-center justify-center text-neutral-500">
            <MousePointerClick class="w-12 h-12 mb-3 text-neutral-600" />
            <p class="text-sm">从左侧拖拽字段组件到此处</p>
          </div>
          <div v-else class="max-w-2xl mx-auto space-y-3">
            <div v-for="(field, idx) in currentTemplate.fields" :key="field.id"
                 class="group bg-neutral-800/70 rounded-lg border-2 transition-all p-4 relative"
                 :class="selectedField?.id === field.id ? 'border-gov-blue' : 'border-transparent hover:border-neutral-600'"
                 draggable="true"
                 @click="selectedField = field"
                 @dragstart="onCanvasDragStart(idx, $event)"
                 @dragover.prevent
                 @drop="onCanvasDrop(idx)">
              <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click.stop="moveField(idx, -1)" :disabled="idx === 0" class="w-6 h-6 rounded bg-neutral-700/60 hover:bg-neutral-600 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30">
                  <ChevronUp class="w-3 h-3" />
                </button>
                <button @click.stop="moveField(idx, 1)" :disabled="idx === currentTemplate.fields.length - 1" class="w-6 h-6 rounded bg-neutral-700/60 hover:bg-neutral-600 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30">
                  <ChevronDown class="w-3 h-3" />
                </button>
                <button @click.stop="removeField(idx)" class="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300">
                  <X class="w-3 h-3" />
                </button>
              </div>
              <label class="text-sm text-neutral-300 block mb-1.5">
                {{ field.label }}
                <span v-if="field.required" class="text-red-400 ml-0.5">*</span>
              </label>
              <div v-if="field.type === 'input'" class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50"></div>
              <div v-else-if="field.type === 'textarea'" class="h-20 rounded-md bg-neutral-700/40 border border-neutral-600/50"></div>
              <div v-else-if="field.type === 'select'" class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50 flex items-center px-3">
                <span class="text-xs text-neutral-500">请选择...</span>
                <ChevronDown class="w-3.5 h-3.5 text-neutral-500 ml-auto" />
              </div>
              <div v-else-if="field.type === 'radio'" class="space-y-1.5">
                <div v-for="opt in field.options.slice(0, 2)" :key="opt" class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 rounded-full border-2 border-neutral-600"></div>
                  <span class="text-xs text-neutral-500">{{ opt }}</span>
                </div>
              </div>
              <div v-else-if="field.type === 'checkbox'" class="space-y-1.5">
                <div v-for="opt in field.options.slice(0, 2)" :key="opt" class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 rounded border-2 border-neutral-600"></div>
                  <span class="text-xs text-neutral-500">{{ opt }}</span>
                </div>
              </div>
              <div v-else-if="field.type === 'date'" class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50 flex items-center px-3">
                <Calendar class="w-3.5 h-3.5 text-neutral-500 mr-2" />
                <span class="text-xs text-neutral-500">选择日期</span>
              </div>
              <div v-else-if="field.type === 'upload'" class="h-16 rounded-md bg-neutral-700/40 border border-neutral-600/50 border-dashed flex items-center justify-center">
                <Upload class="w-4 h-4 text-neutral-500 mr-2" />
                <span class="text-xs text-neutral-500">点击或拖拽文件上传</span>
              </div>
              <div v-else-if="field.type === 'number'" class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50"></div>
              <div v-else-if="field.type === 'idcard'" class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50"></div>
              <div v-else-if="field.type === 'phone'" class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50"></div>
              <div v-else class="h-9 rounded-md bg-neutral-700/40 border border-neutral-600/50"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-3 bg-neutral-800/50 rounded-xl border border-neutral-800 p-4 overflow-y-auto scrollbar-thin">
        <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Settings class="w-4 h-4 text-purple-400" />
          属性配置
        </h3>
        <div v-if="!selectedField" class="text-center py-12 text-neutral-500">
          <MousePointerClick class="w-10 h-10 mx-auto mb-2 text-neutral-600" />
          <p class="text-sm">请选择一个字段进行配置</p>
        </div>
        <div v-else class="space-y-4">
          <div>
            <label class="text-xs text-neutral-400 block mb-1.5">字段标签</label>
            <el-input v-model="selectedField.label" size="small" />
          </div>
          <div>
            <label class="text-xs text-neutral-400 block mb-1.5">字段标识</label>
            <el-input v-model="selectedField.key" size="small" />
          </div>
          <div>
            <label class="text-xs text-neutral-400 block mb-1.5">占位文本</label>
            <el-input v-model="selectedField.placeholder" size="small" />
          </div>
          <div v-if="['select', 'radio', 'checkbox'].includes(selectedField.type)">
            <label class="text-xs text-neutral-400 block mb-1.5">选项配置</label>
            <div class="space-y-2">
              <div v-for="(opt, i) in selectedField.options" :key="i" class="flex gap-2">
                <el-input v-model="selectedField.options[i]" size="small" />
                <button @click="selectedField.options.splice(i, 1)" class="px-2 text-red-400 hover:bg-red-500/10 rounded">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
              <button @click="selectedField.options.push('新选项')" class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus class="w-3 h-3" /> 添加选项
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between py-2 border-t border-neutral-700/50">
            <span class="text-sm text-neutral-400">必填项</span>
            <el-switch v-model="selectedField.required" size="small" />
          </div>
          <div class="flex items-center justify-between py-2 border-t border-neutral-700/50">
            <span class="text-sm text-neutral-400">显示字段</span>
            <el-switch v-model="selectedField.visible" size="small" />
          </div>
          <div v-if="selectedField.type === 'input' || selectedField.type === 'textarea'" class="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-700/50">
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">最小长度</label>
              <el-input-number v-model="selectedField.minLength" :min="0" size="small" class="!w-full" />
            </div>
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">最大长度</label>
              <el-input-number v-model="selectedField.maxLength" :min="0" size="small" class="!w-full" />
            </div>
          </div>
          <div>
            <label class="text-xs text-neutral-400 block mb-1.5">默认值</label>
            <el-input v-model="selectedField.defaultValue" size="small" />
          </div>
          <div>
            <label class="text-xs text-neutral-400 block mb-1.5">校验规则</label>
            <el-select v-model="selectedField.validator" placeholder="选择校验规则" clearable size="small" class="!w-full">
              <el-option label="手机号" value="phone" />
              <el-option label="身份证号" value="idcard" />
              <el-option label="邮箱" value="email" />
              <el-option label="数字" value="number" />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="previewVisible" title="表单预览" width="560px" class="!bg-neutral-900">
      <div class="space-y-4 p-2">
        <div v-for="field in currentTemplate.fields" :key="field.id">
          <label class="text-sm text-neutral-300 block mb-1.5">
            {{ field.label }}
            <span v-if="field.required" class="text-red-400 ml-0.5">*</span>
          </label>
          <el-input v-if="field.type === 'input'" :placeholder="field.placeholder" />
          <el-input v-else-if="field.type === 'textarea'" type="textarea" :rows="3" :placeholder="field.placeholder" />
          <el-select v-else-if="field.type === 'select'" placeholder="请选择..." class="!w-full">
            <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <el-radio-group v-else-if="field.type === 'radio'">
            <el-radio v-for="opt in field.options" :key="opt" :label="opt">{{ opt }}</el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="field.type === 'checkbox'">
            <el-checkbox v-for="opt in field.options" :key="opt" :label="opt">{{ opt }}</el-checkbox>
          </el-checkbox-group>
          <el-date-picker v-else-if="field.type === 'date'" type="date" placeholder="选择日期" class="!w-full" />
          <el-upload v-else-if="field.type === 'upload'" drag>
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件到此处上传</div>
          </el-upload>
          <el-input-number v-else-if="field.type === 'number'" class="!w-full" />
          <el-input v-else placeholder="请输入" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Search, Plus, FileText, Pencil, Trash2, Hash, Eye, Save,
  LayoutGrid, Settings, MousePointerClick, ChevronUp, ChevronDown, X,
  Calendar, Upload
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { generateId } from '@/utils'

interface FormField {
  id: string
  type: string
  label: string
  key: string
  placeholder?: string
  required: boolean
  visible: boolean
  options: string[]
  minLength?: number
  maxLength?: number
  defaultValue?: string
  validator?: string
}

interface FormTemplate {
  id: string
  name: string
  description: string
  fields: FormField[]
  status: 'draft' | 'published'
  usageCount: number
  createTime: string
}

const fieldGroups = [
  {
    name: '基础组件',
    fields: [
      { type: 'input', label: '单行文本', icon: FileText },
      { type: 'textarea', label: '多行文本', icon: FileText },
      { type: 'number', label: '数字输入', icon: Hash },
      { type: 'select', label: '下拉选择', icon: ChevronDown },
      { type: 'radio', label: '单选框组', icon: FileText },
      { type: 'checkbox', label: '多选框组', icon: FileText },
      { type: 'date', label: '日期选择', icon: Calendar },
      { type: 'upload', label: '文件上传', icon: Upload }
    ]
  },
  {
    name: '高级组件',
    fields: [
      { type: 'idcard', label: '身份证号', icon: FileText },
      { type: 'phone', label: '手机号码', icon: FileText },
      { type: 'address', label: '地址选择', icon: FileText }
    ]
  }
]

const currentView = ref<'list' | 'designer'>('list')
const searchKeyword = ref('')
const previewVisible = ref(false)
const selectedField = ref<FormField | null>(null)
let dragField: any = null
let dragFieldIndex = -1

const templates = ref<FormTemplate[]>([
  {
    id: 'tpl_001',
    name: '养老保险参保登记表',
    description: '城乡居民基本养老保险参保登记专用表单',
    fields: [
      { id: 'f1', type: 'input', label: '姓名', key: 'name', required: true, visible: true, options: [], validator: undefined },
      { id: 'f2', type: 'idcard', label: '身份证号', key: 'idCard', required: true, visible: true, options: [], validator: 'idcard' },
      { id: 'f3', type: 'phone', label: '联系电话', key: 'phone', required: true, visible: true, options: [], validator: 'phone' },
      { id: 'f4', type: 'select', label: '户籍类型', key: 'hukouType', required: true, visible: true, options: ['农业户口', '非农业户口'] }
    ],
    status: 'published',
    usageCount: 3420,
    createTime: '2023-06-01'
  },
  {
    id: 'tpl_002',
    name: '医保参保登记表',
    description: '城乡居民医疗保险参保登记表单',
    fields: [
      { id: 'f1', type: 'input', label: '姓名', key: 'name', required: true, visible: true, options: [] }
    ],
    status: 'published',
    usageCount: 12500,
    createTime: '2023-05-15'
  },
  {
    id: 'tpl_003',
    name: '公积金提取申请表',
    description: '住房公积金提取业务申请表单',
    fields: [],
    status: 'draft',
    usageCount: 0,
    createTime: '2024-01-10'
  }
])

const filteredTemplates = computed(() => {
  if (!searchKeyword.value) return templates.value
  const kw = searchKeyword.value.toLowerCase()
  return templates.value.filter(t => t.name.toLowerCase().includes(kw))
})

const currentTemplate = reactive<FormTemplate>({
  id: '',
  name: '新建表单',
  description: '',
  fields: [],
  status: 'draft',
  usageCount: 0,
  createTime: ''
})

const createField = (type: string, label: string): FormField => ({
  id: generateId(),
  type,
  label,
  key: `field_${generateId().slice(0, 6)}`,
  placeholder: `请输入${label}`,
  required: false,
  visible: true,
  options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['选项1', '选项2'] : []
})

const onFieldDragStart = (field: any, e: DragEvent) => {
  dragField = field
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}

const onFieldDrop = () => {
  if (!dragField) return
  const newField = createField(dragField.type, dragField.label)
  currentTemplate.fields.push(newField)
  selectedField.value = newField
  dragField = null
}

const onCanvasDragStart = (index: number, e: DragEvent) => {
  dragFieldIndex = index
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

const onCanvasDrop = (targetIndex: number) => {
  if (dragFieldIndex < 0 || dragFieldIndex === targetIndex) {
    dragFieldIndex = -1
    return
  }
  const moved = currentTemplate.fields.splice(dragFieldIndex, 1)[0]
  currentTemplate.fields.splice(targetIndex, 0, moved)
  dragFieldIndex = -1
}

const moveField = (index: number, direction: number) => {
  const newIdx = index + direction
  if (newIdx < 0 || newIdx >= currentTemplate.fields.length) return
  const temp = currentTemplate.fields[index]
  currentTemplate.fields[index] = currentTemplate.fields[newIdx]
  currentTemplate.fields[newIdx] = temp
}

const removeField = (index: number) => {
  currentTemplate.fields.splice(index, 1)
  if (selectedField.value && !currentTemplate.fields.includes(selectedField.value)) {
    selectedField.value = null
  }
}

const createTemplate = () => {
  Object.assign(currentTemplate, {
    id: generateId(),
    name: '新建表单',
    description: '',
    fields: [],
    status: 'draft' as const,
    usageCount: 0,
    createTime: new Date().toISOString().slice(0, 10)
  })
  selectedField.value = null
  currentView.value = 'designer'
}

const editTemplate = (tpl: FormTemplate) => {
  Object.assign(currentTemplate, JSON.parse(JSON.stringify(tpl)))
  selectedField.value = null
  currentView.value = 'designer'
}

const deleteTemplate = (tpl: FormTemplate) => {
  ElMessageBox.confirm(`确认删除模板「${tpl.name}」？`, '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error'
  }).then(() => {
    templates.value = templates.value.filter(t => t.id !== tpl.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const saveTemplate = () => {
  if (!currentTemplate.name.trim()) {
    ElMessage.warning('请输入表单名称')
    return
  }
  const exists = templates.value.find(t => t.id === currentTemplate.id)
  if (exists) {
    Object.assign(exists, currentTemplate)
  } else {
    templates.value.unshift({ ...currentTemplate })
  }
  ElMessage.success('保存成功')
}
</script>
