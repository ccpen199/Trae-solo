<template>
  <div>
    <div class="page-header">
      <div class="flex items-center gap-2">
        <button class="icon-btn" @click="goBack">←</button>
        <h1 class="page-title">版本管理</h1>
      </div>
      <button class="btn btn-primary" @click="triggerUpload">
        ⬆️ 上传新版本
      </button>
    </div>
    
    <div class="page-content">
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="spinner"></div>
      </div>
      
      <template v-else>
        <div class="card mb-4">
          <div class="card-body">
            <div class="flex items-center gap-3">
              <div class="text-3xl">{{ getFileIcon(file) }}</div>
              <div>
                <div class="font-medium text-lg">{{ file?.fileName }}</div>
                <div class="text-secondary text-sm">
                  {{ formatBytes(file?.fileSize || 0) }} · 创建于 {{ formatDate(file?.createdAt || '') }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <strong>版本历史</strong>
          </div>
          <div class="card-body">
            <div v-if="versions.length === 0" class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="font-medium">暂无版本记录</div>
            </div>
            
            <div v-else class="version-timeline">
              <div 
                v-for="version in versions" 
                :key="version.id" 
                class="version-item"
                :class="{ current: version.isCurrent }"
              >
                <div class="card" style="margin-left: 1rem;">
                  <div class="card-body">
                    <div class="version-header">
                      <div>
                        <span class="version-number">
                          版本 {{ version.versionNumber }}
                          <span v-if="version.isCurrent" class="badge badge-success ml-2">当前版本</span>
                        </span>
                        <div v-if="version.changeDescription" class="text-secondary text-sm mt-1">
                          {{ version.changeDescription }}
                        </div>
                      </div>
                      <span class="version-time">{{ formatDate(version.createdAt) }}</span>
                    </div>
                    
                    <div class="text-secondary text-sm mt-2">
                      <span>大小: {{ formatBytes(version.fileSize) }}</span>
                      <span class="mx-2">·</span>
                      <span>MD5: {{ version.md5Hash?.substring(0, 16) }}...</span>
                    </div>
                    
                    <div class="flex gap-2 mt-3">
                      <button class="btn btn-outline text-xs" @click="downloadVersion(version)">
                        ⬇️ 下载此版本
                      </button>
                      <button 
                        v-if="!version.isCurrent" 
                        class="btn btn-primary text-xs" 
                        @click="rollbackToVersion(version)"
                      >
                        ↩️ 回滚到此版本
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <input 
      type="file" 
      ref="fileInput" 
      style="display: none" 
      @change="handleFileSelect"
    />
    
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">上传新版本</div>
          <button class="icon-btn" @click="showUploadModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择文件</label>
            <div 
              class="drop-zone"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop.prevent="handleDrop"
              @click="triggerUpload"
            >
              <div v-if="!selectedUploadFile" class="text-secondary">
                点击或拖拽文件到此处
              </div>
              <div v-else>
                <div class="font-medium">{{ selectedUploadFile.name }}</div>
                <div class="text-secondary text-sm">{{ formatBytes(selectedUploadFile.size) }}</div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">变更描述（可选）</label>
            <textarea 
              v-model="changeDescription" 
              class="form-input"
              rows="3"
              placeholder="描述此版本的变更内容..."
            ></textarea>
          </div>
          
          <div v-if="uploading" class="alert alert-warning">
            <div class="flex items-center gap-2">
              <div class="spinner" style="width: 1rem; height: 1rem;"></div>
              <span>上传中... {{ Math.round(uploadProgress * 100) }}%</span>
            </div>
            <div class="progress-bar mt-2">
              <div class="progress-bar-fill" :style="{ width: uploadProgress * 100 + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUploadModal = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="uploadNewVersion" 
            :disabled="!selectedUploadFile || uploading"
          >
            {{ uploading ? '上传中...' : '上传新版本' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { filesApi, versionsApi } from '@/api'

const route = useRoute()
const router = useRouter()

const fileId = computed(() => route.params.id as string)

const loading = ref(true)
const file = ref<any>(null)
const versions = ref<any[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const showUploadModal = ref(false)
const isDragOver = ref(false)
const selectedUploadFile = ref<File | null>(null)
const changeDescription = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

function getFileIcon(f: any): string {
  if (!f) return '📄'
  if (f.isFolder) return '📁'
  const ext = (f.fileName || '').split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    pdf: '📄',
    doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊',
    ppt: '📽️', pptx: '📽️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
    mp4: '🎥', avi: '🎥', mov: '🎥',
    mp3: '🎵', wav: '🎵',
    zip: '📦', rar: '📦', '7z': '📦',
    txt: '📃',
    js: '⚡', ts: '⚡', json: '📋',
    html: '🌐', css: '🎨'
  }
  return icons[ext || ''] || '📄'
}

async function loadData() {
  loading.value = true
  try {
    const [fileResponse, versionsResponse] = await Promise.all([
      filesApi.getFile(fileId.value),
      versionsApi.getFileVersions(fileId.value)
    ])
    file.value = fileResponse.data
    versions.value = versionsResponse.data || []
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/files')
}

function triggerUpload() {
  showUploadModal.value = true
  setTimeout(() => {
    fileInput.value?.click()
  }, 100)
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const fileList = target.files
  if (fileList && fileList.length > 0) {
    selectedUploadFile.value = fileList[0]
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const fileList = event.dataTransfer?.files
  if (fileList && fileList.length > 0) {
    selectedUploadFile.value = fileList[0]
  }
}

async function uploadNewVersion() {
  if (!selectedUploadFile.value) return
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    await versionsApi.createVersion(
      fileId.value, 
      selectedUploadFile.value, 
      changeDescription.value || undefined
    )
    
    showUploadModal.value = false
    selectedUploadFile.value = null
    changeDescription.value = ''
    
    await loadData()
  } catch (e: any) {
    alert(e.response?.data?.error || '上传新版本失败')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

async function downloadVersion(version: any) {
  try {
    const response = await versionsApi.downloadVersion(version.id)
    const blob = response.data
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.fileName?.replace(/\.[^.]+$/, '')}_v${version.versionNumber}${file?.fileName?.match(/\.[^.]+$/)?.[0] || ''}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  } catch (e: any) {
    alert(e.response?.data?.error || '下载失败')
  }
}

async function rollbackToVersion(version: any) {
  if (!confirm(`确定要回滚到版本 ${version.versionNumber} 吗？这将创建一个新版本。`)) return
  
  try {
    await versionsApi.rollbackToVersion(fileId.value, version.id)
    await loadData()
  } catch (e: any) {
    alert(e.response?.data?.error || '回滚失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
</style>
