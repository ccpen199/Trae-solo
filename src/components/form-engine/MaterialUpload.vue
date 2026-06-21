<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, FileText, X, Eye, Download, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { ServiceMaterial } from '@/types'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  status: 'uploading' | 'success' | 'error'
  progress: number
}

const props = defineProps<{
  materials?: ServiceMaterial[]
  maxSize?: number
  accept?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', files: UploadedFile[]): void
}>()

const files = ref<UploadedFile[]>([])
const isDragging = ref(false)

const acceptTypes = computed(() => props.accept || '.jpg,.jpeg,.png,.pdf')
const maxFileSize = computed(() => props.maxSize || 10 * 1024 * 1024)

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function generateId(): string {
  return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function validateFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  const allowedExts = acceptTypes.value.split(',').map(e => e.trim().toLowerCase())
  if (!allowedExts.includes(ext) && !allowedExts.includes('.*')) {
    ElMessage.error(`不支持的文件格式：${ext}，支持格式：${acceptTypes.value}`)
    return false
  }
  if (file.size > maxFileSize.value) {
    ElMessage.error(`文件过大，最大支持 ${formatSize(maxFileSize.value)}`)
    return false
  }
  return true
}

function simulateUpload(file: File) {
  const uploadedFile: UploadedFile = {
    id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
    status: 'uploading',
    progress: 0
  }
  files.value.push(uploadedFile)

  const timer = setInterval(() => {
    const target = files.value.find(f => f.id === uploadedFile.id)
    if (!target) {
      clearInterval(timer)
      return
    }
    target.progress += Math.random() * 20 + 10
    if (target.progress >= 100) {
      target.progress = 100
      target.status = 'success'
      clearInterval(timer)
      emit('update:modelValue', files.value)
    }
  }, 200)
}

function handleFiles(fileList: FileList | null) {
  if (!fileList) return
  Array.from(fileList).forEach(file => {
    if (validateFile(file)) {
      simulateUpload(file)
    }
  })
}

function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  handleFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  e.preventDefault()
  handleFiles(e.dataTransfer?.files || null)
}

function removeFile(id: string) {
  const idx = files.value.findIndex(f => f.id === id)
  if (idx >= 0) {
    const file = files.value[idx]
    if (file.url.startsWith('blob:')) URL.revokeObjectURL(file.url)
    files.value.splice(idx, 1)
    emit('update:modelValue', files.value)
  }
}

function previewFile(file: UploadedFile) {
  if (file.type.startsWith('image/')) {
    window.open(file.url, '_blank')
  } else {
    ElMessage.info('该文件类型暂不支持在线预览')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="materials && materials.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"
    >
      <div
        v-for="mat in materials"
        :key="mat.id"
        class="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
      >
        <FileText class="w-5 h-5 text-gov-blue flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-neutral-800">{{ mat.name }}</span>
            <span v-if="mat.required" class="tag tag-danger">必填</span>
            <span v-else class="tag tag-primary">选填</span>
          </div>
          <p class="text-xs text-neutral-500 mt-1">格式：{{ mat.format }}</p>
          <p class="text-xs text-neutral-500 mt-0.5">{{ mat.description }}</p>
        </div>
      </div>
    </div>

    <div
      class="relative"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop="onDrop"
    >
      <label
        :class="[
          'flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-gov-blue bg-gov-blue/5'
            : 'border-neutral-300 hover:border-gov-blue hover:bg-gov-blue/5'
        ]"
      >
        <Upload :class="['w-10 h-10 mb-3 transition-colors', isDragging ? 'text-gov-blue' : 'text-neutral-400']" />
        <p class="text-sm font-medium text-neutral-700 mb-1">点击或拖拽文件到此区域上传</p>
        <p class="text-xs text-neutral-500">支持格式：{{ acceptTypes }}，单个文件不超过 {{ formatSize(maxFileSize) }}</p>
        <input
          type="file"
          class="hidden"
          :accept="acceptTypes"
          multiple
          @change="onFileInputChange"
        />
      </label>
    </div>

    <div v-if="files.length > 0" class="space-y-2">
      <div
        v-for="file in files"
        :key="file.id"
        class="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
      >
        <div class="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
          <FileText v-if="!file.type.startsWith('image/')" class="w-5 h-5 text-neutral-500" />
          <img v-else :src="file.url" :alt="file.name" class="w-full h-full object-cover rounded-lg" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-neutral-800 truncate">{{ file.name }}</p>
          <p class="text-xs text-neutral-500 mt-0.5">{{ formatSize(file.size) }}</p>
          <div v-if="file.status === 'uploading'" class="mt-1.5 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-gov-gradient rounded-full transition-all duration-300"
              :style="{ width: file.progress + '%' }"
            />
          </div>
        </div>
        <div class="flex items-center gap-1">
          <span
            v-if="file.status === 'uploading'"
            class="text-xs text-gov-blue flex items-center gap-1"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-gov-blue animate-pulse"></span>
            上传中 {{ Math.round(file.progress) }}%
          </span>
          <span
            v-else-if="file.status === 'success'"
            class="text-xs text-accent-green flex items-center gap-1"
          >
            <CheckCircle2 class="w-4 h-4" />
            上传成功
          </span>
          <span
            v-else-if="file.status === 'error'"
            class="text-xs text-accent-red flex items-center gap-1"
          >
            <AlertCircle class="w-4 h-4" />
            上传失败
          </span>
          <button
            v-if="file.status === 'success'"
            type="button"
            class="p-1.5 text-neutral-500 hover:text-gov-blue hover:bg-gov-blue/10 rounded-lg transition-colors"
            title="预览"
            @click="previewFile(file)"
          >
            <Eye class="w-4 h-4" />
          </button>
          <button
            v-if="file.status === 'success'"
            type="button"
            class="p-1.5 text-neutral-500 hover:text-gov-blue hover:bg-gov-blue/10 rounded-lg transition-colors"
            title="下载"
          >
            <Download class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1.5 text-neutral-500 hover:text-accent-red hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
            @click="removeFile(file.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
