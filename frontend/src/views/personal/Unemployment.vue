<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Tickets /></el-icon> 失业登记一键办结
      </div>
      <div></div>
    </div>

    <div class="card">
      <div class="section-title">失业登记表</div>
      <el-alert
        v-if="submitted"
        title="已办结"
        type="success"
        description="您的失业登记已成功提交并办结，可在下方历史记录中查看详情。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" :disabled="submitted">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学历" prop="education">
              <el-select v-model="form.education" placeholder="请选择最高学历" style="width:100%">
                <el-option label="初中及以下" value="初中及以下" />
                <el-option label="高中/中专" value="高中/中专" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原工作单位" prop="previous_work">
              <el-input v-model="form.previous_work" placeholder="请输入原工作单位名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="失业原因" prop="unemployment_reason">
          <el-select v-model="form.unemployment_reason" placeholder="请选择失业原因" style="width:100%">
            <el-option label="劳动合同期满" value="劳动合同期满" />
            <el-option label="用人单位解除劳动合同" value="用人单位解除劳动合同" />
            <el-option label="本人解除劳动合同" value="本人解除劳动合同" />
            <el-option label="用人单位辞退/除名" value="用人单位辞退/除名" />
            <el-option label="企业破产/倒闭" value="企业破产/倒闭" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期望薪资(元/月)" prop="expected_salary">
              <el-input-number v-model="form.expected_salary" :min="0" :step="500" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望岗位" prop="expected_position">
              <el-input v-model="form.expected_position" placeholder="请输入期望从事的岗位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" :disabled="submitted" @click="submitForm">
            <el-icon><Check /></el-icon> 一键提交办结
          </el-button>
          <el-button size="large" @click="resetForm" :disabled="submitted">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <div class="section-title">历史登记记录</div>
      <el-table :data="records" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="registration_no" label="登记编号" width="180" />
        <el-table-column prop="education" label="学历" width="120" />
        <el-table-column prop="previous_work" label="原工作单位" min-width="160" />
        <el-table-column prop="unemployment_reason" label="失业原因" width="160" />
        <el-table-column prop="expected_salary" label="期望薪资" width="120">
          <template #default="{ row }">¥ {{ Number(row.expected_salary || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="expected_position" label="期望岗位" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span class="tag-badge success">已办结</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="登记时间" width="180" />
      </el-table>
      <el-empty v-if="!loading && records.length === 0" description="暂无登记记录" />
    </div>
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
const submitted = ref(false)
const records = ref([])
const formRef = ref(null)
const form = ref({
  education: '',
  previous_work: '',
  unemployment_reason: '',
  expected_salary: 5000,
  expected_position: ''
})
const rules = {
  education: [{ required: true, message: '请选择学历', trigger: 'change' }],
  previous_work: [{ required: true, message: '请输入原工作单位', trigger: 'blur' }],
  unemployment_reason: [{ required: true, message: '请选择失业原因', trigger: 'change' }],
  expected_salary: [{ required: true, message: '请输入期望薪资', trigger: 'blur' }],
  expected_position: [{ required: true, message: '请输入期望岗位', trigger: 'blur' }]
}

async function loadRecords() {
  loading.value = true
  try {
    const res = await api.get('/personal/unemployment')
    records.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  await formRef.value.validate()
  submitting.value = true
  try {
    await api.post('/personal/unemployment/apply', form.value)
    ElMessage.success('失业登记已办结')
    submitted.value = true
    loadRecords()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formRef.value?.resetFields()
  form.value = { education: '', previous_work: '', unemployment_reason: '', expected_salary: 5000, expected_position: '' }
}

function goBack() {
  router.push('/personal')
}

onMounted(loadRecords)
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
</style>
