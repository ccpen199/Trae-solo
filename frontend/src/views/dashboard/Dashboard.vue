<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalTickets || 0 }}</div>
              <div class="stat-label">工单总数</div>
            </div>
            <div class="stat-icon" style="background: #409eff;">
              <el-icon :size="32"><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #f56c6c;">{{ stats.activeAlerts || 0 }}</div>
              <div class="stat-label">活跃告警</div>
            </div>
            <div class="stat-icon" style="background: #f56c6c;">
              <el-icon :size="32"><Bell /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #e6a23c;">{{ stats.pendingMessages || 0 }}</div>
              <div class="stat-label">待办消息</div>
            </div>
            <div class="stat-icon" style="background: #e6a23c;">
              <el-icon :size="32"><Message /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #67c23a;">{{ ruleCount }}</div>
              <div class="stat-label">告警规则</div>
            </div>
            <div class="stat-icon" style="background: #67c23a;">
              <el-icon :size="32"><Setting /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>工单状态分布</span>
          </template>
          <div ref="statusChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>节点分布</span>
          </template>
          <div ref="nodeChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>工单趋势 (近7天)</span>
          </template>
          <div ref="trendChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>告警级别分布</span>
          </template>
          <div ref="severityChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近工单</span>
              <el-button type="primary" link @click="router.push('/tickets')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="stats.recentTickets || []" style="width: 100%">
            <el-table-column prop="ticket_no" label="工单号" width="160">
              <template #default="{ row }">
                <el-button type="primary" link @click="router.push(`/tickets/${row.id}`)">
                  {{ row.ticket_no }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近告警</span>
              <el-button type="primary" link @click="router.push('/alerts')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="stats.recentAlerts || []" style="width: 100%">
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="severity" label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="getSeverityType(row.severity)">
                  {{ getSeverityLabel(row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'firing' ? 'danger' : 'success'">
                  {{ row.status === 'firing' ? '触发中' : '已解决' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="last_triggered_at" label="触发时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.last_triggered_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { Document, Bell, Message, Setting } from '@element-plus/icons-vue';
import { dashboardApi, ruleApi } from '@/api';
import dayjs from 'dayjs';

const router = useRouter();

const stats = ref({});
const ruleCount = ref(0);

const statusChartRef = ref(null);
const nodeChartRef = ref(null);
const trendChartRef = ref(null);
const severityChartRef = ref(null);

let statusChart = null;
let nodeChart = null;
let trendChart = null;
let severityChart = null;

const fetchStats = async () => {
  try {
    const result = await dashboardApi.getStats();
    stats.value = result.data;
    
    const ruleResult = await ruleApi.getList({ status: 1, pageSize: 1 });
    ruleCount.value = ruleResult.data.pagination?.total || 0;
    
    renderCharts();
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    pending_rules: 'warning',
    pending_alert: 'warning',
    alerting: 'danger',
    processing: 'primary',
    pending_review: 'warning',
    resolved: 'success',
    closed: 'info',
    cancelled: 'info',
    blocked: 'danger'
  };
  return typeMap[status] || 'info';
};

const getStatusLabel = (status) => {
  const labelMap = {
    draft: '草稿',
    pending_rules: '待规则',
    pending_alert: '待告警',
    alerting: '告警中',
    processing: '处理中',
    pending_review: '待复盘',
    resolved: '已解决',
    closed: '已关闭',
    cancelled: '已取消',
    blocked: '已阻塞'
  };
  return labelMap[status] || status;
};

const getSeverityType = (severity) => {
  const typeMap = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  };
  return typeMap[severity] || 'info';
};

const getSeverityLabel = (severity) => {
  const labelMap = {
    critical: '严重',
    warning: '警告',
    info: '信息'
  };
  return labelMap[severity] || severity;
};

const renderCharts = async () => {
  try {
    const [statusData, nodeData, trendData, severityData] = await Promise.all([
      dashboardApi.getTicketsByStatus(),
      dashboardApi.getTicketsByNode(),
      dashboardApi.getTicketsTrend({ days: 7 }),
      dashboardApi.getAlertsBySeverity()
    ]);

    if (statusChartRef.value) {
      statusChart = echarts.init(statusChartRef.value);
      statusChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: statusData.data.map(item => ({
            name: getStatusLabel(item.status),
            value: item.count
          }))
        }]
      });
    }

    if (nodeChartRef.value) {
      nodeChart = echarts.init(nodeChartRef.value);
      nodeChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: {
          type: 'category',
          data: nodeData.data.map(item => getNodeLabel(item.current_node)),
          axisLabel: { rotate: 30 }
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: nodeData.data.map(item => item.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }]
      });
    }

    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value);
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: trendData.data.map(item => item.date)
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          data: trendData.data.map(item => item.count),
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.8)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
            ])
          },
          lineStyle: { color: '#667eea', width: 2 }
        }]
      });
    }

    if (severityChartRef.value) {
      severityChart = echarts.init(severityChartRef.value);
      severityChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          type: 'pie',
          radius: '60%',
          data: severityData.data.map(item => ({
            name: getSeverityLabel(item.severity),
            value: item.count,
            itemStyle: {
              color: item.severity === 'critical' ? '#f56c6c' : 
                     item.severity === 'warning' ? '#e6a23c' : '#909399'
            }
          }))
        }]
      });
    }
  } catch (error) {
    console.error('渲染图表失败:', error);
  }
};

const getNodeLabel = (node) => {
  const labelMap = {
    collect: '采集指标',
    rules: '设置规则',
    alert: '触发告警',
    notify: '通知处理',
    review: '复盘',
    closed: '已关闭'
  };
  return labelMap[node] || node;
};

const handleResize = () => {
  statusChart?.resize();
  nodeChart?.resize();
  trendChart?.resize();
  severityChart?.resize();
};

onMounted(() => {
  fetchStats();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  statusChart?.dispose();
  nodeChart?.dispose();
  trendChart?.dispose();
  severityChart?.dispose();
});
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
