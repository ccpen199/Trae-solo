<template>
  <div class="project-list-page">
    <div class="sidebar">
      <h3 class="sidebar-title">📁 模块列表</h3>
      <div v-if="loadingModules" class="loading">加载中...</div>
      <ul v-else class="module-list">
        <li
          v-for="m in modules"
          :key="m.id"
          class="module-item"
          :class="{ active: selectedModule === m.id }"
          @click="selectedModule = selectedModule === m.id ? null : m.id"
        >
          <span class="module-name">{{ m.name }}</span>
          <span class="module-count">{{ getModuleProjectCount(m.id) }}</span>
        </li>
      </ul>
      <div class="add-module-form">
        <input
          v-model="newModuleName"
          placeholder="新模块名称"
          @keyup.enter="handleAddModule"
        />
        <button class="btn-primary btn-sm" @click="handleAddModule" :disabled="!newModuleName.trim()">添加</button>
      </div>
    </div>

    <div class="main-area">
      <div class="main-header">
        <h2>项目空间</h2>
        <div class="header-actions">
          <input v-model="searchText" placeholder="🔍 搜索项目..." class="search-input" />
          <button class="btn-primary" @click="startCreateWizard">+ 新建项目</button>
        </div>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
      <div v-if="loading" class="loading">加载中...</div>

      <template v-else>
        <div v-if="activeProjects.length" class="project-grid">
          <div
            v-for="p in activeProjects"
            :key="p.id"
            class="project-card card"
            @click="$router.push(`/project/${p.id}`)"
          >
            <div class="card-header">
              <span class="project-name">{{ p.name }}</span>
              <span class="badge" :class="`badge-${p.status}`">{{ statusLabel(p.status) }}</span>
            </div>
            <p class="project-desc">{{ p.description || '暂无描述' }}</p>
            <div class="card-meta">
              <span v-if="getModuleName(p.module_id)">📦 {{ getModuleName(p.module_id) }}</span>
              <span>📄 {{ p.pages_count ?? 0 }} 页</span>
              <span>🔄 {{ p.versions_count ?? 0 }} 版</span>
              <span>📋 {{ p.requirements_count ?? 0 }} 需求</span>
            </div>
            <div v-if="p.review_count" class="card-footer">
              <span>💬 {{ p.review_count }} 评审</span>
              <span v-if="p.last_review_at">🕐 {{ formatTime(p.last_review_at) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📂</div>
          <div class="empty-text">暂无项目</div>
          <div class="empty-hint">点击"新建项目"开始创建完整的设计稿评审项目</div>
          <button class="btn-primary mt-16" @click="startCreateWizard">+ 立即创建</button>
        </div>

        <template v-if="archivedProjects.length">
          <h3 class="section-title">已归档项目</h3>
          <div class="project-grid archived-grid">
            <div
              v-for="p in archivedProjects"
              :key="p.id"
              class="project-card card archived"
            >
              <div class="card-header">
                <span class="project-name">{{ p.name }}</span>
                <span class="badge badge-archived">已归档</span>
              </div>
              <p class="project-desc">{{ p.description || '暂无描述' }}</p>
              <div class="card-meta">
                <span v-if="getModuleName(p.module_id)">📦 {{ getModuleName(p.module_id) }}</span>
              </div>
              <div class="archived-actions">
                <button class="btn-secondary btn-sm" @click="handleUnarchive(p)">取消归档</button>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <div v-if="showCreateWizard" class="modal-overlay" @click.self="cancelWizard">
      <div class="modal wizard-modal">
        <div class="wizard-header">
          <h3>📝 新建项目 - 第 {{ currentStep }}/{{ totalSteps }} 步</h3>
          <button class="close-btn" @click="cancelWizard">✕</button>
        </div>

        <div class="wizard-steps">
          <div
            v-for="(s, idx) in steps"
            :key="idx"
            class="wizard-step"
            :class="{ active: currentStep === idx + 1, done: currentStep > idx + 1 }"
          >
            <span class="step-num">{{ idx + 1 }}</span>
            <span class="step-label">{{ s.label }}</span>
          </div>
        </div>

        <div class="wizard-progress">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div v-if="wizardError" class="error-msg">{{ wizardError }}</div>

        <div v-show="currentStep === 1" class="wizard-content">
          <h4 class="step-title">📋 基本信息</h4>
          <p class="step-desc">填写项目的基本信息，以便后续按模块归档管理</p>

          <div class="form-group">
            <label>项目名称 <span class="required">*</span></label>
            <input v-model="wizardForm.name" placeholder="例如：首页改版、订单流程优化" />
          </div>
          <div class="form-group">
            <label>项目描述</label>
            <textarea v-model="wizardForm.description" rows="2" placeholder="简要描述项目目标和范围"></textarea>
          </div>
          <div class="form-group">
            <label>所属模块 <span class="required">*</span></label>
            <select v-model="wizardForm.module_id">
              <option :value="null">-- 请选择模块 --</option>
              <option v-for="m in modules" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
        </div>

        <div v-show="currentStep === 2" class="wizard-content">
          <h4 class="step-title">📄 页面与版本</h4>
          <p class="step-desc">添加设计稿页面并录入首个版本，建立可追踪的版本历史</p>

          <div v-if="wizardForm.pages.length" class="pages-list">
            <div v-for="(page, pIdx) in wizardForm.pages" :key="pIdx" class="page-item card">
              <div class="page-header">
                <span class="page-name">📄 {{ page.name }}</span>
                <button class="btn-danger btn-sm" @click="removePage(pIdx)">删除</button>
              </div>
              <div class="page-versions">
                <div class="version-badge">
                  v{{ page.version_number }} · {{ changeTypeLabel(page.change_type) }}
                </div>
                <span class="version-desc">{{ page.version_description || '初始版本' }}</span>
              </div>
            </div>
          </div>

          <div class="add-page-form card">
            <h5>+ 添加新页面</h5>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>页面名称 <span class="required">*</span></label>
                <input v-model="newPage.name" placeholder="例如：首页、商品详情页" />
              </div>
              <div class="form-group sm">
                <label>版本号 <span class="required">*</span></label>
                <input v-model.number="newPage.version_number" type="number" min="1" placeholder="1" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>版本说明</label>
                <input v-model="newPage.version_description" placeholder="例如：初始设计稿" />
              </div>
              <div class="form-group sm">
                <label>变更类型</label>
                <select v-model="newPage.change_type">
                  <option value="create">新增</option>
                  <option value="update">修改</option>
                  <option value="delete">删除</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>创建人</label>
              <input v-model="newPage.created_by" placeholder="例如：设计师A" />
            </div>
            <button class="btn-primary" @click="addPage" :disabled="!newPage.name.trim()">
              + 添加此页面
            </button>
          </div>
        </div>

        <div v-show="currentStep === 3" class="wizard-content">
          <h4 class="step-title">📋 关联需求</h4>
          <p class="step-desc">录入项目需求并关联到对应页面，确保设计稿覆盖所有需求</p>

          <div v-if="wizardForm.requirements.length" class="req-list">
            <div v-for="(req, rIdx) in wizardForm.requirements" :key="rIdx" class="req-item card">
              <div class="req-header">
                <span class="req-name">📋 {{ req.title }}</span>
                <button class="btn-danger btn-sm" @click="removeRequirement(rIdx)">删除</button>
              </div>
              <p class="req-desc">{{ req.description || '暂无描述' }}</p>
              <div class="req-pages">
                <span class="req-label">关联页面：</span>
                <span v-if="req.linked_pages && req.linked_pages.length" class="linked-pages">
                  <span v-for="pid in req.linked_pages" :key="pid" class="page-tag">
                    {{ getPageNameById(pid) }}
                  </span>
                </span>
                <span v-else class="no-link">未关联</span>
              </div>
            </div>
          </div>

          <div class="add-req-form card">
            <h5>+ 添加新需求</h5>
            <div class="form-group">
              <label>需求标题 <span class="required">*</span></label>
              <input v-model="newReq.title" placeholder="例如：支持用户登录、展示商品列表" />
            </div>
            <div class="form-group">
              <label>需求描述</label>
              <textarea v-model="newReq.description" rows="2" placeholder="详细描述需求内容"></textarea>
            </div>
            <div class="form-group">
              <label>关联页面（可多选）</label>
              <div class="checkbox-group">
                <label v-for="page in wizardForm.pages" :key="page.temp_id" class="checkbox-item">
                  <input type="checkbox" :value="page.temp_id" v-model="newReq.linked_pages" />
                  <span>{{ page.name }}</span>
                </label>
              </div>
              <p v-if="!wizardForm.pages.length" class="hint-text">
                💡 请先在上一步添加页面，才能关联需求
              </p>
            </div>
            <button class="btn-primary" @click="addRequirement" :disabled="!newReq.title.trim()">
              + 添加此需求
            </button>
          </div>
        </div>

        <div v-show="currentStep === 4" class="wizard-content">
          <h4 class="step-title">👥 评审安排</h4>
          <p class="step-desc">设置首次评审时间和参与人，启动设计稿评审流程</p>

          <div class="form-group">
            <label>评审标题</label>
            <input v-model="wizardForm.review_title" placeholder="例如：第一轮设计评审" />
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>评审时间</label>
              <input v-model="wizardForm.review_date" type="date" />
            </div>
            <div class="form-group sm">
              <label>开始时间</label>
              <input v-model="wizardForm.review_time" type="time" value="10:00" />
            </div>
          </div>
          <div class="form-group">
            <label>关联版本（可选）</label>
            <select v-model="wizardForm.review_version_id">
              <option :value="null">-- 不指定版本（后续添加）--</option>
              <optgroup v-for="page in wizardForm.pages" :key="page.temp_id" :label="page.name">
                <option :value="page.temp_id">{{ page.name }} - v{{ page.version_number }}</option>
              </optgroup>
            </select>
          </div>

          <div class="form-group">
            <label>参与人</label>
            <div v-if="wizardForm.participants.length" class="participants-chips">
              <span v-for="(p, pIdx) in wizardForm.participants" :key="pIdx" class="participant-chip">
                {{ p.user_name }} ({{ roleLabel(p.role) }})
                <button class="chip-remove" @click="removeParticipant(pIdx)">✕</button>
              </span>
            </div>
            <div class="add-participant-row">
              <input v-model="newParticipant.user_name" placeholder="姓名" class="sm-input" />
              <select v-model="newParticipant.role" class="sm-select">
                <option value="designer">设计师</option>
                <option value="pm">产品经理</option>
                <option value="dev">研发</option>
                <option value="tester">测试</option>
                <option value="business">业务</option>
                <option value="reviewer">评审人</option>
              </select>
              <button class="btn-primary btn-sm" @click="addParticipant" :disabled="!newParticipant.user_name.trim()">
                + 添加
              </button>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 5" class="wizard-content">
          <h4 class="step-title">✅ 确认信息</h4>
          <p class="step-desc">请确认以下信息，确认无误后点击"创建项目"</p>

          <div class="summary-section">
            <h5>📋 基本信息</h5>
            <div class="summary-row"><span class="label">项目名称：</span><span class="value">{{ wizardForm.name }}</span></div>
            <div class="summary-row"><span class="label">项目描述：</span><span class="value">{{ wizardForm.description || '暂无' }}</span></div>
            <div class="summary-row"><span class="label">所属模块：</span><span class="value">{{ getModuleName(wizardForm.module_id) }}</span></div>
          </div>

          <div class="summary-section">
            <h5>📄 页面与版本 ({{ wizardForm.pages.length }})</h5>
            <div v-if="wizardForm.pages.length" class="summary-items">
              <div v-for="page in wizardForm.pages" :key="page.temp_id" class="summary-item">
                <span class="item-title">📄 {{ page.name }}</span>
                <span class="item-meta">v{{ page.version_number }} · {{ changeTypeLabel(page.change_type) }}</span>
              </div>
            </div>
            <p v-else class="empty-sm">未添加页面（可在项目详情中后续添加）</p>
          </div>

          <div class="summary-section">
            <h5>📋 关联需求 ({{ wizardForm.requirements.length }})</h5>
            <div v-if="wizardForm.requirements.length" class="summary-items">
              <div v-for="req in wizardForm.requirements" :key="req.temp_id" class="summary-item">
                <span class="item-title">📋 {{ req.title }}</span>
                <span class="item-meta">{{ req.linked_pages?.length || 0 }} 个关联页面</span>
              </div>
            </div>
            <p v-else class="empty-sm">未添加需求（可在项目详情中后续添加）</p>
          </div>

          <div class="summary-section">
            <h5>👥 评审安排</h5>
            <div v-if="wizardForm.review_title || wizardForm.participants.length">
              <div class="summary-row"><span class="label">评审标题：</span><span class="value">{{ wizardForm.review_title || '未设置' }}</span></div>
              <div class="summary-row"><span class="label">评审时间：</span><span class="value">{{ formatReviewDateTime() || '未设置' }}</span></div>
              <div class="summary-row"><span class="label">参与人：</span><span class="value">{{ wizardForm.participants.length }} 人</span></div>
            </div>
            <p v-else class="empty-sm">未安排评审（可在项目详情中后续创建）</p>
          </div>
        </div>

        <div class="wizard-actions">
          <button v-if="currentStep > 1" class="btn-secondary" @click="prevStep">← 上一步</button>
          <button v-if="currentStep < totalSteps" class="btn-primary" @click="nextStep" :disabled="!canProceed()">
            下一步 →
          </button>
          <button v-if="currentStep === totalSteps" class="btn-primary btn-lg" @click="submitWizard" :disabled="creating">
            {{ creating ? '创建中...' : '🚀 创建项目' }}
          </button>
          <button class="btn-secondary" @click="cancelWizard">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchProjects, createProject, archiveProject, updateProject, fetchModules, createModule } from '../api'

const router = useRouter()

const projects = ref([])
const modules = ref([])
const loading = ref(true)
const loadingModules = ref(true)
const error = ref('')
const searchText = ref('')
const selectedModule = ref(null)
const showCreateModal = ref(false)
const newModuleName = ref('')
const form = ref({ name: '', description: '', module_id: null })

const showCreateWizard = ref(false)
const currentStep = ref(1)
const totalSteps = 5
const creating = ref(false)
const wizardError = ref('')

const steps = [
  { label: '基本信息' },
  { label: '页面版本' },
  { label: '关联需求' },
  { label: '评审安排' },
  { label: '确认' }
]

const progressPercent = computed(() => ((currentStep.value - 1) / (totalSteps - 1)) * 100)

let tempIdCounter = 1

const wizardForm = reactive({
  name: '',
  description: '',
  module_id: null,
  pages: [],
  requirements: [],
  participants: [],
  review_title: '',
  review_date: '',
  review_time: '10:00',
  review_version_id: null
})

const newPage = reactive({
  name: '',
  version_number: 1,
  version_description: '',
  change_type: 'create',
  created_by: ''
})

const newReq = reactive({
  title: '',
  description: '',
  linked_pages: []
})

const newParticipant = reactive({
  user_name: '',
  role: 'reviewer'
})

const activeProjects = computed(() => {
  let list = projects.value.filter(p => p.status !== 'archived')
  if (selectedModule.value) {
    list = list.filter(p => p.module_id === selectedModule.value)
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

const archivedProjects = computed(() => {
  return projects.value.filter(p => p.status === 'archived')
})

function statusLabel(status) {
  const map = { active: '进行中', archived: '已归档', pending: '待启动', in_review: '评审中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

function getModuleName(moduleId) {
  const m = modules.value.find(mod => mod.id === moduleId)
  return m ? m.name : ''
}

function getModuleProjectCount(moduleId) {
  return projects.value.filter(p => p.module_id === moduleId && p.status !== 'archived').length
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN')
}

function changeTypeLabel(t) {
  const map = { create: '新增', update: '修改', delete: '删除' }
  return map[t] || t
}

function roleLabel(role) {
  const map = { designer: '设计师', pm: '产品经理', dev: '研发', tester: '测试', business: '业务', reviewer: '评审人' }
  return map[role] || role
}

function getPageNameById(tempId) {
  const page = wizardForm.pages.find(p => p.temp_id === tempId)
  return page ? page.name : ''
}

function formatReviewDateTime() {
  if (!wizardForm.review_date) return ''
  return `${wizardForm.review_date} ${wizardForm.review_time || ''}`
}

function startCreateWizard() {
  showCreateWizard.value = true
  currentStep.value = 1
  creating.value = false
  wizardError.value = ''
  resetWizardForm()
}

function resetWizardForm() {
  tempIdCounter = 1
  wizardForm.name = ''
  wizardForm.description = ''
  wizardForm.module_id = null
  wizardForm.pages = []
  wizardForm.requirements = []
  wizardForm.participants = []
  wizardForm.review_title = ''
  wizardForm.review_date = ''
  wizardForm.review_time = '10:00'
  wizardForm.review_version_id = null
  newPage.name = ''
  newPage.version_number = 1
  newPage.version_description = ''
  newPage.change_type = 'create'
  newPage.created_by = ''
  newReq.title = ''
  newReq.description = ''
  newReq.linked_pages = []
  newParticipant.user_name = ''
  newParticipant.role = 'reviewer'
}

function cancelWizard() {
  if (confirm('确定要取消创建吗？已填写的信息将丢失。')) {
    showCreateWizard.value = false
    resetWizardForm()
  }
}

function canProceed() {
  if (currentStep.value === 1) {
    return wizardForm.name.trim() && wizardForm.module_id
  }
  return true
}

function nextStep() {
  wizardError.value = ''
  
  if (currentStep.value === 1) {
    if (!wizardForm.name.trim()) {
      wizardError.value = '请输入项目名称'
      return
    }
    if (!wizardForm.module_id) {
      wizardError.value = '请选择所属模块'
      return
    }
  }
  
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    wizardError.value = ''
  }
}

function addPage() {
  if (!newPage.name.trim()) return
  wizardForm.pages.push({
    temp_id: tempIdCounter++,
    name: newPage.name.trim(),
    version_number: newPage.version_number || 1,
    version_description: newPage.version_description.trim(),
    change_type: newPage.change_type,
    created_by: newPage.created_by.trim()
  })
  newPage.name = ''
  newPage.version_number = 1
  newPage.version_description = ''
  newPage.change_type = 'create'
  newPage.created_by = ''
}

function removePage(idx) {
  if (!confirm('确定删除此页面？')) return
  wizardForm.pages.splice(idx, 1)
  for (const req of wizardForm.requirements) {
    req.linked_pages = req.linked_pages.filter(pid => pid !== idx)
  }
}

function addRequirement() {
  if (!newReq.title.trim()) return
  wizardForm.requirements.push({
    temp_id: tempIdCounter++,
    title: newReq.title.trim(),
    description: newReq.description.trim(),
    linked_pages: [...newReq.linked_pages]
  })
  newReq.title = ''
  newReq.description = ''
  newReq.linked_pages = []
}

function removeRequirement(idx) {
  if (!confirm('确定删除此需求？')) return
  wizardForm.requirements.splice(idx, 1)
}

function addParticipant() {
  if (!newParticipant.user_name.trim()) return
  wizardForm.participants.push({
    user_name: newParticipant.user_name.trim(),
    role: newParticipant.role
  })
  newParticipant.user_name = ''
  newParticipant.role = 'reviewer'
}

function removeParticipant(idx) {
  wizardForm.participants.splice(idx, 1)
}

async function submitWizard() {
  creating.value = true
  wizardError.value = ''
  
  try {
    const projectData = {
      name: wizardForm.name.trim(),
      description: wizardForm.description.trim(),
      module_id: wizardForm.module_id,
      pages: wizardForm.pages,
      requirements: wizardForm.requirements,
      participants: wizardForm.participants
    }
    
    if (wizardForm.review_title || wizardForm.review_date || wizardForm.participants.length) {
      projectData.review = {
        title: wizardForm.review_title.trim() || `${wizardForm.name.trim()} - 第一轮评审`,
        scheduled_at: wizardForm.review_date ? `${wizardForm.review_date}T${wizardForm.review_time || '10:00'}:00` : null,
        version_id: wizardForm.review_version_id,
        participants: wizardForm.participants
      }
    }
    
    const result = await createProject(projectData)
    showCreateWizard.value = false
    resetWizardForm()
    await loadData()
    
    if (result && result.data && result.data.id) {
      router.push(`/project/${result.data.id}`)
    }
  } catch (e) {
    wizardError.value = '创建失败: ' + e.message
  } finally {
    creating.value = false
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    projects.value = await fetchProjects()
  } catch (e) {
    error.value = '加载项目失败: ' + e.message
  } finally {
    loading.value = false
  }
}

async function loadModules() {
  loadingModules.value = true
  try {
    modules.value = await fetchModules()
  } catch (e) {
    console.error('加载模块失败:', e)
  } finally {
    loadingModules.value = false
  }
}

async function handleCreate() {
  // 兼容旧方法，实际使用向导
  startCreateWizard()
}

async function handleAddModule() {
  if (!newModuleName.value.trim()) return
  try {
    await createModule({ name: newModuleName.value.trim() })
    newModuleName.value = ''
    await loadModules()
  } catch (e) {
    alert('添加模块失败: ' + e.message)
  }
}

async function handleUnarchive(project) {
  try {
    await updateProject(project.id, { status: 'active' })
    await loadData()
  } catch (e) {
    alert('取消归档失败: ' + e.message)
  }
}

onMounted(() => {
  loadData()
  loadModules()
})
</script>

<style scoped>
.project-list-page {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  min-height: calc(100vh - 104px);
}

.sidebar {
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  height: fit-content;
  position: sticky;
  top: 80px;
}

.sidebar-title {
  font-size: 15px;
  color: var(--color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.module-list {
  list-style: none;
  margin-bottom: 16px;
}

.module-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.module-item:hover {
  background: var(--color-bg);
}

.module-item.active {
  background: #ebf4ff;
  color: var(--color-primary);
  font-weight: 600;
}

.module-count {
  background: var(--color-border);
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 12px;
  color: var(--color-text-light);
}

.add-module-form {
  display: flex;
  gap: 6px;
}

.add-module-form input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
}

.main-area {
  min-width: 0;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.main-header h2 {
  color: var(--color-primary);
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 220px;
  padding: 8px 12px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.project-card.archived {
  opacity: 0.7;
  cursor: default;
}

.project-card.archived:hover {
  transform: none;
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.project-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-primary);
}

.project-desc {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-light);
}

.card-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-light);
}

.archived-actions {
  margin-top: 12px;
  text-align: right;
}

.section-title {
  font-size: 16px;
  color: var(--color-text-light);
  margin: 24px 0 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-light);
  font-size: 15px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
}

.mt-16 {
  margin-top: 16px;
}

.wizard-modal {
  max-width: 720px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.wizard-header h3 {
  margin: 0;
  color: var(--color-primary);
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-light);
  padding: 4px 8px;
}

.close-btn:hover {
  color: var(--color-danger);
}

.wizard-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-border);
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.wizard-step.active .step-num {
  background: var(--color-primary);
  color: #fff;
}

.wizard-step.done .step-num {
  background: var(--color-success);
  color: #fff;
}

.step-label {
  font-size: 12px;
  color: var(--color-text-light);
  transition: color 0.2s;
}

.wizard-step.active .step-label {
  color: var(--color-primary);
  font-weight: 500;
}

.wizard-progress {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  margin-bottom: 24px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.wizard-content {
  margin-bottom: 24px;
}

.step-title {
  font-size: 16px;
  color: var(--color-primary);
  margin: 0 0 4px 0;
}

.step-desc {
  font-size: 13px;
  color: var(--color-text-light);
  margin: 0 0 20px 0;
}

.required {
  color: var(--color-danger);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.form-row .sm {
  width: 120px;
}

.flex-1 {
  flex: 1;
}

.pages-list,
.req-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.page-item,
.req-item {
  padding: 12px 14px;
}

.page-header,
.req-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.page-name,
.req-name {
  font-weight: 500;
  color: var(--color-text);
}

.page-versions {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}

.version-badge {
  background: #ebf4ff;
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.version-desc {
  color: var(--color-text-light);
}

.req-desc {
  font-size: 13px;
  color: var(--color-text-light);
  margin: 4px 0 8px 0;
}

.req-pages {
  font-size: 12px;
  color: var(--color-text-light);
}

.req-label {
  margin-right: 6px;
}

.linked-pages {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
}

.page-tag {
  background: #d1fae5;
  color: #065f46;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.no-link {
  color: var(--color-warning);
}

.add-page-form,
.add-req-form {
  padding: 14px 16px;
  background: var(--color-bg);
}

.add-page-form h5,
.add-req-form h5 {
  margin: 0 0 12px 0;
  color: var(--color-primary);
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.hint-text {
  font-size: 12px;
  color: var(--color-warning);
  margin-top: 8px;
}

.participants-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.participant-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #edf2f7;
  padding: 3px 8px 3px 12px;
  border-radius: 14px;
  font-size: 12px;
}

.chip-remove {
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0 4px;
  font-size: 11px;
}

.chip-remove:hover {
  color: var(--color-danger);
}

.add-participant-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-participant-row .sm-input {
  flex: 1;
}

.add-participant-row .sm-select {
  width: 100px;
}

.summary-section {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--color-bg);
  border-radius: var(--radius);
}

.summary-section h5 {
  margin: 0 0 10px 0;
  color: var(--color-primary);
  font-size: 14px;
}

.summary-row {
  display: flex;
  padding: 4px 0;
  font-size: 13px;
}

.summary-row .label {
  color: var(--color-text-light);
  width: 80px;
  flex-shrink: 0;
}

.summary-row .value {
  color: var(--color-text);
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.item-title {
  color: var(--color-text);
}

.item-meta {
  color: var(--color-text-light);
  font-size: 12px;
}

.empty-sm {
  padding: 12px;
  text-align: center;
  color: var(--color-text-light);
  font-size: 12px;
  background: #fff;
  border-radius: 4px;
}

.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.btn-lg {
  padding: 10px 24px;
  font-size: 15px;
}

@media (max-width: 768px) {
  .project-list-page {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-row .sm {
    width: 100%;
  }
}
</style>
