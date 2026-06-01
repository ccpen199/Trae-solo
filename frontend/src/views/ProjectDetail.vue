<template>
  <div class="project-detail">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <template v-else>
      <div class="detail-header">
        <div>
          <h2>{{ project.name }}</h2>
          <p class="project-desc">{{ project.description || '暂无描述' }}</p>
        </div>
        <div class="header-actions">
          <span class="meta-item">📄 {{ pages.length }} 页</span>
          <span class="meta-item">🔄 {{ totalVersions }} 版</span>
          <span class="meta-item">📋 {{ requirements.length }} 需求</span>
          <span class="meta-item">🔍 {{ reviews.length }} 评审</span>
          <router-link :to="`/reports/${id}`" class="btn-secondary">📊 统计报表</router-link>
          <router-link to="/reviews" class="btn-secondary">← 返回列表</router-link>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'pages' }" @click="activeTab = 'pages'">页面与版本</button>
        <button class="tab" :class="{ active: activeTab === 'requirements' }" @click="activeTab = 'requirements'">关联需求</button>
        <button class="tab" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">评审记录</button>
        <button class="tab" :class="{ active: activeTab === 'diff' }" @click="activeTab = 'diff'">版本对比</button>
      </div>

      <div v-if="activeTab === 'pages'">
        <div class="tab-header">
          <h3>页面列表</h3>
          <button class="btn-primary btn-sm" @click="showAddPage = !showAddPage">
            {{ showAddPage ? '取消' : '+ 添加页面' }}
          </button>
        </div>

        <div v-if="showAddPage" class="inline-form card">
          <h4 class="form-section-title">📄 页面信息</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>页面名称 <span class="required">*</span></label>
              <input v-model="pageForm.name" placeholder="输入页面名称（如：首页、商品详情页" @keyup.enter="handleAddPage" />
            </div>
          </div>
          <div class="form-group">
            <label>页面描述</label>
            <textarea v-model="pageForm.description" rows="2" placeholder="简要描述页面功能"></textarea>
          </div>
          
          <h4 class="form-section-title">🔄 首个版本信息</h4>
          <div class="form-row">
            <div class="form-group sm">
              <label>版本号 <span class="required">*</span></label>
              <input v-model.number="pageForm.initial_version.version_number" type="number" min="1" placeholder="1" />
            </div>
            <div class="form-group sm">
              <label>变更类型</label>
              <select v-model="pageForm.initial_version.change_type">
                <option value="create">新增</option>
                <option value="update">修改</option>
                <option value="delete">删除</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>版本说明</label>
              <input v-model="pageForm.initial_version.description" placeholder="例如：初始设计稿" />
            </div>
            <div class="form-group">
              <label>创建人</label>
              <input v-model="pageForm.initial_version.created_by" placeholder="例如：设计师A" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-secondary btn-sm" @click="showAddPage = false">取消</button>
            <button class="btn-primary btn-sm" @click="handleAddPage" :disabled="!pageForm.name.trim()">添加页面</button>
          </div>
        </div>

        <div v-if="pages.length === 0" class="empty-state">暂无页面，点击"添加页面"开始</div>

        <div v-for="page in pages" :key="page.id" class="page-section">
          <div class="page-header" @click="togglePage(page.id)">
            <span class="page-toggle">{{ expandedPages.includes(page.id) ? '▼' : '▶' }}</span>
            <span class="page-name">📄 {{ page.name }}</span>
            <span class="page-meta">{{ getPageVersions(page.id).length }} 个版本</span>
            <button class="btn-danger btn-sm" @click.stop="handleDeletePage(page.id)">删除</button>
          </div>

          <div v-if="expandedPages.includes(page.id)" class="page-body">
            <div v-if="getPageVersions(page.id).length" class="version-list">
              <div v-for="ver in getPageVersions(page.id)" :key="ver.id" class="version-item">
                <div class="version-info">
                  <span class="version-tag">v{{ ver.version_number }}</span>
                  <span class="badge" :class="changeTypeClass(ver.change_type)">{{ changeTypeLabel(ver.change_type) }}</span>
                  <span class="version-desc">{{ ver.description || '无描述' }}</span>
                  <span v-if="ver.created_by" class="version-author">by {{ ver.created_by }}</span>
                </div>
                <div class="version-actions">
                  <button class="btn-primary btn-sm" @click="handleStartReview(page.id, ver.id)">开始评审</button>
                  <button class="btn-danger btn-sm" @click="handleDeleteVersion(ver.id)">删除</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-sm">暂无版本</div>

            <div class="add-version-row">
              <button v-if="!showAddVersion[page.id]" class="btn-secondary btn-sm" @click="showAddVersion[page.id] = true">
                + 添加版本
              </button>
              <div v-if="showAddVersion[page.id]" class="inline-form-sm">
                <input v-model="versionForm.image_url" placeholder="图片URL" class="sm-input" />
                <select v-model="versionForm.change_type" class="sm-select">
                  <option value="create">新增</option>
                  <option value="update">修改</option>
                  <option value="delete">删除</option>
                </select>
                <input v-model="versionForm.description" placeholder="版本说明" class="sm-input" />
                <button class="btn-primary btn-sm" @click="handleAddVersion(page.id)">添加</button>
                <button class="btn-secondary btn-sm" @click="cancelAddVersion(page.id)">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'requirements'">
        <div class="tab-header">
          <h3>关联需求</h3>
          <button class="btn-primary btn-sm" @click="showAddReq = !showAddReq">
            {{ showAddReq ? '取消' : '+ 添加需求' }}
          </button>
        </div>

        <div v-if="showAddReq" class="inline-form card">
          <div class="form-group">
            <label>需求标题</label>
            <input v-model="reqForm.title" placeholder="输入需求标题" />
          </div>
          <div class="form-group">
            <label>需求描述</label>
            <textarea v-model="reqForm.description" rows="2" placeholder="输入需求描述"></textarea>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="reqForm.status">
              <option value="pending">待处理</option>
              <option value="approved">已审批</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>关联页面（可选）</label>
            <select v-model="reqForm.link_page_id">
              <option :value="null">-- 不关联 --</option>
              <option v-for="p in pages" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-secondary btn-sm" @click="showAddReq = false">取消</button>
            <button class="btn-primary btn-sm" @click="handleAddReq" :disabled="!reqForm.title.trim()">添加</button>
          </div>
        </div>

        <div v-if="requirements.length === 0" class="empty-state">暂无需求</div>

        <div v-for="req in requirements" :key="req.id" class="req-item card">
          <div class="req-header">
            <span class="req-title">📋 {{ req.title }}</span>
            <span class="badge" :class="`badge-${req.status}`">{{ reqStatusLabel(req.status) }}</span>
          </div>
          <p class="req-desc">{{ req.description || '暂无描述' }}</p>
          <div class="req-meta" v-if="req.linked_pages && req.linked_pages.length">
            <span>关联页面：</span>
            <span v-for="lp in req.linked_pages" :key="lp.id" class="link-chip">{{ lp.name }}</span>
          </div>
          <div class="req-actions">
            <select v-if="pages.length" v-model="linkPageId" class="sm-select">
              <option :value="null">-- 选择页面关联 --</option>
              <option v-for="p in pages" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button class="btn-secondary btn-sm" @click="handleLinkReq(req.id)">关联</button>
            <button class="btn-danger btn-sm" @click="handleDeleteReq(req.id)">删除</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'reviews'">
        <div class="tab-header">
          <h3>评审记录</h3>
          <button class="btn-primary btn-sm" @click="showCreateReview = !showCreateReview">
            {{ showCreateReview ? '取消' : '+ 创建评审' }}
          </button>
        </div>

        <div v-if="showCreateReview" class="inline-form card">
          <div class="form-group">
            <label>评审标题</label>
            <input v-model="reviewForm.title" placeholder="输入评审标题" />
          </div>
          <div class="form-group">
            <label>关联版本</label>
            <select v-model="reviewForm.version_id">
              <option :value="null">-- 选择版本 --</option>
              <option v-for="v in allVersions" :key="v.id" :value="v.id">
                {{ v.pageName }} - v{{ v.version_number }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>评审时间</label>
            <input v-model="reviewForm.scheduled_at" type="datetime-local" />
          </div>
          <div class="form-actions">
            <button class="btn-secondary btn-sm" @click="showCreateReview = false">取消</button>
            <button class="btn-primary btn-sm" @click="handleCreateReview" :disabled="!reviewForm.title.trim() || !reviewForm.version_id">创建</button>
          </div>
        </div>

        <div v-if="reviews.length === 0" class="empty-state">暂无评审记录</div>

        <div v-for="review in reviews" :key="review.id" class="review-item card" @click="$router.push(`/review/${review.id}`)">
          <div class="review-header">
            <span class="review-title">🔍 {{ review.title || '评审 #' + review.id }}</span>
            <span class="badge" :class="`badge-${review.status}`">{{ statusLabel(review.status) }}</span>
          </div>
          <div class="review-meta">
            <span>📅 {{ formatTime(review.scheduled_at) || '未排期' }}</span>
            <span v-if="review.comment_count !== undefined">💬 {{ review.comment_count }} 评论</span>
            <span v-if="review.participants && review.participants.length">
              👥 {{ review.participants.length }} 参与人
            </span>
          </div>
          <div class="review-participants" v-if="review.participants && review.participants.length">
            <span v-for="p in review.participants" :key="p.id" class="participant-chip">
              {{ p.user_name }} ({{ roleLabel(p.role) }})
            </span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'diff'">
        <div class="tab-header">
          <h3>版本对比</h3>
        </div>
        <div class="diff-form card">
          <div class="diff-selectors">
            <div class="form-group">
              <label>版本 A</label>
              <select v-model="diffV1">
                <option :value="null">-- 选择版本 --</option>
                <option v-for="v in allVersions" :key="'a'+v.id" :value="v.id">
                  {{ v.pageName }} - v{{ v.version_number }}
                </option>
              </select>
            </div>
            <div class="diff-arrow">⇄</div>
            <div class="form-group">
              <label>版本 B</label>
              <select v-model="diffV2">
                <option :value="null">-- 选择版本 --</option>
                <option v-for="v in allVersions" :key="'b'+v.id" :value="v.id">
                  {{ v.pageName }} - v{{ v.version_number }}
                </option>
              </select>
            </div>
          </div>
          <button class="btn-primary" @click="handleDiff" :disabled="!diffV1 || !diffV2">开始对比</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchProject, fetchPages, createPage, deletePage,
  fetchVersions, createVersion, deleteVersion,
  fetchRequirements, createRequirement, deleteRequirement, linkRequirement,
  fetchReviews, createReview
} from '../api'

