<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">生产报工</h2>
    </div>

    <el-card style="margin-bottom: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ summary.totalQty }}</div>
            <div class="stat-label">总报工数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ summary.passQty }}</div>
            <div class="stat-label">合格数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ summary.failQty }}</div>
            <div class="stat-label">不合格数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ summary.yieldRate }}%</div>
            <div class="stat-label">良率</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索工单号/工序名称"
          clearable
          class="search-box"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
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

      <el-table :data="reports" v-loading="loading" border stripe>
        <el-table-column prop="workOrderNo" label="工单号" width="160" />
        <el-table-column prop="processName" label="工序名称" />
        <el-table-column prop="passQty" label="合格数" width="100" align="center">
          <template #default="scope">
            <span style="color: #67c23a; font-weight: 600;">{{ scope.row.passQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failQty" label="不合格数" width="100" align="center">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: 600;">{{ scope.row.failQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalQty" label="总数" width="80" align="center" />
        <el-table-column prop="yieldRate" label="良率" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.yieldRate >= 95 ? 'success' : 'warning'">
              {{ scope.row.yieldRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="workMinutes" label="工时(分)" width="100" align="center" />
        <el-table-column prop="reporterName" label="报工人" width="100" />
        <el-table-column prop="createdAt" label="报工时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
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
import { ref, reactive, computed, onMounted } from 'vue';
import { reportApi } from '@/api/report';

const loading = ref(false);
const reports = ref<any[]>([]);

const filters = reactive({
  keyword: '',
  dateRange: [] as string[],
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const summary = computed(() => {
  let passQty = 0;
  let failQty = 0;
  reports.value.forEach((r) => {
    passQty += r.passQty || 0;
    failQty += r.failQty || 0;
  });
  const totalQty = passQty + failQty;
  const yieldRate = totalQty > 0 ? Math.round((passQty / totalQty) * 10000) / 100 : 0;
  return {
    totalQty,
    passQty,
    failQty,
    yieldRate,
  };
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize,
    };
    if (filters.keyword) {
      params.keyword = filters.keyword;
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0];
      params.endDate = filters.dateRange[1];
    }

    const response = await reportApi.list(params);
    reports.value = response.data?.items || [];
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
  filters.dateRange = [];
  pagination.page = 1;
  loadData();
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadData();
});
</script>
