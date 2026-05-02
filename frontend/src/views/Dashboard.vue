<template>
  <Layout>
    <div>
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value" style="color: #409eff;">{{ dashboard.realTime?.pendingOrders || 0 }}</div>
            <div class="stat-label">待派单</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ dashboard.realTime?.activeOrders || 0 }}</div>
            <div class="stat-label">进行中订单</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value" style="color: #67c23a;">¥{{ dashboard.today?.revenue || 0 }}</div>
            <div class="stat-label">今日收入</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ dashboard.realTime?.pendingExceptions || 0 }}</div>
            <div class="stat-label">待处理异常</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="page-card">
            <template #header>
              <span>实时订单看板</span>
            </template>
            
            <el-tabs v-model="activeTab">
              <el-tab-pane label="待派单" name="pending">
                <div v-if="dashboard.pendingOrders?.length === 0" class="empty-container">
                  暂无待派单
                </div>
                <div v-else>
                  <div v-for="order in dashboard.pendingOrders" :key="order.id" class="order-card" @click="viewOrder(order.id)">
                    <el-card shadow="hover">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: bold; margin-bottom: 8px;">{{ order.order_no }}</div>
                          <div style="font-size: 13px; color: #606266; margin-bottom: 5px;">
                            <strong>出发:</strong> {{ order.start_address }}
                          </div>
                          <div style="font-size: 13px; color: #606266;">
                            <strong>目的地:</strong> {{ order.end_address }}
                          </div>
                        </div>
                        <div style="text-align: right;">
                          <el-tag type="warning">待派单</el-tag>
                          <div style="font-size: 12px; color: #909399; margin-top: 10px;">
                            乘客: {{ order.passenger_name }}
                          </div>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="进行中" name="active">
                <div v-if="dashboard.activeOrders?.length === 0" class="empty-container">
                  暂无进行中订单
                </div>
                <div v-else>
                  <div v-for="order in dashboard.activeOrders" :key="order.id" class="order-card" @click="viewOrder(order.id)">
                    <el-card shadow="hover">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: bold; margin-bottom: 8px;">{{ order.order_no }}</div>
                          <div style="font-size: 13px; color: #606266; margin-bottom: 5px;">
                            <strong>出发:</strong> {{ order.start_address }}
                          </div>
                          <div style="font-size: 13px; color: #606266;">
                            <strong>目的地:</strong> {{ order.end_address }}
                          </div>
                        </div>
                        <div style="text-align: right;">
                          <el-tag :type="getStatusType(order.status)">{{ getStatusName(order.status) }}</el-tag>
                          <div style="font-size: 12px; color: #909399; margin-top: 10px;">
                            司机: {{ order.driver_name }} ({{ order.car_plate }})
                          </div>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="page-card">
            <template #header>
              <span>在线司机</span>
            </template>
            <div v-if="dashboard.activeDrivers?.length === 0" class="empty-container">
              暂无在线司机
            </div>
            <div v-else>
              <div v-for="driver in dashboard.activeDrivers" :key="driver.id" style="margin-bottom: 15px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: bold;">{{ driver.driver_name }}</div>
                    <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                      {{ driver.car_model }} · {{ driver.car_plate }}
                    </div>
                  </div>
                  <el-tag :type="getDriverStatusType(driver.status)">
                    {{ getDriverStatusName(driver.status) }}
                  </el-tag>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 12px; color: #909399;">
                  <span>评分: {{ driver.rating }} ⭐</span>
                  <span>接单: {{ driver.order_count }} 单</span>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="page-card">
            <template #header>
              <span>今日统计</span>
            </template>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #409eff;">{{ dailyStats.summary?.totalOrders || 0 }}</div>
                <div style="font-size: 12px; color: #909399;">总订单</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #67c23a;">{{ dailyStats.summary?.completedOrders || 0 }}</div>
                <div style="font-size: 12px; color: #909399;">已完成</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #f56c6c;">{{ dailyStats.rates?.conversionRate || 0 }}%</div>
                <div style="font-size: 12px; color: #909399;">转化率</div>
              </div>
            </div>
            <el-progress :percentage="dailyStats.rates?.conversionRate || 0" :color="getProgressColor(dailyStats.rates?.conversionRate)" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';
import { dashboardApi } from '../api';

const router = useRouter();

const activeTab = ref('pending');
const dashboard = ref({});
const dailyStats = ref({});

const loadDashboard = async () => {
  try {
    const [overviewResult, dailyResult] = await Promise.all([
      dashboardApi.getOverview(),
      dashboardApi.getDailyStats()
    ]);
    
    if (overviewResult.success) {
      dashboard.value = overviewResult;
    }
    if (dailyResult.success) {
      dailyStats.value = dailyResult;
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
  }
};

const viewOrder = (orderId) => {
  router.push(`/order/${orderId}`);
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

const getDriverStatusType = (status) => {
  const map = {
    'idle': 'success',
    'assigned': 'warning',
    'in_ride': 'primary',
    'offline': 'info'
  };
  return map[status] || 'info';
};

const getDriverStatusName = (status) => {
  const map = {
    'idle': '空闲',
    'assigned': '已派单',
    'in_ride': '接单中',
    'offline': '离线'
  };
  return map[status] || status;
};

const getProgressColor = (rate) => {
  if (rate >= 80) return '#67c23a';
  if (rate >= 50) return '#409eff';
  if (rate >= 30) return '#e6a23c';
  return '#f56c6c';
};

onMounted(() => {
  loadDashboard();
});
</script>
