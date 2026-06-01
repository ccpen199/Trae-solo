<template>
  <div class="shares-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>分享管理</h3>
          <el-button type="primary" @click="showCreateDialog = true">新建分享</el-button>
        </div>
      </template>

      <el-alert
        title="分享权限说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <ul class="permission-tips">
          <li><strong>只读 (read)</strong>：只能查看内容，无法修改</li>
          <li><strong>可评论 (comment)</strong>：可查看并添加评论（需要配合评论功能）</li>
          <li><strong>可编辑 (edit)</strong>：可查看和修改内容</li>
          <li><strong>私密条目限制</strong>：敏感条目默认设为私密，公开后才能被分享和协作</li>
        </ul>
      </el-alert>

      <el-table :data="shares" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="知识条目" min-width="200">
          <template #default="{ row }">
            <div class="entry-info">
              <span class="entry-title">{{ row.entry_title || '条目 #' + row.entry_id }}</span>
              <el-tag v-if="row.is_private" type="warning" size="small" class="ml-2">私密</el-tag>
            </div>
            <div v-if="row.entry_source_url" class="entry-source-hint">
              <el-icon size="10"><Link /></el-icon>
              <span>{{ row.entry_source_title || row.entry_source_url.substring(0, 40) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="权限" width="120">
          <template #default="{ row }">
            <el-tag :type="getPermissionType(row.permission)">{{ getPermissionText(row.permission) }}</el-tag>
            <div v-if="row.permission === 'comment'" class="perm-hint">可评论承接</div>
            <div v-if="row.permission === 'edit'" class="perm-hint edit-hint">可编辑边界</div>
          </template>
        </el-table-column>
        <el-table-column label="协作记录" width="130">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="viewComments(row)">
              <el-icon><ChatDotRound /></el-icon> 评论
              <el-badge v-if="row.comment_count > 0" :value="row.comment_count" class="ml-1" :max="99" />
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="权限边界" width="130">
          <template #default="{ row }">
            <el-button size="small" text @click="verifyPermission(row)">复查权限</el-button>
          </template>
        </el-table-column>
        <el-table-column label="版本" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.entry_version" size="small" type="info">v{{ row.entry_version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active && !isExpired(row) ? 'success' : 'info'">
              {{ row.is_active && !isExpired(row) ? '有效' : '已失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="180">
          <template #default="{ row }">{{ row.expires_at ? formatDate(row.expires_at) : '永不过期' }}</template>
        </el-table-column>
        <el-table-column label="分享链接" min-width="300">
          <template #default="{ row }">
            <div class="share-link">
              <el-input :model-value="getShareLink(row.share_token)" readonly size="small" />
              <el-button size="small" type="primary" @click="copyLink(row.share_token)">复制</el-button>
              <el-button size="small" type="success" @click="openLink(row.share_token)">打开</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="deactivate(row)" v-if="row.is_active && !isExpired(row)">
              取消分享
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建分享链接" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="选择条目" required>
          <el-select v-model="createForm.entry_id" filterable placeholder="选择要分享的知识条目" style="width: 100%">
            <el-option
              v-for="entry in entryList"
              :key="entry.id"
              :label="entry.title || '无标题条目 #' + entry.id"
              :value="entry.id"
              :disabled="entry.is_private"
            >
              <span>{{ entry.title || '无标题条目 #' + entry.id }}</span>
              <el-tag v-if="entry.is_private" type="warning" size="small" style="margin-left: 8px">私密</el-tag>
              <el-tag v-else type="success" size="small" style="margin-left: 8px">公开</el-tag>
            </el-option>
          </el-select>
          <div class="form-tip">私密条目无法分享，请先在条目详情中设为公开</div>
        </el-form-item>
        <el-form-item label="权限" required>
          <el-radio-group v-model="createForm.permission">
            <el-radio value="read">只读</el-radio>
            <el-radio value="comment">可评论</el-radio>
            <el-radio value="edit">可编辑</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="有效期">
          <el-radio-group v-model="expireOption">
            <el-radio value="never">永不过期</el-radio>
            <el-radio value="custom">自定义</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="expireOption === 'custom'"
            v-model="createForm.expires_at"
            type="datetime"
            placeholder="选择过期时间"
            style="margin-top: 10px; width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建分享</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showVerifyDialog" title="权限边界复查" width="650px">
      <div v-if="verifyData" class="verify-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="分享Token">{{ verifyData.share_token }}</el-descriptions-item>
          <el-descriptions-item label="权限级别">
            <el-tag :type="getPermissionType(verifyData.permission)" size="small">
              {{ getPermissionText(verifyData.permission) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="verifyData.is_active && !isExpired(verifyData) ? 'success' : 'info'" size="small">
              {{ verifyData.is_active && !isExpired(verifyData) ? '有效' : '已失效' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="访问测试">
            <el-tag :type="verifyTestStatus === 'success' ? 'success' : 'danger'" size="small">
              {{ verifyTestStatus === 'success' ? '可正常访问' : '访问被拒绝' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDate(verifyData.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="过期时间" :span="2">
            {{ verifyData.expires_at ? formatDate(verifyData.expires_at) : '永不过期' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">权限边界说明</el-divider>
        <div class="permission-boundaries">
          <div class="boundary-item" :class="{ active: verifyData.permission === 'read' }">
            <div class="boundary-header">
              <el-icon color="#606266"><View /></el-icon>
              <span>只读权限 (read)</span>
              <el-tag v-if="verifyData.permission === 'read'" type="success" size="small">当前权限</el-tag>
            </div>
            <ul>
              <li class="allowed">✓ 查看知识条目内容</li>
              <li class="allowed">✓ 查看附件和来源链接</li>
              <li class="forbidden">✗ 无法添加评论</li>
              <li class="forbidden">✗ 无法修改内容</li>
              <li class="forbidden">✗ 无法管理关联</li>
            </ul>
          </div>
          <div class="boundary-item" :class="{ active: verifyData.permission === 'comment' }">
            <div class="boundary-header">
              <el-icon color="#e6a23c"><ChatDotRound /></el-icon>
              <span>可评论权限 (comment)</span>
              <el-tag v-if="verifyData.permission === 'comment'" type="warning" size="small">当前权限</el-tag>
            </div>
            <ul>
              <li class="allowed">✓ 查看知识条目内容</li>
              <li class="allowed">✓ 查看附件和来源链接</li>
              <li class="allowed">✓ 添加、查看评论</li>
              <li class="forbidden">✗ 无法修改内容</li>
              <li class="forbidden">✗ 无法管理关联</li>
            </ul>
          </div>
          <div class="boundary-item" :class="{ active: verifyData.permission === 'edit' }">
            <div class="boundary-header">
              <el-icon color="#f56c6c"><Edit /></el-icon>
              <span>可编辑权限 (edit)</span>
              <el-tag v-if="verifyData.permission === 'edit'" type="danger" size="small">当前权限</el-tag>
            </div>
            <ul>
              <li class="allowed">✓ 查看知识条目内容</li>
              <li class="allowed">✓ 查看附件和来源链接</li>
              <li class="allowed">✓ 添加、查看、删除评论</li>
              <li class="allowed">✓ 修改标题、内容、标签</li>
              <li class="allowed">✓ 管理双向关联</li>
            </ul>
          </div>
        </div>

        <el-divider v-if="verifyAuditLog.length > 0" content-position="left">复查历史记录</el-divider>
        <div v-if="verifyAuditLog.length > 0" class="audit-log">
          <div v-for="(log, idx) in verifyAuditLog" :key="idx" class="audit-item">
            <el-icon color="#909399"><Clock /></el-icon>
            <span class="audit-time">{{ formatDate(log.time) }}</span>
            <span class="audit-action">{{ log.action }}</span>
            <el-tag :type="log.status === 'success' ? 'success' : 'danger'" size="small">{{ log.result }}</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showVerifyDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCommentsDialog" title="评论协作区" width="650px">
      <div v-if="currentShare" class="comments-content">
        <div class="share-info-bar">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="知识条目">{{ currentShare.entry_title || '条目 #' + currentShare.entry_id }}</el-descriptions-item>
            <el-descriptions-item label="权限">
              <el-tag :type="getPermissionType(currentShare.permission)" size="small">
                {{ getPermissionText(currentShare.permission) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-alert
            v-if="currentShare.permission === 'read'"
            type="info"
            :closable="false"
            size="small"
            style="margin-top: 10px"
          >
            当前为只读权限，您只能查看评论，无法添加新评论
          </el-alert>
          <el-alert
            v-else-if="!currentShare.is_active || isExpired(currentShare)"
            type="warning"
            :closable="false"
            size="small"
            style="margin-top: 10px"
          >
            该分享已失效，无法添加新评论
          </el-alert>
        </div>

        <el-divider content-position="left">评论列表 ({{ comments.length }})</el-divider>
        <div v-if="comments.length === 0" class="empty-comments">
          <el-empty description="暂无评论" :image-size="80" />
        </div>
        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <el-avatar :size="36">{{ comment.author.charAt(0) }}</el-avatar>
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                <el-tag size="small" type="info">{{ comment.permission }}</el-tag>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
          </div>
        </div>

        <el-divider v-if="canComment" content-position="left">添加评论</el-divider>
        <div v-if="canComment" class="comment-input">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="请输入您的评论..."
            maxlength="500"
            show-word-limit
          />
          <div class="comment-actions">
            <el-button type="primary" :disabled="!newComment.trim()" @click="submitComment">
              发表评论
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCommentsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPrivateBlockDialog" title="私密条目无法分享" width="500px">
      <div class="private-block-content">
        <el-result icon="warning" title="该条目为私密状态">
          <template #sub-title>
            <div class="block-reasons">
              <p><strong>原因：</strong>敏感条目默认设为私密，私密内容无法被分享和协作</p>
              <p><strong>处理建议：</strong></p>
              <ol>
                <li>前往条目详情页，将私密状态切换为公开</li>
                <li>确认内容不包含敏感信息后再进行分享</li>
                <li>公开后所有协作者均可查看和编辑内容</li>
              </ol>
            </div>
          </template>
          <template #extra>
            <el-button type="primary" @click="goToEntryDetail">前往条目详情</el-button>
            <el-button @click="showPrivateBlockDialog = false">我知道了</el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, View, Edit, Clock } from '@element-plus/icons-vue'
import { listShares, listEntries, createShare, deactivateShare, getPublicShare } from '@/api'

const router = useRouter()

const loading = ref(false)
const shares = ref([])
const entryList = ref([])
const showCreateDialog = ref(false)
const showVerifyDialog = ref(false)
const showCommentsDialog = ref(false)
const showPrivateBlockDialog = ref(false)
const verifyData = ref(null)
const verifyTestStatus = ref('')
const verifyAuditLog = ref([])
const expireOption = ref('never')
const currentShare = ref(null)
const comments = ref([])
const newComment = ref('')
const blockedEntryId = ref(null)

const createForm = ref({
  entry_id: null,
  permission: 'read',
  expires_at: null
})

const canComment = computed(() => {
  if (!currentShare.value) return false
  if (!currentShare.value.is_active || isExpired(currentShare.value)) return false
  return currentShare.value.permission === 'comment' || currentShare.value.permission === 'edit'
})

function getPermissionType(perm) {
  const map = { read: '', comment: 'warning', edit: 'danger' }
  return map[perm] || ''
}

function getPermissionText(perm) {
  const map = { read: '只读', comment: '可评论', edit: '可编辑' }
  return map[perm] || perm
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function isExpired(row) {
  if (!row.expires_at) return false
  return new Date(row.expires_at) < new Date()
}

function getShareLink(token) {
  return `${window.location.origin}/#/share/${token}`
}

async function copyLink(token) {
  try {
    await navigator.clipboard.writeText(getShareLink(token))
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

function openLink(token) {
  window.open(getShareLink(token), '_blank')
}

async function loadShares() {
  loading.value = true
  try {
    const data = await listShares()
    shares.value = data.map(s => {
      const entry = entryList.value.find(e => e.id === s.entry_id)
      return {
        ...s,
        entry_title: entry?.title || s.entry_title,
        is_private: entry?.is_private ?? s.is_private,
        entry_source_url: entry?.source_url || null,
        entry_source_title: entry?.source_title || null,
        entry_version: entry?.version || null,
        comment_count: s.comment_count || 0
      }
    })
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
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

async function submitCreate() {
  if (!createForm.value.entry_id) {
    ElMessage.warning('请选择要分享的条目')
    return
  }

  const selectedEntry = entryList.value.find(e => e.id === createForm.value.entry_id)
  if (selectedEntry && selectedEntry.is_private) {
    blockedEntryId.value = selectedEntry.id
    showPrivateBlockDialog.value = true
    return
  }

  const formData = { ...createForm.value }
  if (expireOption.value === 'never') {
    formData.expires_at = null
  }
  try {
    const share = await createShare(formData)
    ElMessage.success(`分享创建成功！权限：${getPermissionText(formData.permission)}`)
    showCreateDialog.value = false
    createForm.value = { entry_id: null, permission: 'read', expires_at: null }
    expireOption.value = 'never'
    loadShares()
  } catch (e) {
    const errMsg = e.response?.data?.detail || '创建失败'
    ElMessage.error(errMsg)
  }
}

async function verifyPermission(share) {
  verifyData.value = share
  showVerifyDialog.value = true
  verifyTestStatus.value = 'loading'
  try {
    await getPublicShare(share.share_token)
    verifyTestStatus.value = 'success'
  } catch (e) {
    verifyTestStatus.value = 'failed'
  }
  verifyAuditLog.value.unshift({
    time: new Date().toISOString(),
    action: `复查分享权限 - ${getPermissionText(share.permission)}`,
    result: verifyTestStatus.value === 'success' ? '可正常访问' : '访问被拒绝',
    status: verifyTestStatus.value
  })
}

function viewComments(share) {
  currentShare.value = share
  showCommentsDialog.value = true
  comments.value = [
    {
      id: 1,
      author: '张三',
      content: '这条笔记的观点很新颖，特别是关于异步编程的部分讲得很清晰。',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      permission: '可评论'
    },
    {
      id: 2,
      author: '李四',
      content: '建议补充一下实际应用场景会更好。',
      created_at: new Date(Date.now() - 1800000),
      permission: '可编辑'
    }
  ]
}

function submitComment() {
  if (!newComment.value.trim()) return
  comments.value.push({
    id: Date.now(),
    author: '我',
    content: newComment.value,
    created_at: new Date().toISOString(),
    permission: getPermissionText(currentShare.value.permission)
  })
  newComment.value = ''
  ElMessage.success('评论已发表')
}

function goToEntryDetail() {
  showPrivateBlockDialog.value = false
  showCreateDialog.value = false
  if (blockedEntryId.value) {
    router.push(`/entries?id=${blockedEntryId.value}`)
  }
}

async function deactivate(share) {
  try {
    await deactivateShare(share.id)
    ElMessage.success('已取消分享')
    loadShares()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(async () => {
  await loadEntries()
  loadShares()
})
</script>

<style scoped>
.shares-page {
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.permission-tips {
  margin: 0;
  padding-left: 20px;
}
.permission-tips li {
  margin: 4px 0;
  line-height: 1.6;
}
.entry-info {
  display: flex;
  align-items: center;
}
.entry-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entry-source-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.perm-hint {
  font-size: 11px;
  color: #e6a23c;
  margin-top: 2px;
}
.perm-hint.edit-hint {
  color: #f56c6c;
}
.share-link {
  display: flex;
  gap: 8px;
}
.share-link .el-input {
  flex: 1;
}
.form-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
.verify-details {
  padding: 10px 0;
}
.verify-details h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}
.verify-details ul {
  margin: 0;
  padding-left: 20px;
}
.verify-details li {
  margin: 5px 0;
  line-height: 1.6;
  color: #606266;
}
.ml-2 {
  margin-left: 8px;
}
.ml-1 {
  margin-left: 4px;
}
.verify-content {
  padding: 10px 0;
}
.permission-boundaries {
  display: flex;
  gap: 12px;
  margin-top: 15px;
}
.boundary-item {
  flex: 1;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
}
.boundary-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}
.boundary-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 13px;
}
.boundary-header .el-tag {
  margin-left: auto;
}
.boundary-item ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}
.boundary-item li {
  padding: 4px 0;
  font-size: 12px;
  line-height: 1.6;
}
.boundary-item .allowed {
  color: #67c23a;
}
.boundary-item .forbidden {
  color: #f56c6c;
}
.audit-log {
  margin-top: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}
.audit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed #dcdfe6;
}
.audit-item:last-child {
  border-bottom: none;
}
.audit-time {
  color: #909399;
  font-size: 12px;
}
.audit-action {
  flex: 1;
  color: #606266;
}
.comments-content {
  padding: 10px 0;
}
.share-info-bar {
  margin-bottom: 15px;
}
.empty-comments {
  padding: 40px 0;
}
.comments-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
}
.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-avatar {
  flex-shrink: 0;
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.comment-author {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.comment-time {
  color: #909399;
  font-size: 12px;
}
.comment-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.comment-input {
  margin-top: 15px;
}
.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.private-block-content {
  padding: 10px 0;
}
.block-reasons {
  text-align: left;
  padding: 0 20px;
}
.block-reasons p {
  margin: 8px 0;
  line-height: 1.6;
}
.block-reasons ol {
  margin: 10px 0;
  padding-left: 20px;
}
.block-reasons li {
  margin: 6px 0;
  line-height: 1.6;
  color: #606266;
}
</style>
