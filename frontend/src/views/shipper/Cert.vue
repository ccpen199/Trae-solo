<template>
  <div class="cert-page">
    <el-card shadow="hover" class="cert-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">企业认证</span>
          <el-tag v-if="certInfo.status" :type="getStatusType(certInfo.status)" size="large">
            {{ getStatusText(certInfo.status) }}
          </el-tag>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="cert-form"
        :disabled="certInfo.status === 'approved' || certInfo.status === 'pending'"
      >
        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="公司名称" prop="company_name">
              <el-input v-model="form.company_name" placeholder="请输入公司全称" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="营业执照号" prop="business_license">
              <el-input v-model="form.business_license" placeholder="请输入18位统一社会信用代码" maxlength="18" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="税务登记号" prop="tax_registration">
              <el-input v-model="form.tax_registration" placeholder="请输入税务登记号" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="法人姓名" prop="legal_person_name">
              <el-input v-model="form.legal_person_name" placeholder="请输入法人代表姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :md="12" :sm="24">
            <el-form-item label="法人身份证" prop="legal_person_id">
              <el-input v-model="form.legal_person_id" placeholder="请输入法人代表身份证号" maxlength="18" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :sm="24">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="form.contact_phone" placeholder="请输入公司联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="公司地址" prop="company_address">
              <el-input v-model="form.company_address" placeholder="请输入公司详细地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="certInfo.status === 'rejected'" label="审核备注">
          <el-alert :title="certInfo.reject_reason || '认证信息不符合要求，请重新提交'" type="error" :closable="false" />
        </el-form-item>

        <el-form-item v-if="certInfo.status !== 'approved' && certInfo.status !== 'pending'">
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交认证
          </el-button>
          <el-button size="large" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shipperApi } from '../../api/index'

const formRef = ref(null)
const submitting = ref(false)
const loading = ref(false)

const certInfo = ref({
  status: null,
  reject_reason: ''
})

const form = reactive({
  company_name: '',
  business_license: '',
  tax_registration: '',
  legal_person_name: '',
  legal_person_id: '',
  company_address: '',
  contact_phone: ''
})

const rules = {
  company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  business_license: [
    { required: true, message: '请输入营业执照号', trigger: 'blur' },
    { len: 18, message: '营业执照号为18位', trigger: 'blur' }
  ],
  tax_registration: [{ required: true, message: '请输入税务登记号', trigger: 'blur' }],
  legal_person_name: [{ required: true, message: '请输入法人姓名', trigger: 'blur' }],
  legal_person_id: [
    { required: true, message: '请输入法人身份证号', trigger: 'blur' },
    { len: 18, message: '身份证号为18位', trigger: 'blur' }
  ],
  company_address: [{ required: true, message: '请输入公司地址', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

function getStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    pending: '审核中',
    approved: '已认证',
    rejected: '已驳回'
  }
  return map[status] || '未认证'
}

async function fetchCert() {
  loading.value = true
  try {
    const res = await shipperApi.getCert()
    const data = res.data || {}
    certInfo.value = {
      status: data.status,
      reject_reason: data.reject_reason
    }
    if (data.company_name) {
      Object.assign(form, {
        company_name: data.company_name || '',
        business_license: data.business_license || '',
        tax_registration: data.tax_registration || '',
        legal_person_name: data.legal_person_name || '',
        legal_person_id: data.legal_person_id || '',
        company_address: data.company_address || '',
        contact_phone: data.contact_phone || ''
      })
    }
  } catch (e) {
    if (e.response?.status !== 404) {
      ElMessage.error('获取认证信息失败')
    }
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await ElMessageBox.confirm('确认提交企业认证信息吗？提交后将进入审核流程。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    submitting.value = true
    try {
      await shipperApi.submitCert({ ...form })
      ElMessage.success('认证信息提交成功，请等待审核')
      certInfo.value.status = 'pending'
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '提交失败，请重试')
    } finally {
      submitting.value = false
    }
  })
}

function handleReset() {
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchCert()
})
</script>

<style scoped>
.cert-page {
  max-width: 900px;
  margin: 0 auto;
}
.cert-card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.cert-form {
  padding-top: 20px;
}
@media (max-width: 768px) {
  .cert-form {
    label-width: 90px;
  }
}
</style>
