<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">审计日志</h1>
    </div>
    
    <div class="page-content">
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="spinner"></div>
      </div>
      
      <template v-else>
        <div class="card mb-4">
          <div class="card-body">
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
              <div class="card" style="margin: 0;">
                <div class="card-body">
                  <div class="text-primary font-medium">{{ stats?.fileUploads || 0 }}</div>
                  <div class="text-secondary text-xs">文件上传</div>
                </div>
              </div>
              <div class="card" style="margin: 0;">
                <div class="card-body">
                  <div class="text-success font-medium">{{ stats?.fileDownloads || 0 }}</div>
                  <div class="text-secondary text-xs">文件下载</div>
                </div>
              </div>
              <div class="card" style="margin: 0;">
                <div class="card-body">
                  <div class="text-warning font-medium">{{ stats?.shareCreates || 0 }}</div>
                  <div class="text-secondary text-xs">分享创建</div>
                </div>
              </div>
              <div class="card" style="margin: 0;">
                <div class="card-body">
                  <div class="text-danger font-medium">{{ stats?.securityEvents || 0 }}</div>
                  <div class="text-secondary text-xs">安全事件</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <strong>日志列表</strong>
          </div>
          <div class="card-body p-0">
            <table class="table">
              <thead>
                <tr>
                  <th>操作时间</th>
                  <th>操作类型</th>
                  <th>分类</th>
                  <th>操作人员</th>
                  <th>IP地址</th>
                  <th>操作描述</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="auditLogs.length === 0">
                  <td colspan="7" class="text-center text-secondary py-8">
                    暂无审计日志
                  </td>
                </tr>
                <tr v-for="log in auditLogs" :key="log.id">
                  <td>{{ formatDate(log.createdAt) }}</td>
                  <td>
                    <span 
                      class="badge"
                      :class="getBadgeClass(log.actionCategory)"
                    >
                      {{ log.actionCategory }}
                    </span>
                  </td>
                  <td>{{ log.action }}</td>
                  <td>
                    <div class="font-medium">{{ log.user?.displayName || log.user?.username || '-' }}</div>
                    <div class="text-secondary text-xs">{{ log.user?.role || '-' }}</div>
                  </td>
                  <td><code class="text-xs">{{ log.ipAddress || '-' }}</code></td>
                  <td class="text-sm">
                    {{ log.logicalTrace?.description || '-' }}
                    <div v-if="log.physicalTrace" class="text-secondary text-xs mt-1">
                      <span v-if="log.physicalTrace.fileId">文件ID: {{ log.physicalTrace.fileId }}</span>
                      <span v-if="log.physicalTrace.versionId" class="ml-2">版本ID: {{ log.physicalTrace.versionId }}</span>
                    </div>
                  </td>
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
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'

const loading = ref(true)
const stats = ref<any>(null)
const auditLogs = ref<any[]>([])

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

function getBadgeClass(category: string): string {
  const classes: Record<string, string> = {
    'file': 'badge-primary',
    'version': 'badge-warning',
    'share': 'badge-success',
    'user': 'badge-primary',
    'admin': 'badge-danger',
    'security': 'badge-danger'
  }
  return classes[category?.toLowerCase()] || 'badge-primary'
}

async function loadData() {
  loading.value = true
  try {
    const response = await adminApi.getAuditLogs()
    auditLogs.value = response.data || []
    
    stats.value = {
      fileUploads: auditLogs.value.filter(l => l.action === 'file_upload').length,
      fileDownloads: auditLogs.value.filter(l => l.action === 'file_download').length,
      shareCreates: auditLogs.value.filter(l => l.action === 'share_create').length,
      securityEvents: auditLogs.value.filter(l => l.actionCategory === 'security').length
    }
  } catch (e) {
    console.error('加载审计日志失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
