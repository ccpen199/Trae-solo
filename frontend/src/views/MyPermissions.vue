<template>
  <div class="my-permissions">
    <div class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">我的权限</h2>
          <p class="page-desc">查看权限申请记录、审批状态和已开通的应用权限</p>
        </div>
        <el-button type="primary" size="large" @click="$router.push('/permission-apply')">
          <el-icon><Plus /></el-icon> 新建申请
        </el-button>
      </div>

      <div class="stat-row">
        <div class="stat-item">
          <div class="stat-value pending">{{ stats.pending }}</div>
          <div class="stat-label">待审批</div>
        </div>
        <div class="stat-item">
          <div class="stat-value approved">{{ stats.approved }}</div>
          <div class="stat-label">已开通</div>
        </div>
        <div class="stat-item">
          <div class="stat-value rejected">{{ stats.rejected }}</div>
          <div class="stat-label">已驳回</div>
        </div>
        <div class="stat-item">
          <div class="stat-value expiring">{{ stats.expiring }}</div>
          <div class="stat-label">即将过期</div>
        </div>
        <div class="stat-item">
          <div class="stat-value expired">{{ stats.expired }}</div>
          <div class="stat-label">已过期</div>
        </div>
      </div>

      <div class="filter-bar">
        <el-tabs v-model="activeTab" class="filter-tabs">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="待审批" name="pending" />
          <el-tab-pane label="已通过" name="approved" />
          <el-tab-pane label="已驳回" name="rejected" />
          <el-tab-pane label="已过期" name="expired" />
        </el-tabs>
        <div class="filter-actions">
          <el-input
            v-model="keyword" placeholder="搜索申请编号、应用名称..."
            :prefix-icon="Search" clearable style="width: 280px;" />
        </div>
      </div>

      <el-table :data="filteredList" size="small" stripe v-loading="loading">
        <el-table-column prop="req_no" label="申请编号" width="180" />
        <el-table-column label="应用" width="150">
          <template #default="{ row }">
            <div class="app-cell">
              <span class="icon">{{ row.icon || '📁' }}</span>
              <span>{{ row.app_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="申请标题" min-width="200" />
        <el-table-column prop="scope" label="授权范围" width="130" />
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            <span v-if="row.valid_from && row.valid_to">
              {{ row.valid_from }} 至 {{ row.valid_to }}
              <el-tag v-if="isExpiring(row)" type="danger" size="small" effect="plain" style="margin-left: 6px;">
                剩 {{ daysLeft(row.valid_to) }} 天
              </el-tag>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="approver" label="审批人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approval_opinion" label="审批意见" width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="申请时间" width="150" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button link type="danger" @click="handleCancel(row)">撤销</el-button>
            </template>
            <template v-else-if="row.status === 'approved'">
              <el-button v-if="isExpiring(row)" link type="primary" @click="handleRenew(row)">续期</el-button>
              <el-button link type="primary" @click="handleAccess(row)" v-if="row.access_url">访问</el-button>
            </template>
            <template v-else-if="row.status === 'rejected' || row.status === 'expired'">
              <el-button link type="primary" @click="handleRenew(row)">重新申请</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!filteredList.length && !loading" description="暂无数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PermissionAPI, CatalogAPI } from '../api'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const activeTab = ref('all')
const keyword = ref('')

const stats = computed(() => {
  const s = { pending: 0, approved: 0, rejected: 0, expired: 0, expiring: 0 }
  for (const row of list.value) {
    if (s[row.status] !== undefined) s[row.status]++
    if (row.status === 'approved' && isExpiring(row)) s.expiring++
  }
  return s
})

const filteredList = computed(() => {
  let data = list.value
  if (activeTab.value !== 'all') data = data.filter(r => r.status === activeTab.value)
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    data = data.filter(r =>
      r.req_no.toLowerCase().includes(kw) ||
      r.app_name?.toLowerCase().includes(kw) ||
      r.title?.toLowerCase().includes(kw)
    )
  }
  return data
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const r = await PermissionAPI.getMine()
    if (r?.code === 0) list.value = r.data
  } finally {
    loading.value = false
  }
}

function isExpiring(row) {
  if (!row.valid_to || row.status !== 'approved') return false
  const d = new Date(row.valid_to)
  const now = new Date()
  const diff = (d - now) / (1000 * 60 * 60 * 24)
  return diff <= 30
}

function daysLeft(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

async function handleCancel(row) {
  ElMessageBox.confirm('确定撤销此申请？撤销后无法恢复。', '提示', { type: 'warning' }).then(async () => {
    await PermissionAPI.cancel(row.id)
    ElMessage.success('已撤销')
    loadData()
  }).catch(() => {})
}

function handleRenew(row) {
  router.push({ path: '/permission-apply', query: { catalog_id: row.catalog_id, renew: row.id } })
}

function handleAccess(row) {
  if (row.catalog_id) {
    CatalogAPI.visit(row.catalog_id).then(r => {
      if (r?.code === 0 && r.data?.access_url) {
        window.open(r.data.access_url, '_blank')
      }
    }).catch(e => ElMessage.error(e.response?.data?.message || '访问失败'))
  }
}

function statusType(s) {
  return { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info', expired: 'danger' }[s] || 'info'
}
function statusLabel(s) {
  return { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', cancelled: '已撤销', expired: '已过期' }[s] || s
}
</script>

<style scoped>
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px;
}
.page-header .page-title, .page-header .page-desc { margin: 0; }
.page-header .page-desc { color: #909399; margin-top: 4px; }
.stat-row {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;
  margin-bottom: 24px;
}
.stat-item {
  text-align: center; padding: 20px; background: #fafafa; border-radius: 8px;
}
.stat-value { font-size: 28px; font-weight: 600; margin-bottom: 4px; }
.stat-value.pending { color: #e6a23c; }
.stat-value.approved { color: #67c23a; }
.stat-value.rejected { color: #f56c6c; }
.stat-value.expiring { color: #f56c6c; }
.stat-value.expired { color: #909399; }
.stat-label { color: #909399; font-size: 13px; }
.filter-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.filter-tabs { flex: 1; }
.app-cell { display: flex; align-items: center; gap: 6px; }
.app-cell .icon { font-size: 16px; }
</style>
