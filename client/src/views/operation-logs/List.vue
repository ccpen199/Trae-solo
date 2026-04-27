<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索操作内容/用户名"
          clearable
          class="search-box"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.operationType" placeholder="操作类型" clearable style="width: 140px;">
          <el-option label="创建" value="CREATE" />
          <el-option label="更新" value="UPDATE" />
          <el-option label="删除" value="DELETE" />
          <el-option label="状态变更" value="STATUS_CHANGE" />
          <el-option label="其他" value="OTHER" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="logs" v-loading="loading" border stripe>
        <el-table-column prop="operationType" label="操作类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.operationType)">{{
              getTypeLabel(scope.row.operationType)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="action" label="操作内容" min-width="200" />
        <el-table-column prop="userName" label="操作人" width="100" />
        <el-table-column prop="userRole" label="角色" width="120">
          <template #default="scope">
            {{ UserRoleLabels[scope.row.userRole] || scope.row.userRole }}
          </template>
        </el-table-column>
        <el-table-column prop="targetType" label="目标类型" width="100" />
        <el-table-column prop="targetId" label="目标ID" width="80" align="center" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作详情" width="100" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleView(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDetailDialog" title="操作日志详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getTypeTagType(selectedLog?.operationType)">{{
            getTypeLabel(selectedLog?.operationType)
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模块">{{ selectedLog?.module || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ selectedLog?.userName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ UserRoleLabels[selectedLog?.userRole] || selectedLog?.userRole || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标类型">{{ selectedLog?.targetType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目标ID">{{ selectedLog?.targetId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">
          {{ formatDate(selectedLog?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作内容" :span="2">
          {{ selectedLog?.action || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作详情" :span="2">
          <pre style="white-space: pre-wrap; margin: 0; max-height: 300px; overflow-y: auto;">
{{ selectedLog?.details || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ selectedLog?.ipAddress || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent">
          {{ selectedLog?.userAgent || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { masterDataApi } from '@/api/masterData';
import { UserRoleLabels } from '@/types';

const loading = ref(false);
const logs = ref<any[]>([]);
const showDetailDialog = ref(false);
const selectedLog = ref<any>(null);

const filters = reactive({
  keyword: '',
  operationType: '',
  dateRange: [] as string[],
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.operationType) params.operationType = filters.operationType;
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0];
      params.endDate = filters.dateRange[1];
    }

    const response = await masterDataApi.listOperationLogs(params);
    logs.value = response.data?.items || [];
    pagination.total = response.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  filters.keyword = '';
  filters.operationType = '';
  filters.dateRange = [];
  pagination.page = 1;
  loadData();
};

const handleView = (row: any) => {
  selectedLog.value = row;
  showDetailDialog.value = true;
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    STATUS_CHANGE: '状态变更',
    OTHER: '其他',
  };
  return labels[type] || type;
};

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'primary',
    DELETE: 'danger',
    STATUS_CHANGE: 'warning',
    OTHER: 'info',
  };
  return types[type] || 'info';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadData();
});
</script>
