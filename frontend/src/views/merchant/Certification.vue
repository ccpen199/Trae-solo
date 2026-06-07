<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">资质认证</h2>
      <p class="page-subtitle">完善商家信息，提升可信度</p>
    </div>

    <el-card class="card-shadow">
      <el-alert
        :title="getStatusText(profile?.certification_status)"
        :type="getStatusType(profile?.certification_status)"
        :closable="false"
        style="margin-bottom: 24px;"
      />

      <el-form :model="form" label-width="120px" style="max-width: 700px;">
        <el-form-item label="公司名称">
          <el-input v-model="form.company_name" />
        </el-form-item>
        <el-form-item label="服务类别">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option label="婚纱摄影" value="婚纱摄影" />
            <el-option label="婚宴酒店" value="婚宴酒店" />
            <el-option label="婚庆服务" value="婚庆服务" />
            <el-option label="婚纱礼服" value="婚纱礼服" />
            <el-option label="珠宝首饰" value="珠宝首饰" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="商家地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="商家介绍">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="营业执照">
          <el-upload
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            :on-change="handleLicenseUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="资质证书">
          <el-upload
            action="#"
            :auto-upload="false"
            multiple
            list-type="picture-card"
            :on-change="handleCertUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">提交认证</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

const profile = ref(null)
const form = reactive({
  company_name: '',
  category: '',
  phone: '',
  address: '',
  description: '',
  business_license: '',
  certification_files: ''
})

function getStatusType(status) {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '认证审核中，请耐心等待',
    approved: '已通过认证',
    rejected: '认证未通过，请重新提交'
  }
  return texts[status] || '未提交认证'
}

async function loadProfile() {
  try {
    const res = await api.get('/merchant/profile')
    profile.value = res.data
    Object.assign(form, res.data)
  } catch (e) {
    console.error(e)
  }
}

function handleLicenseUpload(file) {
  form.business_license = file.name
}

function handleCertUpload(file) {
  form.certification_files = file.name
}

async function submit() {
  try {
    await api.put('/merchant/profile', form)
    ElMessage.success('提交成功，等待审核')
    loadProfile()
  } catch (e) {
    ElMessage.error('提交失败')
  }
}

onMounted(() => {
  loadProfile()
})
</script>
