<template>
  <div class="alert-list-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>告警管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="触发中" value="firing" />
            <el-option label="已确认" value="acknowledged" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="searchForm.severity" placeholder="全部级别" clearable>
            <el-option label="严重" value="critical" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAlerts">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="alerts" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="告警标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="severity" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" effect="dark">
              {{ getSeverityLabel(row.severity) }}
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
        <el-table-column prop="metric_value" label="指标值" width="120">
          <template #default="{ row }">
            <span class="metric-value">{{ row.metric_value || '-' }}</span>
            <span v-if="row.threshold"> / {{ row.threshold }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dedup_count" label="触发次数" width="100">
          <template #default="{ row }">
            {{ row.dedup_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="last_triggered_at" label="最后触发时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.last_triggered_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              v-if="row.status === 'firing'"
              @click="handleAcknowledge(row)"
            >
              确认
            </el-button>
            <el-button 
              type="success" 
              link 
              v-if="row.status !== 'resolved'"
              @click="handleResolve(row)"
            >
              解决
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchAlerts"
        @current-change="fetchAlerts"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <el-dialog v-model="resolveDialogVisible" title="解决告警" width="500px">
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="解决说明">
          <el-input
            v-model="resolveForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入解决说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resolveLoading" @click="submitResolve">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { alertApi } from '@/api';
import dayjs from 'dayjs';

const loading = ref(false);
const alerts = ref([]);
const resolveDialogVisible = ref(false);
const resolveLoading = ref(false);
const currentAlert = ref(null);

const searchForm = reactive({
  status: '',
  severity: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const resolveForm = reactive({
  comment: ''
});

const fetchAlerts = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    if (!params.status) delete params.status;
    if (!params.severity) delete params.severity;
    
    const result = await alertApi.getList(params);
    alerts.value = result.data.alerts;
    pagination.total = result.data.pagination.total;
  } catch (error) {
    console.error('获取告警列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  searchForm.status = '';
  searchForm.severity = '';
  pagination.page = 1;
  fetchAlerts();
};

const handleAcknowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确认该告警？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await alertApi.acknowledge(row.id);
    ElMessage.success('告警已确认');
    fetchAlerts();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认告警失败:', error);
    }
  }
};

const handleResolve = (row) => {
  currentAlert.value = row;
  resolveForm.comment = '';
  resolveDialogVisible.value = true;
};

const submitResolve = async () => {
  resolveLoading.value = true;
  try {
    await alertApi.resolve(currentAlert.value.id, { comment: resolveForm.comment });
    ElMessage.success('告警已解决');
    resolveDialogVisible.value = false;
    fetchAlerts();
  } catch (error) {
    console.error('解决告警失败:', error);
  } finally {
    resolveLoading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getSeverityType = (severity) => {
  const typeMap = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  };
  return typeMap[severity] || 'info';
};

const getSeverityLabel = (severity) => {
  const labelMap = {
    critical: '严重',
    warning: '警告',
    info: '信息'
  };
  return labelMap[severity] || severity;
};

const getStatusType = (status) => {
  const typeMap = {
    firing: 'danger',
    acknowledged: 'warning',
    resolved: 'success'
  };
  return typeMap[status] || 'info';
};

const getStatusLabel = (status) => {
  const labelMap = {
    firing: '触发中',
    acknowledged: '已确认',
    resolved: '已解决'
  };
  return labelMap[status] || status;
};

onMounted(() => {
  fetchAlerts();
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

.metric-value {
  font-weight: bold;
  color: #f56c6c;
}
</style>
