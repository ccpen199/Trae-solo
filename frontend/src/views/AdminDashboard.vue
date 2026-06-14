<template>
  <div>
    <div class="page-header admin-header">
      <div>
        <h2>🛠️ 管理后台</h2>
        <p style="color: #909399;">服务运行、业务风险、接口调用与审核任务总览</p>
      </div>
      <div class="admin-actions">
        <el-button type="primary" @click="$router.push('/search')">
          <el-icon><Search /></el-icon>
          企业查询
        </el-button>
        <el-button @click="$router.push('/saas/rules')">
          <el-icon><Setting /></el-icon>
          风控规则
        </el-button>
        <el-button @click="$router.push('/credit')">
          <el-icon><Star /></el-icon>
          信用审核
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="card-shadow admin-metric">
          <span>企业总数</span>
          <strong>{{ stats.enterprises || dashboardStats.total_enterprises || 0 }}</strong>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="card-shadow admin-metric danger">
          <span>高风险企业</span>
          <strong>{{ stats.high_risk_enterprises || 0 }}</strong>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="card-shadow admin-metric warning">
          <span>待审核修复</span>
          <strong>{{ stats.pending_repairs || 0 }}</strong>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="card-shadow admin-metric">
          <span>API 调用</span>
          <strong>{{ stats.api_calls || logsTotal }}</strong>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :xs="24" :lg="8">
        <el-card class="card-shadow">
          <template #header>
            <span style="font-weight: bold;">风险分布</span>
          </template>
          <div class="risk-bars">
            <div v-for="item in riskDistribution" :key="item.risk_level" class="risk-bar-row">
              <span>{{ item.risk_level }}</span>
              <el-progress
                :percentage="riskPercent(item.count)"
                :color="getRiskColor(item.risk_level)"
                :format="() => `${item.count} 家`"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-card class="card-shadow">
          <template #header>
            <span style="font-weight: bold;">最新经营异常</span>
          </template>
          <el-table :data="latestAlerts" v-loading="loading" stripe>
            <el-table-column prop="enterprise_name" label="企业名称" min-width="180" />
            <el-table-column prop="abnormal_type" label="异常类型" width="140" />
            <el-table-column prop="abnormal_reason" label="原因" min-width="240" />
            <el-table-column prop="decision_date" label="决定日期" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow">
      <template #header>
        <div class="admin-table-header">
          <span style="font-weight: bold;">最近 API 调用</span>
          <el-button size="small" @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="apiLogs" v-loading="loading" stripe>
        <el-table-column prop="method" label="方法" width="90">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.method === 'GET' ? 'success' : 'warning'">
              {{ scope.row.method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="endpoint" label="接口" min-width="220" />
        <el-table-column prop="status_code" label="状态" width="90">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.status_code >= 400 ? 'danger' : 'success'">
              {{ scope.row.status_code }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="response_time" label="耗时" width="100">
          <template #default="scope">{{ scope.row.response_time }} ms</template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { adminApi } from '@/utils/api';
import { Refresh, Search, Setting, Star } from '@element-plus/icons-vue';

const loading = ref(false);
const adminStats = ref({ stats: {} });
const adminDashboard = ref({ stats: {}, riskDistribution: [], latestAlerts: [] });
const apiLogs = ref([]);
const logsTotal = ref(0);

const stats = computed(() => adminStats.value.stats || {});
const dashboardStats = computed(() => adminDashboard.value.stats || {});
const riskDistribution = computed(() => adminDashboard.value.riskDistribution || []);
const latestAlerts = computed(() => adminDashboard.value.latestAlerts || []);
const totalRiskCount = computed(() => riskDistribution.value.reduce((sum, item) => sum + item.count, 0));

const riskPercent = (count) => {
  if (!totalRiskCount.value) return 0;
  return Math.round((count / totalRiskCount.value) * 100);
};

const getRiskColor = (level) => {
  if (level === '高风险') return '#f56c6c';
  if (level === '中风险') return '#e6a23c';
  return '#67c23a';
};

const loadData = async () => {
  loading.value = true;
  try {
    const [statsData, dashboardData, logsData] = await Promise.all([
      adminApi.stats(),
      adminApi.dashboard(),
      adminApi.apiLogs({ pageSize: 20 })
    ]);
    adminStats.value = statsData;
    adminDashboard.value = dashboardData;
    apiLogs.value = logsData.list || [];
    logsTotal.value = logsData.total || 0;
  } catch (err) {
    console.error('Failed to load admin dashboard:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
</script>
