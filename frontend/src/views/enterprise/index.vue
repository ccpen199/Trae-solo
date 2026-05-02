<template>
  <div>
    <h2 style="margin-bottom: 20px;">企业管理</h2>
    
    <el-card>
      <template #header>
        <div class="table-header">
          <span>企业列表</span>
          <el-button type="primary" size="small" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增企业
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="行业类型">
          <el-select v-model="searchForm.industryType" placeholder="全部行业" clearable style="width: 150px;">
            <el-option label="化工" value="化工" />
            <el-option label="环保" value="环保" />
            <el-option label="冶金" value="冶金" />
            <el-option label="新能源" value="新能源" />
          </el-select>
        </el-form-item>
        <el-form-item label="合规状态">
          <el-select v-model="searchForm.complianceStatus" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="合规" value="compliant" />
            <el-option label="预警" value="warning" />
            <el-option label="超标" value="violation" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="enterprises" v-loading="loading" stripe>
        <el-table-column prop="code" label="企业编号" width="120" />
        <el-table-column prop="name" label="企业名称" />
        <el-table-column prop="industryType" label="行业类型" width="100" />
        <el-table-column prop="legalPerson" label="法人代表" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="120" />
        <el-table-column prop="creditScore" label="信用分" width="100">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.creditScore" 
              :color="row.creditScore >= 80 ? '#67c23a' : row.creditScore >= 60 ? '#e6a23c' : '#f56c6c'"
              :stroke-width="12"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="complianceStatus" label="合规状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.complianceStatus === 'compliant' ? 'success' : row.complianceStatus === 'warning' ? 'warning' : 'danger'" size="small">
              {{ row.complianceStatus === 'compliant' ? '合规' : row.complianceStatus === 'warning' ? '预警' : '超标' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editEnterprise(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="viewEvaluation(row)">评价</el-button>
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
    
    <el-dialog v-model="showAddDialog" title="企业信息" width="700px">
      <el-form :model="enterpriseForm" :rules="enterpriseRules" ref="enterpriseFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="企业编号" prop="code">
              <el-input v-model="enterpriseForm.code" placeholder="请输入企业编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业名称" prop="name">
              <el-input v-model="enterpriseForm.name" placeholder="请输入企业名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行业类型" prop="industryType">
              <el-select v-model="enterpriseForm.industryType" placeholder="请选择行业类型" style="width: 100%;">
                <el-option label="化工" value="化工" />
                <el-option label="环保" value="环保" />
                <el-option label="冶金" value="冶金" />
                <el-option label="新能源" value="新能源" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人代表" prop="legalPerson">
              <el-input v-model="enterpriseForm.legalPerson" placeholder="请输入法人代表" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="enterpriseForm.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用分" prop="creditScore">
              <el-input-number v-model="enterpriseForm.creditScore" :min="0" :max="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="address">
          <el-input v-model="enterpriseForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input v-model="enterpriseForm.longitude" placeholder="请输入经度" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input v-model="enterpriseForm.latitude" placeholder="请输入纬度" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEnterprise">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showEvaluationDialog" title="企业合规评价" width="700px">
      <el-descriptions :column="2" border v-if="evaluationResult">
        <el-descriptions-item label="企业名称">{{ evaluationResult.enterpriseName }}</el-descriptions-item>
        <el-descriptions-item label="评价时段">{{ evaluationResult.period || '最近30天' }}</el-descriptions-item>
        <el-descriptions-item label="信用分">{{ evaluationResult.creditScore }}</el-descriptions-item>
        <el-descriptions-item label="合规等级">
          <el-tag :type="evaluationResult.grade === 'A' ? 'success' : evaluationResult.grade === 'B' ? 'warning' : 'danger'">
            {{ evaluationResult.grade }}级
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="超标次数">{{ evaluationResult.violationCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="平均响应时间">{{ evaluationResult.avgResponseTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="评价详情" :span="2">
          <div v-if="evaluationResult.details">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in evaluationResult.details"
                :key="index"
                :timestamp="item.time"
              >
                <div>
                  <strong>{{ item.category }}</strong>: {{ item.reason }} ({{ item.points > 0 ? '+' : '' }}{{ item.points }}分)
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getEnterprises, createEnterprise, updateEnterprise, evaluateEnterprise, getRanking } from '@/api/enterprise';
import dayjs from 'dayjs';

const loading = ref(false);
const showAddDialog = ref(false);
const showEvaluationDialog = ref(false);
const enterpriseFormRef = ref(null);
const currentEnterprise = ref(null);
const evaluationResult = ref(null);

const searchForm = reactive({
  industryType: '',
  complianceStatus: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const enterprises = ref([]);

const enterpriseForm = reactive({
  code: '',
  name: '',
  industryType: '',
  legalPerson: '',
  contactPhone: '',
  creditScore: 80,
  address: '',
  longitude: '',
  latitude: '',
  complianceStatus: 'compliant',
  status: 'active',
});

const enterpriseRules = {
  code: [{ required: true, message: '请输入企业编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  industryType: [{ required: true, message: '请选择行业类型', trigger: 'change' }],
};

const loadEnterprises = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: '-creditScore',
    };
    const res = await getEnterprises(params);
    enterprises.value = res.data || [];
    pagination.total = res.total || enterprises.value.length;
  } catch (error) {
    console.error('加载企业列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadEnterprises();
};

const handleReset = () => {
  searchForm.industryType = '';
  searchForm.complianceStatus = '';
  pagination.page = 1;
  loadEnterprises();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  loadEnterprises();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  loadEnterprises();
};

const viewDetail = (row) => {
  Object.assign(enterpriseForm, row);
  currentEnterprise.value = row;
  showAddDialog.value = true;
};

const editEnterprise = (row) => {
  Object.assign(enterpriseForm, row);
  currentEnterprise.value = row;
  showAddDialog.value = true;
};

const viewEvaluation = async (row) => {
  try {
    const res = await evaluateEnterprise(row.id);
    evaluationResult.value = res.data;
    showEvaluationDialog.value = true;
  } catch (error) {
    console.error('加载评价失败:', error);
    ElMessage.error('加载评价失败');
  }
};

const handleSaveEnterprise = async () => {
  if (!enterpriseFormRef.value) return;
  
  await enterpriseFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (currentEnterprise.value) {
          await updateEnterprise(currentEnterprise.value.id, enterpriseForm);
          ElMessage.success('更新成功');
        } else {
          await createEnterprise(enterpriseForm);
          ElMessage.success('创建成功');
        }
        showAddDialog.value = false;
        loadEnterprises();
      } catch (error) {
        console.error('保存失败:', error);
      }
    }
  });
};

onMounted(() => {
  loadEnterprises();
});
</script>
