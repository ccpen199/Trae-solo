<template>
  <div>
    <div class="filter-bar">
      <div class="filter-item">
        <label>代理人:</label>
        <select v-model="filters.agent_id" @change="loadTasks">
          <option value="">全部</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">
            {{ agent.name }}
          </option>
        </select>
      </div>
      <div class="filter-item">
        <label>状态:</label>
        <select v-model="filters.status" @change="loadTasks">
          <option value="">全部</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
      <div class="filter-item">
        <label>优先级:</label>
        <select v-model="filters.priority" @change="loadTasks">
          <option value="">全部</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="loadTasks">刷新</button>
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
            <th>逾期天数</th>
            <th>提醒次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.policy_no }}</td>
            <td>{{ task.customer_name }}</td>
            <td><span class="tag tag-purple">{{ task.product_type }}</span></td>
            <td>¥{{ task.premium_amount?.toLocaleString() }}</td>
            <td>{{ task.agent_name }}</td>
            <td>{{ task.expiry_date }}</td>
            <td>
              <span v-if="task.overdue_days > 0" class="badge badge-danger">
                {{ task.overdue_days }}天
              </span>
              <span v-else class="badge badge-info">-</span>
            </td>
            <td>{{ task.reminder_count || 0 }}次</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(task.status)">
                {{ getStatusLabel(task.status) }}
              </span>
            </td>
            <td>
              <div class="flex gap-10">
                <button class="btn btn-sm btn-primary" @click="viewDetail(task.id)">
                  详情
                </button>
                <button class="btn btn-sm btn-warning" @click="showReassignModal(task)">
                  改派
                </button>
                <button class="btn btn-sm btn-success" @click="recordReminder(task)">
                  记录提醒
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!tasks.length" class="empty-state">
        <div class="empty-state-icon">✅</div>
        <p>暂无任务数据</p>
      </div>

      <div class="pagination" v-if="pagination.total > pagination.page_size">
        <button @click="prevPage" :disabled="pagination.page <= 1">上一页</button>
        <span>第 {{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.page_size) }} 页</span>
        <button @click="nextPage" :disabled="pagination.page >= Math.ceil(pagination.total / pagination.page_size)">下一页</button>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>任务改派</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>当前任务:</label>
            <div>保单号: {{ currentTask?.policy_no }} - 客户: {{ currentTask?.customer_name }}</div>
          </div>
          <div class="form-group">
            <label>新代理人 *</label>
            <select v-model="reassignForm.new_agent_id" class="form-control">
              <option value="">请选择代理人</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.name }} ({{ agent.team || '未知团队' }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>改派原因</label>
            <textarea v-model="reassignForm.reason" class="form-control" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="submitReassign">确认改派</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { tasks as tasksApi, agents as agentsApi } from '../api';
import { useRouter } from 'vue-router';

const router = useRouter();

const filters = reactive({
  agent_id: '',
  status: '',
  priority: '',
  page: 1,
  page_size: 20
});

const tasks = ref([]);
const agents = ref([]);
const pagination = reactive({ page: 1, page_size: 20, total: 0 });
const showModal = ref(false);
const currentTask = ref(null);
const reassignForm = reactive({ new_agent_id: '', reason: '' });

const loadAgents = async () => {
  try {
    const result = await agentsApi.getList();
    agents.value = result.data || [];
  } catch (error) {
    console.error('加载代理人列表失败:', error);
  }
};

const loadTasks = async () => {
  try {
    const params = { ...filters };
    if (!params.agent_id) delete params.agent_id;
    if (!params.status) delete params.status;
    if (!params.priority) delete params.priority;
    
    const result = await tasksApi.getList(params);
    tasks.value = result.data || [];
    pagination.page = result.pagination?.page || 1;
    pagination.page_size = result.pagination?.page_size || 20;
    pagination.total = result.pagination?.total || 0;
  } catch (error) {
    console.error('加载任务列表失败:', error);
  }
};

const getStatusLabel = (status) => {
  const labels = { pending: '待处理', processing: '处理中', completed: '已完成' };
  return labels[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classes = { pending: 'badge-warning', processing: 'badge-info', completed: 'badge-success' };
  return classes[status] || 'badge-default';
};

const viewDetail = (id) => {
  router.push(`/tasks/${id}`);
};

const showReassignModal = (task) => {
  currentTask.value = task;
  reassignForm.new_agent_id = '';
  reassignForm.reason = '';
  showModal.value = true;
};

const submitReassign = async () => {
  if (!reassignForm.new_agent_id) {
    alert('请选择新代理人');
    return;
  }
  try {
    await tasksApi.reassign(currentTask.value.id, {
      new_agent_id: reassignForm.new_agent_id,
      reason: reassignForm.reason
    });
    alert('改派成功');
    showModal.value = false;
    loadTasks();
  } catch (error) {
    alert('改派失败: ' + error.message);
  }
};

const recordReminder = async (task) => {
  try {
    await tasks.update(task.id, {
      reminder_channel: '电话',
      reminder_count: (task.reminder_count || 0) + 1
    });
    alert('提醒记录已保存');
    loadTasks();
  } catch (error) {
    alert('记录失败: ' + error.message);
  }
};

const prevPage = () => {
  if (filters.page > 1) {
    filters.page--;
    loadTasks();
  }
};

const nextPage = () => {
  if (filters.page < Math.ceil(pagination.total / pagination.page_size)) {
    filters.page++;
    loadTasks();
  }
};

onMounted(() => {
  loadAgents();
  loadTasks();
});
</script>
