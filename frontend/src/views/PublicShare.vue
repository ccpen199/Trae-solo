<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
    <div class="card" style="width: 450px;">
      <div class="card-header text-center">
        <div class="text-3xl mb-2">🔗</div>
        <h1 class="text-lg font-bold">文件分享</h1>
      </div>
      
      <div class="card-body">
        <div v-if="loading" class="flex items-center justify-center p-8">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="error" class="alert alert-danger">
          <div class="font-medium">{{ errorTitle }}</div>
          <div class="text-sm mt-1">{{ error }}</div>
        </div>
        
        <template v-else-if="shareInfo">
          <div v-if="shareInfo.requiresPassword && !shareInfo.validated" class="mb-4">
            <div class="form-group">
              <label class="form-label">此分享需要密码</label>
              <input 
                type="password" 
                v-model="sharePassword" 
                class="form-input"
                placeholder="请输入访问密码"
                @keyup.enter="validatePassword"
              />
            </div>
            <button 
              class="btn btn-primary w-full" 
              @click="validatePassword"
              :disabled="validating || !sharePassword"
            >
              {{ validating ? '验证中...' : '验证密码' }}
            </button>
          </div>
          
          <template v-else>
            <div class="card mb-4" style="margin: 0;">
              <div class="card-body">
                <div class="flex items-center gap-3">
                  <div class="text-3xl">{{ getFileIcon(shareInfo.file) }}</div>
                  <div class="flex-1">
                    <div class="font-medium">{{ shareInfo.file?.fileName }}</div>
                    <div class="text-secondary text-sm">
                      {{ formatBytes(shareInfo.file?.fileSize || 0) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="text-secondary text-sm mb-4">
              <div v-if="shareInfo.expiresAt">
                到期时间: {{ formatDate(shareInfo.expiresAt) }}
              </div>
              <div v-if="shareInfo.downloadLimit">
                下载限制: {{ shareInfo.accessCount || 0 }} / {{ shareInfo.downloadLimit }} 次
              </div>
              <div v-if="shareInfo.isExpired" class="text-danger">
                此分享已过期
              </div>
            </div>
            
            <button 
              class="btn btn-primary w-full" 
              @click="downloadFile"
              :disabled="downloading || shareInfo.isExpired || !shareInfo.isActive"
            >
              <span v-if="downloading" class="spinner mr-2" style="width: 1rem; height: 1rem;"></span>
              {{ downloading ? '下载中...' : '下载文件' }}
            </button>
          </template>
        </template>
      </div>
      
      <div class="card-footer text-center text-secondary text-xs">
        由文件存储与网盘系统提供服务
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { sharesApi } from '@/api'

const route = useRoute()

const shareCode = computed(() => route.params.shareCode as string)

const loading = ref(true)
const error = ref('')
const errorTitle = ref('访问失败')
const shareInfo = ref<any>(null)

const sharePassword = ref('')
const validating = ref(false)

const downloading = ref(false)

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

function getFileIcon(file: any): string {
  if (!file) return '📄'
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

async function loadShareInfo() {
  loading.value = true
  error.value = ''
  errorTitle.value = '访问失败'
  
  try {
    const response = await sharesApi.getPublicShare(shareCode.value, sharePassword.value || undefined)
    shareInfo.value = response.data
  } catch (e: any) {
    const err = e.response?.data
    if (err?.requiresPassword) {
      shareInfo.value = {
        requiresPassword: true,
        validated: false
      }
    } else {
      errorTitle.value = err?.error || '访问失败'
      error.value = err?.reason || '无法访问此分享链接'
    }
  } finally {
    loading.value = false
  }
}

async function validatePassword() {
  if (!sharePassword.value) return
  
  validating.value = true
  error.value = ''
  
  try {
    const response = await sharesApi.getPublicShare(shareCode.value, sharePassword.value)
    shareInfo.value = {
      ...response.data,
      requiresPassword: true,
      validated: true
    }
  } catch (e: any) {
    const err = e.response?.data
    errorTitle.value = err?.error || '验证失败'
    error.value = err?.reason || '密码错误'
  } finally {
    validating.value = false
  }
}

async function downloadFile() {
  if (!shareInfo.value?.file) return
  
  downloading.value = true
  error.value = ''
  
  try {
    const response = await sharesApi.downloadPublicShare(shareCode.value, sharePassword.value || undefined)
    const blob = response.data
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = shareInfo.value.file.fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  } catch (e: any) {
    const err = e.response?.data
    errorTitle.value = err?.error || '下载失败'
    error.value = err?.reason || '无法下载文件'
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  loadShareInfo()
})
</script>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, #eff6ff, #dbeafe);
}

.text-3xl {
  font-size: 1.875rem;
}

.text-lg {
  font-size: 1.125rem;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
