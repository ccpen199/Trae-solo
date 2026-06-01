<template>
  <div class="domains-page">
    <div class="page-header">
      <h1 class="page-title">域名资产</h1>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加域名
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input
          v-model="filters.search"
          placeholder="搜索域名、业务、联系人"
          style="width: 250px"
          clearable
          @input="loadDomains"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.status" placeholder="状态" style="width: 120px" clearable @change="loadDomains">
          <el-option label="正常" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>
        <el-select v-model="filters.priority" placeholder="优先级" style="width: 120px" clearable @change="loadDomains">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
        <el-select v-model="filters.sort" placeholder="排序" style="width: 150px" @change="loadDomains">
          <el-option label="按到期时间" value="expiry" />
          <el-option label="按域名" value="domain" />
          <el-option label="按优先级" value="priority" />
          <el-option label="按创建时间" value="created" />
        </el-select>
      </div>

      <el-table :data="domains" v-loading="loading" stripe>
        <el-table-column prop="full_domain" label="域名" width="200">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.full_domain }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="business_owner" label="业务归属" width="120" />
        <el-table-column prop="dns_provider" label="DNS提供商" width="120" />
        <el-table-column prop="cert_type" label="证书类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.cert_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="priority_level" label="重要等级" width="100">
          <template #default="{ row }">
            <span :class="`priority-${row.priority_level}`" class="status-tag">
              {{ row.priority_level === 'high' ? '高' : row.priority_level === 'medium' ? '中' : '低' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days_left" label="剩余天数" width="120">
          <template #default="{ row }">
            <span v-if="row.days_left !== null" :class="getDaysClass(row.days_left)" class="days-badge">
              {{ row.days_left }}天
            </span>
            <span v-else style="color: #909399;">无证书</span>
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="到期时间" width="180">
          <template #default="{ row }">
            {{ row.expiry_date ? formatDate(row.expiry_date) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="row.status === 'active' ? 'status-valid' : 'status-expired'" class="status-tag">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑域名' : '添加域名'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="根域名" prop="root_domain">
              <el-input v-model="form.root_domain" placeholder="例如: example.com" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子域名" prop="sub_domain">
              <el-input v-model="form.sub_domain" placeholder="@ 表示主域名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务归属" prop="business_owner">
              <el-input v-model="form.business_owner" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="DNS提供商" prop="dns_provider">
              <el-input v-model="form.dns_provider" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="证书类型" prop="cert_type">
              <el-select v-model="form.cert_type" style="width: 100%;">
                <el-option label="DV" value="DV" />
                <el-option label="OV" value="OV" />
                <el-option label="EV" value="EV" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重要等级" prop="priority_level">
              <el-select v-model="form.priority_level" style="width: 100%;">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="form.contact_person" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contact_email">
              <el-input v-model="form.contact_email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="正常" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="域名详情" width="700px">
      <div v-if="currentDomain">
        <div class="detail-item">
          <span class="detail-label">完整域名</span>
          <span class="detail-value">{{ currentDomain.full_domain }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">业务归属</span>
          <span class="detail-value">{{ currentDomain.business_owner || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">DNS提供商</span>
          <span class="detail-value">{{ currentDomain.dns_provider || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">证书类型</span>
          <span class="detail-value">{{ currentDomain.cert_type }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">联系人</span>
          <span class="detail-value">{{ currentDomain.contact_person || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">联系邮箱</span>
          <span class="detail-value">{{ currentDomain.contact_email || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">重要等级</span>
          <span class="detail-value">{{ currentDomain.priority_level === 'high' ? '高' : currentDomain.priority_level === 'medium' ? '中' : '低' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">备注</span>
          <span class="detail-value">{{ currentDomain.notes || '-' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const submitting = ref(false)
const domains = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentDomain = ref(null)
const formRef = ref(null)

const filters = ref({
  search: '',
  status: '',
  priority: '',
  sort: 'expiry'
})

const form = ref({
  root_domain: '',
  sub_domain: '@',
  business_owner: '',
  dns_provider: '',
  cert_type: 'DV',
  contact_person: '',
  contact_email: '',
  priority_level: 'medium',
  status: 'active',
  notes: ''
})

const rules = {
  root_domain: [{ required: true, message: '请输入根域名', trigger: 'blur' }]
}

const getDaysClass = (days) => {
  if (days <= 7) return 'days-critical'
  if (days <= 30) return 'days-warning'
  return 'days-normal'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadDomains = async () => {
  loading.value = true
  try {
    const res = await api.get('/domains', { params: filters.value })
    domains.value = res.data.domains
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    root_domain: '',
    sub_domain: '@',
    business_owner: '',
    dns_provider: '',
    cert_type: 'DV',
    contact_person: '',
    contact_email: '',
    priority_level: 'medium',
    status: 'active',
    notes: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentDomain.value = row
  form.value = { ...row }
  dialogVisible.value = true
}

const handleView = async (row) => {
  try {
    const res = await api.get(`/domains/${row.id}`)
    currentDomain.value = res.data.domain
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除域名 ${row.full_domain} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/domains/${row.id}`)
      ElMessage.success('删除成功')
      loadDomains()
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
      await api.put(`/domains/${currentDomain.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/domains', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadDomains()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.domains-page {
  padding: 0;
}
</style>
