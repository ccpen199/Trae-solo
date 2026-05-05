<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card production" @click="goToProduction">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.production }}</div>
              <div class="stat-label">生产物流单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card initiator" @click="goToInitiator">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Truck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.initiator }}</div>
              <div class="stat-label">发起物流单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card transfer" @click="goToTransfer">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Transfer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.transfer }}</div>
              <div class="stat-label">中转物流单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card receiver" @click="goToReceiver">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.receiver }}</div>
              <div class="stat-label">接收物流单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近物流单</span>
              <el-button type="primary" text @click="goToLogistics">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%" size="small">
            <el-table-column prop="logisticsNo" label="物流单号" width="150" />
            <el-table-column prop="goodsName" label="货物名称" />
            <el-table-column prop="initiatorEnterpriseName" label="发起企业" show-overflow-tooltip />
            <el-table-column prop="receiverEnterpriseName" label="接收企业" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ logisticsStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToCreate">
              <el-icon><Plus /></el-icon>
              新增物流单
            </el-button>
            <el-button type="success" size="large" @click="goToUpload">
              <el-icon><Upload /></el-icon>
              上传Excel
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { logisticsService, logisticsApi } from '@/api/logistics';
import { logisticsStatusMap, LogisticsStatus, EnterpriseType } from '@/types';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const enterpriseType = computed(() => userStore.userInfo?.enterprise?.enterpriseType);

const stats = ref({
  production: 0,
  initiator: 0,
  transfer: 0,
  receiver: 0,
});

const recentOrders = ref<any[]>([]);

const getDefaultTabByEnterpriseType = (type?: EnterpriseType): string => {
  const map: Record<EnterpriseType, string> = {
    production: 'production',
    logistics: 'initiator',
    transfer: 'transfer',
    receiver: 'receiver',
  };
  return type ? map[type] : 'initiator';
};

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
    const categories = ['production', 'initiator', 'transfer', 'receiver'] as const;
    const results = await Promise.all(
      categories.map(cat => logisticsApi.getList(cat, { page: 1, pageSize: 1 }))
    );

    stats.value.production = results[0].data?.total || 0;
    stats.value.initiator = results[1].data?.total || 0;
    stats.value.transfer = results[2].data?.total || 0;
    stats.value.receiver = results[3].data?.total || 0;

    const defaultTab = getDefaultTabByEnterpriseType(enterpriseType.value);
    const recentResult = await logisticsApi.getList(defaultTab as any, { page: 1, pageSize: 5 });
    recentOrders.value = recentResult.data?.orders || [];
  } catch (error) {
    console.error('Load dashboard data error:', error);
  }
};

const goToLogistics = () => {
  const defaultTab = getDefaultTabByEnterpriseType(enterpriseType.value);
  router.push(`/enterprise/logistics/${defaultTab}`);
};

const goToCreate = () => {
  router.push('/enterprise/logistics/create');
};

const goToUpload = () => {
  router.push('/enterprise/logistics/upload');
};

const goToProduction = () => {
  router.push('/enterprise/logistics/production');
};

const goToInitiator = () => {
  router.push('/enterprise/logistics/initiator');
};

const goToTransfer = () => {
  router.push('/enterprise/logistics/transfer');
};

const goToReceiver = () => {
  router.push('/enterprise/logistics/receiver');
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

.production .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.initiator .stat-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
}

.transfer .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.receiver .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quick-actions .el-button {
  height: 60px;
}
</style>