const props = defineProps({ id: [String, Number] })
const router = useRouter()

const project = ref({})
const pages = ref([])
const pageVersionsMap = reactive({})
const requirements = ref([])
const reviews = ref([])
const loading = ref(true)
const error = ref('')
const activeTab = ref('pages')
const expandedPages = ref([])
const showAddPage = ref(false)
const showAddVersion = reactive({})
const showAddReq = ref(false)
const showCreateReview = ref(false)
const linkPageId = ref(null)
const diffV1 = ref(null)
const diffV2 = ref(null)

const pageForm = ref({ 
  name: '',
  description: '',
  initial_version: {
    version_number: 1,
    description: '',
    change_type: 'create',
    created_by: '',
    image_url: ''
  }
})
const versionForm = ref({ image_url: '', change_type: 'create', description: '', created_by: '' })
const reqForm = ref({ title: '', description: '', status: 'pending', link_page_id: null })
const reviewForm = ref({ title: '', version_id: null, scheduled_at: '' })

const totalVersions = computed(() => {
  let count = 0
  for (const pageId in pageVersionsMap) {
    count += pageVersionsMap[pageId].length
  }
  return count
})

const allVersions = computed(() => {
  const list = []
  for (const page of pages.value) {
    const versions = pageVersionsMap[page.id] || []
    for (const v of versions) {
      list.push({ ...v, pageName: page.name })
    }
  }
  return list
})

