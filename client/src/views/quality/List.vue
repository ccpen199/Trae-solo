<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">质量检验</h2>
      <el-button v-if="canCreate" type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建检验
      </el-button>
    </div>

    <el-card style="margin-bottom: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ summary.total }}</div>
            <div class="stat-label">总检验数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ summary.pass }}</div>
            <div class="stat-label">合格</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ summary.fail }}</div>
            <div class="stat-label">不合格</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ summary.passRate }}%</div>
            <div class="stat-label">合格率</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

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
        <el-select v-model="filters.result" placeholder="检验结果" clearable style="width: 120px;">
          <el-option label="合格" value="PASS" />
          <el-option label="不合格" value="FAIL" />
        </el-select>
        <el-select v-model="filters.type" placeholder="检验类型" clearable style="width: 120px;">
          <el-option label="工序检验" value="PROCESS" />
          <el-option label="完工检验" value="FINAL" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="inspections" v-loading="loading" border stripe>
        <el-table-column prop="inspectionNo" label="检验单号" width="160" />
        <el-table-column prop="workOrderNo" label="工单号" width="160" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <span>{{ TypeLabels[scope.row.type] || scope.row.type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inspectQty" label="检验数量" width="100" align="center" />
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
        <el-table-column prop="result" label="结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'PASS' ? 'success' : 'danger'">
              {{ ResultLabels[scope.row.result] || scope.row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspectorName" label="检验员" width="100" />
        <el-table-column prop="createdAt" label="检验时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
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

    <el-dialog v-model="showDetailDialog" title="检验详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="检验单号">{{ selectedInspection?.inspectionNo }}</el-descriptions-item>
        <el-descriptions-item label="工单号">{{ selectedInspection?.workOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="检验类型">
          {{ TypeLabels[selectedInspection?.type] || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="检验结果">
          <el-tag :type="selectedInspection?.result === 'PASS' ? 'success' : 'danger'">
            {{ ResultLabels[selectedInspection?.result] || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="检验数量">{{ selectedInspection?.inspectQty }}</el-descriptions-item>
        <el-descriptions-item label="合格数量">{{ selectedInspection?.passQty }}</el-descriptions-item>
        <el-descriptions-item label="不合格数量">{{ selectedInspection?.failQty }}</el-descriptions-item>
        <el-descriptions-item label="检验员">{{ selectedInspection?.inspectorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="检验时间" :span="2">
          {{ formatDate(selectedInspection?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="不合格原因" :span="2">
          {{ selectedInspection?.failReason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="处理措施" :span="2">
          {{ selectedInspection?.treatment || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ selectedInspection?.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { qualityApi } from '@/api/quality';
import { UserRole, InspectionType, InspectionResult } from '@/types';
import { useUserStore } from '@/store';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const inspections = ref<any[]>([]);
const showDetailDialog = ref(false);
const selectedInspection = ref<any>(null);

const filters = reactive({
  keyword: '',
  result: '',
  type: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const TypeLabels: Record<string, string> = {
  [InspectionType.PROCESS]: '工序检验',
  [InspectionType.FINAL]: '完工检验',
};

const ResultLabels: Record<string, string> = {
  [InspectionResult.PASS]: '合格',
  [InspectionResult.FAIL]: '不合格',
};

const canCreate = computed(() =>
  userStore.hasRole([UserRole.QUALITY_INSPECTOR, UserRole.MANAGER])
);

const summary = computed(() => {
  let total = 0;
  let pass = 0;
  let fail = 0;
  inspections.value.forEach((i) => {
    total++;
    if (i.result === InspectionResult.PASS) pass++;
    else if (i.result === InspectionResult.FAIL) fail++;
  });
  const passRate = total > 0 ? Math.round((pass / total) * 10000) / 100 : 0;
  return { total, pass, fail, passRate };
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.result) params.result = filters.result;
    if (filters.type) params.type = filters.type;

    const response = await qualityApi.list(params);
    inspections.value = response.data?.items || [];
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
  filters.result = '';
  filters.type = '';
  pagination.page = 1;
  loadData();
};

const handleCreate = () => {
  router.push('/quality/create');
};

const handleView = (row: any) => {
  selectedInspection.value = row;
  showDetailDialog.value = true;
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadData();
});
</script>
