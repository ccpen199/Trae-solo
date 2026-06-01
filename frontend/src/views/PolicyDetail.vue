<template>
  <div v-if="policy">
    <div class="card">
      <h2 class="mb-20">保单详情</h2>
      <div class="grid grid-3">
        <div class="form-group">
          <label>保单号</label>
          <div class="form-value">{{ policy.policy_no }}</div>
        </div>
        <div class="form-group">
          <label>险种</label>
          <div><span class="tag tag-purple">{{ policy.product_type }}</span></div>
        </div>
        <div class="form-group">
          <label>保费金额</label>
          <div class="form-value">¥{{ policy.premium_amount?.toLocaleString() }}</div>
        </div>
        <div class="form-group">
          <label>生效日期</label>
          <div class="form-value">{{ policy.effective_date || '-' }}</div>
        </div>
        <div class="form-group">
          <label>到期日期</label>
          <div class="form-value">{{ policy.expiry_date }}</div>
        </div>
        <div class="form-group">
          <label>状态</label>
          <div>
            <span class="badge" :class="getStatusBadgeClass(policy.status)">
              {{ getStatusLabel(policy.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">客户信息</h3>
      <div class="grid grid-2">
        <div class="form-group">
          <label>客户姓名</label>
          <div class="form-value">{{ policy.customer_name }}</div>
        </div>
        <div class="form-group">
          <label>联系电话</label>
          <div class="form-value">{{ policy.customer_phone }}</div>
        </div>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">代理人信息</h3>
      <div class="grid grid-2">
        <div class="form-group">
          <label>代理人姓名</label>
          <div class="form-value">{{ policy.agent_name }}</div>
        </div>
        <div class="form-group">
          <label>所属团队</label>
          <div class="form-value">{{ policy.agent_team || '-' }}</div>
        </div>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">状态变更记录</h3>
      <table class="table">
        <thead>
          <tr>
            <th>变更时间</th>
            <th>旧状态</th>
            <th>新状态</th>
            <th>原因</th>
            <th>操作人</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in policy.status_logs || []" :key="log.id">
            <td>{{ log.created_at }}</td>
            <td>
              <span v-if="log.old_status" class="badge" :class="getStatusBadgeClass(log.old_status)">
                {{ getStatusLabel(log.old_status) }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(log.new_status)">
                {{ getStatusLabel(log.new_status) }}
              </span>
            </td>
            <td>{{ log.reason || '-' }}</td>
            <td>{{ log.operator || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!policy.status_logs?.length" class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>暂无状态变更记录</p>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">扣费记录</h3>
      <table class="table">
        <thead>
          <tr>
            <th>扣费时间</th>
            <th>金额</th>
            <th>状态</th>
            <th>失败原因</th>
            <th>重试次数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in policy.payment_records || []" :key="record.id">
            <td>{{ record.payment_date || record.created_at }}</td>
            <td>¥{{ record.amount?.toLocaleString() }}</td>
            <td>
              <span class="badge" :class="getPaymentBadgeClass(record.status)">
                {{ getPaymentLabel(record.status) }}
              </span>
            </td>
            <td>{{ record.failure_reason || '-' }}</td>
            <td>{{ record.retry_count || 0 }}次</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!policy.payment_records?.length" class="empty-state">
        <div class="empty-state-icon">💰</div>
        <p>暂无扣费记录</p>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">续期任务</h3>
      <table class="table">
        <thead>
          <tr>
            <th>创建时间</th>
            <th>代理人</th>
            <th>提醒次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in policy.renewal_tasks || []" :key="task.id">
            <td>{{ task.created_at }}</td>
            <td>{{ task.agent_name || '-' }}</td>
            <td>{{ task.reminder_count || 0 }}次</td>
            <td>
              <span class="badge" :class="getTaskBadgeClass(task.status)">
                {{ getTaskLabel(task.status) }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-primary" @click="viewTask(task.id)">
                查看任务
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!policy.renewal_tasks?.length" class="empty-state">
        <div class="empty-state-icon">✅</div>
        <p>暂无续期任务</p>
      </div>
    </div>
  </div>

  <div v-else class="card">
    <div class="empty-state">
      <div class="empty-state-icon">📋</div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { policies } from '../api';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const policy = ref(null);

const loadPolicy = async () => {
  try {
    const data = await policies.getDetail(route.params.id);
    policy.value = data;
  } catch (error) {
    console.error('加载保单详情失败:', error);
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

const getPaymentLabel = (status) => {
  const labels = {
    pending: '待处理',
    success: '成功',
    insufficient_balance: '余额不足',
    card_expired: '卡失效',
    auth_expired: '授权过期',
    pending_manual: '待人工处理'
  };
  return labels[status] || status;
};

const getPaymentBadgeClass = (status) => {
  const classes = {
    pending: 'badge-info',
    success: 'badge-success',
    insufficient_balance: 'badge-warning',
    card_expired: 'badge-danger',
    auth_expired: 'badge-danger',
    pending_manual: 'badge-warning'
  };
  return classes[status] || 'badge-default';
};

const getTaskLabel = (status) => {
  const labels = { pending: '待处理', processing: '处理中', completed: '已完成' };
  return labels[status] || status;
};

const getTaskBadgeClass = (status) => {
  const classes = { pending: 'badge-warning', processing: 'badge-info', completed: 'badge-success' };
  return classes[status] || 'badge-default';
};

const viewTask = (id) => {
  router.push(`/tasks/${id}`);
};

onMounted(() => {
  loadPolicy();
});
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}

.form-value {
  font-size: 16px;
  color: #333;
  padding: 8px 0;
}
</style>
