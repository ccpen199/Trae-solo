<template>
  <Layout>
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>订单列表</span>
          <div>
            <el-select v-model="filterStatus" placeholder="全部状态" style="width: 150px; margin-right: 10px;" @change="loadOrders">
              <el-option label="全部" value="" />
              <el-option label="待派单" value="pending" />
              <el-option label="已派单" value="driver_assigned" />
              <el-option label="司机已接单" value="driver_accepted" />
              <el-option label="行程中" value="in_progress" />
              <el-option label="已到达" value="arrived" />
              <el-option label="已支付" value="payment_completed" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="orders" v-loading="loading" style="width: 100%" @row-click="viewOrder">
        <el-table-column prop="order_no" label="订单号" min-width="180" />
        <el-table-column label="乘客" min-width="120">
          <template #default="scope">
            {{ scope.row.passenger_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="司机" min-width="120">
          <template #default="scope">
            {{ scope.row.driver_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="start_address" label="出发地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="end_address" label="目的地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="预估价格" min-width="100">
          <template #default="scope">
            <span style="color: #409eff;">¥{{ scope.row.estimated_price || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实际价格" min-width="100">
          <template #default="scope">
            <span style="color: #f56c6c;">¥{{ scope.row.actual_price || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="170">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="orders.length === 0 && !loading" class="empty-container">
        暂无订单数据
      </div>
    </el-card>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';
import { orderApi } from '../api';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const orders = ref([]);
const filterStatus = ref('');

const loadOrders = async () => {
  if (!userStore.user) return;

  loading.value = true;
  try {
    let result;
    
    if (userStore.isPassenger) {
      result = await orderApi.getPassengerOrders(
        userStore.profile.id,
        filterStatus.value || undefined
      );
    } else if (userStore.isDriver) {
      result = await orderApi.getDriverOrders(
        userStore.profile.id,
        filterStatus.value || undefined
      );
    } else {
      result = await dashboardApi.getOverview();
      orders.value = result.success ? [...(result.pendingOrders || []), ...(result.activeOrders || [])] : [];
      return;
    }

    if (result.success) {
      orders.value = result.orders || [];
    }
  } catch (error) {
    console.error('Load orders error:', error);
  } finally {
    loading.value = false;
  }
};

const viewOrder = (row) => {
  router.push(`/order/${row.id}`);
};

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'driver_assigned': 'info',
    'driver_accepted': 'primary',
    'in_progress': 'success',
    'arrived': 'warning',
    'payment_completed': 'success',
    'completed': 'success',
    'cancelled': 'danger'
  };
  return map[status] || 'info';
};

const getStatusName = (status) => {
  const map = {
    'pending': '待派单',
    'driver_assigned': '已派单',
    'driver_accepted': '司机已接单',
    'in_progress': '行程中',
    'arrived': '已到达',
    'payment_completed': '已支付',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return map[status] || status;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadOrders();
});
</script>
