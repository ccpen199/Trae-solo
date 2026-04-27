<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">工单管理</h2>
      <el-button v-if="canCreateWorkOrder" type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建工单
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索工单号/产品名称"
          clearable
          class="search-box"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;">
          <el-option
            v-for="(label, key) in StatusLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="workOrders" v-loading="loading" border stripe>
        <el-table-column prop="workOrderNo" label="工单号" width="160" fixed />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="plannedQty" label="计划数量" width="100" align="center" />
        <el-table-column prop="actualQty" label="完成数量" width="100" align="center" />
        <el-table-column label="进度" width="180">
          <template #default="scope">
            <el-progress
              :percentage="getProgress(scope.row)"
              :stroke-width="8"
              :text-inside="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <span :class="getStatusClass(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button type="primary" link size="small" @click="handleView(scope.row)">查看</el-button>
              <el-button
                v-if="scope.row.status === WorkOrderStatus.DRAFT"
                type="success"
                link
                size="small"
                @click="handleIssue(scope.row)"
              >下发</el-button>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { workOrderApi } from '@/api/workOrder';
import { WorkOrderStatus, StatusLabels, UserRole } from '@/types';
import { useUserStore } from '@/store';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const workOrders = ref<any[]>([]);

const filters = reactive({
  keyword: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const canCreateWorkOrder = computed(() => userStore.hasRole(UserRole.PLANNER));

const loadData = async () => {
  loading.value = true;
  try {
    const response = await workOrderApi.list({
      page: pagination.page,
      limit: pagination.pageSize,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
    });
    workOrders.value = response.data?.items || [];
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
  filters.status = '';
  pagination.page = 1;
  loadData();
};

const handleCreate = () => {
  router.push('/work-orders/create');
};

const handleView = (row: any) => {
  router.push(`/work-orders/${row.id}`);
};

const handleIssue = async (row: any) => {
  await ElMessageBox.confirm('确定要下发该工单吗？下发后将无法修改。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  try {
    await workOrderApi.issue(row.id);
    ElMessage.success('工单下发成功');
    loadData();
  } catch {
    ElMessage.error('下发失败');
  }
};

const getProgress = (row: any) => {
  if (!row.plannedQty || row.plannedQty === 0) return 0;
  return Math.round(((row.actualQty || 0) / row.plannedQty) * 100);
};

const getStatusLabel = (status: string) => StatusLabels[status as WorkOrderStatus] || status;

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [WorkOrderStatus.DRAFT]: 'status-tag-info',
    [WorkOrderStatus.PENDING]: 'status-tag-warning',
    [WorkOrderStatus.IN_PROGRESS]: 'status-tag-primary',
    [WorkOrderStatus.COMPLETED]: 'status-tag-success',
    [WorkOrderStatus.CLOSED]: 'status-tag-success',
    [WorkOrderStatus.CANCELLED]: 'status-tag-danger',
  };
  return 'status-tag ' + (classMap[status] || 'status-tag-info');
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadData();
});
</script>
