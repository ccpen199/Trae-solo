<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">我的分享</h1>
    </div>
    
    <div class="page-content">
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="spinner"></div>
      </div>
      
      <template v-else>
        <div v-if="shares.length === 0" class="empty-state">
          <div class="empty-state-icon">🔗</div>
          <div class="font-medium">暂无分享链接</div>
          <div class="text-secondary mt-1">在文件列表中选择文件创建分享链接</div>
        </div>
        
        <div v-else class="card">
          <div class="card-body p-0">
            <table class="table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>分享码</th>
                  <th>状态</th>
                  <th>访问次数</th>
                  <th>创建时间</th>
                  <th>过期时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="share in shares" :key="share.id">
                  <td>
                    <div class="font-medium">{{ share.file?.fileName }}</div>
                    <div class="text-secondary text-xs">{{ formatBytes(share.file?.fileSize || 0) }}</div>
                  </td>
                  <td>
                    <code class="bg-gray-100 px-2 py-1 rounded text-xs">{{ share.shareCode }}</code>
                  </td>
                  <td>
                    <span 
                      class="badge"
                      :class="{
                        'badge-success': share.isActive && !share.isExpired,
                        'badge-danger': share.isExpired,
                        'badge-warning': !share.isActive
                      }"
                    >
                      {{ share.isExpired ? '已过期' : (share.isActive ? '有效' : '已撤销') }}
                    </span>
                  </td>
                  <td>{{ share.accessCount || 0 }} / {{ share.downloadLimit || '不限' }}</td>
                  <td>{{ formatDate(share.createdAt) }}</td>
                  <td>{{ share.expiresAt ? formatDate(share.expiresAt) : '永久有效' }}</td>
                  <td>
                    <div class="flex gap-2">
                      <button 
                        class="btn btn-outline text-xs" 
                        @click="copyShareLink(share)"
                      >
                        📋 复制链接
                      </button>
                      <button 
                        class="btn btn-outline text-xs" 
                        @click="viewShareDetail(share)"
                      >
                        📊 明细
                      </button>
                      <button 
                        v-if="share.isActive && !share.isExpired"
                        class="btn btn-danger text-xs" 
                        @click="revokeShare(share)"
                      >
                        撤销
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
    
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal" style="max-width: 48rem;">
        <div class="modal-header">
          <div class="modal-title">分享访问明细</div>
          <button class="icon-btn" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedShare" class="mb-4">
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="card">
                <div class="card-body">
                  <div class="text-secondary text-xs mb-1">文件名</div>
                  <div class="font-medium">{{ selectedShare.file?.fileName }}</div>
                </div>
              </div>
              <div class="card">
                <div class="card-body">
                  <div class="text-secondary text-xs mb-1">分享码</div>
                  <div class="font-medium"><code>{{ selectedShare.shareCode }}</code></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <strong>访问日志</strong>
            </div>
            <div class="card-body p-0">
              <table class="table">
                <thead>
                  <tr>
                    <th>访问时间</th>
                    <th>IP地址</th>
                    <th>用户代理</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="shareAccessLogs.length === 0">
                    <td colspan="4" class="text-center text-secondary py-8">
                      暂无访问记录
                    </td>
                  </tr>
                  <tr v-for="log in shareAccessLogs" :key="log.id">
                    <td>{{ formatDate(log.accessedAt) }}</td>
                    <td><code class="text-xs">{{ log.accessIp }}</code></td>
                    <td class="text-xs text-secondary">{{ (log.userAgent || '').substring(0, 50) }}...</td>
                    <td>
                      <span 
                        class="badge"
                        :class="log.success ? 'badge-success' : 'badge-danger'"
                      >
                        {{ log.success ? '成功' : '失败' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { sharesApi } from '@/api'

const loading = ref(true)
const shares = ref<any[]>([])

const showDetailModal = ref(false)
const selectedShare = ref<any>(null)
const shareAccessLogs = ref<any[]>([])

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

async function loadShares() {
  loading.value = true
  try {
    const response = await sharesApi.getShareLinks()
    shares.value = response.data || []
  } catch (e) {
    console.error('加载分享列表失败:', e)
  } finally {
    loading.value = false
  }
}

async function copyShareLink(share: any) {
  const link = `${window.location.origin}/s/${share.shareCode}`
  try {
    await navigator.clipboard.writeText(link)
    alert('链接已复制到剪贴板')
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = link
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    textArea.remove()
    alert('链接已复制到剪贴板')
  }
}

async function viewShareDetail(share: any) {
  selectedShare.value = share
  showDetailModal.value = true
  shareAccessLogs.value = []
  
  try {
    const response = await sharesApi.getShareDetail(share.id)
    shareAccessLogs.value = response.data?.accessLogs || []
  } catch (e) {
    console.error('加载分享详情失败:', e)
  }
}

async function revokeShare(share: any) {
  if (!confirm(`确定要撤销分享 "${share.file?.fileName}" 吗？`)) return
  
  try {
    await sharesApi.revokeShare(share.id)
    await loadShares()
  } catch (e: any) {
    alert(e.response?.data?.error || '撤销失败')
  }
}

onMounted(() => {
  loadShares()
})
</script>

<style scoped>
.bg-gray-100 {
  background-color: #f3f4f6;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.rounded {
  border-radius: 0.25rem;
}

.text-xs {
  font-size: 0.75rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
