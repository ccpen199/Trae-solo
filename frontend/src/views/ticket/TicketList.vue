<template>
  <div class="ticket-list-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>工单列表</span>
          <el-button type="primary" @click="handleCreate" v-if="userStore.hasPermission('ticket:create')">
            <el-icon><Plus /></el-icon>
            新建工单
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="待规则" value="pending_rules" />
            <el-option label="待告警" value="pending_alert" />
            <el-option label="告警中" value="alerting" />
            <el-option label="处理中" value="processing" />
            <el-option label="待复盘" value="pending_review" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部优先级" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.search" placeholder="工单号/标题/描述" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tickets" v-loading="loading" style="width: 100%" @row-click="handleView">
        <el-table-column prop="ticket_no" label="工单号" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="router.push(`/tickets/${row.id}`)">
              {{ row.ticket_no }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_node" label="当前节点" width="100">
          <template #default="{ row }">
            <el-tag type="info">
              {{ getNodeLabel(row.current_node) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="责任人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="handleView(row)">查看</el-button>
            <el-button type="primary" link @click.stop="handleEdit(row)" v-if="userStore.hasPermission('ticket:edit')">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchTickets"
        @current-change="fetchTickets"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ticketApi } from '@/api';
import { useUserStore } from '@/store/user';
import dayjs from 'dayjs';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const tickets = ref([]);

const searchForm = reactive({
  status: '',
  priority: '',
  search: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const fetchTickets = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    if (!params.status) delete params.status;
    if (!params.search) delete params.search;
    
    const result = await ticketApi.getList(params);
    tickets.value = result.data.tickets;
    pagination.total = result.data.pagination.total;
  } catch (error) {
    console.error('获取工单列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchTickets();
};

const handleReset = () => {
  searchForm.status = '';
  searchForm.priority = '';
  searchForm.search = '';
  pagination.page = 1;
  fetchTickets();
};

const handleCreate = () => {
  router.push('/tickets/create');
};

const handleView = (row) => {
  router.push(`/tickets/${row.id}`);
};

const handleEdit = (row) => {
  router.push(`/tickets/${row.id}`);
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getTypeLabel = (type) => {
  const labelMap = {
    alert: '告警工单',
    metric: '指标工单',
    incident: '事件工单'
  };
  return labelMap[type] || type;
};

const getPriorityType = (priority) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  };
  return typeMap[priority] || 'info';
};

const getPriorityLabel = (priority) => {
  const labelMap = {
    high: '高',
    medium: '中',
    low: '低'
  };
  return labelMap[priority] || priority;
};

const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    pending_rules: 'warning',
    pending_alert: 'warning',
    alerting: 'danger',
    processing: 'primary',
    pending_review: 'warning',
    resolved: 'success',
    closed: 'info',
    cancelled: 'info',
    blocked: 'danger'
  };
  return typeMap[status] || 'info';
};

const getStatusLabel = (status) => {
  const labelMap = {
    draft: '草稿',
    pending_rules: '待规则',
    pending_alert: '待告警',
    alerting: '告警中',
    processing: '处理中',
    pending_review: '待复盘',
    resolved: '已解决',
    closed: '已关闭',
    cancelled: '已取消',
    blocked: '已阻塞'
  };
  return labelMap[status] || status;
};

const getNodeLabel = (node) => {
  const labelMap = {
    collect: '采集指标',
    rules: '设置规则',
    alert: '触发告警',
    notify: '通知处理',
    review: '复盘',
    closed: '已关闭'
  };
  return labelMap[node] || node;
};

onMounted(() => {
  fetchTickets();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
