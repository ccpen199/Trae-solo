<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">我的文件</h1>
      <div class="flex gap-2">
        <button class="btn btn-primary" @click="showCreateFolder = true">
          📁 新建文件夹
        </button>
        <button class="btn btn-success" @click="triggerUpload">
          ⬆️ 上传文件
        </button>
      </div>
    </div>
    
    <div class="page-content">
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="spinner"></div>
      </div>
      
      <template v-else>
        <div 
          class="drop-zone mb-4"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <div class="text-2xl mb-2">📤</div>
          <div class="font-medium">拖拽文件到此处上传</div>
          <div class="text-secondary text-sm mt-1">或点击上方按钮选择文件</div>
        </div>
        
        <div v-if="uploadingFiles.length > 0" class="card mb-4">
          <div class="card-header">
            <strong>上传中...</strong>
          </div>
          <div class="card-body">
            <div v-for="uf in uploadingFiles" :key="uf.id" class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span>{{ uf.fileName }}</span>
                <span>{{ Math.round(uf.progress * 100) }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-bar-fill" 
                  :style="{ width: uf.progress * 100 + '%' }"
                  :class="{ 'bg-success': uf.status === 'done' }"
                ></div>
              </div>
              <div v-if="uf.error" class="text-danger text-xs mt-1">
                {{ uf.error }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-state-icon">📂</div>
          <div class="font-medium">暂无文件</div>
          <div class="text-secondary mt-1">上传文件或创建文件夹开始使用</div>
        </div>
        
        <div v-else class="file-list">
          <div v-for="file in files" :key="file.id" class="file-item">
            <div class="file-icon">
              {{ getFileIcon(file) }}
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.fileName }}</div>
              <div class="file-meta">
                {{ formatBytes(file.fileSize) }} · 
                {{ formatDate(file.createdAt) }}
                <span v-if="file.archived" class="badge badge-warning ml-2">已归档</span>
              </div>
            </div>
            <div class="file-actions">
              <template v-if="!file.isFolder">
                <button class="btn btn-outline text-xs" @click="downloadFile(file)">
                  ⬇️ 下载
                </button>
                <button class="btn btn-outline text-xs" @click="openVersions(file)">
                  📋 版本
                </button>
                <button class="btn btn-outline text-xs" @click="openShareDialog(file)">
                  🔗 分享
                </button>
              </template>
              <button class="btn btn-danger text-xs" @click="deleteFile(file)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <input 
      type="file" 
      ref="fileInput" 
      multiple 
      style="display: none" 
      @change="handleFileSelect"
    />
    
    <div v-if="showCreateFolder" class="modal-overlay" @click.self="showCreateFolder = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">新建文件夹</div>
          <button class="icon-btn" @click="showCreateFolder = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">文件夹名称</label>
            <input 
              type="text" 
              v-model="newFolderName" 
              class="form-input"
              placeholder="请输入文件夹名称"
              @keyup.enter="createFolder"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateFolder = false">取消</button>
          <button class="btn btn-primary" @click="createFolder" :disabled="!newFolderName">创建</button>
        </div>
      </div>
    </div>
    
    <div v-if="showShareDialog" class="modal-overlay" @click.self="showShareDialog = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">创建分享链接</div>
          <button class="icon-btn" @click="showShareDialog = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">分享的文件</label>
            <div class="form-input" style="background-color: var(--bg-color);">
              {{ selectedFile?.fileName }}
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">有效期（天，可选）</label>
            <input 
              type="number" 
              v-model.number="shareOptions.expiresInDays" 
              class="form-input"
              placeholder="留空则永久有效"
              min="1"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">访问密码（可选）</label>
            <input 
              type="text" 
              v-model="shareOptions.password" 
              class="form-input"
              placeholder="留空则无需密码"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">下载次数限制（可选）</label>
            <input 
              type="number" 
              v-model.number="shareOptions.downloadLimit" 
              class="form-input"
              placeholder="留空则不限制"
              min="1"
            />
          </div>
          
          <div v-if="shareLinkCreated" class="alert alert-success">
            <div class="font-medium mb-2">分享链接已创建：</div>
            <div class="p-2 bg-white rounded text-primary break-all">
              {{ shareLink }}
            </div>
            <button class="btn btn-primary mt-2 text-sm" @click="copyShareLink">
              📋 复制链接
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showShareDialog = false">关闭</button>
          <button 
            class="btn btn-primary" 
            @click="createShare" 
            :disabled="shareLinkCreated || shareCreating"
          >
            {{ shareCreating ? '创建中...' : '创建分享链接' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { filesApi, sharesApi } from '@/api'

const router = useRouter()

const loading = ref(true)
const files = ref<any[]>([])
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const showCreateFolder = ref(false)
const newFolderName = ref('')

const uploadingFiles = ref<Array<{
  id: string
  fileName: string
  fileSize: number
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
}>>([])

const showShareDialog = ref(false)
const selectedFile = ref<any>(null)
const shareOptions = ref({
  expiresInDays: null as number | null,
  password: '',
  downloadLimit: null as number | null
})
const shareLinkCreated = ref(false)
const shareLink = ref('')
const shareCreating = ref(false)

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

function getFileIcon(file: any): string {
  if (file.isFolder) return '📁'
  const ext = (file.fileName || '').split('.').pop()?.toLowerCase()
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

async function loadFiles() {
  loading.value = true
  try {
    const response = await filesApi.getFiles()
    files.value = response.data || []
  } catch (e) {
    console.error('加载文件失败:', e)
  } finally {
    loading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const fileList = target.files
  if (!fileList || fileList.length === 0) return
  
  for (let i = 0; i < fileList.length; i++) {
    await uploadFile(fileList[i])
  }
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const fileList = event.dataTransfer?.files
  if (!fileList) return
  
  for (let i = 0; i < fileList.length; i++) {
    uploadFile(fileList[i])
  }
}

async function uploadFile(file: File) {
  const uploadId = Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  
  const uploadItem = {
    id: uploadId,
    fileName: file.name,
    fileSize: file.size,
    progress: 0,
    status: 'uploading' as const
  }
  
  uploadingFiles.value.push(uploadItem)
  
  try {
    const response = await filesApi.simpleUpload(file, undefined, (progress) => {
      const idx = uploadingFiles.value.findIndex(u => u.id === uploadId)
      if (idx >= 0) {
        uploadingFiles.value[idx].progress = progress
      }
    })
    
    const idx = uploadingFiles.value.findIndex(u => u.id === uploadId)
    if (idx >= 0) {
      uploadingFiles.value[idx].progress = 1
      uploadingFiles.value[idx].status = 'done'
    }
    
    await loadFiles()
    
    setTimeout(() => {
      const removeIdx = uploadingFiles.value.findIndex(u => u.id === uploadId)
      if (removeIdx >= 0) {
        uploadingFiles.value.splice(removeIdx, 1)
      }
    }, 3000)
    
  } catch (e: any) {
    const idx = uploadingFiles.value.findIndex(u => u.id === uploadId)
    if (idx >= 0) {
      uploadingFiles.value[idx].status = 'error'
      uploadingFiles.value[idx].error = e.response?.data?.error || '上传失败'
    }
  }
}

async function createFolder() {
  if (!newFolderName.value.trim()) return
  
  try {
    await filesApi.createFolder(newFolderName.value.trim())
    showCreateFolder.value = false
    newFolderName.value = ''
    await loadFiles()
  } catch (e: any) {
    alert(e.response?.data?.error || '创建失败')
  }
}

async function downloadFile(file: any) {
  try {
    const response = await filesApi.downloadFile(file.id)
    const blob = response.data
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  } catch (e: any) {
    alert(e.response?.data?.error || '下载失败')
  }
}

function openVersions(file: any) {
  router.push(`/files/${file.id}/versions`)
}

async function deleteFile(file: any) {
  if (!confirm(`确定要删除 "${file.fileName}" 吗？`)) return
  
  try {
    await filesApi.deleteFile(file.id)
    await loadFiles()
  } catch (e: any) {
    alert(e.response?.data?.error || '删除失败')
  }
}

function openShareDialog(file: any) {
  selectedFile.value = file
  shareLinkCreated.value = false
  shareLink.value = ''
  shareOptions.value = {
    expiresInDays: null,
    password: '',
    downloadLimit: null
  }
  showShareDialog.value = true
}

async function createShare() {
  if (!selectedFile.value) return
  
  shareCreating.value = true
  
  try {
    const options: any = {
      fileId: selectedFile.value.id
    }
    
    if (shareOptions.value.expiresInDays) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + shareOptions.value.expiresInDays)
      options.expiresAt = expiresAt.toISOString()
    }
    
    if (shareOptions.value.password) {
      options.password = shareOptions.value.password
    }
    
    if (shareOptions.value.downloadLimit) {
      options.downloadLimit = shareOptions.value.downloadLimit
    }
    
    const response = await sharesApi.createShare(options)
    shareLink.value = `${window.location.origin}/s/${response.data.shareCode}`
    shareLinkCreated.value = true
  } catch (e: any) {
    alert(e.response?.data?.error || '创建分享链接失败')
  } finally {
    shareCreating.value = false
  }
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    alert('链接已复制到剪贴板')
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = shareLink.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    textArea.remove()
    alert('链接已复制到剪贴板')
  }
}

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.bg-success {
  background-color: var(--success-color) !important;
}
</style>
