<template>
  <div class="certs-page">
    <div class="page-header">
      <h1 class="page-title">证书库存</h1>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加证书
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input
          v-model="filters.search"
          placeholder="搜索域名、序列号"
          style="width: 250px"
          clearable
          @input="loadCerts"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.status" placeholder="状态" style="width: 150px" clearable @change="loadCerts">
          <el-option label="有效" value="valid" />
          <el-option label="即将过期" value="expiring_soon" />
          <el-option label="已过期" value="expired" />
          <el-option label="已吊销" value="revoked" />
        </el-select>
        <el-select v-model="filters.ca" placeholder="CA机构" style="width: 150px" clearable @change="loadCerts">
          <el-option label="Let's Encrypt" value="Let's Encrypt" />
          <el-option label="ZeroSSL" value="ZeroSSL" />
          <el-option label="DigiCert" value="DigiCert" />
        </el-select>
        <el-button @click="loadCerts">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>

      <el-table :data="certificates" v-loading="loading" stripe>
        <el-table-column prop="common_name" label="通用名称" width="200">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.common_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="full_domain" label="关联域名" width="150" />
        <el-table-column prop="ca_provider" label="颁发机构" width="130" />
        <el-table-column prop="serial_number" label="序列号" width="150" show-overflow-tooltip />
        <el-table-column prop="san_list" label="SAN列表" width="180" show-overflow-tooltip />
        <el-table-column prop="algorithm" label="算法" width="120">
          <template #default="{ row }">
            <el-tag :type="isWeakAlgorithm(row.algorithm) ? 'danger' : 'info'" size="small">
              {{ row.algorithm }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auto_renew" label="自动续签" width="100">
          <template #default="{ row }">
            <el-tag :type="row.auto_renew ? 'success' : 'info'" size="small">
              {{ row.auto_renew ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="days_left" label="剩余天数" width="100">
          <template #default="{ row }">
            <span :class="getDaysClass(row.days_left)" class="days-badge">
              {{ row.days_left }}天
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)" class="status-tag">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑证书' : '添加证书'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联域名" prop="domain_id">
              <el-select v-model="form.domain_id" style="width: 100%;" filterable>
                <el-option 
                  v-for="d in domainList" 
                  :key="d.id" 
                  :label="d.full_domain" 
                  :value="d.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通用名称" prop="common_name">
              <el-input v-model="form.common_name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="颁发机构" prop="ca_provider">
              <el-input v-model="form.ca_provider" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序列号" prop="serial_number">
              <el-input v-model="form.serial_number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="SAN列表" prop="san_list">
          <el-input v-model="form.san_list" placeholder="多个域名用逗号分隔" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="私钥存放" prop="key_storage">
              <el-input v-model="form.key_storage" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部署位置" prop="deploy_locations">
              <el-input v-model="form.deploy_locations" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签发日期" prop="issue_date">
              <el-date-picker v-model="form.issue_date" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期" prop="expiry_date">
              <el-date-picker v-model="form.expiry_date" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签名算法" prop="algorithm">
              <el-select v-model="form.algorithm" style="width: 100%;">
                <el-option label="RSA-2048" value="RSA-2048" />
                <el-option label="RSA-4096" value="RSA-4096" />
                <el-option label="ECDSA-P256" value="ECDSA-P256" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option label="有效" value="valid" />
                <el-option label="即将过期" value="expiring_soon" />
                <el-option label="已过期" value="expired" />
                <el-option label="已吊销" value="revoked" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="自动续签" prop="auto_renew">
          <el-switch v-model="form.auto_renew" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="证书详情" width="700px">
      <div v-if="currentCert">
        <div class="detail-item">
          <span class="detail-label">通用名称</span>
          <span class="detail-value">{{ currentCert.common_name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">关联域名</span>
          <span class="detail-value">{{ currentCert.full_domain }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">颁发机构</span>
          <span class="detail-value">{{ currentCert.ca_provider }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">序列号</span>
          <span class="detail-value">{{ currentCert.serial_number }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">SAN列表</span>
          <span class="detail-value">{{ currentCert.san_list || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">私钥存放</span>
          <span class="detail-value">{{ currentCert.key_storage || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">部署位置</span>
          <span class="detail-value">{{ currentCert.deploy_locations || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">签名算法</span>
          <span class="detail-value">{{ currentCert.algorithm }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">签发日期</span>
          <span class="detail-value">{{ formatDate(currentCert.issue_date) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">到期日期</span>
          <span class="detail-value">{{ formatDate(currentCert.expiry_date) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">自动续签</span>
          <span class="detail-value">{{ currentCert.auto_renew ? '是' : '否' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const submitting = ref(false)
const certificates = ref([])
const domainList = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentCert = ref(null)
const formRef = ref(null)

const filters = ref({
  search: '',
  status: '',
  ca: ''
})

const form = ref({
  domain_id: null,
  ca_provider: '',
  serial_number: '',
  common_name: '',
  san_list: '',
  key_storage: '',
  deploy_locations: '',
  auto_renew: false,
  issue_date: '',
  expiry_date: '',
  algorithm: 'RSA-2048',
  status: 'valid'
})

const rules = {
  domain_id: [{ required: true, message: '请选择关联域名', trigger: 'change' }],
  ca_provider: [{ required: true, message: '请输入颁发机构', trigger: 'blur' }],
  common_name: [{ required: true, message: '请输入通用名称', trigger: 'blur' }],
  expiry_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
}

const isWeakAlgorithm = (algo) => {
  return algo && (algo.includes('1024') || algo.includes('MD5') || algo.includes('SHA1'))
}

const getDaysClass = (days) => {
  if (days <= 7) return 'days-critical'
  if (days <= 30) return 'days-warning'
  return 'days-normal'
}

const getStatusClass = (status) => {
  const map = {
    'valid': 'status-valid',
    'expiring_soon': 'status-expiring',
    'expired': 'status-expired',
    'revoked': 'status-pending'
  }
  return map[status] || 'status-pending'
}

const getStatusText = (status) => {
  const map = {
    'valid': '有效',
    'expiring_soon': '即将过期',
    'expired': '已过期',
    'revoked': '已吊销'
  }
  return map[status] || status
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString('zh-CN') : '-'
}

const loadCerts = async () => {
  loading.value = true
  try {
    const res = await api.get('/certificates', { params: filters.value })
    certificates.value = res.data.certificates
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadDomains = async () => {
  try {
    const res = await api.get('/domains')
    domainList.value = res.data.domains
  } catch (e) {
    console.error(e)
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    domain_id: null,
    ca_provider: '',
    serial_number: '',
    common_name: '',
    san_list: '',
    key_storage: '',
    deploy_locations: '',
    auto_renew: false,
    issue_date: '',
    expiry_date: '',
    algorithm: 'RSA-2048',
    status: 'valid'
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentCert.value = row
  form.value = { ...row, auto_renew: !!row.auto_renew }
  dialogVisible.value = true
}

const handleView = async (row) => {
  try {
    const res = await api.get(`/certificates/${row.id}`)
    currentCert.value = res.data.certificate
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除证书 ${row.common_name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/certificates/${row.id}`)
      ElMessage.success('删除成功')
      loadCerts()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await api.put(`/certificates/${currentCert.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/certificates', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadCerts()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCerts()
  loadDomains()
})
</script>

<style scoped>
.certs-page {
  padding: 0;
}
</style>
