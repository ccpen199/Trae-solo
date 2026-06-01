<template>
  <div class="review-canvas-page">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <template v-else>
      <div class="review-topbar">
        <div class="topbar-left">
          <router-link :to="`/project/${review.project_id}`" class="btn-secondary btn-sm">← 返回项目</router-link>
          <router-link to="/reviews" class="btn-secondary btn-sm">← 评审列表</router-link>
          <h3 class="review-title">{{ review.title || '评审 #' + review.id }}</h3>
          <span class="badge" :class="`badge-${review.status}`">{{ statusLabel(review.status) }}</span>
          <select v-model="statusUpdate" @change="handleStatusChange" class="status-select">
            <option value="scheduled">已排期</option>
            <option value="in_progress">评审中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="topbar-right">
          <div class="participants">
            <span class="participant-label">👥 参与人 ({{ participants.length }}):</span>
            <span v-for="p in participants" :key="p.id" class="participant-chip">
              {{ p.user_name }} ({{ roleLabel(p.role) }})
              <button class="chip-remove" @click.stop="handleRemoveParticipant(p.id)">✕</button>
            </span>
            <button class="btn-primary btn-sm" @click="showAddParticipant = !showAddParticipant">
              {{ showAddParticipant ? '取消' : '+ 添加' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAddParticipant" class="add-participant-bar card">
        <input v-model="newParticipantName" placeholder="参与者姓名" class="sm-input" @keyup.enter="handleAddParticipant" />
        <select v-model="newParticipantRole" class="sm-select">
          <option value="designer">设计师</option>
          <option value="pm">产品经理</option>
          <option value="dev">研发</option>
          <option value="tester">测试</option>
          <option value="business">业务</option>
          <option value="reviewer">评审人</option>
        </select>
        <button class="btn-primary btn-sm" @click="handleAddParticipant" :disabled="!newParticipantName.trim()">添加</button>
        <button class="btn-secondary btn-sm" @click="showAddParticipant = false">取消</button>
      </div>

      <div class="review-summary card">
        <div class="summary-item">
          <span class="summary-label">项目：</span>
          <span class="summary-value">{{ review.project_name || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">评审时间：</span>
          <span class="summary-value">{{ formatTime(review.scheduled_at) || '未排期' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">评论总数：</span>
          <span class="summary-value">{{ comments.length }} 条</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">待处理：</span>
          <span class="summary-value open-count">{{ openComments.length }} 条</span>
        </div>
      </div>

      <div class="canvas-layout">
        <div class="canvas-area" ref="canvasRef" @click="handleCanvasClick">
          <div class="design-canvas">
            <div class="canvas-header">
              <span>🖼️ 设计稿画布</span>
              <span v-if="versionInfo" class="version-badge">v{{ versionInfo.version_number }} - {{ changeTypeLabel(versionInfo.change_type) }}</span>
            </div>
            <div class="canvas-content">
              <div class="canvas-placeholder">
                <div class="placeholder-icon">📄</div>
                <div class="placeholder-text">设计稿预览区域</div>
                <div class="placeholder-hint" v-if="!isAddingAnnotation">点击右侧「+ 新评论」开始圈选标注</div>
                <div class="placeholder-hint active" v-else>在画布上点击放置标注点</div>
              </div>

              <div
                v-for="(comment, cIdx) in comments"
                :key="comment.id"
                class="annotation"
                :class="{ active: selectedCommentId === comment.id, resolved: comment.status === 'resolved' || comment.status === 'wontfix' }"
                :style="annotationStyle(comment)"
                @click.stop="selectComment(comment.id)"
              >
                <span class="annotation-marker">{{ cIdx + 1 }}</span>
                <div class="annotation-tooltip">
                  <div class="tooltip-title">#{{ cIdx + 1 }} {{ issueIcon(comment.issue_type) }} {{ comment.issue_type }}</div>
                  <div class="tooltip-content">{{ comment.content }}</div>
                  <div class="tooltip-meta">{{ commentStatusLabel(comment.status) }} · {{ priorityLabel(comment.priority) }}</div>
                </div>
              </div>

              <div
                v-if="isAddingAnnotation && newAnnotation.x > 0 && newAnnotation.y > 0"
                class="annotation new"
                :style="annotationStyle(newAnnotation)"
              >
                <span class="annotation-marker">+</span>
              </div>
            </div>
          </div>
        </div>

        <div class="comment-sidebar">
          <div class="sidebar-header">
            <h4>💬 评论列表</h4>
            <div class="sidebar-stats">
              <span class="stat open">{{ openComments.length }} 待处理</span>
              <span class="stat total">{{ comments.length }} 总评论</span>
            </div>
          </div>

          <div v-if="participants.length === 0" class="alert-bar">
            <div class="alert-icon">👥</div>
            <div class="alert-content">
              <div class="alert-title">还没有添加参与者</div>
              <div class="alert-desc">请先添加评审参与者，然后开始圈选标注和评论</div>
            </div>
            <button class="btn-primary btn-sm" @click="showAddParticipant = true">+ 添加参与者</button>
          </div>

          <div v-if="review.status === 'scheduled' && participants.length > 0" class="alert-bar info">
            <div class="alert-icon">⏱️</div>
            <div class="alert-content">
              <div class="alert-title">评审已排期</div>
              <div class="alert-desc">参与者已就位，点击右上角状态切换为"评审中"开始</div>
            </div>
            <button class="btn-primary btn-sm" @click="startReview">开始评审</button>
          </div>

          <div v-if="review.version_id === null && participants.length > 0" class="alert-bar warning">
            <div class="alert-icon">📄</div>
            <div class="alert-content">
              <div class="alert-title">未关联版本</div>
              <div class="alert-desc">建议关联一个设计稿版本，方便追溯</div>
            </div>
          </div>

          <div class="sidebar-actions">
            <button class="btn-primary" @click="startAddComment" :disabled="isAddingAnnotation">
              {{ isAddingAnnotation ? '正在圈选...' : '+ 新评论' }}
            </button>
            <button v-if="isAddingAnnotation" class="btn-secondary" @click="cancelAddComment">
              取消
            </button>
          </div>

          <div v-if="isAddingAnnotation" class="comment-form card">
            <h5>📝 添加标注与评论</h5>
            <div class="form-info">
              <span class="info-item">📍 位置: ({{ newAnnotation.x.toFixed(1) }}%, {{ newAnnotation.y.toFixed(1) }}%)</span>
              <span class="info-item">点击画布可重新定位</span>
            </div>
            <div class="form-group">
              <label>标注区域大小</label>
              <div class="size-row">
                <input v-model.number="newAnnotation.width" type="number" min="2" max="40" class="sm-input" />
                <span>%</span>
                <span class="size-x">×</span>
                <input v-model.number="newAnnotation.height" type="number" min="2" max="40" class="sm-input" />
                <span>%</span>
              </div>
            </div>
            <div class="form-group">
              <label>评论内容 *</label>
              <textarea v-model="commentForm.content" rows="3" placeholder="详细描述问题..." @keyup.ctrl.enter="submitComment"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>问题类型</label>
                <select v-model="commentForm.issue_type">
                  <option value="layout">📐 布局</option>
                  <option value="color">🎨 颜色</option>
                  <option value="text">📝 文字</option>
                  <option value="typography">📝 排版</option>
                  <option value="interaction">👆 交互</option>
                  <option value="ux">👆 用户体验</option>
                  <option value="icon">🎨 图标</option>
                  <option value="other">❓ 其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>优先级</label>
                <select v-model="commentForm.priority">
                  <option value="critical">🔴 紧急</option>
                  <option value="high">🟠 高</option>
                  <option value="medium">🟡 中</option>
                  <option value="low">🟢 低</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>指派给</label>
              <select v-model="commentForm.assignee">
                <option value="">-- 请选择 --</option>
                <option v-for="p in participants" :key="p.id" :value="p.user_name">
                  {{ p.user_name }} ({{ roleLabel(p.role) }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>创建人</label>
              <input v-model="commentForm.created_by" placeholder="输入您的姓名" />
            </div>
            <div class="form-actions">
              <button class="btn-secondary" @click="cancelAddComment">取消</button>
              <button class="btn-primary" @click="submitComment" :disabled="!commentForm.content.trim()">提交评论 (Ctrl+Enter)</button>
            </div>
          </div>

          <div class="comment-list">
            <div
              v-for="(comment, cIdx) in comments"
              :key="comment.id"
              class="comment-card"
              :class="{
                highlighted: selectedCommentId === comment.id,
                resolved: comment.status === 'resolved' || comment.status === 'wontfix',
                open: comment.status === 'open',
                in_progress: comment.status === 'in_progress'
              }"
              @click="selectComment(comment.id)"
            >
              <div class="comment-header">
                <span class="comment-marker">#{{ cIdx + 1 }}</span>
                <span class="issue-icon">{{ issueIcon(comment.issue_type) }}</span>
                <span class="issue-type">{{ issueTypeLabel(comment.issue_type) }}</span>
                <span class="badge" :class="priorityClass(comment.priority)">{{ priorityLabel(comment.priority) }}</span>
                <span class="badge" :class="`badge-${comment.status}`">{{ commentStatusLabel(comment.status) }}</span>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
              <div class="comment-meta">
                <span class="meta-author">👤 {{ comment.created_by || '匿名' }}</span>
                <span class="meta-time">🕐 {{ formatTime(comment.created_at) }}</span>
                <span v-if="comment.assignee" class="meta-assignee">→ {{ comment.assignee }}</span>
                <span v-if="comment.x" class="meta-pos">📍 ({{ comment.x.toFixed(0) }}%, {{ comment.y.toFixed(0) }}%)</span>
              </div>

              <div v-if="commentResolutions[comment.id] && commentResolutions[comment.id].length" class="resolution-history">
                <div class="history-title">📋 决议记录</div>
                <div
                  v-for="res in commentResolutions[comment.id]"
                  :key="res.id"
                  class="resolution-item"
                  :class="`resolution-${res.action}`"
                >
                  <span class="resolution-icon">{{ resolutionIcon(res.action) }}</span>
                  <span class="resolution-text">
                    <strong>{{ resolutionLabel(res.action) }}</strong>
                    <span v-if="res.note"> - {{ res.note }}</span>
                  </span>
                  <span class="resolution-meta">
                    by {{ res.created_by || '匿名' }} · {{ formatTime(res.created_at) }}
                  </span>
                  <div v-if="res.action === 'fixed' && !res.confirmed" class="resolution-confirm">
                    <span class="confirm-hint">等待确认修复...</span>
                    <button class="btn-success btn-sm" @click.stop="handleConfirmFix(res.id)">✓ 确认已修复</button>
                  </div>
                  <div v-if="res.action === 'fixed' && res.confirmed" class="resolution-confirmed">
                    ✅ 已由 {{ res.confirmed_by || '评审人' }} 确认 · {{ formatTime(res.confirmed_at) }}
                  </div>
                </div>
              </div>

              <div class="resolution-section">
                <div class="resolution-label">处理决议：</div>
                <div class="resolution-actions">
                  <button class="btn-success btn-sm" @click.stop="handleResolution(comment.id, 'adopted')">✓ 采纳</button>
                  <button class="btn-warning btn-sm" @click.stop="handleResolution(comment.id, 'deferred')">⏳ 暂缓</button>
                  <button class="btn-danger btn-sm" @click.stop="handleResolution(comment.id, 'rejected')">✕ 拒绝</button>
                  <button class="btn-primary btn-sm" @click.stop="handleResolution(comment.id, 'fixed')">🔧 已修复</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="comments.length === 0 && !isAddingAnnotation" class="empty-state">
            <div class="empty-icon">💬</div>
            <div class="empty-text">暂无评论</div>
            <div class="empty-hint">点击上方「+ 新评论」按钮开始</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchReview, updateReview, addParticipant, removeParticipant,
  fetchComments, createComment, updateComment,
  createResolution, fetchResolutions, confirmFix,
  fetchVersion
} from '../api'

const props = defineProps({ id: [String, Number] })
const router = useRouter()

const review = ref({})
const comments = ref([])
const participants = ref([])
const versionInfo = ref(null)
const commentResolutions = reactive({})
const loading = ref(true)
const error = ref('')
const statusUpdate = ref('')
const selectedCommentId = ref(null)
const isAddingAnnotation = ref(false)
const canvasRef = ref(null)
const showAddParticipant = ref(false)
const newParticipantName = ref('')
const newParticipantRole = ref('reviewer')

const newAnnotation = reactive({ x: 0, y: 0, width: 10, height: 8 })
const commentForm = ref({
  content: '',
  issue_type: 'layout',
  priority: 'medium',
  assignee: '',
  created_by: ''
})

const openComments = computed(() => comments.value.filter(c => c.status === 'open' || c.status === 'in_progress'))

function annotationStyle(ann) {
  return {
    left: (ann.x || 10) + '%',
    top: (ann.y || 10) + '%',
    width: (ann.width || 10) + '%',
    height: (ann.height || 8) + '%'
  }
}

function statusLabel(status) {
  const map = { scheduled: '已排期', in_progress: '评审中', completed: '已完成' }
  return map[status] || status
}

function commentStatusLabel(status) {
  const map = { open: '未处理', in_progress: '处理中', resolved: '已解决', wontfix: '不修复' }
  return map[status] || status
}

function issueTypeLabel(type) {
  const map = { layout: '布局', color: '颜色', text: '文字', typography: '排版', interaction: '交互', ux: '用户体验', icon: '图标', other: '其他' }
  return map[type] || type
}

function priorityLabel(p) {
  const map = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return map[p] || p
}

function priorityClass(p) {
  const map = { critical: 'badge-cancelled', high: 'badge-cancelled', medium: 'badge-pending', low: 'badge-active' }
  return map[p] || ''
}

function issueIcon(type) {
  const map = { layout: '📐', color: '🎨', text: '📝', typography: '📝', interaction: '👆', ux: '👆', icon: '🎨', other: '❓' }
  return map[type] || '💬'
}

function resolutionLabel(action) {
  const map = { adopted: '采纳', deferred: '暂缓', rejected: '拒绝', fixed: '已修复' }
  return map[action] || action
}

function resolutionIcon(action) {
  const map = { adopted: '✓', deferred: '⏳', rejected: '✕', fixed: '🔧' }
  return map[action] || ''
}

function roleLabel(role) {
  const map = { designer: '设计师', pm: '产品经理', dev: '研发', tester: '测试', business: '业务', reviewer: '评审人' }
  return map[role] || role
}

function changeTypeLabel(t) {
  const map = { create: '新增', update: '修改', delete: '删除' }
  return map[t] || t
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN')
}

function selectComment(commentId) {
  selectedCommentId.value = selectedCommentId.value === commentId ? null : commentId
}

function handleCanvasClick(e) {
  if (!isAddingAnnotation.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  newAnnotation.x = Math.max(5, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100))
  newAnnotation.y = Math.max(5, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100))
}

function startAddComment() {
  isAddingAnnotation.value = true
  selectedCommentId.value = null
  newAnnotation.x = 30
  newAnnotation.y = 30
}

function cancelAddComment() {
  isAddingAnnotation.value = false
  newAnnotation.x = 0
  newAnnotation.y = 0
  commentForm.value = {
    content: '',
    issue_type: 'layout',
    priority: 'medium',
    assignee: '',
    created_by: ''
  }
}

async function submitComment() {
  if (!commentForm.value.content.trim()) return
  try {
    await createComment(props.id, {
      content: commentForm.value.content,
      issue_type: commentForm.value.issue_type,
      priority: commentForm.value.priority,
      assignee: commentForm.value.assignee || null,
      x: newAnnotation.x,
      y: newAnnotation.y,
      width: newAnnotation.width,
      height: newAnnotation.height,
      version_id: review.value.version_id || null,
      created_by: commentForm.value.created_by || '匿名',
      status: 'open'
    })
    cancelAddComment()
    await loadComments()
  } catch (e) {
    alert('提交评论失败: ' + e.message)
  }
}

async function handleResolution(commentId, action) {
  const note = prompt(`请输入决议说明（可选）：`)
  if (note === null) return
  try {
    const createdBy = prompt('请输入您的姓名：', '评审人') || '评审人'
    await createResolution(commentId, {
      action,
      note: note || '',
      created_by: createdBy
    })
    if (action === 'fixed') {
      await updateComment(commentId, { status: 'resolved' })
    } else if (action === 'adopted') {
      await updateComment(commentId, { status: 'in_progress' })
    } else if (action === 'rejected') {
      await updateComment(commentId, { status: 'wontfix' })
    }
    await loadComments()
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

async function handleConfirmFix(resolutionId) {
  const confirmedBy = prompt('请输入确认人姓名：', '评审人') || '评审人'
  try {
    await confirmFix(resolutionId, {
      reviewer: confirmedBy,
      confirmed: 1,
      note: '修复已确认'
    })
    await loadComments()
  } catch (e) {
    alert('确认失败: ' + e.message)
  }
}

async function handleStatusChange() {
  try {
    await updateReview(props.id, { status: statusUpdate.value })
    review.value.status = statusUpdate.value
  } catch (e) {
    alert('更新状态失败: ' + e.message)
    statusUpdate.value = review.value.status
  }
}

async function handleAddParticipant() {
  if (!newParticipantName.value.trim()) return
  try {
    await addParticipant(props.id, {
      user_name: newParticipantName.value.trim(),
      role: newParticipantRole.value
    })
    newParticipantName.value = ''
    newParticipantRole.value = 'reviewer'
    showAddParticipant.value = false
    await loadParticipants()
  } catch (e) {
    alert('添加参与者失败: ' + e.message)
  }
}

async function handleRemoveParticipant(participantId) {
  if (!confirm('确定移除此参与者？')) return
  try {
    await removeParticipant(props.id, participantId)
    await loadParticipants()
  } catch (e) {
    alert('移除失败: ' + e.message)
  }
}

async function startReview() {
  try {
    await updateReview(props.id, { status: 'in_progress' })
    review.value.status = 'in_progress'
    statusUpdate.value = 'in_progress'
  } catch (e) {
    alert('开始评审失败: ' + e.message)
  }
}

async function loadReview() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchReview(props.id)
    review.value = data || {}
    statusUpdate.value = data.status || 'scheduled'
    participants.value = data.participants || []
    if (data.version_id) {
      try {
        versionInfo.value = await fetchVersion(data.version_id)
      } catch (e) {
        console.warn('加载版本信息失败:', e)
      }
    }
  } catch (e) {
    error.value = '加载评审失败: ' + e.message
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  try {
    comments.value = await fetchComments(props.id)
    for (const c of comments.value) {
      await loadCommentResolutions(c.id)
    }
  } catch (e) {
    console.error('加载评论失败:', e)
    comments.value = []
  }
}

async function loadCommentResolutions(commentId) {
  try {
    const res = await fetchResolutions(commentId)
    commentResolutions[commentId] = res || []
  } catch (e) {
    commentResolutions[commentId] = []
  }
}

async function loadParticipants() {
  try {
    const data = await fetchReview(props.id)
    participants.value = (data || {}).participants || []
    review.value.participants = participants.value
  } catch (e) {
    console.error('加载参与者失败:', e)
  }
}

onMounted(async () => {
  await loadReview()
  await loadComments()
})
</script>

<style scoped>
.review-canvas-page {
  max-width: 1600px;
  margin: 0 auto;
}

.review-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.review-title {
  font-size: 16px;
  color: var(--color-primary);
  font-weight: 600;
}

.status-select {
  padding: 4px 10px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.topbar-right {
  display: flex;
  align-items: center;
}

.participants {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.participant-label {
  font-size: 13px;
  color: var(--color-text-light);
  margin-right: 4px;
}

.participant-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #edf2f7;
  padding: 2px 6px 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.chip-remove {
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0 4px;
  font-size: 12px;
  border-radius: 50%;
}

.chip-remove:hover {
  background: var(--color-danger);
  color: #fff;
}

.add-participant-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.review-summary {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.summary-label {
  color: var(--color-text-light);
}

.summary-value {
  font-weight: 500;
  color: var(--color-primary);
}

.open-count {
  color: var(--color-danger);
  font-weight: 600;
}

.canvas-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
  align-items: start;
}

.canvas-area {
  min-height: 600px;
}

.design-canvas {
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  height: 100%;
  min-height: 600px;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
}

.version-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.canvas-content {
  position: relative;
  padding: 20px;
  min-height: 540px;
  background: repeating-linear-gradient(
    45deg,
    #f8fafc,
    #f8fafc 10px,
    #f1f5f9 10px,
    #f1f5f9 20px
  );
}

.canvas-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: #fff;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.placeholder-text {
  font-size: 18px;
  color: var(--color-text-light);
  margin-bottom: 8px;
}

.placeholder-hint {
  font-size: 13px;
  color: var(--color-text-light);
}

.placeholder-hint.active {
  color: var(--color-primary);
  font-weight: 500;
}

.annotation {
  position: absolute;
  border: 2px solid var(--color-danger);
  background: rgba(229, 62, 62, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.annotation:hover,
.annotation.active {
  background: rgba(229, 62, 62, 0.3);
  border-color: var(--color-critical);
  z-index: 20;
}

.annotation.resolved {
  border-color: var(--color-success);
  background: rgba(56, 161, 105, 0.1);
}

.annotation.resolved:hover,
.annotation.resolved.active {
  background: rgba(56, 161, 105, 0.3);
}

.annotation.new {
  border-color: var(--color-info);
  border-style: dashed;
  background: rgba(49, 130, 206, 0.1);
  z-index: 30;
}

.annotation-marker {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 24px;
  height: 24px;
  background: var(--color-danger);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  box-shadow: var(--shadow);
}

.annotation.resolved .annotation-marker {
  background: var(--color-success);
}

.annotation.new .annotation-marker {
  background: var(--color-info);
}

.annotation-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 100;
  margin-bottom: 8px;
}

.annotation:hover .annotation-tooltip {
  opacity: 1;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-content {
  max-width: 200px;
  white-space: normal;
  word-break: break-word;
  margin-bottom: 4px;
}

.tooltip-meta {
  font-size: 11px;
  opacity: 0.8;
}

.comment-sidebar {
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  position: sticky;
  top: 80px;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--color-primary);
}

.sidebar-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.stat.open {
  color: var(--color-danger);
  font-weight: 500;
}

.stat.total {
  color: var(--color-text-light);
}

.sidebar-actions {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 8px;
}

.sidebar-actions .btn-primary {
  flex: 1;
}

.comment-form {
  margin: 12px;
  padding: 14px;
}

.comment-form h5 {
  margin: 0 0 12px 0;
  color: var(--color-primary);
  font-size: 14px;
}

.form-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--color-text-light);
}

.size-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-x {
  color: var(--color-text-light);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.comment-card {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--color-bg);
  border-radius: var(--radius);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.comment-card:hover {
  background: #edf2f7;
}

.comment-card.highlighted {
  border-left-color: var(--color-primary);
  background: #ebf4ff;
}

.comment-card.resolved {
  opacity: 0.6;
}

.comment-card.open {
  border-left-color: var(--color-danger);
}

.comment-card.in_progress {
  border-left-color: var(--color-warning);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.comment-marker {
  background: var(--color-primary);
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.issue-icon {
  font-size: 14px;
}

.issue-type {
  font-size: 12px;
  color: var(--color-text-light);
}

.comment-content {
  font-size: 13px;
  margin: 6px 0;
  line-height: 1.5;
}

.comment-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--color-text-light);
}

.meta-assignee {
  color: var(--color-primary);
  font-weight: 500;
}

.resolution-history {
  margin: 10px 0;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border-left: 2px solid var(--color-border);
}

.history-title {
  font-size: 11px;
  color: var(--color-text-light);
  margin-bottom: 6px;
}

.resolution-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
}

.resolution-adopted {
  background: rgba(56, 161, 105, 0.1);
  border-left: 3px solid var(--color-success);
}

.resolution-deferred {
  background: rgba(214, 158, 46, 0.1);
  border-left: 3px solid var(--color-warning);
}

.resolution-rejected {
  background: rgba(229, 62, 62, 0.1);
  border-left: 3px solid var(--color-danger);
}

.resolution-fixed {
  background: rgba(49, 130, 206, 0.1);
  border-left: 3px solid var(--color-info);
}

.resolution-text {
  margin-right: 8px;
}

.resolution-meta {
  font-size: 11px;
  color: var(--color-text-light);
}

.resolution-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--color-border);
}

.confirm-hint {
  font-size: 11px;
  color: var(--color-warning);
  font-weight: 500;
}

.resolution-confirmed {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--color-border);
  font-size: 11px;
  color: var(--color-success);
  font-weight: 500;
}

.resolution-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border);
}

.resolution-label {
  font-size: 11px;
  color: var(--color-text-light);
  margin-bottom: 6px;
}

.resolution-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.resolution-actions .btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 15px;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
}

.alert-bar {
  margin: 0 12px 12px;
  padding: 12px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: var(--radius);
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.alert-bar.info {
  background: #ebf8ff;
  border-color: #bee3f8;
}

.alert-bar.warning {
  background: #fffbeb;
  border-color: #fcd34d;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-danger);
  margin-bottom: 2px;
}

.alert-bar.info .alert-title {
  color: #2b6cb0;
}

.alert-bar.warning .alert-title {
  color: #b7791f;
}

.alert-desc {
  font-size: 12px;
  color: var(--color-text-light);
}

@media (max-width: 1200px) {
  .canvas-layout {
    grid-template-columns: 1fr;
  }

  .comment-sidebar {
    max-height: none;
    position: static;
  }
}
</style>
