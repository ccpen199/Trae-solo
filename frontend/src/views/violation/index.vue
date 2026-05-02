<template>
  <div>
    <h2 style="margin-bottom: 20px;">超标事件管理</h2>
    
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="dashboard-card warning">
          <div class="card-value">{{ stats.pending_response || 0 }}</div>
          <div class="card-label">待响应</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card danger">
          <div class="card-value">{{ stats.waiting_inspection || 0 }}</div>
          <div class="card-label">待核查</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card info">
          <div class="card-value">{{ stats.under_treatment || 0 }}</div>
          <div class="card-label">治理中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card normal">
          <div class="card-value">{{ stats.compliant || 0 }}</div>
          <div class="card-label">已结案</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card>
      <template #header>
        <div class="table-header">
          <span>事件列表</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="事件状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="待响应" value="pending_response" />
            <el-option label="待核查" value="waiting_inspection" />
            <el-option label="治理中" value="under_treatment" />
            <el-option label="审核中" value="under_review" />
            <el-option label="合规" value="compliant" />
            <el-option label="已结案" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="violations" v-loading="loading" stripe>
        <el-table-column prop="eventCode" label="事件编号" width="180" />
        <el-table-column prop="enterpriseName" label="所属企业" />
        <el-table-column prop="violationIndicators" label="超标指标" width="180">
          <template #default="{ row }">
            <template v-if="row.violationIndicators">
              <el-tag v-for="(val, key) in row.violationIndicators" :key="key" size="small" type="danger" style="margin-right: 5px;">
                {{ key }}: {{ val }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', row.status]">{{ getStatusName(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="responseDeadline" label="响应截止" width="160">
          <template #default="{ row }">
            {{ formatTime(row.responseDeadline) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <template v-if="row.status === 'pending_response'">
              <el-button type="primary" link size="small" @click="handleRespond(row)">响应</el-button>
              <el-button type="danger" link size="small" @click="handleEscalate(row)">升级</el-button>
            </template>
            <template v-else-if="row.status === 'waiting_inspection'">
              <el-button type="primary" link size="small" @click="handleInspect(row)">核查</el-button>
            </template>
            <template v-else-if="row.status === 'under_treatment'">
              <el-button type="primary" link size="small" @click="handleRectify(row)">整改</el-button>
            </template>
            <template v-else-if="row.status === 'under_review'">
              <el-button type="success" link size="small" @click="handleVerify(row)">验证结案</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showDetailDialog" title="事件详情" width="800px">
      <el-descriptions :column="2" border v-if="currentViolation">
        <el-descriptions-item label="事件编号">{{ currentViolation.eventCode }}</el-descriptions-item>
        <el-descriptions-item label="企业名称">{{ currentViolation.enterpriseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="事件状态">
          <span :class="['status-tag', currentViolation.status]">{{ getStatusName(currentViolation.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="响应截止">{{ formatTime(currentViolation.responseDeadline) }}</el-descriptions-item>
        <el-descriptions-item label="超标指标" :span="2">
          <template v-if="currentViolation.violationIndicators">
            <el-tag v-for="(val, key) in currentViolation.violationIndicators" :key="key" size="small" type="danger" style="margin-right: 5px;">
              {{ key }}: {{ val }}
            </el-tag>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="溯源结果" :span="2">
          <pre v-if="currentViolation.traceResult" style="white-space: pre-wrap; margin: 0;">{{ JSON.stringify(currentViolation.traceResult, null, 2) }}</pre>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">处理轨迹</el-divider>
      <el-timeline class="timeline-container">
        <el-timeline-item
          v-for="(item, index) in traceList"
          :key="index"
          :timestamp="formatTime(item.time)"
          placement="top"
        >
          <div class="timeline-card">
            <div class="timeline-title">{{ item.action }}</div>
            <div class="timeline-content">{{ item.description }}</div>
            <div class="timeline-time">操作人: {{ item.operator || '系统' }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
    
    <el-dialog v-model="showActionDialog" :title="actionTitle" width="500px">
      <el-form :model="actionForm" :rules="actionRules" ref="actionFormRef" label-width="100px">
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="actionForm.content"
            type="textarea"
            :rows="4"
            :placeholder="actionPlaceholder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showActionDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getViolations, getViolationById, getTrace,
  enterpriseRespond, escalateToInspection, submitInspectionResult,
  submitRectification, verifyCompliance
} from '@/api/violation';
import { getStatistics } from '@/api/violation';
import dayjs from 'dayjs';

const loading = ref(false);
const showDetailDialog = ref(false);
const showActionDialog = ref(false);
const actionFormRef = ref(null);
const currentViolation = ref(null);
const traceList = ref([]);
const actionType = ref('');
const actionTitle = ref('');
const actionPlaceholder = ref('');

const searchForm = reactive({
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const stats = reactive({
  pending_response: 0,
  waiting_inspection: 0,
  under_treatment: 0,
  under_review: 0,
  compliant: 0,
  closed: 0,
});

const violations = ref([]);

const actionForm = reactive({
  content: '',
});

const actionRules = {
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
};

const getStatusName = (status) => {
  const names = {
    pending_response: '待响应',
    waiting_inspection: '待核查',
    under_treatment: '治理中',
    under_review: '审核中',
    compliant: '合规',
    closed: '已结案',
  };
  return names[status] || status;
};

const formatTime = (time) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

const loadStatistics = async () => {
  try {
    const res = await getStatistics();
    if (res.data) {
      Object.assign(stats, res.data);
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
};

const loadViolations = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: '-createdAt',
    };
    const res = await getViolations(params);
    violations.value = res.data || [];
    pagination.total = res.total || violations.value.length;
  } catch (error) {
    console.error('加载事件列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadViolations();
};

const handleReset = () => {
  searchForm.status = '';
  pagination.page = 1;
  loadViolations();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  loadViolations();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  loadViolations();
};

const viewDetail = async (row) => {
  currentViolation.value = row;
  showDetailDialog.value = true;
  
  try {
    const [detailRes, traceRes] = await Promise.all([
      getViolationById(row.id).catch(() => ({ data: row })),
      getTrace(row.id).catch(() => ({ data: [] })),
    ]);
    
    currentViolation.value = detailRes.data || row;
    traceList.value = traceRes.data || [];
  } catch (error) {
    console.error('加载详情失败:', error);
  }
};

const handleRespond = (row) => {
  actionType.value = 'respond';
  actionTitle.value = '企业响应';
  actionPlaceholder.value = '请输入自查结果...';
  currentViolation.value = row;
  actionForm.content = '';
  showActionDialog.value = true;
};

const handleEscalate = (row) => {
  ElMessageBox.confirm('确定要将此事件升级为核查单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await escalateToInspection(row.id, { reason: '企业逾期未响应' });
        ElMessage.success('升级成功');
        loadViolations();
        loadStatistics();
      } catch (error) {
        console.error('升级失败:', error);
      }
    })
    .catch(() => {});
};

const handleInspect = (row) => {
  actionType.value = 'inspect';
  actionTitle.value = '录入核查结果';
  actionPlaceholder.value = '请输入核查结果和整改要求...';
  currentViolation.value = row;
  actionForm.content = '';
  showActionDialog.value = true;
};

const handleRectify = (row) => {
  actionType.value = 'rectify';
  actionTitle.value = '提交整改证明';
  actionPlaceholder.value = '请输入整改内容和证明材料...';
  currentViolation.value = row;
  actionForm.content = '';
  showActionDialog.value = true;
};

const handleVerify = (row) => {
  ElMessageBox.confirm('确定要验证结案吗？验证通过后状态将转为合规。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await verifyCompliance(row.id);
        ElMessage.success('验证结案成功');
        loadViolations();
        loadStatistics();
      } catch (error) {
        console.error('验证失败:', error);
      }
    })
    .catch(() => {});
};

const handleSubmitAction = async () => {
  if (!actionFormRef.value) return;
  
  await actionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (actionType.value === 'respond') {
          await enterpriseRespond(currentViolation.value.id, {
            respondContent: actionForm.content,
            isSelfCorrected: true,
          });
          ElMessage.success('响应成功');
        } else if (actionType.value === 'inspect') {
          await submitInspectionResult(currentViolation.value.inspectionOrderId || currentViolation.value.id, {
            inspectionResult: actionForm.content,
            rectificationRequirements: '请按要求整改',
            rectificationDeadline: dayjs().add(7, 'day').toISOString(),
          });
          ElMessage.success('核查完成');
        } else if (actionType.value === 'rectify') {
          await submitRectification(currentViolation.value.id, {
            rectificationContent: actionForm.content,
            proofMaterials: [],
          });
          ElMessage.success('整改提交成功');
        }
        
        showActionDialog.value = false;
        loadViolations();
        loadStatistics();
      } catch (error) {
        console.error('提交失败:', error);
      }
    }
  });
};

onMounted(() => {
  loadStatistics();
  loadViolations();
});
</script>
