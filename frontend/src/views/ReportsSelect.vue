<template>
  <div class="reports-select-page">
    <div class="page-header">
      <h2>📊 统计报表</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <template v-else>
      <p class="page-hint">请选择要查看报表的项目：</p>
      <div v-if="projects.length === 0" class="empty-state">暂无项目</div>
      <div class="project-grid">
        <div
          v-for="p in projects"
          :key="p.id"
          class="project-card card"
          @click="$router.push(`/reports/${p.id}`)"
        >
          <div class="card-header">
            <span class="project-name">{{ p.name }}</span>
            <span class="badge" :class="`badge-${p.status}`">{{ statusLabel(p.status) }}</span>
          </div>
          <p class="project-desc">{{ p.description || '暂无描述' }}</p>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-value">{{ p.pages_count ?? 0 }}</span>
              <span class="stat-label">页面</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ p.versions_count ?? 0 }}</span>
              <span class="stat-label">版本</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ p.requirements_count ?? 0 }}</span>
              <span class="stat-label">需求</span>
            </div>
          </div>
          <div class="card-action">
            <button class="btn-primary btn-sm">查看报表 →</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchProjects } from '../api'

const projects = ref([])
const loading = ref(true)
const error = ref('')

function statusLabel(status) {
  const map = { active: '进行中', archived: '已归档', pending: '待启动', completed: '已完成' }
  return map[status] || status
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

onMounted(loadData)
</script>

<style scoped>
.reports-select-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  color: var(--color-primary);
  font-size: 20px;
}

.page-hint {
  color: var(--color-text-light);
  margin-bottom: 20px;
  font-size: 14px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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
  margin-bottom: 16px;
  flex: 1;
}

.card-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-light);
}

.card-action {
  text-align: right;
}
</style>
