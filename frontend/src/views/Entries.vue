<template>
  <div class="entries-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filter">
        <el-form-item label="类型">
          <el-select v-model="filter.entry_type" clearable placeholder="全部">
            <el-option label="笔记" value="note" />
            <el-option label="网页剪藏" value="web_clipping" />
            <el-option label="手写摘录" value="handwritten" />
            <el-option label="文件附件" value="file" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="filter.tag" clearable placeholder="全部">
            <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadEntries">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <div class="list-header">
        <h3>知识条目 ({{ total }})</h3>
      </div>
      <el-table :data="entries" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <div class="entry-title">
              <el-icon><Document /></el-icon>
              <span @click="viewDetail(row.id)" class="clickable">{{ row.title || '无标题' }}</span>
              <el-tag v-if="row.is_private" type="warning" size="small" class="ml-2">私密</el-tag>
              <el-tag v-else type="success" size="small" class="ml-2">公开</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.entry_type)" size="small">{{ getTypeName(row.entry_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="120">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags.slice(0, 2)" :key="tag.id" :color="tag.color" size="small" class="mr-1">{{ tag.name }}</el-tag>
            <span v-if="row.tags.length > 2" class="more-tags">+{{ row.tags.length - 2 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" min-width="180">
          <template #default="{ row }">
            <div v-if="row.source_url || row.source_title" class="source-info">
              <el-icon size="12"><Link /></el-icon>
              <div class="source-content">
                <div class="source-title" :title="row.source_title">{{ row.source_title || '无标题来源' }}</div>
                <a v-if="row.source_url" :href="row.source_url" target="_blank" class="source-url" @click.stop>
                  {{ row.source_url.substring(0, 35) }}{{ row.source_url.length > 35 ? '...' : '' }}
                </a>
              </div>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="附件" width="100" align="center">
          <template #default="{ row }">
            <el-popover
              placement="bottom"
              :width="300"
              trigger="click"
              v-if="row.attachments?.length > 0"
            >
              <template #reference>
                <el-badge :value="row.attachments?.length || 0" :max="99" class="clickable-badge">
                  <el-icon><Paperclip /></el-icon>
                </el-badge>
              </template>
              <div class="attachment-list">
                <h4>附件列表</h4>
                <div v-for="att in row.attachments" :key="att.id" class="attachment-item">
                  <el-icon><Paperclip /></el-icon>
                  <div class="attachment-info">
                    <div class="attachment-name">{{ att.filename }}</div>
                    <div class="attachment-meta">{{ formatSize(att.file_size) }} · {{ formatDate(att.created_at) }}</div>
                  </div>
                  <el-button size="small" type="primary" link>下载</el-button>
                </div>
              </div>
            </el-popover>
            <el-badge v-else :value="0" :max="99">
              <el-icon><Paperclip /></el-icon>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="关联" width="120" align="center">
          <template #default="{ row }">
            <el-popover
              placement="bottom"
              :width="350"
              trigger="click"
              v-if="row.relation_count > 0"
            >
              <template #reference>
                <el-badge :value="row.relation_count || 0" :max="99" type="success" class="clickable-badge">
                  <el-icon><Connection /></el-icon>
                </el-badge>
              </template>
              <div class="relation-list">
                <h4>关联节点路径</h4>
                <div v-for="rel in row.related_entries || []" :key="rel.id" class="relation-item">
                  <el-icon><Link /></el-icon>
                  <div class="relation-arrow">→</div>
                  <div class="relation-info" @click="viewDetail(rel.id)">
                    <el-tag size="small" :type="getTypeTagType(rel.entry_type)" class="mr-1">
                      {{ getTypeName(rel.entry_type) }}
                    </el-tag>
                    <span class="relation-title">{{ rel.title || '无标题' }}</span>
                  </div>
                </div>
                <el-divider v-if="row.related_entries?.length > 0" />
                <div class="relation-path">
                  <span class="path-label">关联路径：</span>
                  <span class="path-content">
                    <span class="path-node">本条</span>
                    <span class="path-arrow"> ↔ </span>
                    <span class="path-node" v-for="(rel, idx) in (row.related_entries || []).slice(0, 3)" :key="rel.id">
                      {{ rel.title || '无标题' }}
                      <span v-if="idx < (row.related_entries || []).slice(0, 3).length - 1" class="path-arrow"> ↔ </span>
                    </span>
                    <span v-if="(row.related_entries || []).length > 3" class="path-more">
                      等 {{ row.relation_count }} 个节点
                    </span>
                  </span>
                </div>
              </div>
            </el-popover>
            <el-badge v-else :value="0" :max="99" type="success">
              <el-icon><Connection /></el-icon>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="70" align="center" />
        <el-table-column label="最后修改" width="180">
          <template #default="{ row }">{{ formatDate(row.last_modified_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row.id)">详情</el-button>
            <el-button size="small" type="success" link @click="editEntry(row)">编辑</el-button>
            <el-button size="small" type="info" link @click="showRelations(row)">关联</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="page"
        :page-size="limit"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="showEditDialog" title="编辑条目" width="800px">
      <el-form :model="editForm" label-width="100px" :rules="editRules" ref="editFormRef">
        <el-form-item label="类型">
          <el-select v-model="editForm.entry_type">
            <el-option label="笔记" value="note" />
            <el-option label="网页剪藏" value="web_clipping" />
            <el-option label="手写摘录" value="handwritten" />
            <el-option label="文件附件" value="file" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="editForm.content" type="textarea" :rows="6" placeholder="请输入内容" />
        </el-form-item>

        <el-divider v-if="editForm.entry_type === 'web_clipping'" content-position="left">网页剪藏来源信息</el-divider>
        <el-form-item v-if="editForm.entry_type === 'web_clipping'" label="来源标题">
          <el-input v-model="editForm.source_title" placeholder="网页标题" />
        </el-form-item>
        <el-form-item v-if="editForm.entry_type === 'web_clipping'" label="来源链接">
          <el-input v-model="editForm.source_url" placeholder="https://..." />
        </el-form-item>

        <el-divider v-if="editForm.entry_type === 'handwritten'" content-position="left">手写摘录信息</el-divider>
        <el-form-item v-if="editForm.entry_type === 'handwritten'" label="摘录来源">
          <el-input v-model="editForm.source_title" placeholder="书籍/文章名称" />
        </el-form-item>
        <el-form-item v-if="editForm.entry_type === 'handwritten'" label="页码/位置">
          <el-input v-model="editForm.handwritten_location" placeholder="如：第12页第3段" />
        </el-form-item>

        <el-divider v-if="editForm.entry_type === 'file'" content-position="left">文件附件</el-divider>
        <el-form-item v-if="editForm.entry_type === 'file'" label="上传文件">
          <el-upload
            v-model:file-list="editFileList"
            action="#"
            :auto-upload="false"
            :limit="5"
          >
            <el-button type="primary" :icon="Upload">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="editingRow?.attachments?.length > 0" label="已有附件">
          <div class="existing-attachments">
            <div v-for="att in editingRow.attachments" :key="att.id" class="exist-att-item">
              <el-icon><Paperclip /></el-icon>
              <span>{{ att.filename }}</span>
              <el-text type="info" size="small">{{ formatSize(att.file_size) }}</el-text>
            </div>
          </div>
        </el-form-item>

        <el-divider content-position="left">标签与关联</el-divider>
        <el-form-item label="标签">
          <el-select v-model="editForm.tags" multiple filterable allow-create default-first-option placeholder="选择或创建标签">
            <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联条目">
          <el-select v-model="editForm.related_to" multiple filterable placeholder="选择关联的知识条目">
            <el-option v-for="entry in entryList" :key="entry.id" :label="entry.title || '无标题条目 #' + entry.id" :value="entry.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingRow?.related_entries?.length > 0" label="当前关联">
          <div class="current-relations">
            <el-tag v-for="rel in editingRow.related_entries" :key="rel.id" size="small" class="mr-1" @click="viewDetail(rel.id)" style="cursor:pointer">
              {{ rel.title || '无标题' }}
            </el-tag>
          </div>
        </el-form-item>

        <el-divider content-position="left">隐私设置</el-divider>
        <el-form-item label="私密">
          <el-switch v-model="editForm.is_private" />
          <span class="form-tip">敏感内容默认设为私密，公开后可被分享和协作</span>
        </el-form-item>

        <el-alert v-if="editForm.is_private" type="warning" :closable="false" size="small">
          当前为私密状态，仅您可见，如需分享请先设为公开
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditSummary" title="编辑保存成功 - 可追溯复查" width="650px">
      <div v-if="editSummaryData" class="edit-summary-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="条目ID">{{ editSummaryData.id }}</el-descriptions-item>
          <el-descriptions-item label="版本号">
            <el-tag type="primary" size="small">v{{ editSummaryData.version }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="修改时间" :span="2">{{ formatDate(editSummaryData.last_modified_at) }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <div class="edit-summary-tips">
          <el-icon color="#67c23a"><CircleCheck /></el-icon>
          <span>修改已落库，版本号已递增至 v{{ editSummaryData.version }}，可通过版本历史追溯本次修改</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEditSummary = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRelationsDialog" title="关联关系管理" width="700px">
      <div v-if="currentEntry" class="relations-dialog">
        <div class="relations-header">
          <h4>{{ currentEntry.title || '无标题' }}</h4>
          <el-tag :type="currentEntry.is_private ? 'warning' : 'success'" size="small">
            {{ currentEntry.is_private ? '私密' : '公开' }}
          </el-tag>
        </div>
        <el-divider />
        <div class="relations-section">
          <h5>已关联条目 ({{ relatedEntries.length }})</h5>
          <div v-if="relatedEntries.length === 0" class="empty-relations">
            <el-empty description="暂无关联条目" :image-size="80" />
          </div>
          <div v-else class="relations-list">
            <div v-for="rel in relatedEntries" :key="rel.id" class="relation-item">
              <el-icon><Link /></el-icon>
              <span class="relation-title" @click="viewDetail(rel.id)">{{ rel.title || '无标题' }}</span>
              <el-tag size="small">{{ getTypeName(rel.entry_type) }}</el-tag>
              <el-button size="small" type="danger" link @click="removeRelation(rel.id)">移除</el-button>
            </div>
          </div>
        </div>
        <el-divider />
        <div class="relations-section">
          <h5>添加新关联</h5>
          <el-select v-model="newRelationId" filterable placeholder="选择要关联的条目" style="width: 100%">
            <el-option
              v-for="entry in availableEntries"
              :key="entry.id"
              :label="entry.title || '无标题条目 #' + entry.id"
              :value="entry.id"
            />
          </el-select>
          <el-button type="primary" style="margin-top: 10px" :disabled="!newRelationId" @click="addRelation">
            添加关联
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRelationsDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Link, Connection, Paperclip, Upload, CircleCheck } from '@element-plus/icons-vue'
import { listEntries, deleteEntry, updateEntry, listTags, getRelatedEntries } from '@/api'

const router = useRouter()
const loading = ref(false)
const entries = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const allTags = ref([])
const entryList = ref([])
const showEditDialog = ref(false)
const showRelationsDialog = ref(false)
const editFormRef = ref(null)
const editForm = ref({})
const editFileList = ref([])
const editingId = ref(null)
const editingRow = ref(null)
const currentEntry = ref(null)
const relatedEntries = ref([])
const newRelationId = ref(null)
const showEditSummary = ref(false)
const editSummaryData = ref(null)

const editRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const availableEntries = computed(() => {
  if (!currentEntry.value) return []
  const relatedIds = relatedEntries.value.map(r => r.id)
  return entryList.value.filter(e => e.id !== currentEntry.value.id && !relatedIds.includes(e.id))
})

const filter = ref({
  entry_type: '',
  tag: '',
  dateRange: []
})

function getTypeName(type) {
  const map = { note: '笔记', web_clipping: '网页剪藏', handwritten: '手写摘录', file: '文件' }
  return map[type] || type
}

function getTypeTagType(type) {
  const map = { note: '', web_clipping: 'primary', handwritten: 'success', file: 'info' }
  return map[type] || ''
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

async function loadEntries() {
  loading.value = true
  try {
    const params = { user_id: 1, skip: (page.value - 1) * limit.value, limit: limit.value }
    if (filter.value.entry_type) params.entry_type = filter.value.entry_type
    if (filter.value.tag) params.tag = filter.value.tag
    if (filter.value.dateRange && filter.value.dateRange.length === 2) {
      params.start_date = filter.value.dateRange[0].toISOString()
      params.end_date = filter.value.dateRange[1].toISOString()
    }
    const result = await listEntries(params)
    entries.value = result.results
    total.value = result.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadAllEntries() {
  try {
    const result = await listEntries({ user_id: 1, limit: 100 })
    entryList.value = result.results
  } catch (e) {
    console.error('Load entries failed:', e)
  }
}

async function loadTags() {
  try {
    allTags.value = await listTags()
  } catch (e) {
    console.error('Load tags failed:', e)
  }
}

function resetFilter() {
  filter.value = { entry_type: '', tag: '', dateRange: [] }
  page.value = 1
  loadEntries()
}

function handlePageChange(p) {
  page.value = p
  loadEntries()
}

function viewDetail(id) {
  router.push(`/entries/${id}`)
}

function editEntry(row) {
  editingId.value = row.id
  editingRow.value = row
  editForm.value = {
    entry_type: row.entry_type,
    title: row.title,
    content: row.content,
    tags: row.tags.map(t => t.name),
    source_url: row.source_url,
    source_title: row.source_title,
    handwritten_location: row.handwritten_location,
    related_to: [],
    is_private: row.is_private
  }
  editFileList.value = []
  showEditDialog.value = true
}

async function saveEdit() {
  if (!editFormRef.value) return
  try {
    await editFormRef.value.validate()
    const result = await updateEntry(editingId.value, editForm.value)
    editSummaryData.value = result
    showEditDialog.value = false
    showEditSummary.value = true
    loadEntries()
  } catch (e) {
    if (e !== false) {
      ElMessage.error('保存失败')
    }
  }
}

async function showRelations(row) {
  currentEntry.value = row
  showRelationsDialog.value = true
  newRelationId.value = null
  try {
    relatedEntries.value = await getRelatedEntries(row.id)
  } catch (e) {
    console.error('Load related failed:', e)
    relatedEntries.value = []
  }
}

function addRelation() {
  if (!newRelationId.value) return
  const entry = entryList.value.find(e => e.id === newRelationId.value)
  if (entry) {
    relatedEntries.value.push(entry)
    newRelationId.value = null
    ElMessage.success('关联已添加')
  }
}

function removeRelation(id) {
  relatedEntries.value = relatedEntries.value.filter(r => r.id !== id)
  ElMessage.success('关联已移除')
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条知识条目吗？', '删除确认', { type: 'warning' })
    await deleteEntry(id)
    ElMessage.success('删除成功')
    loadEntries()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadEntries()
  loadAllEntries()
  loadTags()
  window.addEventListener('entry-created', loadEntries)
})
</script>

<style scoped>
.entries-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.filter-card {
  margin-bottom: 0;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.entry-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.clickable {
  cursor: pointer;
  color: #409eff;
}
.clickable:hover {
  text-decoration: underline;
}
.clickable-badge {
  cursor: pointer;
}
.clickable-badge :deep(.el-badge__content) {
  cursor: pointer;
}
.source-info {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  text-align: left;
}
.source-content {
  flex: 1;
  min-width: 0;
}
.source-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source-url {
  color: #409eff;
  text-decoration: none;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
.source-url:hover {
  text-decoration: underline;
}
.text-muted {
  color: #c0c4cc;
}
.more-tags {
  color: #909399;
  font-size: 12px;
}
.pagination {
  margin-top: 20px;
  justify-content: center;
}
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.existing-attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exist-att-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}
.current-relations {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.edit-summary-content {
  padding: 10px 0;
}
.edit-summary-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #67c23a;
  font-size: 14px;
}
.relations-dialog {
  padding: 10px 0;
}
.relations-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.relations-header h4 {
  margin: 0;
  font-size: 16px;
}
.relations-section {
  margin-bottom: 10px;
}
.relations-section h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}
.relations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.relation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
.relation-title {
  flex: 1;
  cursor: pointer;
  color: #303133;
}
.relation-title:hover {
  color: #409eff;
}
.empty-relations {
  padding: 20px;
}
.attachment-list h4,
.relation-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}
.attachment-item,
.relation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}
.attachment-info {
  flex: 1;
  min-width: 0;
}
.attachment-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attachment-meta {
  font-size: 11px;
  color: #909399;
}
.relation-arrow {
  color: #909399;
  font-size: 12px;
}
.relation-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  min-width: 0;
}
.relation-info:hover {
  color: #409eff;
}
.relation-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.relation-path {
  padding: 10px;
  background: #f0fdf4;
  border-radius: 6px;
  font-size: 12px;
}
.path-label {
  color: #909399;
  margin-right: 8px;
}
.path-content {
  display: inline;
}
.path-node {
  background: white;
  padding: 2px 8px;
  border-radius: 10px;
  color: #166534;
  border: 1px solid #86efac;
}
.path-arrow {
  color: #22c55e;
  font-weight: bold;
  margin: 0 4px;
}
.path-more {
  color: #909399;
  margin-left: 4px;
}
.ml-2 {
  margin-left: 8px;
}
.mr-1 {
  margin-right: 4px;
}
</style>
