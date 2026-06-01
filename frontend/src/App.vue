<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#409eff"><Document /></el-icon>
        <span>Knowledge Sync</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2937"
        text-color="#d1d5db"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/entries">
          <el-icon><Document /></el-icon>
          <span>知识条目</span>
        </el-menu-item>
        <el-menu-item index="/search">
          <el-icon><Search /></el-icon>
          <span>全文检索</span>
        </el-menu-item>
        <el-menu-item index="/conflicts">
          <el-icon><Warning /></el-icon>
          <span>同步冲突</span>
          <el-badge v-if="pendingConflicts > 0" :value="pendingConflicts" class="conflict-badge" />
        </el-menu-item>
        <el-menu-item index="/shares">
          <el-icon><Share /></el-icon>
          <span>分享协作</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><DataAnalysis /></el-icon>
          <span>统计看板</span>
        </el-menu-item>
        <el-menu-item index="/admin">
          <el-icon><Setting /></el-icon>
          <span>管理运营</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
            新建条目
          </el-button>
          <el-button :icon="Refresh" @click="loadStats">刷新</el-button>
        </div>
        <div class="header-right">
          <el-tag type="info" v-if="syncStatus === 'synced'">
            <el-icon><Check /></el-icon> 已同步
          </el-tag>
          <el-tag type="warning" v-else-if="syncStatus === 'syncing'">
            <el-icon><Loading /></el-icon> 同步中
          </el-tag>
          <el-tag type="danger" v-else>
            <el-icon><Close /></el-icon> 离线
          </el-tag>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="showCreateDialog" title="新建知识条目" width="800px" :close-on-click-modal="false">
    <el-form :model="newEntry" label-width="110px" :rules="createRules" ref="createFormRef">
      <el-form-item label="条目类型" prop="entry_type">
        <el-radio-group v-model="newEntry.entry_type" style="width: 100%">
          <el-radio-button value="note">
            <el-icon><Document /></el-icon> 笔记
          </el-radio-button>
          <el-radio-button value="web_clipping">
            <el-icon><Link /></el-icon> 网页剪藏
          </el-radio-button>
          <el-radio-button value="handwritten">
            <el-icon><Edit /></el-icon> 手写摘录
          </el-radio-button>
          <el-radio-button value="file">
            <el-icon><Paperclip /></el-icon> 文件附件
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-alert
        v-if="newEntry.entry_type === 'web_clipping'"
        title="网页剪藏模式"
        type="info"
        :closable="false"
        show-icon
      >
        请填写网页的来源标题和链接，便于后续追溯原始内容
      </el-alert>
      <el-alert
        v-if="newEntry.entry_type === 'handwritten'"
        title="手写摘录模式"
        type="success"
        :closable="false"
        show-icon
      >
        请填写摘录的书籍来源和页码位置，便于后续定位原文
      </el-alert>
      <el-alert
        v-if="newEntry.entry_type === 'file'"
        title="文件附件模式"
        type="warning"
        :closable="false"
        show-icon
      >
        支持 PDF、Word、图片等格式，文件将与知识条目关联存储
      </el-alert>

      <el-form-item label="标题" prop="title">
        <el-input v-model="newEntry.title" placeholder="请输入标题，便于检索和识别" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="newEntry.content"
          type="textarea"
          :rows="6"
          placeholder="请输入知识内容，支持 Markdown 格式"
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>

      <template v-if="newEntry.entry_type === 'web_clipping'">
        <el-divider content-position="left">网页来源信息</el-divider>
        <el-form-item label="来源标题">
          <el-input v-model="newEntry.source_title" placeholder="例如：Python 官方文档 - 装饰器" />
        </el-form-item>
        <el-form-item label="来源链接" prop="source_url">
          <el-input v-model="newEntry.source_url" placeholder="https://docs.python.org/..." />
        </el-form-item>
      </template>

      <template v-if="newEntry.entry_type === 'handwritten'">
        <el-divider content-position="left">手写摘录信息</el-divider>
        <el-form-item label="摘录来源">
          <el-input v-model="newEntry.source_title" placeholder="例如：《深度工作》卡尔·纽波特" />
        </el-form-item>
        <el-form-item label="页码位置">
          <el-input v-model="newEntry.handwritten_location" placeholder="例如：第12页第3段 / 第三章第二节" />
        </el-form-item>
      </template>

      <template v-if="newEntry.entry_type === 'file'">
        <el-divider content-position="left">文件附件</el-divider>
        <el-form-item label="上传文件">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="5"
            multiple
          >
            <el-button type="primary" :icon="Upload">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word、图片等格式，可多选</div>
            </template>
          </el-upload>
        </el-form-item>
      </template>

      <el-divider content-position="left">标签与关联</el-divider>
      <el-form-item label="标签">
        <el-select v-model="newEntry.tags" multiple filterable allow-create default-first-option placeholder="选择或创建标签">
          <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="关联条目">
        <el-select v-model="newEntry.related_to" multiple filterable placeholder="选择要关联的知识条目" style="width: 100%">
          <el-option v-for="entry in entryList" :key="entry.id" :label="entry.title || '无标题条目 #' + entry.id" :value="entry.id">
            <div class="option-item">
              <el-tag size="small" :type="getTypeTagType(entry.entry_type)" class="mr-2">{{ getTypeName(entry.entry_type) }}</el-tag>
              <span>{{ entry.title || '无标题' }}</span>
            </div>
          </el-option>
        </el-select>
        <div v-if="newEntry.related_to.length > 0" class="selected-relations">
          <el-tag
            v-for="relId in newEntry.related_to"
            :key="relId"
            size="small"
            closable
            @close="removeRelation(relId)"
            class="mr-1"
          >
            {{ getEntryTitle(relId) }}
          </el-tag>
        </div>
      </el-form-item>

      <el-divider content-position="left">隐私设置</el-divider>
      <el-form-item label="私密状态">
        <el-switch v-model="newEntry.is_private" active-text="私密" inactive-text="公开" />
        <span class="form-tip ml-2">敏感内容默认设为私密，公开后可被分享和协作</span>
      </el-form-item>
      <el-alert
        v-if="newEntry.is_private"
        type="warning"
        :closable="false"
        size="small"
        show-icon
      >
        当前为私密状态，仅您可见；如需分享请先设为公开
      </el-alert>
    </el-form>
    <template #footer>
      <el-button @click="showCreateDialog = false">取消</el-button>
      <el-button type="primary" @click="handleCreate">创建条目</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showCreatedSummary" title="条目创建成功 - 可追溯复查" width="700px">
    <div v-if="createdEntry" class="summary-content">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="条目ID">{{ createdEntry.id }}</el-descriptions-item>
        <el-descriptions-item label="条目类型">
          <el-tag :type="getTypeTagType(createdEntry.entry_type)" size="small">{{ getTypeName(createdEntry.entry_type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ createdEntry.title }}</el-descriptions-item>
        <el-descriptions-item label="版本号">v{{ createdEntry.version }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(createdEntry.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="私密状态">
          <el-tag :type="createdEntry.is_private ? 'warning' : 'success'">{{ createdEntry.is_private ? '私密' : '公开' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          <el-tag v-for="t in (createdEntry.tags || [])" :key="t.id" size="small" class="mr-1">{{ t.name }}</el-tag>
          <span v-if="!createdEntry.tags?.length">无</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">来源信息</el-divider>
      <div class="summary-source">
        <template v-if="createdEntry.source_url || createdEntry.source_title">
          <div class="summary-source-row">
            <span class="summary-label">来源标题：</span>
            <span>{{ createdEntry.source_title || '无' }}</span>
          </div>
          <div class="summary-source-row">
            <span class="summary-label">来源链接：</span>
            <a v-if="createdEntry.source_url" :href="createdEntry.source_url" target="_blank" class="summary-link">{{ createdEntry.source_url }}</a>
            <span v-else>无</span>
          </div>
        </template>
        <template v-else>
          <el-text type="info">未填写来源信息</el-text>
        </template>
      </div>

      <el-divider content-position="left">关联条目</el-divider>
      <div class="summary-relations">
        <template v-if="createdEntry.relation_count > 0 && createdEntry.related_entries?.length > 0">
          <div v-for="rel in createdEntry.related_entries" :key="rel.id" class="summary-relation-item">
            <el-icon><Link /></el-icon>
            <el-tag size="small" :type="getTypeTagType(rel.entry_type)">{{ getTypeName(rel.entry_type) }}</el-tag>
            <span>{{ rel.title || '无标题' }}</span>
            <el-tag v-if="rel.is_private" type="warning" size="small">私密</el-tag>
          </div>
        </template>
        <template v-else>
          <el-text type="info">未关联其他条目</el-text>
        </template>
      </div>

      <el-divider content-position="left">附件</el-divider>
      <div class="summary-attachments">
        <template v-if="createdEntry.attachments?.length > 0">
          <div v-for="att in createdEntry.attachments" :key="att.id" class="summary-att-item">
            <el-icon><Paperclip /></el-icon>
            <span>{{ att.filename }}</span>
            <el-text type="info" size="small">{{ formatSize(att.file_size) }}</el-text>
          </div>
        </template>
        <template v-else>
          <el-text type="info">暂无附件</el-text>
        </template>
      </div>

      <el-divider />
      <div class="summary-tips">
        <el-icon color="#67c23a"><CircleCheck /></el-icon>
        <span>该条目已落库（v{{ createdEntry.version }}），可通过版本历史追溯所有修改记录</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="showCreatedSummary = false">关闭</el-button>
      <el-button type="primary" @click="viewCreatedEntry">查看详情</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Refresh, Check, Loading, Close, Document, Search, Warning, Share,
  DataAnalysis, Setting, Upload, Link, Edit, Paperclip, CircleCheck
} from '@element-plus/icons-vue'
import { listTags, listEntries, createEntry, getStats, healthCheck } from '@/api'

const route = useRoute()
const router = useRouter()
const showCreateDialog = ref(false)
const showCreatedSummary = ref(false)
const syncStatus = ref('offline')
const pendingConflicts = ref(0)
const allTags = ref([])
const entryList = ref([])
const fileList = ref([])
const createFormRef = ref(null)
const createdEntry = ref(null)

const activeMenu = computed(() => route.path)

const newEntry = ref({
  entry_type: 'note',
  title: '',
  content: '',
  tags: [],
  source_url: '',
  source_title: '',
  handwritten_location: '',
  related_to: [],
  is_private: true
})

const createRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  source_url: [
    {
      validator: (rule, value, callback) => {
        if (newEntry.value.entry_type === 'web_clipping' && !value) {
          callback(new Error('网页剪藏请填写来源链接'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

function getTypeName(type) {
  const map = { note: '笔记', web_clipping: '网页剪藏', handwritten: '手写摘录', file: '文件' }
  return map[type] || type
}

function getTypeTagType(type) {
  const map = { note: '', web_clipping: 'primary', handwritten: 'success', file: 'warning' }
  return map[type] || ''
}

function getEntryTitle(id) {
  const entry = entryList.value.find(e => e.id === id)
  return entry ? (entry.title || '无标题') : `条目 #${id}`
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function formatSize(bytes) {
  if (!bytes) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function removeRelation(relId) {
  newEntry.value.related_to = newEntry.value.related_to.filter(id => id !== relId)
}

async function checkHealth() {
  try {
    await healthCheck()
    syncStatus.value = 'synced'
  } catch {
    syncStatus.value = 'offline'
  }
}

async function loadStats() {
  try {
    const stats = await getStats()
    pendingConflicts.value = stats.pending_conflicts
  } catch (e) {
    console.error('Load stats failed:', e)
  }
}

async function loadTags() {
  try {
    allTags.value = await listTags()
  } catch (e) {
    console.error('Load tags failed:', e)
  }
}

async function loadEntries() {
  try {
    const result = await listEntries({ limit: 100 })
    entryList.value = result.results
  } catch (e) {
    console.error('Load entries failed:', e)
  }
}

function handleFileChange(file) {
  console.log('File selected:', file.name)
}

async function handleCreate() {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
    const entry = await createEntry(newEntry.value)
    createdEntry.value = entry
    showCreateDialog.value = false
    showCreatedSummary.value = true
    fileList.value = []
    newEntry.value = {
      entry_type: 'note',
      title: '',
      content: '',
      tags: [],
      source_url: '',
      source_title: '',
      handwritten_location: '',
      related_to: [],
      is_private: true
    }
    loadEntries()
    window.dispatchEvent(new CustomEvent('entry-created'))
  } catch (e) {
    if (e !== false) {
      ElMessage.error('创建失败: ' + (e.response?.data?.detail || e.message))
    }
  }
}

function viewCreatedEntry() {
  showCreatedSummary.value = false
  if (createdEntry.value) {
    router.push(`/entries/${createdEntry.value.id}`)
  }
}

onMounted(() => {
  checkHealth()
  loadStats()
  loadTags()
  loadEntries()
  setInterval(checkHealth, 30000)
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}
.sidebar {
  background-color: #1f2937;
  color: white;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  border-bottom: 1px solid #374151;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 20px;
}
.header-left {
  display: flex;
  gap: 10px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.main-content {
  background-color: #f9fafb;
  padding: 20px;
  overflow-y: auto;
}
.conflict-badge {
  margin-left: 10px;
}
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.selected-relations {
  margin-top: 8px;
}
.summary-content {
  padding: 10px 0;
}
.summary-source {
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}
.summary-source-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 4px 0;
  font-size: 13px;
}
.summary-label {
  color: #1e40af;
  font-weight: 500;
  min-width: 70px;
}
.summary-link {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}
.summary-link:hover {
  text-decoration: underline;
}
.summary-relations {
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border-left: 4px solid #22c55e;
}
.summary-relation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
.summary-attachments {
  padding: 8px 12px;
  background: #fefce8;
  border-radius: 6px;
  border-left: 4px solid #eab308;
}
.summary-att-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
.summary-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #67c23a;
  font-size: 14px;
}
.ml-2 {
  margin-left: 8px;
}
.mr-1 {
  margin-right: 4px;
}
.mr-2 {
  margin-right: 8px;
}
</style>
