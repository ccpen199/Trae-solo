<template>
  <div class="review-list-page">
    <div class="page-header">
      <h2>🔍 评审工作台</h2>
      <div class="header-actions">
        <select v-model="statusFilter" class="sm-select">
          <option value="">全部状态</option>
          <option value="scheduled">已排期</option>
          <option value="in_progress">评审中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <template v-else>
      <div v-if="filteredReviews.length === 0" class="empty-state">暂无评审记录</div>
      <div class="review-grid">
        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="review-card card"
          @click="$router.push(`/review/${review.id}`)"
        >
          <div class="review-header">
            <div class="review-title">
              <span class="review-name">{{ review.title || '评审 #' + review.id }}</span>
              <span class="badge" :class="`badge-${review.status}`">{{ statusLabel(review.status) }}</span>
            </div>
            <div class="review-project">{{ review.project_name || '未关联项目' }}</div>
          </div>

          <div class="review-info">
            <div class="info-row">
              <span>📅 {{ formatTime(review.scheduled_at) || '未排期' }}</span>
              <span>📝 {{ review.comment_count }} 条评论</span>
              <span v-if="review.open_comment_count" class="open-count">⚠️ {{ review.open_comment_count }} 待处理</span>
            </div>
          </div>

          <div class="review-participants">
            <span class="label">参与人：</span>
            <span
              v-for="p in review.participants"
              :key="p.id"
              class="participant-chip"
            >
              {{ p.user_name }} ({{ roleLabel(p.role) }})
            </span>
            <span v-if="!review.participants || review.participants.length === 0" class="none-text">暂无参与人</span>
          </div>

          <div class="review-actions">
            <button class="btn-primary btn-sm" @click.stop="$router.push(`/review/${review.id}`)">
              进入评审
            </button>
            <button
              v-if="review.project_id"
              class="btn-secondary btn-sm"
              @click.stop="$router.push(`/project/${review.project_id}`)"
            >
              查看项目
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAllReviews } from '../api'

const reviews = ref([])
const loading = ref(true)
const error = ref('')
const statusFilter = ref('')

const filteredReviews = computed(() => {
  if (statusFilter.value) {
    return reviews.value.filter(r => r.status === statusFilter.value)
  }
  return reviews.value
})

function statusLabel(status) {
  const map = { scheduled: '已排期', in_progress: '评审中', completed: '已完成' }
  return map[status] || status
}

function roleLabel(role) {
  const map = { designer: '设计师', pm: '产品经理', dev: '研发', tester: '测试', business: '业务', reviewer: '评审人' }
  return map[role] || role
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN')
}

async function loadReviews() {
  loading.value = true
  error.value = ''
  try {
    reviews.value = await fetchAllReviews()
  } catch (e) {
    error.value = '加载评审列表失败: ' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadReviews)
</script>

<style scoped>
.review-list-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  color: var(--color-primary);
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.review-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.review-header {
  margin-bottom: 12px;
}

.review-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.review-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-primary);
}

.review-project {
  font-size: 13px;
  color: var(--color-text-light);
}

.review-info {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--color-bg);
  border-radius: var(--radius);
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text);
}

.open-count {
  color: var(--color-danger);
  font-weight: 500;
}

.review-participants {
  margin-bottom: 12px;
  font-size: 13px;
}

.review-participants .label {
  color: var(--color-text-light);
  margin-right: 6px;
}

.participant-chip {
  display: inline-block;
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-right: 4px;
}

.none-text {
  color: var(--color-text-light);
}

.review-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}
</style>
