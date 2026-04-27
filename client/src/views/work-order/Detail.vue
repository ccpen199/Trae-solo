<template>
  <div>
    <div class="page-header">
      <div>
        <el-button link @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title" style="display: inline; margin-left: 12px;">
          工单详情 - {{ workOrder?.workOrderNo }}
        </h2>
      </div>
      <div>
        <el-button
          v-if="workOrder?.status === WorkOrderStatus.DRAFT"
          type="success"
          :loading="submitting"
          @click="handleIssue"
        >下发工单</el-button>
      </div>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="16">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span class="card-title">基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单号">{{ workOrder?.workOrderNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <span :class="getStatusClass(workOrder?.status)">
                {{ getStatusLabel(workOrder?.status) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ workOrder?.productName }}</el-descriptions-item>
            <el-descriptions-item label="产品规格">{{ workOrder?.productSpec || '-' }}</el-descriptions-item>
            <el-descriptions-item label="计划数量">{{ workOrder?.plannedQty }}</el-descriptions-item>
            <el-descriptions-item label="已完成数量">{{ workOrder?.actualQty || 0 }}</el-descriptions-item>
            <el-descriptions-item label="优先级">
              {{ PriorityLabels[workOrder?.priority as WorkOrderPriority] || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="进度">
              <el-progress
                :percentage="getProgress(workOrder)"
                :stroke-width="18"
                :text-inside="true"
              />
            </el-descriptions-item>
            <el-descriptions-item label="计划开始日期">
              {{ workOrder?.plannedStartDate || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="计划完成日期">
              {{ workOrder?.plannedEndDate || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(workOrder?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建人">
              {{ workOrder?.creatorName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ workOrder?.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">工序列表</span>
            </div>
          </template>
          <el-table :data="processes" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="processName" label="工序名称" />
            <el-table-column prop="assignedUserName" label="操作工" width="120" />
            <el-table-column prop="assignedEquipmentName" label="设备" width="120" />
            <el-table-column prop="plannedQty" label="计划数量" width="100" align="center" />
            <el-table-column prop="actualQty" label="完成数量" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <span :class="getProcessStatusClass(scope.row.status)">
                  {{ getProcessStatusLabel(scope.row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <div class="table-actions">
                  <el-button
                    v-if="canAssignProcess && scope.row.status === ProcessStatus.PENDING"
                    type="primary"
                    link
                    size="small"
                    @click="handleAssignProcess(scope.row)"
                  >分配</el-button>
                  <el-button
                    v-if="canStartProcess && scope.row.status === ProcessStatus.ASSIGNED"
                    type="success"
                    link
                    size="small"
                    @click="handleStartProcess(scope.row)"
                  >开始</el-button>
                  <el-button
                    v-if="canReportProcess && scope.row.status === ProcessStatus.IN_PROGRESS"
                    type="warning"
                    link
                    size="small"
                    @click="handleReport(scope.row)"
                  >报工</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card>
          <template #header>
            <span class="card-title">生产记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in processLogs"
              :key="log.id"
              :timestamp="formatDate(log.createdAt)"
              placement="top"
            >
              <el-card>
                <h4>{{ log.action }}</h4>
                <p v-if="log.remark">{{ log.remark }}</p>
                <p style="color: #909399; font-size: 12px;">操作人：{{ log.userName || '系统' }}</p>
              </el-card>
            </el-timeline-item>
            <el-empty v-if="processLogs.length === 0" description="暂无生产记录" />
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span class="card-title">报工统计</span>
          </template>
          <div class="stat-card">
            <div class="stat-value">{{ reportStats.totalQty }}</div>
            <div class="stat-label">总报工数量</div>
          </div>
          <el-divider />
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ reportStats.passQty }}</div>
            <div class="stat-label">合格数量</div>
          </div>
          <el-divider />
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ reportStats.failQty }}</div>
            <div class="stat-label">不合格数量</div>
          </div>
          <el-divider />
          <div class="stat-card">
            <div class="stat-value">{{ reportStats.yieldRate }}%</div>
            <div class="stat-label">良率</div>
          </div>
        </el-card>

        <el-card style="margin-bottom: 20px;">
          <template #header>
            <span class="card-title">绑定物料</span>
          </template>
          <el-table :data="workOrder?.materials || []" size="small" border>
            <el-table-column prop="materialName" label="物料名称" />
            <el-table-column prop="qty" label="数量" width="80" align="center" />
          </el-table>
          <el-empty v-if="!workOrder?.materials?.length" description="暂无绑定物料" />
        </el-card>

        <el-card>
          <template #header>
            <span class="card-title">绑定设备</span>
          </template>
          <el-table :data="workOrder?.equipments || []" size="small" border>
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="equipmentNo" label="编号" />
          </el-table>
          <el-empty v-if="!workOrder?.equipments?.length" description="暂无绑定设备" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAssignDialog" title="分配工序" width="500px">
      <el-form
        :model="assignForm"
        :rules="assignRules"
        label-width="100px"
        ref="assignFormRef"
      >
        <el-form-item label="操作工" prop="userId">
          <el-select
            v-model="assignForm.userId"
            placeholder="请选择操作工"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in operators"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备" prop="equipmentId">
          <el-select
            v-model="assignForm.equipmentId"
            placeholder="请选择设备"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="equip in availableEquipments"
              :key="equip.id"
              :label="equip.name"
              :value="equip.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" prop="plannedQty">
          <el-input-number
            v-model="assignForm.plannedQty"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReportDialog" title="生产报工" width="500px">
      <el-form
        :model="reportForm"
        :rules="reportRules"
        label-width="100px"
        ref="reportFormRef"
      >
        <el-form-item label="合格数量" prop="passQty">
          <el-input-number
            v-model="reportForm.passQty"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="不合格数量" prop="failQty">
          <el-input-number
            v-model="reportForm.failQty"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工时(分钟)" prop="workMinutes">
          <el-input-number
            v-model="reportForm.workMinutes"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="reportForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReport">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { workOrderApi } from '@/api/workOrder';
import { reportApi } from '@/api/report';
import { masterDataApi } from '@/api/masterData';
import {
  WorkOrderStatus,
  StatusLabels,
  WorkOrderPriority,
  PriorityLabels,
  ProcessStatus,
  ProcessStatusLabels,
  UserRole,
} from '@/types';
import { useUserStore } from '@/store';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const workOrderId = computed(() => Number(route.params.id));

const loading = ref(false);
const submitting = ref(false);
const workOrder = ref<any>(null);
const processes = ref<any[]>([]);
const processLogs = ref<any[]>([]);
const operators = ref<any[]>([]);
const availableEquipments = ref<any[]>([]);

const showAssignDialog = ref(false);
const showReportDialog = ref(false);
const assignFormRef = ref<FormInstance>();
const reportFormRef = ref<FormInstance>();
const selectedProcess = ref<any>(null);

const assignForm = reactive({
  userId: null as number | null,
  equipmentId: null as number | null,
  plannedQty: 1,
});

const reportForm = reactive({
  passQty: 0,
  failQty: 0,
  workMinutes: 0,
  remark: '',
});

const assignRules: FormRules = {
  userId: [{ required: true, message: '请选择操作工', trigger: 'change' }],
};

const reportRules: FormRules = {
  passQty: [{ required: true, message: '请输入合格数量', trigger: 'blur' }],
};

const canAssignProcess = computed(() => userStore.hasRole([UserRole.TEAM_LEADER, UserRole.MANAGER]));
const canStartProcess = computed(() =>
  userStore.hasRole([UserRole.OPERATOR, UserRole.TEAM_LEADER, UserRole.MANAGER])
);
const canReportProcess = computed(() =>
  userStore.hasRole([UserRole.OPERATOR, UserRole.TEAM_LEADER, UserRole.MANAGER])
);

const reportStats = computed(() => {
  let passQty = 0;
  let failQty = 0;
  processes.value.forEach((p) => {
    passQty += p.passQty || 0;
    failQty += p.failQty || 0;
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

const loadWorkOrder = async () => {
  loading.value = true;
  try {
    const response = await workOrderApi.getDetail(workOrderId.value);
    workOrder.value = response.data;
    processes.value = response.data?.processes || [];
    processLogs.value = response.data?.logs || [];
  } finally {
    loading.value = false;
  }
};

const loadOperators = async () => {
  try {
    const response = await masterDataApi.listUsers({ role: UserRole.OPERATOR, limit: 100 });
    operators.value = response.data?.items || [];
  } catch {
    // ignore
  }
};

const loadEquipments = async () => {
  try {
    const response = await masterDataApi.listEquipments({ limit: 100 });
    availableEquipments.value = response.data?.items || [];
  } catch {
    // ignore
  }
};

const handleBack = () => {
  router.back();
};

const handleIssue = async () => {
  await ElMessageBox.confirm('确定要下发该工单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  submitting.value = true;
  try {
    await workOrderApi.issue(workOrderId.value);
    ElMessage.success('工单下发成功');
    loadWorkOrder();
  } catch {
    ElMessage.error('下发失败');
  } finally {
    submitting.value = false;
  }
};

const handleAssignProcess = (row: any) => {
  selectedProcess.value = row;
  assignForm.userId = null;
  assignForm.equipmentId = null;
  assignForm.plannedQty = row.plannedQty || 1;
  showAssignDialog.value = true;
};

const handleStartProcess = async (row: any) => {
  await ElMessageBox.confirm('确定要开始该工序吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  });

  try {
    await workOrderApi.startProcess(row.id);
    ElMessage.success('工序已开始');
    loadWorkOrder();
  } catch {
    ElMessage.error('操作失败');
  }
};

const handleReport = (row: any) => {
  selectedProcess.value = row;
  reportForm.passQty = 0;
  reportForm.failQty = 0;
  reportForm.workMinutes = 0;
  reportForm.remark = '';
  showReportDialog.value = true;
};

const submitAssign = async () => {
  if (!assignFormRef.value || !selectedProcess.value) return;

  await assignFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      await workOrderApi.assignProcess(selectedProcess.value.id, {
        userId: assignForm.userId!,
        equipmentId: assignForm.equipmentId || undefined,
        plannedQty: assignForm.plannedQty,
      });
      ElMessage.success('分配成功');
      showAssignDialog.value = false;
      loadWorkOrder();
    } catch {
      ElMessage.error('分配失败');
    } finally {
      submitting.value = false;
    }
  });
};

const submitReport = async () => {
  if (!reportFormRef.value || !selectedProcess.value) return;

  await reportFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      await reportApi.create({
        workOrderProcessId: selectedProcess.value.id,
        passQty: reportForm.passQty,
        failQty: reportForm.failQty,
        workMinutes: reportForm.workMinutes || undefined,
        remark: reportForm.remark || undefined,
      });
      ElMessage.success('报工成功');
      showReportDialog.value = false;
      loadWorkOrder();
    } catch {
      ElMessage.error('报工失败');
    } finally {
      submitting.value = false;
    }
  });
};

const getProgress = (row: any) => {
  if (!row?.plannedQty || row.plannedQty === 0) return 0;
  return Math.round(((row.actualQty || 0) / row.plannedQty) * 100);
};

const getStatusLabel = (status: string) => StatusLabels[status as WorkOrderStatus] || status;

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

const getProcessStatusLabel = (status: string) => ProcessStatusLabels[status as ProcessStatus] || status;

const getProcessStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    [ProcessStatus.PENDING]: 'status-tag status-tag-info',
    [ProcessStatus.ASSIGNED]: 'status-tag status-tag-warning',
    [ProcessStatus.IN_PROGRESS]: 'status-tag status-tag-primary',
    [ProcessStatus.COMPLETED]: 'status-tag status-tag-success',
    [ProcessStatus.INSPECTED]: 'status-tag status-tag-success',
    [ProcessStatus.HOLD]: 'status-tag status-tag-danger',
  };
  return classMap[status] || 'status-tag status-tag-info';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadWorkOrder();
  loadOperators();
  loadEquipments();
});
</script>
