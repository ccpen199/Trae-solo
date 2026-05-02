<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">管理面板</h1>
    </div>
    
    <div class="page-content">
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="spinner"></div>
      </div>
      
      <template v-else>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ dashboardStats?.totalUsers || 0 }}</div>
            <div class="stat-label">总用户数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ dashboardStats?.totalFiles || 0 }}</div>
            <div class="stat-label">总文件数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatBytes(dashboardStats?.totalStorageUsed || 0) }}</div>
            <div class="stat-label">总存储使用</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ dashboardStats?.activeShares || 0 }}</div>
            <div class="stat-label">活跃分享</div>
          </div>
        </div>
        
        <div class="card mb-4">
          <div class="card-header">
            <strong>用户列表</strong>
          </div>
          <div class="card-body p-0">
            <table class="table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>显示名称</th>
                  <th>角色</th>
                  <th>邮箱</th>
                  <th>存储使用</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td class="font-medium">{{ user.username }}</td>
                  <td>{{ user.displayName }}</td>
                  <td>
                    <span 
                      class="badge"
                      :class="{
                        'badge-danger': user.role === 'admin',
                        'badge-warning': user.role === 'compliance',
                        'badge-primary': user.role === 'user'
                      }"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td>{{ user.email || '-' }}</td>
                  <td>
                    {{ formatBytes(user.storageUsed) }} / {{ formatBytes(user.storageQuota) }}
                    <div class="progress-bar mt-1">
                      <div 
                        class="progress-bar-fill" 
                        :style="{ width: Math.min((user.storageUsed / user.storageQuota) * 100, 100) + '%' }"
                      ></div>
                    </div>
                  </td>
                  <td>
                    <span 
                      class="badge"
                      :class="user.isActive ? 'badge-success' : 'badge-danger'"
                    >
                      {{ user.isActive ? '活跃' : '禁用' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-outline text-xs" @click="showQuotaModal(user)">
                      调整配额
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card mb-4">
          <div class="card-header">
            <strong>下载记录（最近）</strong>
          </div>
          <div class="card-body p-0">
            <table class="table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>下载用户</th>
                  <th>IP地址</th>
                  <th>文件大小</th>
                  <th>耗时</th>
                  <th>下载时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="downloadRecords.length === 0">
                  <td colspan="6" class="text-center text-secondary py-8">
                    暂无下载记录
                  </td>
                </tr>
                <tr v-for="record in downloadRecords" :key="record.id">
                  <td class="font-medium">{{ record.fileName }}</td>
                  <td>{{ record.user?.displayName || record.user?.username || '匿名' }}</td>
                  <td><code class="text-xs">{{ record.downloadIp }}</code></td>
                  <td>{{ formatBytes(record.fileSize) }}</td>
                  <td>{{ record.durationMs ? (record.durationMs / 1000).toFixed(2) + 's' : '-' }}</td>
                  <td>{{ formatDate(record.downloadedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
    
    <div v-if="showQuotaDialog" class="modal-overlay" @click.self="showQuotaDialog = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">调整用户配额</div>
          <button class="icon-btn" @click="showQuotaDialog = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">用户</label>
            <div class="form-input" style="background-color: var(--bg-color);">
              {{ selectedQuotaUser?.displayName }} ({{ selectedQuotaUser?.username }})
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">当前配额</label>
            <div class="form-input" style="background-color: var(--bg-color);">
              {{ formatBytes(selectedQuotaUser?.storageQuota || 0) }}
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">新配额大小（GB）</label>
            <input 
              type="number" 
              v-model.number="newQuotaGB" 
              class="form-input"
              min="0.1"
              step="0.1"
            />
            <div class="text-secondary text-xs mt-1">
              0.1 GB = 100 MB, 10 GB = 10240 MB
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showQuotaDialog = false">取消</button>
          <button class="btn btn-primary" @click="updateQuota" :disabled="updatingQuota">
            {{ updatingQuota ? '更新中...' : '确认更新' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'

const loading = ref(true)
const dashboardStats = ref<any>(null)
const users = ref<any[]>([])
const downloadRecords = ref<any[]>([])

const showQuotaDialog = ref(false)
const selectedQuotaUser = ref<any>(null)
const newQuotaGB = ref(10)
const updatingQuota = ref(false)

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

async function loadData() {
  loading.value = true
  try {
    const [statsResponse, usersResponse, downloadsResponse] = await Promise.all([
      adminApi.getDashboard(),
      adminApi.getUsers(),
      adminApi.getDownloadRecords()
    ])
    
    dashboardStats.value = statsResponse.data
    users.value = usersResponse.data || []
    downloadRecords.value = downloadsResponse.data || []
  } catch (e) {
    console.error('加载管理面板数据失败:', e)
  } finally {
    loading.value = false
  }
}

function showQuotaModal(user: any) {
  selectedQuotaUser.value = user
  newQuotaGB.value = Math.round((user.storageQuota / 1024 / 1024 / 1024) * 10) / 10
  showQuotaDialog.value = true
}

async function updateQuota() {
  if (!selectedQuotaUser.value) return
  
  updatingQuota.value = true
  try {
    const newQuotaBytes = newQuotaGB.value * 1024 * 1024 * 1024
    await adminApi.updateUserQuota(selectedQuotaUser.value.id, newQuotaBytes)
    
    showQuotaDialog.value = false
    await loadData()
  } catch (e: any) {
    alert(e.response?.data?.error || '更新配额失败')
  } finally {
    updatingQuota.value = false
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
</style>
