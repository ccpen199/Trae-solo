<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card pending">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingUsers }}</div>
              <div class="stat-label">待审核用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card approved">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approvedUsers }}</div>
              <div class="stat-label">已审核用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card logistics">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalLogistics }}</div>
              <div class="stat-label">物流单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card unmatched">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unmatchedLogistics }}</div>
              <div class="stat-label">异常数据</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近物流单</span>
              <el-button type="primary" text @click="goToLogistics">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentLogistics" style="width: 100%" size="small">
            <el-table-column prop="logisticsNo" label="物流单号" width="150" />
            <el-table-column prop="goodsName" label="货物名称" />
            <el-table-column prop="initiatorEnterpriseName" label="发起企业" />
            <el-table-column prop="receiverEnterpriseName" label="接收企业" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ logisticsStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统日志</span>
              <el-button type="primary" text @click="goToLogs">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentLogs" style="width: 100%" size="small">
            <el-table-column prop="operationType" label="操作类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ operationTypeMap[row.operationType] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operationDesc" label="操作描述" show-overflow-tooltip />
            <el-table-column prop="username" label="操作用户" width="100" />
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '@/api/admin';
import { logisticsStatusMap, operationTypeMap, LogisticsStatus, OperationType } from '@/types';

const router = useRouter();

const stats = ref({
  pendingUsers: 0,
  approvedUsers: 0,
  totalLogistics: 0,
  unmatchedLogistics: 0,
});

const recentLogistics = ref<any[]>([]);
const recentLogs = ref<any[]>([]);

const getStatusType = (status: LogisticsStatus) => {
  const map: Record<LogisticsStatus, string> = {
    created: 'info',
    transit: 'primary',
    transferring: 'warning',
    delivered: 'success',
    abnormal: 'danger',
  };
  return map[status] || 'info';
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

const loadData = async () => {
  try {
    const [pendingResult, approvedResult, logisticsResult, logsResult] = await Promise.all([
      adminApi.getPendingUsers({ page: 1, pageSize: 1 }),
      adminApi.getApprovedUsers({ page: 1, pageSize: 1 }),
      adminApi.getLogistics({ page: 1, pageSize: 5 }),
      adminApi.getLogs({ page: 1, pageSize: 5 }),
    ]);

    stats.value.pendingUsers = pendingResult.data?.total || 0;
    stats.value.approvedUsers = approvedResult.data?.total || 0;
    stats.value.totalLogistics = logisticsResult.data?.total || 0;
    recentLogistics.value = logisticsResult.data?.orders || [];
    recentLogs.value = logsResult.data?.logs || [];
  } catch (error) {
    console.error('Load dashboard data error:', error);
  }
};

const goToLogistics = () => {
  router.push('/admin/logistics');
};

const goToLogs = () => {
  router.push('/admin/logs');
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending .stat-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #e65100;
}

.approved .stat-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #00897b;
}

.logistics .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.unmatched .stat-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-row {
  margin-bottom: 20px;
}
</style>
