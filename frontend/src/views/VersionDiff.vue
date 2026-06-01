<template>
  <div class="version-diff-page">
    <div class="diff-header">
      <button class="btn-secondary btn-sm" @click="$router.back()">← 返回</button>
      <h2>版本对比</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>
    <template v-else>
      <div class="diff-summary card">
        <div class="summary-items">
          <span class="summary-item new">🟢 新增 {{ diffData.new_count || 0 }}</span>
          <span class="summary-item deleted">🔴 删除 {{ diffData.deleted_count || 0 }}</span>
          <span class="summary-item changed">🟡 改动 {{ diffData.changed_count || 0 }}</span>
          <span class="summary-item">💬 未解决评论 {{ diffData.unresolved_count || 0 }}</span>
        </div>
      </div>

      <div class="diff-side-by-side">
        <div class="diff-side" :class="`border-${changeTypeClass(versionA.change_type)}`">
          <div class="side-header">
            <span class="version-label">版本 A</span>
            <span class="version-tag">v{{ versionA.version_number || '?' }}</span>
            <span class="badge" :class="changeTypeBadge(versionA.change_type)">{{ changeTypeLabel(versionA.change_type) }}</span>
          </div>
          <div class="side-body">
            <div class="side-field">
              <span class="field-label">描述:</span>
              {{ versionA.description || '暂无描述' }}
            </div>
            <div class="side-field">
              <span class="field-label">创建者:</span>
              {{ versionA.created_by || '未知' }}
            </div>
            <div class="side-field">
              <span class="field-label">创建时间:</span>
              {{ formatTime(versionA.created_at) }}
            </div>
          </div>
          <div class="side-comments" v-if="versionA.comments && versionA.comments.length">
            <h5>未解决评论</h5>
            <div v-for="c in versionA.comments" :key="c.id" class="diff-comment">
              <span class="issue-icon">{{ issueIcon(c.issue_type) }}</span>
              <span class="badge" :class="priorityClass(c.priority)">{{ priorityLabel(c.priority) }}</span>
              <span class="comment-text">{{ c.content }}</span>
            </div>
          </div>
        </div>

        <div class="diff-side" :class="`border-${changeTypeClass(versionB.change_type)}`">
          <div class="side-header">
            <span class="version-label">版本 B</span>
            <span class="version-tag">v{{ versionB.version_number || '?' }}</span>
            <span class="badge" :class="changeTypeBadge(versionB.change_type)">{{ changeTypeLabel(versionB.change_type) }}</span>
          </div>
          <div class="side-body">
            <div class="side-field">
              <span class="field-label">描述:</span>
              {{ versionB.description || '暂无描述' }}
            </div>
            <div class="side-field">
              <span class="field-label">创建者:</span>
              {{ versionB.created_by || '未知' }}
            </div>
            <div class="side-field">
              <span class="field-label">创建时间:</span>
              {{ formatTime(versionB.created_at) }}
            </div>
          </div>
          <div class="side-comments" v-if="versionB.comments && versionB.comments.length">
            <h5>未解决评论</h5>
            <div v-for="c in versionB.comments" :key="c.id" class="diff-comment">
              <span class="issue-icon">{{ issueIcon(c.issue_type) }}</span>
              <span class="badge" :class="priorityClass(c.priority)">{{ priorityLabel(c.priority) }}</span>
              <span class="comment-text">{{ c.content }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchVersionDiff } from '../api'

const props = defineProps({ v1: [String, Number], v2: [String, Number] })

const loading = ref(true)
const error = ref('')
const diffData = ref({})
const versionA = ref({})
const versionB = ref({})

function changeTypeLabel(t) {
  const map = { new: '新增', create: '新增', modified: '修改', update: '修改', deleted: '删除', delete: '删除' }
  return map[t] || t || '未知'
}

function changeTypeBadge(t) {
  const map = { new: 'badge-active', create: 'badge-active', modified: 'badge-pending', update: 'badge-pending', deleted: 'badge-cancelled', delete: 'badge-cancelled' }
  return map[t] || ''
}

function changeTypeClass(t) {
  const map = { new: 'new', create: 'new', modified: 'changed', update: 'changed', deleted: 'deleted', delete: 'deleted' }
  return map[t] || ''
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
  const map = { layout: '📐', color: '🎨', text: '📝', typography: '📝', interaction: '👆', icon: '🎨', ux: '👆', content: '📝', other: '❓' }
  return map[type] || '💬'
}

function formatTime(ts) {
  if (!ts) return '未知'
  return new Date(ts).toLocaleString('zh-CN')
}

async function loadDiff() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchVersionDiff(props.v1, props.v2)
    const data = res || {}
    diffData.value = data
    versionA.value = data.version_a || {}
    versionB.value = data.version_b || {}
    versionA.value.comments = (data.comments_a || []).filter(c => c.status === 'open')
    versionB.value.comments = (data.comments_b || []).filter(c => c.status === 'open')
    const typeA = versionA.value.change_type
    const typeB = versionB.value.change_type
    diffData.value.new_count = typeB === 'create' ? 1 : 0
    diffData.value.deleted_count = typeA === 'delete' || typeB === 'delete' ? 1 : 0
    diffData.value.changed_count = typeB === 'update' ? 1 : 0
    diffData.value.unresolved_count = (versionA.value.comments.length || 0) + (versionB.value.comments.length || 0)
  } catch (e) {
    error.value = '加载版本对比失败: ' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadDiff)
</script>

<style scoped>
.version-diff-page {
  max-width: 1200px;
  margin: 0 auto;
}

.diff-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.diff-header h2 {
  color: var(--color-primary);
  font-size: 20px;
}

.diff-summary {
  margin-bottom: 20px;
  padding: 16px;
}

.summary-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-item {
  font-size: 14px;
  font-weight: 500;
}

.summary-item.new { color: var(--color-success); }
.summary-item.deleted { color: var(--color-danger); }
.summary-item.changed { color: var(--color-warning); }

.diff-side-by-side {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.diff-side {
  background: var(--color-bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  border-top: 4px solid var(--color-border);
}

.diff-side.border-new {
  border-top-color: var(--color-success);
}

.diff-side.border-changed {
  border-top-color: var(--color-warning);
}

.diff-side.border-deleted {
  border-top-color: var(--color-danger);
}

.side-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.version-label {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 15px;
}

.version-tag {
  background: var(--color-primary);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.side-body {
  padding: 16px;
}

.side-field {
  font-size: 14px;
  margin-bottom: 8px;
}

.field-label {
  color: var(--color-text-light);
  margin-right: 6px;
}

.side-comments {
  padding: 0 16px 16px;
}

.side-comments h5 {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.diff-comment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
}

.diff-comment:last-child {
  border-bottom: none;
}

.issue-icon {
  font-size: 14px;
}

.comment-text {
  flex: 1;
  color: var(--color-text);
}
</style>
