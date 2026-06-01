<template>
  <div>
    <div class="grid grid-5 mb-20">
      <div class="stat-card">
        <h3>有效保单</h3>
        <div class="value">{{ stats.active_policies || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>待处理任务</h3>
        <div class="value">{{ stats.pending_tasks || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>扣费失败</h3>
        <div class="value">{{ stats.failed_payments || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>30天内到期</h3>
        <div class="value">{{ stats.expiring_30d || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>已过期保单</h3>
        <div class="value">{{ stats.expired_policies || 0 }}</div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3 class="mb-20">保单状态分布</h3>
        <div v-if="byStatus.length">
          <div v-for="item in byStatus" :key="item.status" class="flex flex-between mb-10">
            <span>{{ getStatusLabel(item.status) }}</span>
            <span class="badge" :class="getStatusBadgeClass(item.status)">
              {{ item.count }} 单
            </span>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p>暂无数据</p>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-20">险种分布</h3>
        <div v-if="byProductType.length">
          <div v-for="item in byProductType" :key="item.product_type" class="flex flex-between mb-10">
            <span>{{ item.product_type || '其他' }}</span>
            <span class="tag tag-blue">{{ item.count }} 单</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p>暂无数据</p>
        </div>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">代理人任务排名</h3>
      <table class="table">
        <thead>
          <tr>
            <th>排名</th>
            <th>代理人</th>
            <th>保单数量</th>
            <th>待处理任务</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(agent, index) in byAgent" :key="agent.id">
            <td>
              <span class="badge" :class="index < 3 ? 'badge-warning' : 'badge-default'">
                {{ index + 1 }}
              </span>
            </td>
            <td>{{ agent.name }}</td>
            <td>{{ agent.policy_count || 0 }}</td>
            <td>{{ agent.task_count || 0 }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="drillDown('agent', agent.id)">
                查看详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { reports } from '../api';
import { useRouter } from 'vue-router';

const router = useRouter();

const stats = reactive({});
const byStatus = reactive([]);
const byProductType = reactive([]);
const byAgent = reactive([]);

const loadDashboard = async () => {
  try {
    const data = await reports.getDashboard();
    Object.assign(stats, data.stats);
    byStatus.splice(0, byStatus.length, ...(data.by_status || []));
    byProductType.splice(0, byProductType.length, ...(data.by_product_type || []));
    byAgent.splice(0, byAgent.length, ...(data.by_agent || []));
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  }
};

const getStatusLabel = (status) => {
  const labels = {
    active: '有效',
    grace_period: '宽限期',
    expired: '已过期',
    renewed: '已续保',
    lapsed: '已失效'
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'badge-success',
    grace_period: 'badge-warning',
    expired: 'badge-danger',
    renewed: 'badge-success',
    lapsed: 'badge-default'
  };
  return classes[status] || 'badge-default';
};

const drillDown = (dimension, value) => {
  router.push({
    path: '/reports',
    query: { dimension, filter_value: value }
  });
};

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}
</style>
