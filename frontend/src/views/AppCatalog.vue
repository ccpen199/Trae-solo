<template>
  <div class="app-catalog">
    <div class="page-card">
      <h2 class="page-title">应用目录</h2>
      <div class="catalog-filter">
        <div class="cat-tabs">
          <el-tag
            v-for="cat in categories" :key="cat.category"
            :type="selectedCategory === cat.category ? 'primary' : 'info'"
            effect="plain" size="large"
            class="cat-tag"
            @click="selectedCategory = selectedCategory === cat.category ? '' : cat.category">
            {{ cat.category }} <span class="count">({{ cat.count }})</span>
          </el-tag>
          <el-tag v-if="showFavoritesOnly" type="danger" effect="plain" size="large" class="cat-tag" @click="showFavoritesOnly = false">
            ❤️ 我的收藏
          </el-tag>
        </div>
        <div class="filter-actions">
          <el-input
            v-model="keyword" placeholder="搜索应用名称或描述..."
            :prefix-icon="Search" clearable style="width: 280px;" />
          <el-button :type="showFavoritesOnly ? 'primary' : 'default'" @click="showFavoritesOnly = !showFavoritesOnly">
            <el-icon><StarFilled /></el-icon> 我的收藏
          </el-button>
        </div>
      </div>
    </div>

    <div class="quick-access">
      <div class="section-title">
        <span>🕐 最近访问</span>
        <el-button link type="primary" size="small" @click="clearRecent">清空</el-button>
      </div>
      <div class="app-scroll" v-if="recentApps.length">
        <div class="app-mini" v-for="app in recentApps" :key="app.id" @click="openApp(app)">
          <span class="icon">{{ app.icon }}</span>
          <span class="name">{{ app.app_name }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无最近访问" :image-size="60" />
    </div>

    <div class="page-card">
      <div class="section-title">
        <span>📋 全部应用</span>
        <span class="sub">共 {{ filteredApps.length }} 个</span>
      </div>
      <div class="app-list">
        <div class="app-card" v-for="app in filteredApps" :key="app.id">
          <div class="app-card-header">
            <div class="app-icon">{{ app.icon }}</div>
            <div class="app-info">
              <div class="app-name">
                {{ app.app_name }}
                <el-tag v-if="app.approval_required === 1" type="warning" size="small" effect="plain">需审批</el-tag>
                <el-tag v-else type="success" size="small" effect="plain">免审批</el-tag>
                <el-tag v-if="app.maintenance_status !== 'online'" type="danger" size="small">维护中</el-tag>
              </div>
              <div class="app-code">{{ app.app_code }} · {{ app.category }}</div>
            </div>
            <el-button
              link :type="app.is_favorite ? 'danger' : 'info'"
              @click.stop="toggleFavorite(app)">
              <el-icon><StarFilled v-if="app.is_favorite" /><Star v-else /></el-icon>
              {{ app.is_favorite ? '已收藏' : '收藏' }}
            </el-button>
          </div>
          <p class="app-desc">{{ app.description }}</p>
          <div class="app-meta">
            <div class="meta-item">
              <span class="label">开通条件</span>
              <span class="value">{{ app.open_condition }}</span>
            </div>
            <div class="meta-item">
              <span class="label">负责人</span>
              <span class="value">{{ ownerLabel(app.owner) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">可见范围</span>
              <span class="value">{{ scopeLabel(app.visible_scope) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">维护状态</span>
              <span class="value">
                <el-tag :type="app.maintenance_status === 'online' ? 'success' : 'danger'" size="small">
                  {{ app.maintenance_status === 'online' ? '在线' : '维护' }}
                </el-tag>
              </span>
            </div>
          </div>
          <div class="app-actions">
            <el-button type="primary" @click="openApp(app)">
              <el-icon><Link /></el-icon> 访问应用
            </el-button>
            <el-button v-if="app.approval_required === 1" @click="applyPermission(app)">
              <el-icon><Key /></el-icon> 申请权限
            </el-button>
          </div>
        </div>
      </div>
      <el-empty v-if="!filteredApps.length" description="没有找到匹配的应用" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Star, StarFilled, Link, Key } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CatalogAPI, PermissionAPI } from '../api'

const router = useRouter()
const keyword = ref('')
const selectedCategory = ref('')
const showFavoritesOnly = ref(false)
const apps = ref([])
const recentApps = ref([])
const categories = ref([])

onMounted(async () => {
  await loadData()
})

async function loadData() {
  const [list, recent] = await Promise.all([
    CatalogAPI.list({ category: selectedCategory.value, keyword: keyword.value }),
    CatalogAPI.getRecent()
  ])
  if (list?.code === 0) {
    apps.value = list.data.list
    categories.value = list.data.categories
  }
  if (recent?.code === 0) recentApps.value = recent.data
}

const filteredApps = computed(() => {
  let list = apps.value
  if (showFavoritesOnly.value) list = list.filter(a => a.is_favorite)
  return list
})

async function toggleFavorite(app) {
  const r = await CatalogAPI.toggleFavorite(app.id)
  if (r?.code === 0) {
    app.is_favorite = r.data.is_favorite
    ElMessage.success(r.data.is_favorite ? '已收藏' : '已取消收藏')
  }
}

function openApp(app) {
  if (app.maintenance_status !== 'online') {
    ElMessage.warning('应用维护中，暂不可访问')
    return
  }
  CatalogAPI.visit(app.id).then(r => {
    if (r?.code === 0 && r.data?.access_url) {
      window.open(r.data.access_url, '_blank')
      loadData()
    }
  }).catch(e => {
    if (e.response?.status === 403 && e.response?.data?.requireApproval) {
      ElMessageBox.confirm('该应用需要申请权限才能访问，是否立即申请？', '提示', {
        type: 'info', confirmButtonText: '去申请', cancelButtonText: '取消'
      }).then(() => {
        router.push({ path: '/permission-apply', query: { catalog_id: app.id } })
      }).catch(() => {})
    }
  })
}

function applyPermission(app) {
  router.push({ path: '/permission-apply', query: { catalog_id: app.id } })
}

async function clearRecent() {
  ElMessageBox.confirm('确定清空最近访问记录？', '提示', { type: 'warning' }).then(async () => {
    recentApps.value = []
    ElMessage.success('已清空')
  }).catch(() => {})
}

function ownerLabel(o) {
  return { admin: '系统管理员', platform: '平台工程师', ops: '运维工程师', owner: '应用负责人', security: '安全管理员' }[o] || o
}
function scopeLabel(s) {
  if (!s || s === 'all') return '全员可见'
  if (s.startsWith('role:')) return `指定角色: ${s.slice(5)}`
  if (s.startsWith('department:')) return `指定部门: ${s.slice(11)}`
  return s
}
</script>

<style scoped>
.catalog-filter {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 16px; margin-bottom: 16px;
}
.cat-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.cat-tag { cursor: pointer; }
.cat-tag .count { opacity: 0.7; font-size: 12px; }
.filter-actions { display: flex; gap: 8px; }
.quick-access {
  background: #fff; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;
}
.section-title {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px; font-weight: 500;
}
.section-title .sub { color: #909399; font-size: 13px; font-weight: normal; }
.app-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.app-mini {
  display: flex; align-items: center; gap: 8px; padding: 8px 16px;
  background: #f5f7fa; border-radius: 20px; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.app-mini:hover { background: #ecf5ff; color: #409eff; }
.app-mini .icon { font-size: 18px; }
.app-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.app-card {
  border: 1px solid #ebeef5; border-radius: 12px; padding: 20px;
  transition: all 0.2s;
}
.app-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border-color: #409eff;
}
.app-card-header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
.app-card .app-icon {
  font-size: 36px; width: 56px; height: 56px; display: flex;
  align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}
.app-card .app-info { flex: 1; }
.app-card .app-name { font-size: 16px; font-weight: 500; margin-bottom: 4px; display: flex; gap: 6px; align-items: center; }
.app-card .app-code { font-size: 12px; color: #909399; }
.app-desc { color: #606266; margin: 0 0 16px; line-height: 1.6; }
.app-meta {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;
  padding: 12px; background: #fafafa; border-radius: 8px; margin-bottom: 16px;
}
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-item .label { font-size: 12px; color: #909399; }
.meta-item .value { font-size: 13px; color: #303133; }
.app-actions { display: flex; gap: 8px; }
</style>
