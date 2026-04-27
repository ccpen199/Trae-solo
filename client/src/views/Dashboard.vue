<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">实时看板</h2>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <div class="metric-card metric-card-blue">
          <div class="metric-value">{{ stats.totalWorkOrders }}</div>
          <div class="metric-label">总工单</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card metric-card-green">
          <div class="metric-value">{{ stats.activeWorkOrders }}</div>
          <div class="metric-label">进行中</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card metric-card-orange">
          <div class="metric-value">{{ stats.abnormalCount }}</div>
          <div class="metric-label">待处理异常</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card metric-card-purple">
          <div class="metric-value">{{ stats.completedToday }}</div>
          <div class="metric-label">今日完成</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">生产进度</span>
              <el-button type="primary" link @click="loadWorkOrders">刷新</el-button>
            </div>
          </template>
          <el-table :data="activeWorkOrders" v-loading="loading" border stripe>
            <el-table-column prop="workOrderNo" label="工单号" width="140" />
            <el-table-column prop="productName" label="产品名称" />
            <el-table-column prop="plannedQty" label="计划数量" width="100" />
            <el-table-column prop="actualQty" label="完成数量" width="100" />
            <el-table-column label="进度" width="180">
              <template #default="scope">
                <div class="progress-bar-container">
                  <el-progress
                    :percentage="getProgress(scope.row)"
                    :status="getProgressStatus(scope.row)"
                    :stroke-width="10"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <span :class="getStatusClass(scope.row.status)">
                  {{ getStatusLabel(scope.row.status) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">设备状态</span>
            </div>
          </template>
          <div v-loading="loading">
            <el-empty description="暂无设备数据" />
          </div>
        </el-card>
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">最新异常</span>
              <el-button type="primary" link @click="loadAbnormals">刷新</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <div v-for="abnormal in recentAbnormals" :key="abnormal.id" class="kanban-card">
              <div class="kanban-card-header">
                <span class="kanban-card-title">{{ abnormal.title || abnormal.description }}</span>
                <span :class="'status-tag status-tag-' + getAbnormalStatusClass(abnormal.status)">
                  {{ getAbnormalStatusLabel(abnormal.status) }}
                </span>
              </div>
              <div class="kanban-card-meta">
                <span>类型: {{ getAbnormalTypeLabel(abnormal.type) }}</span>
                <span>工单: {{ abnormal.workOrderNo || '-' }}</span>
              </div>
            </div>
            <el-empty v-if="recentAbnormals.length === 0" description="暂无异常" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { workOrderApi } from '@/api/workOrder';
import { abnormalApi } from '@/api/abnormal';
import { WorkOrderStatus, WorkOrderStatusLabels, AbnormalStatus, AbnormalStatusLabels, AbnormalType, AbnormalTypeLabels } from '@/types';

const loading = ref(false);
const activeWorkOrders = ref<any[]>([]);
const recentAbnormals = ref<any[]>([]);

const stats = ref({
  totalWorkOrders: 0,
  activeWorkOrders: 0,
  abnormalCount: 0,
  completedToday: 0,
});

const loadWorkOrders = async () => {
  loading.value = true;
  try {
    const response = await workOrderApi.getList({ pageSize: 10 });
    activeWorkOrders.value = response.data?.list || [];
    stats.value.totalWorkOrders = response.data?.total || 0;
    stats.value.activeWorkOrders = activeWorkOrders.value.filter(
      (w) => w.status === WorkOrderStatus.IN_PRODUCTION || w.status === WorkOrderStatus.PENDING_PRODUCTION
    ).length;
  } catch (e) {
    console.error('加载工单失败:', e);
  } finally {
    loading.value = false;
  }
};

const loadAbnormals = async () => {
  try {
    const response = await abnormalApi.getList({ pageSize: 5 });
    recentAbnormals.value = response.data?.list || [];
    stats.value.abnormalCount = recentAbnormals.value.filter(
      (a) => a.status === AbnormalStatus.REPORTED || a.status === AbnormalStatus.IN_PROGRESS
    ).length;
  } catch (e) {
    console.error('加载异常失败:', e);
  }
};

const getProgress = (row: any) => {
  if (!row.plannedQty || row.plannedQty === 0) return 0;
  return Math.round(((row.actualQty || 0) / row.plannedQty) * 100);
};

const getProgressStatus = (row: any) => {
  const progress = getProgress(row);
  if (progress === 100) return 'success';
  if (progress > 0) return '';
  return 'exception';
};

const getStatusLabel = (status: string) => WorkOrderStatusLabels[status as keyof typeof WorkOrderStatusLabels] || status;
const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [WorkOrderStatus.DRAFT]: 'status-tag-info',
    [WorkOrderStatus.PENDING_PRODUCTION]: 'status-tag-warning',
    [WorkOrderStatus.IN_PRODUCTION]: 'status-tag-primary',
    [WorkOrderStatus.COMPLETED]: 'status-tag-success',
    [WorkOrderStatus.CANCELLED]: 'status-tag-danger',
  };
  return 'status-tag ' + (classMap[status] || 'status-tag-info');
};

const getAbnormalStatusLabel = (status: string) =>
  AbnormalStatusLabels[status as keyof typeof AbnormalStatusLabels] || status;
const getAbnormalStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [AbnormalStatus.PENDING]: 'danger',
    [AbnormalStatus.REPORTED]: 'danger',
    [AbnormalStatus.IN_PROGRESS]: 'warning',
    [AbnormalStatus.RESOLVED]: 'success',
    [AbnormalStatus.CLOSED]: 'info',
  };
  return classMap[status] || 'info';
};

const getAbnormalTypeLabel = (type: string) => AbnormalTypeLabels[type as keyof typeof AbnormalTypeLabels] || type;

onMounted(() => {
  loadWorkOrders();
  loadAbnormals();
});
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.metric-card {
  padding: 20px;
  border-radius: 8px;
  color: #fff;
  text-align: center;
}

.metric-card-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-card-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.metric-card-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-card-purple {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  opacity: 0.9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}

.progress-bar-container {
  padding: 0 10px;
}

.kanban-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
}

.kanban-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kanban-card-title {
  font-weight: bold;
  color: #303133;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kanban-card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag-primary {
  background: #ecf5ff;
  color: #409eff;
}

.status-tag-success {
  background: #f0f9eb;
  color: #67c23a;
}

.status-tag-warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-tag-info {
  background: #f4f4f5;
  color: #909399;
}

.status-tag-danger {
  background: #fef0f0;
  color: #f56c6c;
}

.status-tag-success {
  background: #f0f9eb;
  color: #67c23a;
}

.status-tag-warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-tag-danger {
  background: #fef0f0;
  color: #f56c6c;
}

.status-tag-info {
  background: #f4f4f5;
  color: #909399;
}
</style>
