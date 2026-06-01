<template>
  <div class="admin">
    <h2 class="mb-6">⚙️ 运营后台</h2>
    
    <div class="grid-2">
      <router-link to="/admin/resources" class="card admin-card">
        <div class="admin-icon">📚</div>
        <h3>资源管理</h3>
        <p class="text-gray">管理题目和课程资源，设置标签和难度</p>
      </router-link>
      
      <router-link to="/admin/students" class="card admin-card">
        <div class="admin-icon">👥</div>
        <h3>学生管理</h3>
        <p class="text-gray">查看学生画像和学习进度数据</p>
      </router-link>
    </div>

    <div class="card mt-6">
      <h3 class="mb-4">📊 系统概览</h3>
      <div class="grid-3">
        <div class="stat-item">
          <div class="stat-number text-primary">{{ stats.total_resources || 0 }}</div>
          <div class="stat-label">资源总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number text-success">{{ stats.active_students || 0 }}</div>
          <div class="stat-label">活跃学生</div>
        </div>
        <div class="stat-item">
          <div class="stat-number text-warning">{{ stats.today_recommendations || 0 }}</div>
          <div class="stat-label">今日推荐数</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58830'

const stats = ref({})

onMounted(async () => {
  const res = await axios.get(`${API_BASE}/api/admin/stats`)
  stats.value = res.data
})
</script>

<style scoped>
.admin-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.admin-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.admin-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: var(--gray-50);
  border-radius: 8px;
}
.stat-number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}
.stat-label {
  color: var(--gray-600);
  font-size: 14px;
}
</style>
