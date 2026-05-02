<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>仪表盘</h2>
      <p>航空货运管理系统概览</p>
    </div>

    <div class="stats-cards" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          📦
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalWaybills }}</div>
          <div class="stat-label">总运单数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          📋
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingTodos }}</div>
          <div class="stat-label">待办事项</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          🔔
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.unreadNotifications }}</div>
          <div class="stat-label">未读消息</div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="section-card">
        <div class="section-header">
          <h3>运单状态分布</h3>
        </div>
        <div class="status-list" v-if="stats?.statusCounts">
          <div
            v-for="(count, status) in stats.statusCounts"
            :key="status"
            class="status-item"
            v-if="count > 0"
          >
            <span
              class="status-badge"
              :style="{ backgroundColor: getStatusColor(status) + '20', color: getStatusColor(status) }"
            >
              {{ getStatusDisplay(status) }}
            </span>
            <span class="status-count">{{ count }} 单</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无运单数据</p>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <h3>快捷操作</h3>
        </div>
        <div class="quick-actions">
          <router-link to="/waybills/create" class="action-btn primary" v-if="canCreateBooking">
            <span class="action-icon">➕</span>
            <span>新建订舱</span>
          </router-link>
          <router-link to="/waybills" class="action-btn">
            <span class="action-icon">📋</span>
            <span>运单列表</span>
          </router-link>
          <router-link to="/todos" class="action-btn">
            <span class="action-icon">✅</span>
            <span>待办处理</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>系统信息</h3>
      </div>
      <div class="system-info">
        <div class="info-item">
          <span class="info-label">后端地址</span>
          <span class="info-value">http://localhost:11169</span>
        </div>
        <div class="info-item">
          <span class="info-label">前端地址</span>
          <span class="info-value">http://localhost:11691</span>
        </div>
        <div class="info-item">
          <span class="info-label">数据库</span>
          <span class="info-value">SQLite (data/app.sqlite)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { systemApi } from '@/api';
import { STATUS_DISPLAY_MAP, STATUS_COLOR_MAP, WaybillStatus, UserRole } from '@/types';
import { getCurrentUser } from '@/router';

const stats = ref<any>(null);
const loading = ref(false);

const canCreateBooking = computed(() => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === UserRole.FORWARDER || user.role === UserRole.ADMIN;
});

function getStatusDisplay(status: string): string {
  return STATUS_DISPLAY_MAP[status as WaybillStatus] || status;
}

function getStatusColor(status: string): string {
  return STATUS_COLOR_MAP[status as WaybillStatus] || '#8c8c8c';
}

async function loadStats() {
  loading.value = true;
  try {
    stats.value = await systemApi.getDashboard();
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    stats.value = {
      totalWaybills: 0,
      statusCounts: {},
      pendingTodos: 0,
      unreadNotifications: 0,
    };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #8c8c8c;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #262626;
  line-height: 1;
}

.stat-label {
  color: #8c8c8c;
  font-size: 14px;
  margin-top: 4px;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.status-count {
  color: #262626;
  font-weight: 600;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fafafa;
  border-radius: 8px;
  text-decoration: none;
  color: #262626;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  transform: translateX(4px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

.action-icon {
  font-size: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
}

.system-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.info-label {
  color: #8c8c8c;
}

.info-value {
  color: #262626;
  font-weight: 500;
  font-family: monospace;
}
</style>
