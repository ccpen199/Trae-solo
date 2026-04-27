<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">生产履历</h2>
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
        <el-select v-model="filters.status" placeholder="工单状态" clearable style="width: 120px;">
          <el-option
            v-for="(label, key) in StatusLabels"
            :key="key"
            :label="label"
            :value="key"
          />
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

      <el-table :data="histories" v-loading="loading" border stripe>
        <el-table-column prop="workOrderNo" label="工单号" width="160" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="productSpec" label="产品规格" />
        <el-table-column prop="plannedQty" label="计划数量" width="100" align="center" />
        <el-table-column prop="actualQty" label="完成数量" width="100" align="center" />
        <el-table-column prop="passQty" label="合格数" width="100" align="center">
          <template #default="scope">
            <span style="color: #67c23a;">{{ scope.row.passQty || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failQty" label="不合格数" width="100" align="center">
          <template #default="scope">
            <span style="color: #f56c6c;">{{ scope.row.failQty || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <span :class="getStatusClass(scope.row.status)">
              {{ StatusLabels[scope.row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="completedAt" label="完成时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.completedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
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

    <el-dialog v-model="showDetailDialog" title="生产履历详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工单号">{{ selectedHistory?.workOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="getStatusClass(selectedHistory?.status)">
            {{ StatusLabels[selectedHistory?.status] }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ selectedHistory?.productName }}</el-descriptions-item>
        <el-descriptions-item label="产品规格">{{ selectedHistory?.productSpec || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ selectedHistory?.plannedQty }}</el-descriptions-item>
        <el-descriptions-item label="完成数量">{{ selectedHistory?.actualQty }}</el-descriptions-item>
        <el-descriptions-item label="合格数量">{{ selectedHistory?.passQty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="不合格数量">{{ selectedHistory?.failQty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDate(selectedHistory?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间" :span="2">
          {{ formatDate(selectedHistory?.completedAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider>工序详情</el-divider>

      <el-table :data="selectedHistory?.processes || []" size="small" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="processName" label="工序名称" />
        <el-table-column prop="assignedUserName" label="操作工" width="100" />
        <el-table-column prop="plannedQty" label="计划数量" width="100" align="center" />
        <el-table-column prop="actualQty" label="完成数量" width="100" align="center" />
        <el-table-column prop="passQty" label="合格数" width="80" align="center">
          <template #default="scope">
            <span style="color: #67c23a;">{{ scope.row.passQty || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failQty" label="不合格数" width="80" align="center">
          <template #default="scope">
            <span style="color: #f56c6c;">{{ scope.row.failQty || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getProcessStatusType(scope.row.status)">
              {{ ProcessStatusLabels[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-divider>操作记录</el-divider>

      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in selectedHistory?.logs || []"
          :key="log.id || index"
          :timestamp="formatDate(log.createdAt)"
          placement="top"
        >
          <el-card size="small">
            <h4>{{ log.action }}</h4>
            <p style="color: #909399; font-size: 12px;">操作人：{{ log.userName || '系统' }}</p>
            <p v-if="log.remark" style="margin-top: 8px;">{{ log.remark }}</p>
          </el-card>
        </el-timeline-item>
        <el-empty
          v-if="!selectedHistory?.logs?.length"
          description="暂无操作记录"
          :image-size="60"
        />
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { masterDataApi } from '@/api/masterData';
import { WorkOrderStatus, StatusLabels, ProcessStatus, ProcessStatusLabels } from '@/types';

const loading = ref(false);
const histories = ref<any[]>([]);
const showDetailDialog = ref(false);
const selectedHistory = ref<any>(null);

const filters = reactive({
  keyword: '',
  status: '',
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
    if (filters.status) params.status = filters.status;
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0];
      params.endDate = filters.dateRange[1];
    }

    const response = await masterDataApi.listProductionHistory(params);
    histories.value = response.data?.items || [];
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
  filters.dateRange = [];
  pagination.page = 1;
  loadData();
};

const handleView = async (row: any) => {
  try {
    const response = await masterDataApi.getProductionHistoryDetail(row.id);
    selectedHistory.value = response.data;
    showDetailDialog.value = true;
  } catch {
    selectedHistory.value = row;
    showDetailDialog.value = true;
  }
};

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [WorkOrderStatus.DRAFT]: 'status-tag status-tag-info',
    [WorkOrderStatus.PENDING]: 'status-tag status-tag-warning',
    [WorkOrderStatus.IN_PROGRESS]: 'status-tag status-tag-primary',
    [WorkOrderStatus.COMPLETED]: 'status-tag status-tag-success',
    [WorkOrderStatus.CLOSED]: 'status-tag status-tag-success',
    [WorkOrderStatus.CANCELLED]: 'status-tag status-tag-danger',
  };
  return classMap[status] || 'status-tag status-tag-info';
};

const getProcessStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    [ProcessStatus.PENDING]: 'info',
    [ProcessStatus.ASSIGNED]: 'warning',
    [ProcessStatus.IN_PROGRESS]: 'primary',
    [ProcessStatus.COMPLETED]: 'success',
    [ProcessStatus.INSPECTED]: 'success',
    [ProcessStatus.HOLD]: 'danger',
  };
  return typeMap[status] || 'info';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadData();
});
</script>
