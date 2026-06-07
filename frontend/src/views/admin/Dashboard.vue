<template>
  <div class="dashboard-page">
    <h2 class="page-title">事项运行健康度仪表盘</h2>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ dashboardData.overview?.totalApplications || 0 }}</div>
            <div class="stat-label">总受理量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ dashboardData.overview?.todayApplications || 0 }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ dashboardData.overview?.completionRate || '0%' }}</div>
            <div class="stat-label">办结率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon purple">
            <el-icon :size="24"><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ dashboardData.overview?.avgProcessingDays || 0 }}</div>
            <div class="stat-label">平均用时(天)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>近7天办件趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>办件状态分布</span>
          </template>
          <div ref="statusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>各部门办理情况</span>
          </template>
          <el-table :data="dashboardData.deptStats || []">
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="count" label="受理量" width="100" />
            <el-table-column prop="completed" label="已办结" width="100" />
            <el-table-column label="办结率" width="120">
              <template #default="{ row }">
                {{ row.count > 0 ? ((row.completed / row.count) * 100).toFixed(1) + '%' : '0%' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>用户统计</span>
          </template>
          <div class="user-stats">
            <div class="user-stat-item">
              <div class="user-stat-number">{{ dashboardData.overview?.totalUsers || 0 }}</div>
              <div class="user-stat-label">注册用户总数</div>
            </div>
            <div class="user-stat-item">
              <div class="user-stat-number">{{ dashboardData.overview?.verifiedUsers || 0 }}</div>
              <div class="user-stat-label">已实名用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/utils/api';
import * as echarts from 'echarts';

const dashboardData = ref<any>({ overview: {}, deptStats: [] });
const trendChartRef = ref<HTMLElement>();
const statusChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let statusChart: echarts.ECharts | null = null;

const loadDashboard = async () => {
  try {
    const res = await api.get('/admin/dashboard');
    if (res.code === 200) {
      dashboardData.value = res.data;
      initCharts();
    }
  } catch (error) {
    console.error('加载仪表盘数据失败', error);
  }
};

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    const trendData = dashboardData.value.weeklyTrend || [];
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: trendData.map((d: any) => d.date)
      },
      yAxis: { type: 'value' },
      series: [{
        data: trendData.map((d: any) => d.count),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        color: '#3b82f6'
      }]
    });
  }

  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value);
    const statusData = dashboardData.value.statusStats || [];
    const statusMap: Record<string, string> = {
      pending: '待受理',
      processing: '办理中',
      completed: '已办结',
      rejected: '已驳回'
    };
    statusChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: statusData.map((d: any) => ({
          name: statusMap[d.status] || d.status,
          value: d.count
        }))
      }]
    });
  }
};

const handleResize = () => {
  trendChart?.resize();
  statusChart?.resize();
};

onMounted(() => {
  loadDashboard();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  statusChart?.dispose();
});
</script>

<style scoped>
.page-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #1e293b;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
.stat-icon.green { background: linear-gradient(135deg, #10b981, #34d399); }
.stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 280px;
}

.bottom-row {
  margin-bottom: 20px;
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-stat-item {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.user-stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1e40af;
}

.user-stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}
</style>
