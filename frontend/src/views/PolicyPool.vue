<template>
  <div>
    <div class="filter-bar">
      <div class="filter-item">
        <label>代理人:</label>
        <select v-model="filters.agent_id" @change="loadPolicies">
          <option value="">全部</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">
            {{ agent.name }}
          </option>
        </select>
      </div>
      <div class="filter-item">
        <label>客户等级:</label>
        <select v-model="filters.customer_level" @change="loadPolicies">
          <option value="">全部</option>
          <option value="vip">VIP</option>
          <option value="normal">普通</option>
        </select>
      </div>
      <div class="filter-item">
        <label>风险等级:</label>
        <select v-model="filters.risk_level" @change="loadPolicies">
          <option value="">全部</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>
      <div class="filter-item">
        <label>排序:</label>
        <select v-model="filters.sort_by" @change="loadPolicies">
          <option value="overdue_days">逾期天数</option>
          <option value="premium">保费金额</option>
          <option value="expiry_date">到期日期</option>
        </select>
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="loadPolicies">刷新</button>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>保单号</th>
            <th>客户姓名</th>
            <th>险种</th>
            <th>保费</th>
            <th>代理人</th>
            <th>到期日期</th>
            <th>剩余天数</th>
            <th>提醒次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="policy in policies" :key="policy.id">
            <td>{{ policy.policy_no }}</td>
            <td>
              <div>{{ policy.customer_name }}</div>
              <div style="font-size: 12px; color: #999;">{{ policy.customer_phone }}</div>
            </td>
            <td><span class="tag tag-purple">{{ policy.product_type }}</span></td>
            <td>¥{{ policy.premium_amount?.toLocaleString() }}</td>
            <td>{{ policy.agent_name }}</td>
            <td>{{ policy.expiry_date }}</td>
            <td>
              <span v-if="policy.overdue_days > 0" class="badge badge-danger">
                逾期{{ policy.overdue_days }}天
              </span>
              <span v-else class="badge" :class="policy.days_to_expiry <= 30 ? 'badge-warning' : 'badge-info'">
                {{ policy.days_to_expiry >= 0 ? Math.floor(policy.days_to_expiry) + '天' : '-' }}
              </span>
            </td>
            <td>{{ policy.reminder_count || 0 }}次</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(policy.status)">
                {{ getStatusLabel(policy.status) }}
              </span>
            </td>
            <td>
              <div class="flex gap-10">
                <button class="btn btn-sm btn-primary" @click="viewDetail(policy.id)">
                  详情
                </button>
                <button class="btn btn-sm btn-success" @click="createTask(policy)">
                  创建任务
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!policies.length" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>暂无保单数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { policies as policiesApi, agents as agentsApi, tasks as tasksApi } from '../api';
import { useRouter } from 'vue-router';

const router = useRouter();

const filters = reactive({
  agent_id: '',
  customer_level: '',
  risk_level: '',
  sort_by: 'overdue_days'
});

const policies = ref([]);
const agents = ref([]);

const loadAgents = async () => {
  try {
    const result = await agentsApi.getList();
    agents.value = result.data || [];
  } catch (error) {
    console.error('加载代理人列表失败:', error);
  }
};

const loadPolicies = async () => {
  try {
    const params = { ...filters };
    if (!params.agent_id) delete params.agent_id;
    if (!params.customer_level) delete params.customer_level;
    if (!params.risk_level) delete params.risk_level;
    
    const result = await policiesApi.getPool(params);
    policies.value = result.data || [];
  } catch (error) {
    console.error('加载保单池数据失败:', error);
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

const viewDetail = (id) => {
  router.push(`/policies/${id}`);
};

const createTask = async (policy) => {
  try {
    await tasksApi.create({
      policy_id: policy.id,
      agent_id: policy.agent_id,
      priority: 'medium'
    });
    alert('续期任务创建成功');
  } catch (error) {
    alert('创建任务失败: ' + error.message);
  }
};

onMounted(() => {
  loadAgents();
  loadPolicies();
});
</script>
