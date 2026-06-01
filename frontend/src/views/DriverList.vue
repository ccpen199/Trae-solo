<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">司机档案管理</h1>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增司机
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="所属平台">
          <el-select v-model="filters.platformId" placeholder="请选择平台" clearable>
            <el-option v-for="p in platforms" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filters.auditStatus" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="姓名/身份证/手机号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="id_card" label="身份证号" min-width="150" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="driver_license_no" label="驾驶证号" min-width="150" />
        <el-table-column prop="taxi_qualification_no" label="从业资格证号" min-width="150" />
        <el-table-column prop="platform_name" label="所属平台" min-width="120" />
        <el-table-column prop="audit_status" label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getAuditStatusClass(row.audit_status)">{{ getAuditStatusText(row.audit_status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="driver_license_expiry_date" label="驾驶证有效期" width="130" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.audit_status === 'pending'"
              type="success"
              link
              @click="handleAudit(row, 'approved')"
            >
              通过
            </el-button>
            <el-button
              v-if="row.audit_status === 'pending'"
              type="danger"
              link
              @click="handleAudit(row, 'rejected')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑司机' : '新增司机'" width="700px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio value="male">男</el-radio>
                <el-radio value="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="formData.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驾驶证号" prop="driver_license_no">
              <el-input v-model="formData.driver_license_no" placeholder="请输入驾驶证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="准驾车型" prop="driver_license_type">
              <el-input v-model="formData.driver_license_type" placeholder="请输入准驾车型" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="从业资格证号" prop="taxi_qualification_no">
              <el-input v-model="formData.taxi_qualification_no" placeholder="请输入从业资格证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属平台" prop="platform_id">
              <el-select v-model="formData.platform_id" placeholder="请选择平台" style="width: 100%">
                <el-option v-for="p in platforms" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驾驶证有效期" prop="driver_license_expiry_date">
              <el-date-picker v-model="formData.driver_license_expiry_date" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="从业资格证有效期" prop="taxi_qualification_expiry_date">
              <el-date-picker v-model="formData.taxi_qualification_expiry_date" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.audit_remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialogVisible" title="审核意见" width="500px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-tag :type="auditForm.audit_status === 'approved' ? 'success' : 'danger'">
            {{ auditForm.audit_status === 'approved' ? '通过' : '驳回' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="auditForm.audit_remark" type="textarea" :rows="4" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const auditDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const tableData = ref([])
const platforms = ref([])

const filters = reactive({
  platformId: '',
  auditStatus: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: '',
  name: '',
  gender: 'male',
  id_card: '',
  phone: '',
  driver_license_no: '',
  driver_license_type: '',
  taxi_qualification_no: '',
  platform_id: '',
  driver_license_expiry_date: '',
  taxi_qualification_expiry_date: '',
  audit_remark: ''
})

const auditForm = reactive({
  driverId: '',
  audit_status: '',
  audit_remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  driver_license_no: [{ required: true, message: '请输入驾驶证号', trigger: 'blur' }],
  taxi_qualification_no: [{ required: true, message: '请输入从业资格证号', trigger: 'blur' }],
  platform_id: [{ required: true, message: '请选择平台', trigger: 'change' }]
}

const getAuditStatusText = (status) => {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

const getAuditStatusClass = (status) => {
  const map = { pending: 'tag-warning', approved: 'tag-success', rejected: 'tag-danger' }
  return map[status] || 'tag-info'
}

const fetchPlatforms = async () => {
  try {
    const data = await request.get('/platforms/all')
    platforms.value = data
  } catch (error) {
    ElMessage.error('获取平台列表失败')
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/drivers', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      }
    })
    tableData.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.platformId = ''
  filters.auditStatus = ''
  filters.keyword = ''
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  router.push(`/drivers/${row.id}`)
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: '',
    name: '',
    gender: 'male',
    id_card: '',
    phone: '',
    driver_license_no: '',
    driver_license_type: '',
    taxi_qualification_no: '',
    platform_id: '',
    driver_license_expiry_date: '',
    taxi_qualification_expiry_date: '',
    audit_remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await request.put(`/drivers/${formData.id}`, formData)
      ElMessage.success('编辑成功')
    } else {
      await request.post('/drivers', formData)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
  } finally {
    submitting.value = false
  }
}

const handleAudit = (row, status) => {
  auditForm.driverId = row.id
  auditForm.audit_status = status
  auditForm.audit_remark = ''
  auditDialogVisible.value = true
}

const submitAudit = async () => {
  submitting.value = true
  try {
    await request.post(`/drivers/${auditForm.driverId}/audit`, {
      audit_status: auditForm.audit_status,
      audit_remark: auditForm.audit_remark
    })
    ElMessage.success('审核成功')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPlatforms()
  fetchList()
})
</script>
