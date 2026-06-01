<template>
  <div>
    <div class="filter-bar">
      <div class="filter-item">
        <label>状态:</label>
        <select v-model="filters.status" @change="loadPayments">
          <option value="">全部</option>
          <option value="pending">待处理</option>
          <option value="success">成功</option>
          <option value="insufficient_balance">余额不足</option>
          <option value="card_expired">卡失效</option>
          <option value="auth_expired">授权过期</option>
          <option value="pending_manual">待人工处理</option>
        </select>
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="loadPayments">刷新</button>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>保单号</th>
            <th>客户姓名</th>
            <th>险种</th>
            <th>扣费金额</th>
            <th>状态</th>
            <th>重试次数</th>
            <th>扣费时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.id">
            <td>{{ payment.policy_no }}</td>
            <td>{{ payment.customer_name }}</td>
            <td><span class="tag tag-purple">{{ payment.product_type }}</span></td>
            <td>¥{{ payment.amount?.toLocaleString() }}</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(payment.status)">
                {{ getStatusLabel(payment.status) }}
              </span>
            </td>
            <td>{{ payment.retry_count || 0 }}次</td>
            <td>{{ payment.payment_date || '-' }}</td>
            <td>
              <div class="flex gap-10">
                <button 
                  v-if="payment.status !== 'success' && payment.retry_count < 3" 
                  class="btn btn-sm btn-success" 
                  @click="retryPayment(payment)"
                >
                  重试扣费
                </button>
                <button class="btn btn-sm btn-warning" @click="openActionModal(payment)">
                  补救措施
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!payments.length" class="empty-state">
        <div class="empty-state-icon">💰</div>
        <p>暂无扣费记录</p>
      </div>

      <div class="pagination" v-if="pagination.total > pagination.page_size">
        <button @click="prevPage" :disabled="pagination.page <= 1">上一页</button>
        <span>第 {{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.page_size) }} 页</span>
        <button @click="nextPage" :disabled="pagination.page >= Math.ceil(pagination.total / pagination.page_size)">下一页</button>
      </div>
    </div>

    <div v-if="showActionModal" class="modal-overlay" @click.self="showActionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>补救措施</h3>
          <button class="modal-close" @click="showActionModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>当前扣费状态:</label>
            <div>
              <span class="badge" :class="getStatusBadgeClass(currentPayment?.status)">
                {{ getStatusLabel(currentPayment?.status) }}
              </span>
            </div>
          </div>
          <div class="form-group" v-if="currentPayment?.failure_reason">
            <label>失败原因:</label>
            <div>{{ currentPayment.failure_reason }}</div>
          </div>
          <div class="form-group">
            <label>建议补救措施:</label>
            <div class="remedy-actions">
              <div 
                v-for="action in currentPayment?.remedy_actions || []" 
                :key="action.code" 
                class="remedy-item"
              >
                <span class="remedy-icon">➜</span>
                <span>{{ action.name }}</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>处理备注</label>
            <textarea v-model="actionForm.remark" class="form-control" rows="3" placeholder="请输入处理备注..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showActionModal = false">关闭</button>
          <button class="btn btn-primary" @click="submitAction">确认处理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { payments as paymentsApi } from '../api';

const filters = reactive({
  status: '',
  page: 1,
  page_size: 20
});

const payments = ref([]);
const pagination = reactive({ page: 1, page_size: 20, total: 0 });
const showActionModal = ref(false);
const currentPayment = ref(null);
const actionForm = reactive({ remark: '' });

const loadPayments = async () => {
  try {
    const params = { ...filters };
    if (!params.status) delete params.status;
    
    const result = await paymentsApi.getList(params);
    payments.value = result.data || [];
    pagination.page = result.pagination?.page || 1;
    pagination.page_size = result.pagination?.page_size || 20;
    pagination.total = result.pagination?.total || 0;
  } catch (error) {
    console.error('加载扣费记录失败:', error);
  }
};

const getStatusLabel = (status) => {
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

const getStatusBadgeClass = (status) => {
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

const retryPayment = async (payment) => {
  if (!confirm(`确认重试扣费？当前已重试${payment.retry_count}次`)) {
    return;
  }
  try {
    const result = await paymentsApi.retry(payment.id, {});
    if (result.payment_success) {
      alert('重试扣费成功！');
    } else {
      alert('重试扣费失败，已安排下次重试');
    }
    loadPayments();
  } catch (error) {
    alert('重试失败: ' + error.message);
  }
};

const openActionModal = (payment) => {
  currentPayment.value = payment;
  actionForm.remark = '';
  showActionModal.value = true;
};

const submitAction = async () => {
  alert('处理记录已保存');
  showActionModal.value = false;
};

const prevPage = () => {
  if (filters.page > 1) {
    filters.page--;
    loadPayments();
  }
};

const nextPage = () => {
  if (filters.page < Math.ceil(pagination.total / pagination.page_size)) {
    filters.page++;
    loadPayments();
  }
};

onMounted(() => {
  loadPayments();
});
</script>

<style scoped>
.remedy-actions {
  margin-top: 10px;
}

.remedy-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.remedy-icon {
  color: #1890ff;
}
</style>
