<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">数据概览</h1>
    </div>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #409EFF; font-weight: bold">{{ stats.leaderCount }}</div>
            <div style="color: #909399; margin-top: 10px">团长总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #67C23A; font-weight: bold">{{ stats.activityCount }}</div>
            <div style="color: #909399; margin-top: 10px">活动总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #E6A23C; font-weight: bold">{{ stats.orderCount }}</div>
            <div style="color: #909399; margin-top: 10px">订单总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #F56C6C; font-weight: bold">¥{{ stats.totalCommission }}</div>
            <div style="color: #909399; margin-top: 10px">累计佣金</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近团长</span>
          </template>
          <el-table :data="recentLeaders" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="community" label="社区" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近订单</span>
          </template>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="order_no" label="订单号" />
            <el-table-column prop="customer_name" label="客户" />
            <el-table-column prop="total_amount" label="金额">
              <template #default="{ row }">¥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { leadersAPI, activitiesAPI, ordersAPI, commissionsAPI } from '../api';

const props = defineProps({
  currentRole: {
    type: String,
    default: 'admin'
  }
});

const stats = ref({
  leaderCount: 0,
  activityCount: 0,
  orderCount: 0,
  totalCommission: 0
});

const recentLeaders = ref([]);
const recentOrders = ref([]);

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    confirmed: 'success',
    shipped: 'primary',
    refunded: 'danger'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    shipped: '已发货',
    refunded: '已退款'
  };
  return texts[status] || status;
};

const loadStats = async () => {
  try {
    const [leaders, activities, orders, commissions] = await Promise.all([
      leadersAPI.list(),
      activitiesAPI.list(),
      ordersAPI.list(),
      commissionsAPI.list()
    ]);
    
    stats.value.leaderCount = leaders.data?.length || 0;
    stats.value.activityCount = activities.data?.length || 0;
    stats.value.orderCount = orders.data?.length || 0;
    stats.value.totalCommission = (commissions.data || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0).toFixed(2);
    
    recentLeaders.value = (leaders.data || []).slice(0, 5);
    recentOrders.value = (orders.data || []).slice(0, 5);
  } catch (error) {
    console.error('加载统计数据失败', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>
