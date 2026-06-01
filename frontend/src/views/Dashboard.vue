<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">工作台</span>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon blue"><el-icon size="32"><Document /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.sops }}</div>
              <div class="stat-label">作业指导书</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon green"><el-icon size="32"><List /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-label">待执行工单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon orange"><el-icon size="32"><VideoPlay /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.inProgressOrders }}</div>
              <div class="stat-label">执行中工单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon red"><el-icon size="32"><Bell /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.notifications }}</div>
              <div class="stat-label">变更通知</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>最近工单</span>
              <el-button type="text" size="small" @click="$router.push('/work-execution')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="order_no" label="工单号" width="120" />
            <el-table-column prop="product_name" label="产品" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>待审核SOP</span>
              <el-button type="text" size="small" @click="$router.push('/sops')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingSOPs" size="small">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="version" label="版本" width="80" />
            <el-table-column prop="product_name" label="产品" width="100" />
            <el-table-column prop="creator_name" label="创建人" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const stats = ref({ sops: 0, pendingOrders: 0, inProgressOrders: 0, notifications: 0 });
const recentOrders = ref([]);
const pendingSOPs = ref([]);

const statusType = (status) => {
  const types = { pending: 'info', in_progress: 'warning', completed: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { pending: '待执行', in_progress: '执行中', completed: '已完成' };
  return texts[status] || status;
};

const loadData = async () => {
  try {
    const [sopsRes, ordersRes] = await Promise.all([
      api.get('/sops'),
      api.get('/work-orders')
    ]);
    
    stats.value.sops = sopsRes.data.length;
    stats.value.pendingOrders = ordersRes.data.filter(o => o.status === 'pending').length;
    stats.value.inProgressOrders = ordersRes.data.filter(o => o.status === 'in_progress').length;
    stats.value.notifications = 0;
    
    recentOrders.value = ordersRes.data.slice(0, 5);
    pendingSOPs.value = sopsRes.data.filter(s => s.status === 'pending_review').slice(0, 5);
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadData);
</script>

<style scoped>
.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.blue { background: #409EFF; }
.stat-icon.green { background: #67C23A; }
.stat-icon.orange { background: #E6A23C; }
.stat-icon.red { background: #F56C6C; }

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
</style>