function getPageVersions(pageId) {
  return pageVersionsMap[pageId] || []
}

function statusLabel(status) {
  const map = { scheduled: '已排期', in_progress: '评审中', completed: '已完成', active: '进行中', archived: '已归档' }
  return map[status] || status
}

function reqStatusLabel(status) {
  const map = { pending: '待处理', approved: '已审批', completed: '已完成' }
  return map[status] || status
}

function roleLabel(role) {
  const map = { designer: '设计师', pm: '产品经理', dev: '研发', tester: '测试', business: '业务', reviewer: '评审人' }
  return map[role] || role
}

function changeTypeLabel(t) {
  const map = { create: '新增', update: '修改', delete: '删除' }
  return map[t] || t
}

function changeTypeClass(t) {
  const map = { create: 'badge-active', update: 'badge-pending', delete: 'badge-cancelled' }
  return map[t] || ''
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN')
}

function togglePage(pageId) {
  const idx = expandedPages.value.indexOf(pageId)
  if (idx > -1) {
    expandedPages.value.splice(idx, 1)
  } else {
    expandedPages.value.push(pageId)
    loadPageVersions(pageId)
  }
}

function cancelAddVersion(pageId) {
  showAddVersion[pageId] = false
  versionForm.value = { image_url: '', change_type: 'create', description: '', created_by: '' }
}

