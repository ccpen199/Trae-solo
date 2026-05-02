<template>
  <div class="audit-log-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="全部模块" clearable>
            <el-option
              v-for="mod in modules"
              :key="mod"
              :label="getModuleLabel(mod)"
              :value="mod"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-select v-model="searchForm.action" placeholder="全部操作" clearable>
            <el-option
              v-for="act in actions"
              :key="act"
              :label="getActionLabel(act)"
              :value="act"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="logs" v-loading="loading" style="width: 100%">
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="操作人" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.user_name || '系统' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag :type="getModuleType(row.module)" size="small">
              {{ getModuleLabel(row.module) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_type" label="目标类型" width="120">
          <template #default="{ row }">
            {{ getTargetLabel(row.target_type) }}
            <span v-if="row.target_id" class="target-id">#{{ row.target_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="log-details">
              <div class="detail-row" v-if="row.old_value">
                <span class="detail-label">变更前:</span>
                <span class="detail-value old-value">{{ formatJson(row.old_value) }}</span>
              </div>
              <div class="detail-row" v-if="row.new_value">
                <span class="detail-label">变更后:</span>
                <span class="detail-value new-value">{{ formatJson(row.new_value) }}</span>
              </div>
              <div class="detail-row" v-if="!row.old_value && !row.new_value && row.details">
                <span class="detail-value">{{ row.details }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="140">
          <template #default="{ row }">
            {{ row.ip_address || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { auditApi } from '@/api';
import dayjs from 'dayjs';

const loading = ref(false);
const logs = ref([]);
const modules = ref([]);
const actions = ref([]);

const searchForm = reactive({
  module: '',
  action: '',
  dateRange: []
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const moduleLabelMap = {
  ticket: '工单',
  alert: '告警',
  rule: '规则',
  user: '用户',
  metric: '指标',
  notify: '通知',
  dashboard: '仪表盘',
  audit: '审计',
  system: '系统'
};

const actionLabelMap = {
  create: '创建',
  edit: '编辑',
  update: '更新',
  delete: '删除',
  view: '查看',
  login: '登录',
  logout: '登出',
  approve: '审批',
  reject: '驳回',
  transfer: '转派',
  resolve: '解决',
  close: '关闭',
  acknowledge: '确认'
};

const targetLabelMap = {
  ticket: '工单',
  alert_event: '告警',
  alert_rule: '规则',
  user: '用户',
  metric: '指标',
  notification: '通知',
  message: '消息',
  dashboard_config: '仪表盘'
};

const getModuleLabel = (module) => {
  return moduleLabelMap[module] || module;
};

const getModuleType = (module) => {
  const typeMap = {
    ticket: 'primary',
    alert: 'danger',
    rule: 'warning',
    user: 'success',
    metric: 'info',
    system: ''
  };
  return typeMap[module] || 'info';
};

const getActionLabel = (action) => {
  return actionLabelMap[action] || action;
};

const getActionType = (action) => {
  const typeMap = {
    create: 'success',
    edit: 'primary',
    update: 'primary',
    delete: 'danger',
    approve: 'success',
    reject: 'danger',
    resolve: 'success',
    close: 'info',
    login: 'primary',
    logout: 'info'
  };
  return typeMap[action] || 'info';
};

const getTargetLabel = (type) => {
  return targetLabelMap[type] || type;
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const formatJson = (str) => {
  if (!str) return '-';
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, 2);
  } catch {
    return str;
  }
};

const fetchModuleOptions = async () => {
  try {
    const result = await auditApi.getModules();
    modules.value = result.data.modules || [];
    actions.value = result.data.actions || [];
  } catch (error) {
    console.error('获取模块选项失败:', error);
  }
};

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      module: searchForm.module,
      action: searchForm.action
    };
    
    if (!params.module) delete params.module;
    if (!params.action) delete params.action;
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0];
      params.end_date = searchForm.dateRange[1];
    }
    
    const result = await auditApi.getList(params);
    logs.value = result.data.logs;
    pagination.total = result.data.pagination.total;
  } catch (error) {
    console.error('获取审计日志失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  searchForm.module = '';
  searchForm.action = '';
  searchForm.dateRange = [];
  pagination.page = 1;
  fetchLogs();
};

onMounted(() => {
  fetchModuleOptions();
  fetchLogs();
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

.target-id {
  color: #409eff;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.log-details {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.detail-row {
  margin-bottom: 4px;
  word-break: break-all;
}

.detail-label {
  color: #909399;
  margin-right: 8px;
}

.detail-value {
  white-space: pre-wrap;
}

.old-value {
  color: #f56c6c;
}

.new-value {
  color: #67c23a;
}
</style>
