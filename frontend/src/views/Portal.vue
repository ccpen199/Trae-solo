<template>
  <div class="portal">
    <div class="portal-header">
      <div class="welcome">
        <h2>你好，{{ user?.display_name || user?.username }} 👋</h2>
        <p>欢迎回到企业门户统一工作台</p>
      </div>
      <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="搜索应用、公告、待办..." :prefix-icon="Search" size="large" clearable />
      </div>
    </div>

    <div class="announcement-bar" v-if="importantAnnouncements.length">
      <el-carousel height="40px" :interval="4000" indicator-position="none" arrow="never">
        <el-carousel-item v-for="a in importantAnnouncements" :key="a.id">
          <div class="announcement-item">
            <el-tag :type="levelType(a.level)" size="small" effect="dark">{{ levelLabel(a.level) }}</el-tag>
            <span class="ann-title" @click="showAnnouncement(a)">{{ a.title }}</span>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <div class="portal-grid">
      <div class="portal-col">
        <div class="page-card">
          <div class="card-header">
            <h3>🔥 常用应用</h3>
            <el-button link type="primary" @click="$router.push('/app-catalog')">查看全部</el-button>
          </div>
          <div class="app-grid">
            <div class="app-item" v-for="app in favoriteApps" :key="app.id" @click="openApp(app)">
              <div class="app-icon">{{ app.icon }}</div>
              <div class="app-name">{{ app.app_name }}</div>
              <div class="app-cat">{{ app.category }}</div>
            </div>
            <div class="app-item" v-for="app in recentApps" :key="'r'+app.id" @click="openApp(app)">
              <div class="app-icon">{{ app.icon }}</div>
              <div class="app-name">{{ app.app_name }}</div>
              <div class="app-cat">{{ app.category }}</div>
            </div>
          </div>
        </div>

        <div class="page-card">
          <div class="card-header">
            <h3>📢 最新公告</h3>
          </div>
          <div class="announcement-list">
            <div class="ann-row" v-for="a in announcements" :key="a.id" @click="showAnnouncement(a)">
              <el-tag :type="levelType(a.level)" size="small">{{ levelLabel(a.level) }}</el-tag>
              <span class="title">{{ a.title }}</span>
              <span class="date">{{ a.created_at }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="portal-col">
        <div class="page-card">
          <div class="card-header">
            <h3>⏰ 待办事项</h3>
            <el-badge :value="todoCount" class="todo-badge" />
          </div>
          <el-tabs v-model="activeTab" class="todo-tabs">
            <el-tab-pane label="待我审批" name="approve">
              <div class="todo-list" v-if="pendingPerms.length">
                <div class="todo-item" v-for="p in pendingPerms" :key="p.id">
                  <div class="todo-icon perm">🔑</div>
                  <div class="todo-content">
                    <div class="todo-title">{{ p.title }}</div>
                    <div class="todo-meta">申请人: {{ p.applicant }} · {{ p.created_at }}</div>
                  </div>
                  <div class="todo-actions">
                    <el-button size="small" type="success" @click="handleApprove(p)">通过</el-button>
                    <el-button size="small" type="danger" @click="handleReject(p)">驳回</el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无待办" :image-size="80" />
            </el-tab-pane>
            <el-tab-pane label="我的申请" name="my">
              <el-table :data="myPerms" size="small" stripe>
                <el-table-column prop="req_no" label="申请编号" width="180" />
                <el-table-column prop="app_name" label="应用" width="130" />
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="status" label="状态" width="90">
                  <template #default="{ row }">
                    <el-tag :type="permStatusType(row.status)" size="small">{{ permStatusLabel(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="申请时间" width="150" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="page-card" v-if="expiringPerms.length">
          <div class="card-header">
            <h3>⚠️ 即将过期提醒</h3>
          </div>
          <div class="expiring-list">
            <div class="expiring-item" v-for="p in expiringPerms" :key="p.id">
              <el-alert
                :title="`${p.app_name} 权限将在 ${daysBetween(p.valid_to)} 天后过期`"
                type="warning" :closable="false" show-icon>
                <template #default>
                  <span>有效期至: {{ p.valid_to }} · 范围: {{ p.scope }}</span>
                  <el-button size="small" type="primary" class="renew-btn" @click="handleRenew(p)">续期申请</el-button>
                </template>
              </el-alert>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="annDialogVisible" title="公告详情" width="600px">
      <div class="ann-detail">
        <div class="ann-detail-header">
          <el-tag :type="levelType(currentAnn?.level)" size="small">{{ levelLabel(currentAnn?.level) }}</el-tag>
          <span class="ann-publisher">发布人: {{ currentAnn?.publisher }}</span>
          <span class="ann-date">{{ currentAnn?.created_at }}</span>
        </div>
        <h3>{{ currentAnn?.title }}</h3>
        <p>{{ currentAnn?.content }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { CatalogAPI, PermissionAPI, AuthAPI } from '../api'

const router = useRouter()
const user = ref(null)
const searchKeyword = ref('')
const activeTab = ref('approve')
const annDialogVisible = ref(false)
const currentAnn = ref(null)

const favoriteApps = ref([])
const recentApps = ref([])
const announcements = ref([])
const pendingPerms = ref([])
const myPerms = ref([])
const expiringPerms = ref([])

const importantAnnouncements = computed(() =>
  announcements.value.filter(a => a.level === 'danger' || a.level === 'warning')
)

const todoCount = computed(() => pendingPerms.value.length)

onMounted(async () => {
  const cached = localStorage.getItem('user')
  if (cached) user.value = JSON.parse(cached)
  try {
    const r = await AuthAPI.me()
    if (r?.code === 0) user.value = r.data
  } catch (e) {}
  loadData()
})

async function loadData() {
  try {
    const [fav, rec, ann, pending, mine, exp] = await Promise.all([
      CatalogAPI.getFavorites(),
      CatalogAPI.getRecent(),
      CatalogAPI.getAnnouncements(),
      PermissionAPI.getPending(),
      PermissionAPI.getMine(),
      PermissionAPI.getExpiringSoon()
    ])
    if (fav?.code === 0) favoriteApps.value = fav.data.slice(0, 6)
    if (rec?.code === 0) recentApps.value = rec.data.filter(r => !favoriteApps.value.find(f => f.id === r.id)).slice(0, 6)
    if (ann?.code === 0) announcements.value = ann.data
    if (pending?.code === 0) pendingPerms.value = pending.data
    if (mine?.code === 0) myPerms.value = mine.data
    if (exp?.code === 0) expiringPerms.value = exp.data.expiring || []
  } catch (e) {}
}

function openApp(app) {
  CatalogAPI.visit(app.id).then(r => {
    if (r?.code === 0 && r.data?.access_url) {
      window.open(r.data.access_url, '_blank')
    }
  }).catch(e => {
    if (e.response?.status === 403 && e.response?.data?.requireApproval) {
      ElMessageBox.confirm('该应用需要申请权限才能访问，是否立即申请？', '提示', {
        type: 'info',
        confirmButtonText: '去申请',
        cancelButtonText: '取消'
      }).then(() => {
        router.push({ path: '/permission-apply', query: { catalog_id: app.id } })
      }).catch(() => {})
    }
  })
}

function showAnnouncement(a) {
  currentAnn.value = a
  annDialogVisible.value = true
}

function handleApprove(p) {
  ElMessageBox.prompt('请输入审批意见', '审批通过', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入审批意见（可选）'
  }).then(async ({ value }) => {
    await PermissionAPI.approve(p.id, { opinion: value || '审批通过' })
    ElMessage.success('审批通过')
    loadData()
  }).catch(() => {})
}

function handleReject(p) {
  ElMessageBox.prompt('请输入驳回理由', '驳回申请', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入驳回理由',
    type: 'warning'
  }).then(async ({ value }) => {
    if (!value?.trim()) {
      ElMessage.warning('驳回理由必填')
      return
    }
    await PermissionAPI.reject(p.id, { opinion: value })
    ElMessage.success('已驳回')
    loadData()
  }).catch(() => {})
}

function handleRenew(p) {
  router.push({ path: '/permission-apply', query: { catalog_id: p.catalog_id, renew: p.id } })
}

function daysBetween(dateStr) {
  if (!dateStr) return 0
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function levelType(l) {
  return { info: 'info', success: 'success', warning: 'warning', danger: 'danger' }[l] || 'info'
}
function levelLabel(l) {
  return { info: '通知', success: '正常', warning: '警告', danger: '重要' }[l] || '通知'
}
function permStatusType(s) {
  return { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info', expired: 'danger' }[s] || 'info'
}
function permStatusLabel(s) {
  return { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', cancelled: '已撤销', expired: '已过期' }[s] || s
}
</script>

<style scoped>
.portal { padding: 20px 0; }
.portal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px; color: #fff;
}
.welcome h2 { margin: 0 0 8px; color: #fff; font-size: 24px; }
.welcome p { margin: 0; opacity: 0.9; }
.search-box { width: 400px; }
.announcement-bar { margin-bottom: 20px; background: #fff; border-radius: 8px; padding: 0 16px; }
.announcement-item { display: flex; align-items: center; height: 40px; gap: 12px; }
.ann-title { cursor: pointer; color: #303133; }
.ann-title:hover { color: #409eff; }
.portal-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-header h3 { margin: 0; font-size: 16px; }
.todo-badge { margin-right: auto; }
.app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.app-item {
  text-align: center; padding: 16px 8px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s; border: 1px solid #ebeef5;
}
.app-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #409eff;
}
.app-icon { font-size: 32px; margin-bottom: 8px; }
.app-name { font-weight: 500; color: #303133; margin-bottom: 4px; }
.app-cat { font-size: 12px; color: #909399; }
.announcement-list { display: flex; flex-direction: column; gap: 8px; }
.ann-row {
  display: flex; align-items: center; gap: 12px; padding: 8px 12px;
  border-radius: 6px; cursor: pointer;
}
.ann-row:hover { background: #f5f7fa; }
.ann-row .title { flex: 1; }
.ann-row .date { color: #909399; font-size: 12px; }
.todo-tabs .todo-list { display: flex; flex-direction: column; gap: 12px; }
.todo-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  border: 1px solid #ebeef5; border-radius: 8px;
}
.todo-icon { font-size: 24px; }
.todo-content { flex: 1; }
.todo-title { font-weight: 500; margin-bottom: 4px; }
.todo-meta { font-size: 12px; color: #909399; }
.expiring-list { display: flex; flex-direction: column; gap: 12px; }
.renew-btn { margin-left: 12px; }
.ann-detail-header {
  display: flex; gap: 12px; align-items: center;
  padding-bottom: 12px; border-bottom: 1px solid #ebeef5; margin-bottom: 16px;
}
.ann-detail h3 { margin: 0 0 12px; }
.ann-detail p { line-height: 1.8; color: #606266; }
.ann-publisher, .ann-date { color: #909399; font-size: 13px; }
</style>