async function loadProject() {
  loading.value = true
  error.value = ''
  try {
    project.value = await fetchProject(props.id)
  } catch (e) {
    error.value = '加载项目失败: ' + e.message
  } finally {
    loading.value = false
  }
}

async function loadPages() {
  try {
    pages.value = await fetchPages(props.id)
  } catch (e) {
    console.error('加载页面失败:', e)
  }
}

async function loadPageVersions(pageId) {
  try {
    const versions = await fetchVersions(pageId)
    pageVersionsMap[pageId] = versions
  } catch (e) {
    console.error('加载版本失败:', e)
    pageVersionsMap[pageId] = []
  }
}

async function loadRequirements() {
  try {
    requirements.value = await fetchRequirements(props.id)
  } catch (e) {
    console.error('加载需求失败:', e)
  }
}

async function loadReviews() {
  try {
    const data = await fetchReviews(props.id)
    reviews.value = data.map(r => ({
      ...r,
      participants: r.participants || [],
      comment_count: r.comment_count || 0
    }))
  } catch (e) {
    console.error('加载评审失败:', e)
  }
}

async function handleAddPage() {
  if (!pageForm.value.name.trim()) return
  try {
    const res = await createPage(props.id, {
      name: pageForm.value.name.trim(),
      description: pageForm.value.description.trim(),
      initial_version: pageForm.value.initial_version
    })
    pageForm.value = { 
      name: '',
      description: '',
      initial_version: {
        version_number: 1,
        description: '',
        change_type: 'create',
        created_by: '',
        image_url: ''
      }
    }
    showAddPage.value = false
    await loadPages()
    if (res && res.data && res.data.id) {
      await loadPageVersions(res.data.id)
      expandedPages.value.push(res.data.id)
    }
  } catch (e) {
    alert('添加页面失败: ' + e.message)
  }
}

