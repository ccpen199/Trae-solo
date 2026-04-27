<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">异常管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        上报异常
      </el-button>
    </div>

    <el-card style="margin-bottom: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ summary.total }}</div>
            <div class="stat-label">总异常数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ summary.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ summary.processing }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ summary.resolved }}</div>
            <div class="stat-label">已解决</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索描述/工单号"
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
        <el-select v-model="filters.type" placeholder="异常类型" clearable style="width: 140px;">
          <el-option
            v-for="(label, key) in TypeLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="abnormals" v-loading="loading" border stripe>
        <el-table-column prop="abnormalNo" label="异常编号" width="160" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ TypeLabels[scope.row.type] || scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="workOrderNo" label="关联工单" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <span :class="getStatusClass(scope.row.status)">
              {{ StatusLabels[scope.row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reporterName" label="上报人" width="100" />
        <el-table-column prop="assignedToName" label="处理人" width="100">
          <template #default="scope">
            {{ scope.row.assignedToName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上报时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button type="primary" link size="small" @click="handleView(scope.row)">
                详情
              </el-button>
              <el-button
                v-if="canAssign && scope.row.status === AbnormalStatus.PENDING"
                type="success"
                link
                size="small"
                @click="handleAssign(scope.row)"
              >分配</el-button>
              <el-button
                v-if="canProcess && scope.row.status === AbnormalStatus.PROCESSING"
                type="warning"
                link
                size="small"
                @click="handleResolve(scope.row)"
              >处理</el-button>
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

    <el-dialog v-model="showDetailDialog" title="异常详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="异常编号">{{ selectedAbnormal?.abnormalNo }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">
          <el-tag :type="getTypeTagType(selectedAbnormal?.type)">
            {{ TypeLabels[selectedAbnormal?.type] || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="getStatusClass(selectedAbnormal?.status)">
            {{ StatusLabels[selectedAbnormal?.status] || '-' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          {{ PriorityLabels[selectedAbnormal?.priority] || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联工单">
          {{ selectedAbnormal?.workOrderNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联工序">
          {{ selectedAbnormal?.processName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="上报人">{{ selectedAbnormal?.reporterName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上报时间">
          {{ formatDate(selectedAbnormal?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">
          {{ selectedAbnormal?.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedAbnormal?.assignedToName" label="处理人" :span="2">
          {{ selectedAbnormal?.assignedToName }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedAbnormal?.treatment" label="处理措施" :span="2">
          {{ selectedAbnormal?.treatment }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedAbnormal?.resolvedAt" label="解决时间" :span="2">
          {{ formatDate(selectedAbnormal?.resolvedAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showAssignDialog" title="分配异常" width="500px">
      <el-form
        :model="assignForm"
        :rules="assignRules"
        label-width="100px"
        ref="assignFormRef"
      >
        <el-form-item label="分配给" prop="assignedToId">
          <el-select
            v-model="assignForm.assignedToId"
            placeholder="请选择处理人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in handlers"
              :key="user.id"
              :label="user.name + ' (' + UserRoleLabels[user.role] + ')'"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResolveDialog" title="处理异常" width="500px">
      <el-form
        :model="resolveForm"
        :rules="resolveRules"
        label-width="100px"
        ref="resolveFormRef"
      >
        <el-form-item label="处理措施" prop="treatment">
          <el-input
            v-model="resolveForm.treatment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理措施"
          />
        </el-form-item>
        <el-form-item label="是否解决" prop="resolved">
          <el-radio-group v-model="resolveForm.resolved">
            <el-radio :value="true">已解决</el-radio>
            <el-radio :value="false">继续处理</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResolve">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { abnormalApi } from '@/api/abnormal';
import { masterDataApi } from '@/api/masterData';
import {
  AbnormalStatus,
  AbnormalStatusLabels,
  AbnormalType,
  AbnormalTypeLabels,
  AbnormalPriority,
  AbnormalPriorityLabels,
  UserRole,
  UserRoleLabels,
} from '@/types';
import { useUserStore } from '@/store';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const submitting = ref(false);
const abnormals = ref<any[]>([]);
const handlers = ref<any[]>([]);
const showDetailDialog = ref(false);
const showAssignDialog = ref(false);
const showResolveDialog = ref(false);
const selectedAbnormal = ref<any>(null);
const assignFormRef = ref<FormInstance>();
const resolveFormRef = ref<FormInstance>();

const StatusLabels = AbnormalStatusLabels;
const TypeLabels = AbnormalTypeLabels;
const PriorityLabels = AbnormalPriorityLabels;

const filters = reactive({
  keyword: '',
  status: '',
  type: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const assignForm = reactive({
  assignedToId: null as number | null,
});

const resolveForm = reactive({
  treatment: '',
  resolved: true,
});

const assignRules: FormRules = {
  assignedToId: [{ required: true, message: '请选择处理人', trigger: 'change' }],
};

const resolveRules: FormRules = {
  treatment: [{ required: true, message: '请输入处理措施', trigger: 'blur' }],
};

const canAssign = computed(() =>
  userStore.hasRole([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.PLANNER])
);
const canProcess = computed(() =>
  userStore.hasRole([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.OPERATOR])
);

const summary = computed(() => {
  let total = 0;
  let pending = 0;
  let processing = 0;
  let resolved = 0;
  abnormals.value.forEach((a) => {
    total++;
    if (a.status === AbnormalStatus.PENDING) pending++;
    else if (a.status === AbnormalStatus.PROCESSING) processing++;
    else if (a.status === AbnormalStatus.RESOLVED || a.status === AbnormalStatus.CLOSED) resolved++;
  });
  return { total, pending, processing, resolved };
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
    if (filters.type) params.type = filters.type;

    const response = await abnormalApi.list(params);
    abnormals.value = response.data?.items || [];
    pagination.total = response.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const loadHandlers = async () => {
  try {
    const response = await masterDataApi.listUsers({ limit: 100 });
    handlers.value = response.data?.items || [];
  } catch {
    // ignore
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  filters.keyword = '';
  filters.status = '';
  filters.type = '';
  pagination.page = 1;
  loadData();
};

const handleCreate = () => {
  router.push('/abnormals/create');
};

const handleView = (row: any) => {
  selectedAbnormal.value = row;
  showDetailDialog.value = true;
};

const handleAssign = (row: any) => {
  selectedAbnormal.value = row;
  assignForm.assignedToId = null;
  showAssignDialog.value = true;
};

const handleResolve = (row: any) => {
  selectedAbnormal.value = row;
  resolveForm.treatment = '';
  resolveForm.resolved = true;
  showResolveDialog.value = true;
};

const submitAssign = async () => {
  if (!assignFormRef.value || !selectedAbnormal.value) return;

  await assignFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      await abnormalApi.assign(selectedAbnormal.value.id, {
        assignedToId: assignForm.assignedToId!,
      });
      ElMessage.success('分配成功');
      showAssignDialog.value = false;
      loadData();
    } catch {
      ElMessage.error('分配失败');
    } finally {
      submitting.value = false;
    }
  });
};

const submitResolve = async () => {
  if (!resolveFormRef.value || !selectedAbnormal.value) return;

  await resolveFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (resolveForm.resolved) {
        await abnormalApi.resolve(selectedAbnormal.value.id, {
          treatment: resolveForm.treatment,
        });
      } else {
        await abnormalApi.process(selectedAbnormal.value.id, {
          treatment: resolveForm.treatment,
        });
      }
      ElMessage.success('提交成功');
      showResolveDialog.value = false;
      loadData();
    } catch {
      ElMessage.error('提交失败');
    } finally {
      submitting.value = false;
    }
  });
};

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [AbnormalStatus.PENDING]: 'status-tag status-tag-danger',
    [AbnormalStatus.PROCESSING]: 'status-tag status-tag-warning',
    [AbnormalStatus.RESOLVED]: 'status-tag status-tag-success',
    [AbnormalStatus.CLOSED]: 'status-tag status-tag-info',
  };
  return classMap[status] || 'status-tag status-tag-info';
};

const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    [AbnormalType.EQUIPMENT]: 'danger',
    [AbnormalType.MATERIAL]: 'warning',
    [AbnormalType.PROCESS]: 'info',
    [AbnormalType.QUALITY]: 'danger',
    [AbnormalType.OTHER]: 'info',
  };
  return typeMap[type] || 'info';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadData();
  loadHandlers();
});
</script>
