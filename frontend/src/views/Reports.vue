<template>
  <div>
    <div class="card">
      <h3 class="mb-20">续期漏斗分析</h3>
      <div class="funnel-container">
        <div v-for="(item, index) in funnelData" :key="item.stage" class="funnel-item" :style="{ width: `${Math.max(20, 100 - index * 15)}%` }">
          <div class="funnel-label">{{ item.stage }}</div>
          <div class="funnel-value">{{ item.count }} 单</div>
        </div>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">钻取分析</h3>
      <div class="filter-bar">
        <div class="filter-item">
          <label>钻取维度:</label>
          <select v-model="drillDimension" @change="loadDrillDown">
            <option value="agent">按代理人</option>
            <option value="product_type">按险种</option>
            <option value="status">按状态</option>
          </select>
        </div>
        <div class="filter-item" v-if="drillFilter">
          <label>筛选条件:</label>
          <span>{{ drillFilter }}</span>
          <button class="btn btn-sm btn-default" @click="clearFilter">清除</button>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>保单号</th>
            <th>客户姓名</th>
            <th>险种</th>
            <th>保费</th>
            <th>代理人</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in drillData" :key="item.id">
            <td>{{ item.policy_no }}</td>
            <td>{{ item.customer_name }}</td>
            <td><span class="tag tag-purple">{{ item.product_type }}</span></td>
            <td>¥{{ item.premium_amount?.toLocaleString() }}</td>
            <td>{{ item.agent_name || '-' }}</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-primary" @click="viewPolicy(item.id)">
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!drillData.length" class="empty-state">
        <div class="empty-state-icon">📊</div>
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { reports, policies } from '../api';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const funnelData = ref([]);
const drillData = ref([]);
const drillDimension = ref('agent');
const drillFilter = ref('');

const loadFunnel = async () => {
  try {
    const result = await reports.getRenewalFunnel();
    funnelData.value = result.data || [];
  } catch (error) {
    console.error('加载漏斗数据失败:', error);
  }
};

const loadDrillDown = async () => {
  try {
    const params = {
      dimension: drillDimension.value,
      filter_value: drillFilter.value || undefined
    };
    const result = await reports.getDrillDown(params);
    drillData.value = result.data || [];
  } catch (error) {
    console.error('加载钻取数据失败:', error);
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

const viewPolicy = (id) => {
  router.push(`/policies/${id}`);
};

const clearFilter = () => {
  drillFilter.value = '';
  loadDrillDown();
};

onMounted(() => {
  loadFunnel();
  
  if (route.query.dimension) {
    drillDimension.value = route.query.dimension;
  }
  if (route.query.filter_value) {
    drillFilter.value = route.query.filter_value;
  }
  
  loadDrillDown();
});
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}

.funnel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
}

.funnel-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  text-align: center;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.funnel-item:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.funnel-item:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.funnel-item:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.funnel-item:nth-child(5) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.funnel-label {
  font-weight: 500;
  margin-bottom: 5px;
}

.funnel-value {
  font-size: 20px;
  font-weight: 600;
}
</style>
