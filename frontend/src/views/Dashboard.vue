<template>
  <div class="dashboard">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <h3>{{ dashboard?.summary.totalAssets || 0 }}</h3>
          <p>资产总数</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>{{ formatCurrency(dashboard?.summary.totalValue || 0) }}</h3>
          <p>资产总值</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>{{ getStatusCount('IN_USE') }}</h3>
          <p>使用中</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-info">
          <h3>{{ getPendingCount() }}</h3>
          <p>待处理</p>
        </div>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <div class="chart-section">
        <h3>资产状态分布</h3>
        <div class="status-list">
          <div 
            v-for="item in dashboard?.statusCounts" 
            :key="item.status" 
            class="status-item"
          >
            <span class="status-label">{{ getStatusLabel(item.status) }}</span>
            <span class="status-value">{{ item.count }}</span>
          </div>
        </div>
      </div>
      
      <div class="chart-section">
        <h3>资产类型分布</h3>
        <div class="type-list">
          <div 
            v-for="item in dashboard?.typeCounts" 
            :key="item.assetType" 
            class="type-item"
          >
            <span class="type-label">{{ item.assetType }}</span>
            <span class="type-value">{{ item.count }}台 ({{ formatCurrency(item.totalValue) }})</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="recent-section">
      <h3>最近新增资产</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>资产编号</th>
            <th>资产名称</th>
            <th>类型</th>
            <th>价值</th>
            <th>状态</th>
            <th>入账时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in dashboard?.recentAssets" :key="asset.id">
            <td>{{ asset.assetCode }}</td>
            <td>{{ asset.assetName }}</td>
            <td>{{ asset.assetType }}</td>
            <td>{{ formatCurrency(asset.totalPrice) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(asset.status)]">
                {{ getStatusLabel(asset.status) }}
              </span>
            </td>
            <td>{{ formatDate(asset.createdAt) }}</td>
          </tr>
          <tr v-if="!dashboard?.recentAssets?.length">
            <td colspan="6" class="empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="monthly-section">
      <h3>月度资产趋势</h3>
      <div class="trend-chart">
        <div 
          v-for="item in dashboard?.monthlyTrend" 
          :key="item.month" 
          class="trend-item"
        >
          <div class="trend-bar" :style="{ height: getBarHeight(item.count) }"></div>
          <span class="trend-label">{{ item.month }}</span>
          <span class="trend-value">{{ item.count }}台</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { DashboardData, AssetStatus } from '@/types';
import { AssetStatusLabels } from '@/types';
import { reportApi } from '@/api';
import dayjs from 'dayjs';

const dashboard = ref<DashboardData | null>(null);
const maxCount = ref(1);

const loadDashboard = async () => {
  try {
    const result = await reportApi.getDashboard();
    if (result.success && result.data) {
      dashboard.value = result.data;
      maxCount.value = Math.max(...(result.data.monthlyTrend?.map(t => t.count) || [1]));
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value);
};

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const getStatusLabel = (status: string) => {
  return AssetStatusLabels[status as AssetStatus] || status;
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'PENDING_REGISTER': 'status-waiting',
    'PENDING_RECEIVE': 'status-waiting',
    'PENDING_DEPRECIATION': 'status-waiting',
    'PENDING_INVENTORY': 'status-waiting',
    'PENDING_TRANSFER': 'status-waiting',
    'PENDING_SCRAP': 'status-waiting',
    'IN_USE': 'status-success',
    'IN_DEPRECIATION': 'status-info',
    'TRANSFERRED': 'status-info',
    'SCRAPPED': 'status-danger',
    'REJECTED': 'status-danger',
    'CANCELLED': 'status-danger'
  };
  return classes[status] || 'status-waiting';
};

const getStatusCount = (status: string) => {
  return dashboard.value?.statusCounts?.find(s => s.status === status)?.count || 0;
};

const getPendingCount = () => {
  const pendingStatuses = ['PENDING_REGISTER', 'PENDING_RECEIVE', 'PENDING_DEPRECIATION', 'PENDING_INVENTORY', 'PENDING_TRANSFER', 'PENDING_SCRAP'];
  return pendingStatuses.reduce((sum, status) => sum + getStatusCount(status), 0);
};

const getBarHeight = (count: number) => {
  if (maxCount.value === 0) return '0px';
  return `${(count / maxCount.value) * 150}px`;
};

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 40px;
}

.stat-info h3 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-info p {
  font-size: 14px;
  color: #888;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.status-list, .type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item, .type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.status-label, .type-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.status-value, .type-value {
  font-size: 13px;
  color: #888;
}

.recent-section, .monthly-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.recent-section h3, .monthly-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #333;
}

.data-table tr:hover td {
  background: #f8fafc;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-waiting {
  background: #fef3c7;
  color: #d97706;
}

.status-success {
  background: #d1fae5;
  color: #059669;
}

.status-info {
  background: #dbeafe;
  color: #2563eb;
}

.status-danger {
  background: #fee2e2;
  color: #dc2626;
}

.empty-cell {
  text-align: center;
  color: #999;
  padding: 40px 0 !important;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 0;
  min-height: 200px;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.trend-bar {
  width: 40px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  margin-bottom: 10px;
  min-height: 4px;
}

.trend-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.trend-value {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
</style>
