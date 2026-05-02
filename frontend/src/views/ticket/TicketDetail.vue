<template>
  <div class="ticket-detail-container">
    <el-card shadow="hover" v-loading="loading">
      <template #header>
        <div class="card-header">
          <div>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/tickets' }">工单管理</el-breadcrumb-item>
              <el-breadcrumb-item>工单详情</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-actions">
            <el-tag :type="getStatusType(ticket?.status)" size="large">
              {{ getStatusLabel(ticket?.status) }}
            </el-tag>
            <el-tag type="info" size="large" v-if="ticket?.current_node">
              {{ getNodeLabel(ticket?.current_node) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="工单号">
              <el-tag type="primary">{{ ticket?.ticket_no }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="标题">
              {{ ticket?.title }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              {{ getTypeLabel(ticket?.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="getPriorityType(ticket?.priority)">
                {{ getPriorityLabel(ticket?.priority) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="责任人">
              {{ ticket?.assignee_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="报告人">
              {{ ticket?.reporter_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="期望完成时间">
              {{ formatDate(ticket?.expected_finish_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(ticket?.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ ticket?.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">
            <span style="font-weight: bold;">指标信息</span>
          </el-divider>
          
          <el-table :data="metrics" border v-if="metrics.length > 0">
            <el-table-column prop="name" label="指标名称" width="180" />
            <el-table-column prop="code" label="编码" width="120" />
            <el-table-column prop="metric_type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getMetricTypeLabel(row.metric_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="value" label="当前值">
              <template #default="{ row }">
                <span class="metric-value">{{ row.value }}</span>
                <span v-if="row.unit">{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="阈值">
              <template #default="{ row }">
                <span v-if="row.threshold" :class="isThresholdExceeded(row) ? 'threshold-exceeded' : ''">
                  {{ row.threshold }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" />
          </el-table>
          <el-empty description="暂无指标数据" v-else />

          <el-divider content-position="left">
            <span style="font-weight: bold;">流转时间轴</span>
          </el-divider>
          
          <el-timeline>
            <el-timeline-item
              v-for="(transition, index) in transitions"
              :key="transition.id"
              :timestamp="formatDate(transition.created_at)"
              placement="top"
            >
              <el-card>
                <template #header>
                  <div class="timeline-header">
                    <span class="action-label">{{ getActionLabel(transition.action) }}</span>
                    <span class="operator">{{ transition.operator_name || '系统' }}</span>
                  </div>
                </template>
                <div class="timeline-content">
                  <p v-if="transition.from_state || transition.to_state">
                    状态: 
                    <el-tag size="small" :type="getStatusType(transition.from_state)">
                      {{ getStatusLabel(transition.from_state) }}
                    </el-tag>
                    <el-icon style="margin: 0 8px;"><ArrowRight /></el-icon>
                    <el-tag size="small" :type="getStatusType(transition.to_state)" effect="dark">
                      {{ getStatusLabel(transition.to_state) }}
                    </el-tag>
                  </p>
                  <p v-if="transition.comment">
                    意见: {{ transition.comment }}
                  </p>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <span>可用操作</span>
            </template>
            
            <div class="action-buttons">
              <template v-if="availableActions.length > 0">
                <template v-for="action in availableActions" :key="action">
                  <el-button 
                    :type="getActionType(action)" 
                    :icon="getActionIcon(action)"
                    @click="handleAction(action)"
                    style="width: 100%; margin-bottom: 10px;"
                  >
                    {{ getActionLabel(action) }}
                  </el-button>
                </template>
              </template>
              <el-empty description="当前状态无可用操作" v-else />
            </div>
          </el-card>

          <el-card shadow="hover" style="margin-top: 20px;">
            <template #header>
              <span>明细表</span>
            </template>
            
            <el-table :data="items" v-if="items.length > 0" size="small">
              <el-table-column prop="item_type" label="类型" width="80">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.item_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="item_key" label="键" show-overflow-tooltip />
              <el-table-column prop="item_value" label="值" show-overflow-tooltip />
              <el-table-column prop="item_status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="getItemStatusType(row.item_status)" size="small">
                    {{ getItemStatusLabel(row.item_status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty description="暂无明细" v-else />
          </el-card>

          <el-card shadow="hover" style="margin-top: 20px;">
            <template #header>
              <span>关联日志</span>
            </template>
            
            <el-table :data="logs" v-if="logs.length > 0" size="small">
              <el-table-column prop="log_level" label="级别" width="80">
                <template #default="{ row }">
                  <el-tag :type="getLogLevelType(row.log_level)" size="small">
                    {{ row.log_level }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="log_source" label="来源" width="100" show-overflow-tooltip />
              <el-table-column prop="log_content" label="内容" show-overflow-tooltip />
            </el-table>
            <el-empty description="暂无日志" v-else />
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="actionDialogVisible" :title="actionDialogTitle" width="500px">
      <el-form :model="actionForm" label-width="100px">
        <el-form-item label="处理意见">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见（可选）"
          />
        </el-form-item>
        <el-form-item label="转派给" v-if="currentAction === 'transfer' || currentAction === 'assign'">
          <el-select v-model="actionForm.newAssigneeId" placeholder="请选择责任人" style="width: 100%">
            <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  ArrowRight, Check, Close, Edit, RefreshLeft, Transfer,
  CirclePlus, Warning, Info, Document, Delete
} from '@element-plus/icons-vue';
import { ticketApi } from '@/api';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const actionLoading = ref(false);
const actionDialogVisible = ref(false);
const currentAction = ref('');
const users = ref([]);

const ticket = ref(null);
const metrics = ref([]);
const items = ref([]);
const transitions = ref([]);
const logs = ref([]);

const actionForm = reactive({
  comment: '',
  newAssigneeId: null
});

const availableActions = computed(() => {
  const node = ticket.value?.current_node;
  if (!node) return [];
  
  const actionsByNode = {
    collect: ['submit', 'cancel'],
    rules: ['approve', 'reject', 'supplement', 'transfer', 'cancel'],
    alert: ['approve', 'reject', 'transfer', 'cancel'],
    notify: ['approve', 'reject', 'supplement', 'transfer', 'resolve', 'cancel'],
    review: ['approve', 'reject', 'close']
  };
  
  return actionsByNode[node] || [];
});

const actionDialogTitle = computed(() => {
  return getActionLabel(currentAction.value);
});

const fetchTicketDetail = async () => {
  loading.value = true;
  try {
    const result = await ticketApi.getDetail(route.params.id);
    ticket.value = result.data.ticket;
    metrics.value = result.data.metrics || [];
    items.value = result.data.items || [];
    transitions.value = result.data.transitions || [];
    logs.value = result.data.logs || [];
  } catch (error) {
    console.error('获取工单详情失败:', error);
    ElMessage.error('获取工单详情失败');
  } finally {
    loading.value = false;
  }
};

const handleAction = (action) => {
  currentAction.value = action;
  actionForm.comment = '';
  actionForm.newAssigneeId = null;
  
  if (['approve', 'reject', 'supplement', 'transfer', 'resolve', 'close'].includes(action)) {
    actionDialogVisible.value = true;
  } else {
    submitAction();
  }
};

const submitAction = async () => {
  actionLoading.value = true;
  try {
    const params = {
      action: currentAction.value,
      comment: actionForm.comment
    };
    
    if (actionForm.newAssigneeId) {
      params.newAssigneeId = actionForm.newAssigneeId;
    }
    
    await ticketApi.action(ticket.value.id, params);
    ElMessage.success('操作成功');
    actionDialogVisible.value = false;
    fetchTicketDetail();
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    actionLoading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
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

const getMetricTypeLabel = (type) => {
  const labelMap = {
    counter: '计数器',
    gauge: '仪表盘',
    histogram: '直方图'
  };
  return labelMap[type] || type;
};

const getActionType = (action) => {
  const typeMap = {
    submit: 'primary',
    approve: 'success',
    reject: 'danger',
    supplement: 'warning',
    transfer: 'warning',
    resolve: 'success',
    close: 'info',
    cancel: 'danger'
  };
  return typeMap[action] || 'primary';
};

const getActionLabel = (action) => {
  const labelMap = {
    submit: '提交审核',
    approve: '通过',
    reject: '驳回',
    supplement: '补充资料',
    transfer: '转派',
    resolve: '解决',
    close: '关闭',
    cancel: '撤销'
  };
  return labelMap[action] || action;
};

const getActionIcon = (action) => {
  const iconMap = {
    submit: CirclePlus,
    approve: Check,
    reject: Close,
    supplement: Edit,
    transfer: Transfer,
    resolve: Check,
    close: Document,
    cancel: Delete
  };
  return iconMap[action] || Info;
};

const getItemStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success',
    failed: 'danger'
  };
  return typeMap[status] || 'info';
};

const getItemStatusLabel = (status) => {
  const labelMap = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return labelMap[status] || status;
};

const getLogLevelType = (level) => {
  const typeMap = {
    error: 'danger',
    warn: 'warning',
    info: 'info',
    debug: ''
  };
  return typeMap[level] || 'info';
};

const isThresholdExceeded = (metric) => {
  if (!metric.value || !metric.threshold) return false;
  return parseFloat(metric.value) > parseFloat(metric.threshold);
};

onMounted(() => {
  fetchTicketDetail();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-buttons {
  padding: 10px 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-label {
  font-weight: bold;
  color: #409eff;
}

.operator {
  color: #909399;
  font-size: 12px;
}

.timeline-content {
  font-size: 14px;
}

.timeline-content p {
  margin: 5px 0;
}

.metric-value {
  font-weight: bold;
  font-size: 16px;
  color: #409eff;
}

.threshold-exceeded {
  color: #f56c6c;
  font-weight: bold;
}
</style>
