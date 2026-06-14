<template>
  <div>
    <div class="page-header">
      <h2>⭐ 信用管理</h2>
      <p style="color: #909399;">
        严格遵循《建筑市场信用管理暂行办法》，失信信息展示期限自动倒计时，修复记录需人工复核
      </p>
    </div>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: bold;">📋 信用记录列表</span>
      </template>
      <div style="margin-bottom: 16px; display: flex; gap: 12px;">
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 150px;">
          <el-option label="有效" value="有效" />
          <el-option label="已失效" value="已失效" />
          <el-option label="已修复" value="已修复" />
        </el-select>
        <el-select v-model="filterRepairStatus" placeholder="修复状态" clearable style="width: 150px;">
          <el-option label="未修复" value="未修复" />
          <el-option label="修复中" value="修复中" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已修复" value="已修复" />
          <el-option label="审核不通过" value="审核不通过" />
        </el-select>
        <el-button type="primary" @click="loadRecords">查询</el-button>
      </div>
      
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="enterprise_name" label="企业名称" min-width="200" />
        <el-table-column prop="credit_type" label="信用类型" width="150" />
        <el-table-column prop="credit_level" label="等级" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.credit_level.includes('AAA') || scope.row.credit_level.includes('良好') ? 'success' : 
                          scope.row.credit_level.includes('严重') ? 'danger' : 'warning'">
              {{ scope.row.credit_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="250" />
        <el-table-column label="公示倒计时" width="180">
          <template #default="scope">
            <div v-if="scope.row.status === '有效'">
              <el-tag type="warning" size="large">
                <el-icon><Timer /></el-icon>
                {{ scope.row.days_remaining }} 天
              </el-tag>
            </div>
            <el-tag v-else type="info">已下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '有效' ? 'success' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="repair_status" label="修复状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.repair_status === '已修复' ? 'success' : 
                          scope.row.repair_status === '待审核' ? 'warning' :
                          scope.row.repair_status === '审核不通过' ? 'danger' : 'info'">
              {{ scope.row.repair_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="法规依据" width="150">
          <template #default="scope">
            <el-button size="small" type="info" link @click="showMetaDialog(scope.row)">查看依据</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewCountdown(scope.row)">
              倒计时
            </el-button>
            <el-button 
              v-if="scope.row.repair_status === '未修复' && scope.row.status === '有效'"
              size="small" 
              type="primary"
              @click="applyRepair(scope.row)"
            >
              申请修复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 20px; text-align: center;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>

    <el-card class="card-shadow" v-if="showReviewPanel">
      <template #header>
        <span style="font-weight: bold; color: #e6a23c;">
          ⚠️ 待审核修复申请 ({{ pendingCount }})
        </span>
      </template>
      <el-table :data="pendingList" stripe>
        <el-table-column prop="enterprise_name" label="企业名称" min-width="200" />
        <el-table-column prop="credit_type" label="信用类型" width="120" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="description" label="整改说明" min-width="150" show-overflow-tooltip />
        <el-table-column prop="credit_description" label="失信内容" min-width="150" show-overflow-tooltip />
        <el-table-column label="证明核验" width="120" align="center">
          <template #default="scope">
            <el-tag type="warning" size="small">待核验</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="proof_file" label="证明文件" width="100">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="viewProof(scope.row.proof_file)">
              查看
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="submitted_at" label="申请时间" width="170" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" type="success" @click="reviewRepair(scope.row, true)">
              通过
            </el-button>
            <el-button size="small" type="danger" @click="reviewRepair(scope.row, false)">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="countdownDialogVisible" title="失信信息公示倒计时" width="500px">
      <div v-if="countdownData" style="text-align: center;">
        <el-alert
          :title="countdownData.regulation"
          type="info"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <div style="font-size: 16px; margin-bottom: 16px;">
          {{ countdownData.creditType }} - {{ countdownData.description }}
        </div>
        
        <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #e6a23c;">{{ countdownData.daysRemaining }}</div>
            <div style="color: #909399;">天</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #e6a23c;">{{ countdownData.hoursRemaining }}</div>
            <div style="color: #909399;">时</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #e6a23c;">{{ countdownData.minutesRemaining }}</div>
            <div style="color: #909399;">分</div>
          </div>
        </div>
        
        <div style="color: #909399;">
          公示截止日期：{{ countdownData.displayDeadline }}
        </div>
        
        <el-alert
          v-if="countdownData.isExpired"
          title="该失信信息已超过公示期限，自动下架"
          type="success"
          show-icon
          style="margin-top: 20px;"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="repairDialogVisible" title="申请信用修复" width="500px">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="企业">
          <span>{{ repairingRecord?.enterprise_name }}</span>
        </el-form-item>
        <el-form-item label="失信内容">
          <span>{{ repairingRecord?.description }}</span>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="repairForm.applicant" placeholder="请输入申请人姓名" />
        </el-form-item>
        <el-form-item label="整改说明">
          <el-input v-model="repairForm.description" type="textarea" :rows="3" placeholder="请简要说明整改情况" />
        </el-form-item>
        <el-form-item label="证明文件" required>
          <el-upload
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <el-button>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传主管部门盖章的信用修复证明文件（支持 jpg、png、pdf）
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repairDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="metaDialogVisible" title="法规依据与数据来源" width="700px">
      <div v-if="metaData" style="line-height: 2;">
        <el-alert
          :title="`【${metaData.credit_type}】${metaData.description}`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <el-divider content-position="left">📜 法规依据</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="适用法规">
            <a :href="metaData._meta.regulationUrl" target="_blank" style="color: #409eff;">
              {{ metaData._meta.regulation }}
            </a>
          </el-descriptions-item>
          <el-descriptions-item label="法规原文链接">
            <a :href="metaData._meta.regulationUrl" target="_blank" style="color: #409eff; word-break: break-all;">
              {{ metaData._meta.regulationUrl }}
            </a>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">📊 数据来源</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="原始数据来源">
            <span style="font-weight: bold;">{{ metaData.data_source }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原始出处URL">
            <a :href="metaData.source_url" target="_blank" style="color: #409eff; word-break: break-all;">
              {{ metaData.source_url }}
            </a>
          </el-descriptions-item>
          <el-descriptions-item label="数据更新时间">
            {{ metaData.data_updated_at }}
          </el-descriptions-item>
          <el-descriptions-item label="本地同步时间">
            {{ metaData._meta.dataFetchedAt }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">⏰ 展示期限与失效规则</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="生效日期">
            {{ metaData.effective_date }}
          </el-descriptions-item>
          <el-descriptions-item label="失效日期">
            {{ metaData.expiry_date }}
          </el-descriptions-item>
          <el-descriptions-item label="公示截止日期">
            <span style="color: #e6a23c; font-weight: bold;">{{ metaData.display_deadline }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="剩余公示天数">
            <el-tag :type="metaData.days_remaining <= 30 ? 'danger' : metaData.days_remaining <= 90 ? 'warning' : 'success'" size="large">
              ⏱️ {{ metaData.days_remaining }} 天
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          title="📋 失效/下架规则说明"
          type="info"
          :closable="false"
          style="margin-top: 20px;"
        >
          <template #default>
            <p><strong>规则依据：</strong>根据《建筑市场信用管理暂行办法》，失信信息公示期限为3年，期满自动下架。</p>
            <p><strong>下架条件：</strong>达到 display_deadline（{{ metaData.display_deadline }}）后系统自动下架，不再对外公示。</p>
            <p><strong>复查轨迹：</strong>系统每日自动检查即将到期记录，提前30天进行预警提醒。如企业完成信用修复，可申请提前下架。</p>
            <p v-if="metaData.repair_status !== '未修复'"><strong>修复状态：</strong>{{ metaData.repair_status }}，可点击"申请修复"提交整改证明。</p>
          </template>
        </el-alert>

        <el-alert
          title="💡 数据说明"
          type="info"
          :closable="false"
          style="margin-top: 12px;"
        >
          <template #default>
            <p>本系统数据同步自全国建筑市场监管公共服务平台及各级政府主管部门官方网站，数据更新存在1-3个工作日延迟。</p>
            <p>如对数据有异议，请联系主管部门进行数据核对。</p>
          </template>
        </el-alert>
      </div>
    </el-dialog>

    <el-card class="card-shadow" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #409eff;">📋 信用修复申请台账</span>
          <el-select v-model="repairFilterStatus" placeholder="状态筛选" clearable size="small" style="width: 120px;" @change="loadRepairApplications">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </div>
      </template>
      <el-table :data="repairApplications" stripe v-loading="repairLoading">
        <el-table-column prop="enterprise_name" label="企业名称" min-width="180" />
        <el-table-column prop="credit_type" label="信用类型" width="120" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="description" label="整改说明" min-width="150" show-overflow-tooltip />
        <el-table-column label="盖章证明核验" width="130" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'pending'" type="warning" size="small">待核验</el-tag>
            <el-tag v-else type="success" size="small">已核验</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="证明文件" width="100">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="viewProof(scope.row.proof_file)">
              查看
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="submitted_at" label="申请时间" width="170" />
        <el-table-column prop="status_text" label="审核状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'pending' ? 'warning' : 
                          scope.row.status === 'approved' ? 'success' : 'danger'">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="review_comment" label="驳回原因/审核意见" min-width="150" show-overflow-tooltip />
        <el-table-column label="复核人" width="100">
          <template #default="scope">
            <span v-if="scope.row.reviewed_by">{{ scope.row.reviewed_by === 1 ? '系统管理员' : '审核员' + scope.row.reviewed_by }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="reviewed_at" label="复核时间" width="170">
          <template #default="scope">
            <span v-if="scope.row.reviewed_at">{{ scope.row.reviewed_at }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="repairApplications.length === 0 && !repairLoading" style="text-align: center; color: #909399; padding: 40px;">
        暂无修复申请记录
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { creditApi } from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Timer } from '@element-plus/icons-vue';

const loading = ref(false);
const list = ref([]);
const pendingList = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const filterStatus = ref('');
const filterRepairStatus = ref('');
const showReviewPanel = ref(true);
const pendingCount = ref(0);
const countdownDialogVisible = ref(false);
const countdownData = ref(null);
const repairDialogVisible = ref(false);
const repairingRecord = ref(null);
const repairForm = ref({ file: null, applicant: '', description: '' });
const metaDialogVisible = ref(false);
const metaData = ref(null);
const repairApplications = ref([]);
const repairLoading = ref(false);
const repairFilterStatus = ref('');

const loadRecords = async () => {
  loading.value = true;
  try {
    const data = await creditApi.list({
      status: filterStatus.value,
      repairStatus: filterRepairStatus.value,
      page: page.value,
      pageSize: pageSize.value
    });
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    console.error('Load records failed:', err);
  } finally {
    loading.value = false;
  }
};

const loadPending = async () => {
  try {
    const data = await creditApi.pendingRepair({ pageSize: 20 });
    pendingList.value = data.list;
    pendingCount.value = data.total;
  } catch (err) {
    console.error('Load pending failed:', err);
  }
};

const viewCountdown = async (record) => {
  try {
    countdownData.value = await creditApi.countdown(record.id);
    countdownDialogVisible.value = true;
  } catch (err) {
    console.error('View countdown failed:', err);
  }
};

const showMetaDialog = (record) => {
  metaData.value = record;
  metaDialogVisible.value = true;
};

const loadRepairApplications = async () => {
  repairLoading.value = true;
  try {
    const params = { pageSize: 50 };
    if (repairFilterStatus.value) {
      params.status = repairFilterStatus.value;
    }
    const data = await creditApi.repairApplications(params);
    repairApplications.value = data.list;
  } catch (err) {
    console.error('Load repair applications failed:', err);
  } finally {
    repairLoading.value = false;
  }
};

const applyRepair = (record) => {
  repairingRecord.value = record;
  repairForm.value = { file: null, applicant: '', description: '' };
  repairDialogVisible.value = true;
};

const handleFileChange = (file) => {
  repairForm.value.file = file.raw;
};

const submitRepair = async () => {
  if (!repairForm.value.file) {
    ElMessage.warning('请上传证明文件');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('proof', repairForm.value.file);
    formData.append('applicant', repairForm.value.applicant);
    formData.append('description', repairForm.value.description);
    
    await creditApi.applyRepair(repairingRecord.value.id, formData);
    ElMessage.success('修复申请已提交，等待人工复核');
    repairDialogVisible.value = false;
    loadRecords();
    loadPending();
    loadRepairApplications();
  } catch (err) {
    console.error('Submit repair failed:', err);
  }
};

const reviewRepair = async (record, approved) => {
  try {
    let reviewComment = '';
    
    if (approved) {
      await ElMessageBox.confirm(
        `确认通过该修复申请？\n\n企业：${record.enterprise_name}\n失信类型：${record.credit_type}\n\n系统将自动核验盖章证明文件并更新信用记录状态。`,
        '通过审核确认',
        { 
          type: 'success',
          confirmButtonText: '确认通过',
          cancelButtonText: '取消'
        }
      );
      reviewComment = '经核验主管部门盖章证明文件真实有效，同意信用修复申请，信用记录已更新。';
    } else {
      const { value } = await ElMessageBox.prompt(
        `请输入驳回原因：\n\n企业：${record.enterprise_name}\n失信类型：${record.credit_type}`,
        '驳回审核确认',
        {
          confirmButtonText: '确认驳回',
          cancelButtonText: '取消',
          inputPlaceholder: '请详细说明驳回原因（如：证明文件不完整、整改未到位等）',
          inputType: 'textarea',
          inputValidator: (value) => {
            if (!value || value.trim().length < 5) {
              return '驳回原因至少需要5个字符';
            }
            return true;
          },
          type: 'warning'
        }
      );
      reviewComment = value;
    }
    
    await creditApi.reviewRepair(record.id, { 
      approved, 
      reviewerId: 1,
      reviewComment 
    });
    ElMessage.success(`审核${approved ? '通过' : '驳回'}成功`);
    loadRecords();
    loadPending();
    loadRepairApplications();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Review repair failed:', err);
    }
  }
};

const viewProof = (proofPath) => {
  window.open(proofPath, '_blank');
};

onMounted(() => {
  loadRecords();
  loadPending();
  loadRepairApplications();
});
</script>
