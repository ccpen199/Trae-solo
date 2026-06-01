<template>
  <div class="conflicts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>同步冲突管理</h3>
          <el-tabs v-model="activeTab" @tab-change="loadConflicts">
            <el-tab-pane label="待处理" name="pending" />
            <el-tab-pane label="已解决" name="resolved" />
            <el-tab-pane label="全部" name="all" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="conflicts" v-loading="loading" row-key="id">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="条目标题" min-width="180">
          <template #default="{ row }">
            <span class="entry-link" @click="goToEntry(row.entry_id)">
              {{ getEntryTitle(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="来源设备" width="140">
          <template #default="{ row }">
            <div class="device-info">
              <el-icon size="14"><Monitor /></el-icon>
              <span>{{ getDeviceName(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="base_version" label="基准版本" width="90" align="center" />
        <el-table-column label="冲突原因" min-width="200">
          <template #default="{ row }">
            <el-popover placement="bottom" :width="360" trigger="hover">
              <template #reference>
                <div class="reason-cell">
                  <el-icon :color="getReasonColor(row.conflict_reason)"><WarningFilled /></el-icon>
                  <span>{{ getReasonTitle(row.conflict_reason) }}</span>
                </div>
              </template>
              <div class="reason-detail-popover">
                <div class="reason-detail-item">
                  <span class="reason-label">冲突类型：</span>
                  <el-tag :type="getReasonTagType(row.conflict_reason)" size="small">{{ getReasonTitle(row.conflict_reason) }}</el-tag>
                </div>
                <div class="reason-detail-item">
                  <span class="reason-label">详细说明：</span>
                  <span>{{ getReasonDescription(row.conflict_reason) }}</span>
                </div>
                <div class="reason-detail-item" v-if="row.local_version_snapshot?.content_hash && row.remote_version_snapshot?.content_hash">
                  <span class="reason-label">本地哈希：</span>
                  <code class="hash-code">{{ row.local_version_snapshot.content_hash?.substring(0, 16) }}...</code>
                </div>
                <div class="reason-detail-item" v-if="row.local_version_snapshot?.content_hash && row.remote_version_snapshot?.content_hash">
                  <span class="reason-label">远程哈希：</span>
                  <code class="hash-code">{{ row.remote_version_snapshot.content_hash?.substring(0, 16) }}...</code>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="冲突时间线" width="180">
          <template #default="{ row }">
            <div class="timeline-cell">
              <div class="timeline-item">
                <span class="timeline-dot local"></span>
                <span class="timeline-label">本地修改</span>
                <span class="timeline-time">{{ formatTime(row.local_version_snapshot?.modified_at) }}</span>
              </div>
              <div class="timeline-item">
                <span class="timeline-dot remote"></span>
                <span class="timeline-label">远程修改</span>
                <span class="timeline-time">{{ formatTime(row.remote_version_snapshot?.modified_at) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="解决结果" min-width="200">
          <template #default="{ row }">
            <div v-if="row.status !== 'pending'" class="resolution-cell">
              <div class="resolution-summary">
                <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                <span>保留{{ row.status === 'resolved_local' ? '本地' : row.status === 'resolved_remote' ? '远程' : '合并' }}版本</span>
              </div>
              <div v-if="row.resolution" class="resolution-note">{{ row.resolution }}</div>
              <div v-if="row.resolved_at" class="resolution-time">解决于 {{ formatDate(row.resolved_at) }}</div>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewDetail(row)">查看对比</el-button>
            <el-button size="small" type="success" v-if="row.status === 'pending'" @click="showResolve(row)">解决</el-button>
            <el-button size="small" type="info" v-if="row.status !== 'pending'" @click="viewResolution(row)">查看结果</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDetailDialog" title="冲突详情对比" width="1100px" top="5vh">
      <div v-if="currentConflict" class="conflict-detail">
        <div class="detail-meta">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="冲突类型">
              <el-tag :type="getReasonTagType(currentConflict.conflict_reason)">{{ getReasonTitle(currentConflict.conflict_reason) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="来源设备">
              <div class="device-info">
                <el-icon size="14"><Monitor /></el-icon>
                <span>{{ getDeviceName(currentConflict) }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="基准版本">v{{ currentConflict.base_version }}</el-descriptions-item>
            <el-descriptions-item label="同步时间" :span="3">
              <div class="sync-times">
                <span>本地修改: {{ formatTime(currentConflict.local_version_snapshot?.modified_at) }}</span>
                <el-divider direction="vertical" />
                <span>远程修改: {{ formatTime(currentConflict.remote_version_snapshot?.modified_at) }}</span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="entry-context" v-if="entryDetail">
          <el-divider content-position="left">条目上下文</el-divider>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="条目标题">{{ entryDetail.title || '无标题' }}</el-descriptions-item>
            <el-descriptions-item label="条目类型">
              <el-tag size="small">{{ getEntryTypeName(entryDetail.entry_type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="来源链接" v-if="entryDetail.source_url">
              <a :href="entryDetail.source_url" target="_blank" class="source-link">{{ entryDetail.source_url }}</a>
            </el-descriptions-item>
            <el-descriptions-item label="标签" :span="3" v-if="entryDetail.tags?.length">
              <el-tag v-for="tag in entryDetail.tags" :key="tag.id" :color="tag.color" size="small" class="mr-1">{{ tag.name }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联节点" :span="3" v-if="relatedEntries.length">
              <div class="related-nodes">
                <div v-for="rel in relatedEntries" :key="rel.id" class="related-node" @click="goToEntry(rel.id)">
                  <el-icon size="12"><Link /></el-icon>
                  <span>{{ rel.title || '无标题' }}</span>
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="conflict-reason-detail">
          <el-divider content-position="left">冲突原因分析</el-divider>
          <el-alert :closable="false" :type="getReasonAlertType(currentConflict.conflict_reason)">
            <template #title>
              <strong>{{ getReasonTitle(currentConflict.conflict_reason) }}</strong>
            </template>
            {{ getReasonDescription(currentConflict.conflict_reason) }}
          </el-alert>
          <el-timeline class="conflict-timeline">
            <el-timeline-item timestamp="基准版本" placement="top" type="info">
              <span>v{{ currentConflict.base_version }} 作为共同祖先</span>
            </el-timeline-item>
            <el-timeline-item
              :timestamp="formatTime(currentConflict.local_version_snapshot?.modified_at)"
              placement="top"
              type="primary"
            >
              <span>本地设备修改为 v{{ currentConflict.local_version_snapshot?.version }}</span>
            </el-timeline-item>
            <el-timeline-item
              :timestamp="formatTime(currentConflict.remote_version_snapshot?.modified_at)"
              placement="top"
              type="warning"
            >
              <span>远程设备({{ getDeviceName(currentConflict) }})修改为 v{{ currentConflict.remote_version_snapshot?.version }}</span>
            </el-timeline-item>
            <el-timeline-item timestamp="检测到冲突" placement="top" type="danger">
              <span>两方修改无法自动合并</span>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="compare-section">
          <el-divider content-position="left">版本对比</el-divider>
          <el-row :gutter="20" class="compare-row">
            <el-col :span="12">
              <h4 class="version-heading">
                <el-tag type="primary">本地版本</el-tag>
                v{{ currentConflict.local_version_snapshot?.version || 'N/A' }}
              </h4>
              <div class="version-card local">
                <div class="version-meta">
                  <span>修改时间: {{ formatTime(currentConflict.local_version_snapshot?.modified_at) }}</span>
                </div>
                <p><strong>标题:</strong> {{ currentConflict.local_version_snapshot?.title || 'N/A' }}</p>
                <p><strong>内容:</strong></p>
                <pre>{{ currentConflict.local_version_snapshot?.content || 'N/A' }}</pre>
              </div>
            </el-col>
            <el-col :span="12">
              <h4 class="version-heading">
                <el-tag type="warning">远程版本</el-tag>
                v{{ currentConflict.remote_version_snapshot?.version || 'N/A' }}
              </h4>
              <div class="version-card remote">
                <div class="version-meta">
                  <span>修改时间: {{ formatTime(currentConflict.remote_version_snapshot?.modified_at) }}</span>
                </div>
                <p><strong>标题:</strong> {{ currentConflict.remote_version_snapshot?.title || 'N/A' }}</p>
                <p><strong>内容:</strong></p>
                <pre>{{ currentConflict.remote_version_snapshot?.content || 'N/A' }}</pre>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" v-if="currentConflict?.status === 'pending'" @click="showResolve(currentConflict)">立即解决</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResolveDialog" title="解决冲突" width="900px" top="5vh">
      <div v-if="currentConflict" class="resolve-dialog-content">
        <div class="strategy-cards">
          <div
            class="strategy-card"
            :class="{ active: resolveForm.status === 'resolved_local' }"
            @click="resolveForm.status = 'resolved_local'"
          >
            <div class="strategy-icon local-icon">
              <el-icon size="28"><HomeFilled /></el-icon>
            </div>
            <h4>保留本地版本</h4>
            <p class="strategy-desc">使用本地设备的修改版本</p>
            <div class="strategy-effect">
              <div class="effect-item negative">
                <el-icon><CloseBold /></el-icon>
                <span>丢弃远程设备的所有修改</span>
              </div>
              <div class="effect-item positive">
                <el-icon><Select /></el-icon>
                <span>保留本地修改内容</span>
              </div>
            </div>
            <div class="strategy-tag">适用于：确认本地修改更准确</div>
          </div>
          <div
            class="strategy-card"
            :class="{ active: resolveForm.status === 'resolved_remote' }"
            @click="resolveForm.status = 'resolved_remote'"
          >
            <div class="strategy-icon remote-icon">
              <el-icon size="28"><Monitor /></el-icon>
            </div>
            <h4>保留远程版本</h4>
            <p class="strategy-desc">使用远程设备的修改版本</p>
            <div class="strategy-effect">
              <div class="effect-item negative">
                <el-icon><CloseBold /></el-icon>
                <span>丢弃本地设备的所有修改</span>
              </div>
              <div class="effect-item positive">
                <el-icon><Select /></el-icon>
                <span>保留远程修改内容</span>
              </div>
            </div>
            <div class="strategy-tag">适用于：确认远程修改更准确</div>
          </div>
          <div
            class="strategy-card"
            :class="{ active: resolveForm.status === 'merged' }"
            @click="resolveForm.status = 'merged'"
          >
            <div class="strategy-icon merge-icon">
              <el-icon size="28"><Connection /></el-icon>
            </div>
            <h4>手动合并</h4>
            <p class="strategy-desc">自行取舍两方修改内容</p>
            <div class="strategy-effect">
              <div class="effect-item positive">
                <el-icon><Select /></el-icon>
                <span>可选择性保留双方修改</span>
              </div>
              <div class="effect-item warning">
                <el-icon><Warning /></el-icon>
                <span>需要手动编辑合并结果</span>
              </div>
            </div>
            <div class="strategy-tag">适用于：双方修改均有价值</div>
          </div>
        </div>

        <div class="version-preview-section">
          <el-divider content-position="left">版本预览对比</el-divider>
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="preview-card local-preview" :class="{ selected: resolveForm.status === 'resolved_local' }">
                <div class="preview-header">
                  <el-tag type="primary" size="small">本地版本</el-tag>
                  <el-icon v-if="resolveForm.status === 'resolved_local'" color="#409eff" size="18"><CircleCheckFilled /></el-icon>
                </div>
                <div class="preview-body">
                  <div class="preview-field">
                    <span class="field-label">标题</span>
                    <span class="field-value">{{ currentConflict.local_version_snapshot?.title || 'N/A' }}</span>
                  </div>
                  <div class="preview-field">
                    <span class="field-label">内容</span>
                    <span class="field-value content-preview">{{ truncate(currentConflict.local_version_snapshot?.content, 200) }}</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="preview-card remote-preview" :class="{ selected: resolveForm.status === 'resolved_remote' }">
                <div class="preview-header">
                  <el-tag type="warning" size="small">远程版本</el-tag>
                  <el-icon v-if="resolveForm.status === 'resolved_remote'" color="#e6a23c" size="18"><CircleCheckFilled /></el-icon>
                </div>
                <div class="preview-body">
                  <div class="preview-field">
                    <span class="field-label">标题</span>
                    <span class="field-value">{{ currentConflict.remote_version_snapshot?.title || 'N/A' }}</span>
                  </div>
                  <div class="preview-field">
                    <span class="field-label">内容</span>
                    <span class="field-value content-preview">{{ truncate(currentConflict.remote_version_snapshot?.content, 200) }}</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="resolve-form-section">
          <el-divider content-position="left">解决说明</el-divider>
          <el-form :model="resolveForm" label-width="100px">
            <el-form-item label="选择方案">
              <el-radio-group v-model="resolveForm.status">
                <el-radio value="resolved_local">保留本地版本</el-radio>
                <el-radio value="resolved_remote">保留远程版本</el-radio>
                <el-radio value="merged">手动合并</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="合并标题" v-if="resolveForm.status === 'merged'">
              <el-input v-model="resolveForm.merged_title" placeholder="请输入合并后的标题" />
            </el-form-item>
            <el-form-item label="合并内容" v-if="resolveForm.status === 'merged'">
              <el-input v-model="resolveForm.merged_content" type="textarea" :rows="8" placeholder="请输入合并后的内容..." />
            </el-form-item>
            <el-form-item label="合并说明" v-if="resolveForm.status === 'merged'">
              <el-input v-model="resolveForm.resolution" type="textarea" :rows="4" placeholder="请描述合并策略和取舍说明..." />
            </el-form-item>
            <el-form-item label="说明" v-else>
              <el-input v-model="resolveForm.resolution" type="textarea" :rows="3" placeholder="可选：说明选择原因" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitResolve" :loading="resolving">确认解决</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResolutionDialog" title="冲突解决结果" width="700px">
      <div v-if="currentConflict" class="resolution-dialog">
        <el-result :icon="currentConflict.status === 'merged' ? 'info' : 'success'" :title="getResolutionTitle(currentConflict)">
          <template #sub-title>
            <div class="resolution-detail">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="解决策略">{{ getStatusText(currentConflict.status) }}</el-descriptions-item>
                <el-descriptions-item label="保留版本">v{{ getKeptVersion(currentConflict) }}</el-descriptions-item>
                <el-descriptions-item label="解决时间">{{ formatDate(currentConflict.resolved_at) }}</el-descriptions-item>
                <el-descriptions-item label="解决说明" v-if="currentConflict.resolution">
                  {{ currentConflict.resolution }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-result>

        <div class="merge-result" v-if="currentConflict.status === 'merged' && mergeResult">
          <el-divider content-position="left">合并结果摘要</el-divider>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="合并后标题">{{ mergeResult.title }}</el-descriptions-item>
            <el-descriptions-item label="合并后内容">
              <div class="merge-content-preview">{{ truncate(mergeResult.content, 300) }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="kept-version-preview">
          <el-divider content-position="left">保留版本</el-divider>
          <div class="version-card" :class="currentConflict.status === 'resolved_local' ? 'local' : 'remote'">
            <p><strong>标题:</strong> {{ getKeptSnapshot(currentConflict)?.title || 'N/A' }}</p>
            <p><strong>内容:</strong></p>
            <pre>{{ truncate(getKeptSnapshot(currentConflict)?.content, 500) }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showResolutionDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, WarningFilled, CircleCheckFilled, CloseBold, Select, HomeFilled, Connection, Warning, Link } from '@element-plus/icons-vue'
import { listConflicts, resolveConflict, listEntries, getEntryVersions, getRelatedEntries } from '@/api'

const router = useRouter()
const loading = ref(false)
const resolving = ref(false)
const conflicts = ref([])
const activeTab = ref('pending')
const showDetailDialog = ref(false)
const showResolveDialog = ref(false)
const showResolutionDialog = ref(false)
const currentConflict = ref(null)
const entryDetail = ref(null)
const relatedEntries = ref([])
const mergeResult = ref(null)
const entryMap = ref({})
const resolveForm = ref({ status: 'resolved_remote', resolution: '', merged_title: '', merged_content: '' })

const reasonMap = {
  content_hash_mismatch: { title: '内容哈希不匹配', desc: '本地和远程版本的内容哈希值不一致，两方对同一内容进行了不同的修改，无法自动合并。' },
  version_conflict: { title: '版本冲突', desc: '本地和远程版本号均高于基准版本，属于典型的分叉修改场景，需要手动决定保留哪一方。' },
  concurrent_edit: { title: '并发编辑', desc: '两个设备在短时间内同时修改了同一条目，系统检测到并发写入冲突。' },
  delete_vs_update: { title: '删除与更新冲突', desc: '一方删除了条目而另一方更新了条目内容，需要决定是保留更新还是执行删除。' },
  field_conflict: { title: '字段级冲突', desc: '同一条目的不同字段在本地和远程被分别修改，可能需要逐字段合并。' }
}

function getReasonTitle(reason) {
  return reasonMap[reason]?.title || reason || '未知冲突'
}

function getReasonDescription(reason) {
  return reasonMap[reason]?.desc || '检测到数据冲突，需要手动解决。'
}

function getReasonColor(reason) {
  const map = { content_hash_mismatch: '#e6a23c', version_conflict: '#f56c6c', concurrent_edit: '#e6a23c', delete_vs_update: '#f56c6c', field_conflict: '#909399' }
  return map[reason] || '#e6a23c'
}

function getReasonTagType(reason) {
  const map = { content_hash_mismatch: 'warning', version_conflict: 'danger', concurrent_edit: 'warning', delete_vs_update: 'danger', field_conflict: 'info' }
  return map[reason] || 'warning'
}

function getReasonAlertType(reason) {
  const map = { content_hash_mismatch: 'warning', version_conflict: 'error', concurrent_edit: 'warning', delete_vs_update: 'error', field_conflict: 'info' }
  return map[reason] || 'warning'
}

function getStatusType(status) {
  const map = { pending: 'warning', resolved_local: 'success', resolved_remote: 'success', merged: 'info' }
  return map[status] || ''
}

function getStatusText(status) {
  const map = { pending: '待处理', resolved_local: '保留本地', resolved_remote: '保留远程', merged: '已合并' }
  return map[status] || status
}

function getEntryTypeName(type) {
  const map = { note: '笔记', web_clipping: '网页剪藏', handwritten: '手写摘录', file: '文件' }
  return map[type] || type
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

function formatTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

function getDeviceName(conflict) {
  return conflict?.remote_version_snapshot?.device_name || conflict?.device_name || '未知设备'
}

function getEntryTitle(conflict) {
  return entryMap.value[conflict.entry_id]?.title || `条目 #${conflict.entry_id}`
}

function getKeptVersion(conflict) {
  if (conflict.status === 'resolved_local') return conflict.local_version_snapshot?.version || '?'
  if (conflict.status === 'resolved_remote') return conflict.remote_version_snapshot?.version || '?'
  return '合并版本'
}

function getKeptSnapshot(conflict) {
  if (conflict.status === 'resolved_local') return conflict.local_version_snapshot
  if (conflict.status === 'resolved_remote') return conflict.remote_version_snapshot
  return conflict.local_version_snapshot
}

function getResolutionTitle(conflict) {
  if (conflict.status === 'resolved_local') return '已保留本地版本'
  if (conflict.status === 'resolved_remote') return '已保留远程版本'
  if (conflict.status === 'merged') return '已手动合并'
  return '已解决'
}

function goToEntry(id) {
  if (id) router.push(`/entries/${id}`)
}

async function loadConflicts() {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? null : activeTab.value
    conflicts.value = await listConflicts({ status })
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadEntryMap() {
  try {
    const result = await listEntries({ limit: 200 })
    const map = {}
    ;(result.results || []).forEach(e => { map[e.id] = e })
    entryMap.value = map
  } catch (e) {
    console.error('Load entry map failed:', e)
  }
}

async function loadEntryContext(entryId) {
  entryDetail.value = null
  relatedEntries.value = []
  try {
    const entry = entryMap.value[entryId]
    if (entry) {
      entryDetail.value = entry
    }
    const related = await getRelatedEntries(entryId)
    relatedEntries.value = related || []
  } catch (e) {
    console.error('Load entry context failed:', e)
  }
}

async function viewDetail(conflict) {
  currentConflict.value = conflict
  showDetailDialog.value = true
  await loadEntryContext(conflict.entry_id)
}

function showResolve(conflict) {
  currentConflict.value = conflict
  resolveForm.value = {
    status: 'resolved_remote',
    resolution: '',
    merged_title: conflict.local_version_snapshot?.title || '',
    merged_content: conflict.local_version_snapshot?.content || ''
  }
  showResolveDialog.value = true
  showDetailDialog.value = false
}

async function viewResolution(conflict) {
  currentConflict.value = conflict
  mergeResult.value = null
  if (conflict.status === 'merged') {
    try {
      const versions = await getEntryVersions(conflict.entry_id)
      if (versions && versions.length > 0) {
        const latest = versions[0]
        mergeResult.value = { title: latest.snapshot?.title || '', content: latest.snapshot?.content || '' }
      }
    } catch (e) {
      console.error('Load merge result failed:', e)
    }
  }
  showResolutionDialog.value = true
}

async function submitResolve() {
  resolving.value = true
  try {
    const data = { status: resolveForm.value.status, resolution: resolveForm.value.resolution }
    if (resolveForm.value.status === 'merged') {
      data.merged_title = resolveForm.value.merged_title
      data.merged_content = resolveForm.value.merged_content
    }
    await resolveConflict(currentConflict.value.id, data)
    ElMessage.success('冲突已解决')
    showResolveDialog.value = false
    loadConflicts()
  } catch (e) {
    ElMessage.error('解决失败')
  } finally {
    resolving.value = false
  }
}

onMounted(() => {
  loadConflicts()
  loadEntryMap()
})
</script>

<style scoped>
.conflicts-page {
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.entry-link {
  cursor: pointer;
  color: #409eff;
  font-weight: 500;
}

.entry-link:hover {
  text-decoration: underline;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

.reason-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.reason-detail-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reason-detail-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}

.reason-label {
  color: #909399;
  white-space: nowrap;
  min-width: 70px;
}

.hash-code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #f56c6c;
  font-family: monospace;
}

.timeline-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.timeline-dot.local {
  background: #409eff;
}

.timeline-dot.remote {
  background: #e6a23c;
}

.timeline-label {
  color: #606266;
  min-width: 56px;
}

.timeline-time {
  color: #909399;
}

.resolution-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resolution-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #67c23a;
  font-weight: 500;
}

.resolution-note {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.resolution-time {
  font-size: 11px;
  color: #909399;
}

.text-muted {
  color: #c0c4cc;
}

.conflict-detail {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-meta {
  margin-bottom: 0;
}

.sync-times {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #606266;
}

.source-link {
  color: #409eff;
  text-decoration: none;
  word-break: break-all;
}

.source-link:hover {
  text-decoration: underline;
}

.related-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.related-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #ecf5ff;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  color: #409eff;
}

.related-node:hover {
  background: #d9ecff;
}

.conflict-reason-detail {
  margin-top: 0;
}

.conflict-timeline {
  margin-top: 16px;
  padding-left: 4px;
}

.conflict-timeline :deep(.el-timeline-item__content) {
  font-size: 13px;
  color: #606266;
}

.compare-section {
  margin-top: 0;
}

.compare-row {
  margin-top: 0;
}

.version-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.version-card {
  padding: 15px;
  border-radius: 8px;
  min-height: 200px;
}

.version-card.local {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
}

.version-card.remote {
  background: #fdf6ec;
  border: 1px solid #faecd8;
}

.version-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.version-card pre {
  white-space: pre-wrap;
  background: white;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

.strategy-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.strategy-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.25s;
  text-align: center;
  background: #fff;
}

.strategy-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.strategy-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.strategy-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.local-icon {
  background: #ecf5ff;
  color: #409eff;
}

.remote-icon {
  background: #fdf6ec;
  color: #e6a23c;
}

.merge-icon {
  background: #f0f9eb;
  color: #67c23a;
}

.strategy-card h4 {
  margin: 0 0 6px;
  font-size: 15px;
  color: #303133;
}

.strategy-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 14px;
}

.strategy-effect {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  text-align: left;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.effect-item.negative {
  color: #f56c6c;
  background: #fef0f0;
}

.effect-item.positive {
  color: #67c23a;
  background: #f0f9eb;
}

.effect-item.warning {
  color: #e6a23c;
  background: #fdf6ec;
}

.strategy-tag {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.version-preview-section {
  margin-bottom: 8px;
}

.preview-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.25s;
}

.preview-card.selected {
  box-shadow: 0 0 0 2px #409eff;
}

.preview-card.local-preview.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.preview-card.remote-preview.selected {
  border-color: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.3);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
}

.preview-body {
  padding: 12px;
}

.preview-field {
  margin-bottom: 8px;
}

.field-label {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.field-value {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.content-preview {
  display: block;
  max-height: 120px;
  overflow-y: auto;
  background: #fafafa;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.resolve-form-section {
  margin-bottom: 0;
}

.resolution-dialog {
  padding: 10px 0;
}

.resolution-detail {
  margin-top: 10px;
  text-align: left;
}

.merge-result {
  margin-top: 8px;
}

.merge-content-preview {
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 150px;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
}

.kept-version-preview {
  margin-top: 8px;
}

.mr-1 {
  margin-right: 4px;
}
</style>