async function handleDeletePage(pageId) {
  if (!confirm('确定删除此页面？所有关联版本也会被删除。')) return
  try {
    await deletePage(pageId)
    delete pageVersionsMap[pageId]
    const idx = expandedPages.value.indexOf(pageId)
    if (idx > -1) expandedPages.value.splice(idx, 1)
    await loadPages()
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

async function handleAddVersion(pageId) {
  try {
    const nextVersion = getPageVersions(pageId).length + 1
    const data = {
      ...versionForm.value,
      version_number: nextVersion
    }
    await createVersion(pageId, data)
    versionForm.value = { image_url: '', change_type: 'create', description: '', created_by: '' }
    showAddVersion[pageId] = false
    await loadPageVersions(pageId)
  } catch (e) {
    alert('添加版本失败: ' + e.message)
  }
}

async function handleDeleteVersion(versionId) {
  if (!confirm('确定删除此版本？')) return
  try {
    await deleteVersion(versionId)
    for (const page of pages.value) {
      await loadPageVersions(page.id)
    }
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

async function handleStartReview(pageId, versionId) {
  try {
    const res = await createReview(props.id, {
      title: `${project.value.name} - ${pages.value.find(p => p.id === pageId)?.name || ''} v${getPageVersions(pageId).find(v => v.id === versionId)?.version_number || ''}`,
      version_id: versionId,
      status: 'in_progress',
      scheduled_at: new Date().toISOString().slice(0, 16)
    })
    if (res && res.data && res.data.id) {
      router.push(`/review/${res.data.id}`)
    } else {
      await loadReviews()
      activeTab.value = 'reviews'
    }
  } catch (e) {
    alert('创建评审失败: ' + e.message)
  }
}

async function handleCreateReview() {
  if (!reviewForm.value.title.trim() || !reviewForm.value.version_id) return
  try {
    const res = await createReview(props.id, {
      ...reviewForm.value,
      status: 'scheduled'
    })
    reviewForm.value = { title: '', version_id: null, scheduled_at: '' }
    showCreateReview.value = false
    await loadReviews()
    if (res && res.data && res.data.id) {
      router.push(`/review/${res.data.id}`)
    }
  } catch (e) {
    alert('创建评审失败: ' + e.message)
  }
}

async function handleAddReq() {
  if (!reqForm.value.title.trim()) return
  try {
    const { link_page_id, ...data } = reqForm.value
    await createRequirement(props.id, data)
    if (link_page_id) {
      const reqs = await fetchRequirements(props.id)
      const newReq = reqs[reqs.length - 1]
      if (newReq) {
        await linkRequirement(link_page_id, newReq.id)
      }
    }
    reqForm.value = { title: '', description: '', status: 'pending', link_page_id: null }
    showAddReq.value = false
    await loadRequirements()
  } catch (e) {
    alert('添加需求失败: ' + e.message)
  }
}

async function handleLinkReq(reqId) {
  if (!linkPageId.value) { alert('请选择页面'); return }
  try {
    await linkRequirement(linkPageId.value, reqId)
    linkPageId.value = null
    await loadRequirements()
  } catch (e) {
    alert('关联失败: ' + e.message)
  }
}

async function handleDeleteReq(reqId) {
  if (!confirm('确定删除此需求？')) return
  try {
    await deleteRequirement(reqId)
    await loadRequirements()
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

function handleDiff() {
  if (diffV1.value && diffV2.value) {
    router.push(`/version-diff/${diffV1.value}/${diffV2.value}`)
  }
}

onMounted(async () => {
  await loadProject()
  await loadPages()
  await loadRequirements()
  await loadReviews()
  for (const page of pages.value) {
    await loadPageVersions(page.id)
  }
})
</script>

<style scoped>
.project-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.detail-header h2 {
  color: var(--color-primary);
  font-size: 22px;
  margin-bottom: 4px;
}

.project-desc {
  color: var(--color-text-light);
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  padding: 4px 10px;
  border-radius: 12px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tab-header h3 {
  font-size: 16px;
  color: var(--color-primary);
}

.inline-form {
  padding: 16px;
  margin-bottom: 16px;
}

.inline-form-sm {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}

.sm-input {
  width: 140px;
  padding: 6px 10px;
  font-size: 13px;
}

.sm-select {
  padding: 6px 10px;
  font-size: 13px;
}

.page-section {
  margin-bottom: 8px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: background 0.15s;
}

.page-header:hover {
  background: #edf2f7;
}

.page-toggle {
  font-size: 12px;
  color: var(--color-text-light);
  width: 20px;
}

.page-name {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

.page-meta {
  font-size: 13px;
  color: var(--color-text-light);
  margin-right: 8px;
}

.page-body {
  padding: 12px 14px 12px 42px;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--color-bg);
  border-radius: var(--radius);
  flex-wrap: wrap;
  gap: 8px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.version-tag {
  background: var(--color-primary);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.version-desc {
  font-size: 13px;
  color: var(--color-text);
}

.version-author {
  font-size: 12px;
  color: var(--color-text-light);
}

.version-actions {
  display: flex;
  gap: 6px;
}

.add-version-row {
  margin-top: 10px;
}

.empty-sm {
  padding: 12px;
  color: var(--color-text-light);
  font-size: 13px;
}

.req-item {
  margin-bottom: 10px;
}

.req-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.req-title {
  font-weight: 500;
  font-size: 14px;
}

.req-desc {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 8px;
}

.req-meta {
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 8px;
}

.link-chip {
  display: inline-block;
  background: #edf2f7;
  padding: 1px 6px;
  border-radius: 8px;
  margin-right: 4px;
}

.req-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.review-item {
  margin-bottom: 10px;
  cursor: pointer;
  transition: transform 0.1s;
}

.review-item:hover {
  transform: translateX(4px);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.review-title {
  font-weight: 500;
  font-size: 15px;
}

.review-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 8px;
}

.review-participants {
  font-size: 12px;
}

.participant-chip {
  display: inline-block;
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-right: 4px;
}

.diff-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.diff-selectors {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.diff-arrow {
  font-size: 24px;
  color: var(--color-text-light);
  padding-bottom: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-light);
}
</style>
