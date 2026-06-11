<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><ScaleToBalance /></el-icon> 劳动争议调解申请
      </div>
      <el-button type="primary" @click="showApply = true">
        <el-icon><Plus /></el-icon> 提交申请
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">我的调解申请</div>
      <el-table :data="disputes" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="application_no" label="申请编号" width="180" />
        <el-table-column prop="respondent_name" label="被申请人" width="180" />
        <el-table-column prop="dispute_type" label="争议类型" width="140" />
        <el-table-column prop="dispute_amount" label="争议金额" width="140">
          <template #default="{ row }">¥ {{ Number(row.dispute_amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="description" label="争议描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="调解状态" width="120">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && disputes.length === 0" description="暂无调解申请记录" />
    </div>

    <el-dialog v-model="showApply" title="劳动争议调解申请表" width="640px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="被申请人" prop="respondent_name">
          <el-input v-model="form.respondent_name" placeholder="请输入被申请人（单位/个人）名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="争议类型" prop="dispute_type">
              <el-select v-model="form.dispute_type" placeholder="请选择争议类型" style="width:100%">
                <el-option label="工资报酬争议" value="工资报酬争议" />
                <el-option label="社会保险争议" value="社会保险争议" />
                <el-option label="劳动合同争议" value="劳动合同争议" />
                <el-option label="经济补偿争议" value="经济补偿争议" />
                <el-option label="工伤待遇争议" value="工伤待遇争议" />
                <el-option label="休息休假争议" value="休息休假争议" />
                <el-option label="其他争议" value="其他争议" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="争议金额(元)" prop="dispute_amount">
              <el-input-number v-model="form.dispute_amount" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="争议描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述争议事实、理由及诉求" />
        </el-form-item>
        <el-form-item label="证据材料">
          <div class="evidence-upload">
            <div v-for="(ev, idx) in form.evidence" :key="idx" class="evidence-item">
              <el-input v-model="ev.name" placeholder="证据名称" style="width:180px; margin-right:8px;" />
              <el-input v-model="ev.url" placeholder="证据链接/说明" style="flex:1;" />
              <el-button type="danger" link style="margin-left:8px;" @click="removeEvidence(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addEvidence">
              <el-icon><Plus /></el-icon> 添加证据
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApply = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="调解申请详情" width="600px">
      <el-descriptions :column="1" border v-if="current">
        <el-descriptions-item label="申请编号">{{ current.application_no }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ current.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ current.applicant_phone }}</el-descriptions-item>
        <el-descriptions-item label="被申请人">{{ current.respondent_name }}</el-descriptions-item>
        <el-descriptions-item label="争议类型">{{ current.dispute_type }}</el-descriptions-item>
        <el-descriptions-item label="争议金额">¥ {{ Number(current.dispute_amount || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="调解状态">
          <span :class="['tag-badge', statusClass(current.status)]">{{ statusText(current.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="调解结果" v-if="current.mediation_result">{{ current.mediation_result }}</el-descriptions-item>
        <el-descriptions-item label="争议描述">
          <div style="white-space: pre-wrap;">{{ current.description }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="证据材料" v-if="current.evidence">
          <div v-for="(ev, idx) in parseEvidence(current.evidence)" :key="idx" class="ev-detail">
            <el-icon style="margin-right:4px;"><Paperclip /></el-icon>
            <span>{{ ev.name }}</span>
            <span v-if="ev.url" style="color:#1d4ed8; margin-left:8px;">{{ ev.url }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ current.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const disputes = ref([])
const showApply = ref(false)
const showDetail = ref(false)
const current = ref(null)
const formRef = ref(null)
const form = ref({
  respondent_name: '',
  dispute_type: '',
  dispute_amount: 0,
  description: '',
  evidence: [{ name: '', url: '' }]
})
const rules = {
  respondent_name: [{ required: true, message: '请输入被申请人', trigger: 'blur' }],
  dispute_type: [{ required: true, message: '请选择争议类型', trigger: 'change' }],
  dispute_amount: [{ required: true, message: '请输入争议金额', trigger: 'blur' }],
  description: [{ required: true, message: '请描述争议详情', trigger: 'blur' }]
}

function statusText(s) {
  const map = { pending: '待受理', processing: '调解中', success: '调解成功', failed: '调解失败', closed: '已结案' }
  return map[s] || s
}
function statusClass(s) {
  const map = { pending: 'warning', processing: 'info', success: 'success', failed: 'danger', closed: 'gray' }
  return map[s] || 'gray'
}
function parseEvidence(e) {
  try { return typeof e === 'string' ? JSON.parse(e) : (e || []) } catch { return [] }
}

async function loadDisputes() {
  loading.value = true
  try {
    const res = await api.get('/personal/labor-disputes')
    disputes.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function addEvidence() {
  form.value.evidence.push({ name: '', url: '' })
}
function removeEvidence(idx) {
  if (form.value.evidence.length > 1) form.value.evidence.splice(idx, 1)
}

async function submitForm() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = { ...form.value, evidence: form.value.evidence.filter(e => e.name) }
    await api.post('/personal/labor-disputes/submit', payload)
    ElMessage.success('调解申请已提交')
    showApply.value = false
    formRef.value?.resetFields()
    form.value = { respondent_name: '', dispute_type: '', dispute_amount: 0, description: '', evidence: [{ name: '', url: '' }] }
    loadDisputes()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function viewDetail(row) {
  current.value = row
  showDetail.value = true
}

function goBack() {
  router.push('/personal')
}

onMounted(loadDisputes)
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
.evidence-upload {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.evidence-item {
  display: flex;
  align-items: center;
  width: 100%;
}
.ev-detail {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}
</style>
