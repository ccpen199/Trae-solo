<template>
  <div class="logs-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>日志管理</span>
          <div class="header-actions">
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operationType" placeholder="全部" clearable>
            <el-option
              v-for="(label, key) in operationTypeMap"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="时间段">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="logList"
        style="width: 100%"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="operationType" label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ operationTypeMap[row.operationType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationDesc" label="操作描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="username" label="操作用户" width="120" />
        <el-table-column prop="enterpriseName" label="企业名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="requestMethod" label="请求方式" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.requestMethod)" size="small">
              {{ row.requestMethod }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '@/api/admin';
import { operationTypeMap, OperationType } from '@/types';

const loading = ref(false);
const logList = ref<any[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const selectedIds = ref<string[]>([]);

const searchForm = reactive({
  operationType: undefined as OperationType | undefined,
  username: '',
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 20,
});

const getMethodType = (method: string) => {
  const map: Record<string, string> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'danger',
  };
  return map[method] || 'info';
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

const loadData = async () => {
  loading.value = true;
  try {
    const result = await adminApi.getLogs({
      ...searchForm,
    });
    logList.value = result.data?.logs || [];
    total.value = result.data?.total || 0;
  } catch (error) {
    console.error('Load data error:', error);
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id);
};

const handleSearch = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    searchForm.startDate = dateRange.value[0];
    searchForm.endDate = dateRange.value[1];
  } else {
    searchForm.startDate = '';
    searchForm.endDate = '';
  }
  searchForm.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.operationType = undefined;
  searchForm.username = '';
  searchForm.startDate = '';
  searchForm.endDate = '';
  searchForm.page = 1;
  dateRange.value = [];
  loadData();
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条日志吗？删除后无法恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await adminApi.deleteLogs(selectedIds.value);
    ElMessage.success('删除成功');
    selectedIds.value = [];
    loadData();
  } catch {
    // 取消操作
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.logs-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
