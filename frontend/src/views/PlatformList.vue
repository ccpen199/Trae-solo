<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">平台企业管理</h1>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增平台
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="平台名称">
          <el-input v-model="filters.name" placeholder="请输入平台名称" clearable />
        </el-form-item>
        <el-form-item label="许可证号">
          <el-input v-model="filters.licenseNo" placeholder="请输入许可证号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="暂停" value="suspended" />
            <el-option label="吊销" value="revoked" />
          </el-select>
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
        <el-table-column prop="name" label="平台名称" min-width="150" />
        <el-table-column prop="license_no" label="许可证号" min-width="150" />
        <el-table-column prop="contact_person" label="联系人" min-width="100" />
        <el-table-column prop="contact_phone" label="联系电话" min-width="120" />
        <el-table-column prop="driver_count" label="司机数" width="80" align="center" />
        <el-table-column prop="vehicle_count" label="车辆数" width="80" align="center" />
        <el-table-column prop="order_count" label="订单数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="warning" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="detailVisible" :title="'平台详情 - ' + detailData.name" width="1100px" top="3vh">
      <el-descriptions :column="3" border size="small" style="margin-bottom: 16px">
        <el-descriptions-item label="平台名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="许可证号">{{ detailData.license_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="getStatusClass(detailData.status)">{{ getStatusText(detailData.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="许可证有效期">
          <span :style="{ color: detailData.license_expiry_date && new Date(detailData.license_expiry_date) < new Date(Date.now() + 90*86400000) ? '#ef4444' : '' }">
            {{ detailData.license_expiry_date || '-' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailData.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="3">{{ detailData.address || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.suspension_reason" label="暂停原因" :span="3">
          <el-tag type="warning">{{ detailData.suspension_reason }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.rectification_requirement" label="整改要求" :span="3">
          {{ detailData.rectification_requirement }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.rectification_result" label="整改结果" :span="3">
          {{ detailData.rectification_result }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.audit_remark" label="复核备注" :span="3">
          {{ detailData.audit_remark }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.latest_audit_user" label="最后复核人">
          {{ detailData.latest_audit_user }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.audit_time" label="复核时间">
          {{ detailData.audit_time }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="detailTab">
        <el-tab-pane label="关联司机" name="drivers">
          <el-table :data="detailData.drivers || []" border size="small" max-height="300">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="phone" label="电话" width="130" />
            <el-table-column prop="id_card" label="身份证号" min-width="180" show-overflow-tooltip />
            <el-table-column prop="driver_license_no" label="驾驶证号" min-width="180" show-overflow-tooltip />
            <el-table-column prop="taxi_qualification_no" label="资格证号" min-width="160" show-overflow-tooltip />
            <el-table-column prop="audit_status" label="审核状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.audit_status === 'approved' ? 'success' : row.audit_status === 'rejected' ? 'danger' : 'warning'" size="small">
                  {{ {approved:'已通过',rejected:'已驳回',pending:'待审核'}[row.audit_status] || row.audit_status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="driver_license_expiry_date" label="驾驶证到期" width="120" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.driver_license_expiry_date && new Date(row.driver_license_expiry_date) < new Date(Date.now() + 30*86400000) ? '#ef4444' : '' }">{{ row.driver_license_expiry_date || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="taxi_qualification_expiry_date" label="资格证到期" width="120" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.taxi_qualification_expiry_date && new Date(row.taxi_qualification_expiry_date) < new Date(Date.now() + 30*86400000) ? '#ef4444' : '' }">{{ row.taxi_qualification_expiry_date || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="goToDriver(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="(detailData.drivers || []).length === 0" class="empty-hint">暂无关联司机</div>
        </el-tab-pane>
        <el-tab-pane label="关联车辆" name="vehicles">
          <el-table :data="detailData.vehicles || []" border size="small" max-height="300">
            <el-table-column prop="plate_no" label="车牌号" width="120" />
            <el-table-column prop="vehicle_license_no" label="行驶证号" min-width="160" show-overflow-tooltip />
            <el-table-column prop="operation_license_no" label="营运证号" min-width="160" show-overflow-tooltip />
            <el-table-column prop="audit_status" label="审核状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.audit_status === 'approved' ? 'success' : row.audit_status === 'rejected' ? 'danger' : 'warning'" size="small">
                  {{ {approved:'已通过',rejected:'已驳回',pending:'待审核'}[row.audit_status] || row.audit_status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="vehicle_license_expiry_date" label="行驶证到期" width="120" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.vehicle_license_expiry_date && new Date(row.vehicle_license_expiry_date) < new Date(Date.now() + 30*86400000) ? '#ef4444' : '' }">{{ row.vehicle_license_expiry_date || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="operation_license_expiry_date" label="营运证到期" width="120" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.operation_license_expiry_date && new Date(row.operation_license_expiry_date) < new Date(Date.now() + 30*86400000) ? '#ef4444' : '' }">{{ row.operation_license_expiry_date || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="goToVehicle(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="(detailData.vehicles || []).length === 0" class="empty-hint">暂无关联车辆</div>
        </el-tab-pane>
        <el-tab-pane label="订单抽查" name="orders">
          <el-table :data="detailData.orders || []" border size="small" max-height="300">
            <el-table-column prop="platform_order_no" label="订单号" min-width="160" />
            <el-table-column prop="driver_name" label="司机" width="100" />
            <el-table-column prop="pickup_address" label="上车地址" min-width="140" show-overflow-tooltip />
            <el-table-column prop="dropoff_address" label="下车地址" min-width="140" show-overflow-tooltip />
            <el-table-column prop="pickup_time" label="时间" width="170" />
            <el-table-column prop="total_amount" label="金额" width="80" align="right" />
            <el-table-column prop="anomaly_tags" label="异常标签" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.anomaly_tags" type="danger" size="small">{{ row.anomaly_tags }}</el-tag>
                <span v-else class="tag-success">正常</span>
              </template>
            </el-table-column>
            <el-table-column prop="is_checked" label="已查" width="60" align="center">
              <template #default="{ row }">
                <span :class="row.is_checked ? 'tag-success' : 'tag-warning'">{{ row.is_checked ? '是' : '否' }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="(detailData.orders || []).length === 0" class="empty-hint">暂无关联订单</div>
        </el-tab-pane>
        <el-tab-pane label="投诉记录" name="complaints">
          <el-table :data="detailData.complaints || []" border size="small" max-height="300">
            <el-table-column prop="complaint_no" label="投诉编号" width="160" />
            <el-table-column prop="complaint_type" label="投诉类型" width="120">
              <template #default="{ row }">{{ getComplaintTypeText(row.complaint_type) }}</template>
            </el-table-column>
            <el-table-column prop="complainant_name" label="投诉人" width="100" />
            <el-table-column prop="complaint_content" label="投诉内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="complaint_time" label="投诉时间" width="170" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'handled' ? 'success' : 'warning'" size="small">{{ row.status === 'handled' ? '已处理' : '待处理' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="(detailData.complaints || []).length === 0" class="empty-hint">暂无投诉记录</div>
        </el-tab-pane>
        <el-tab-pane label="执法案件" name="cases">
          <el-table :data="detailData.cases || []" border size="small" max-height="300">
            <el-table-column prop="case_no" label="案件编号" width="160" />
            <el-table-column prop="case_type" label="案件类型" width="120">
              <template #default="{ row }">{{ getCaseTypeText(row.case_type) }}</template>
            </el-table-column>
            <el-table-column prop="driver_name" label="涉案司机" width="100" />
            <el-table-column prop="initial_fine_amount" label="罚款金额" width="100" align="right">
              <template #default="{ row }">
                <span style="color: #ef4444">{{ row.initial_fine_amount || 0 }}元</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="{pending:'warning',decision_made:'danger',appealed:'info',reviewed:'success',rectifying:'warning',closed:'success'}[row.status] || 'info'" size="small">
                  {{ {pending:'待处理',decision_made:'已处罚',appealed:'申诉中',reviewed:'已复核',rectifying:'整改中',closed:'已结案'}[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="170" />
          </el-table>
          <div v-if="(detailData.cases || []).length === 0" class="empty-hint">暂无执法案件</div>
        </el-tab-pane>
        <el-tab-pane label="变更记录" name="logs">
          <el-table :data="detailData.logs || []" border size="small" max-height="350">
            <el-table-column prop="field_name" label="变更字段" width="150">
              <template #default="{ row }">{{ getFieldNameText(row.field_name) }}</template>
            </el-table-column>
            <el-table-column prop="old_value" label="变更前" min-width="150" show-overflow-tooltip />
            <el-table-column prop="new_value" label="变更后" min-width="150" show-overflow-tooltip />
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column prop="created_at" label="变更时间" width="180" />
          </el-table>
          <div v-if="(detailData.logs || []).length === 0" class="empty-hint">暂无变更记录</div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑平台' : '新增平台'" width="720px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="平台名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入平台名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="许可证号" prop="license_no">
              <el-input v-model="formData.license_no" placeholder="请输入许可证号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="许可证有效期">
              <el-date-picker v-model="formData.license_expiry_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" value="active" />
                <el-option label="暂停" value="suspended" />
                <el-option label="吊销" value="revoked" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="formData.contact_person" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="formData.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="企业地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入企业地址" />
        </el-form-item>
        <el-divider>监管业务字段</el-divider>
        <el-form-item label="暂停原因" v-if="formData.status === 'suspended'">
          <el-input v-model="formData.suspension_reason" type="textarea" :rows="2" placeholder="请输入暂停原因" />
        </el-form-item>
        <el-form-item label="整改要求">
          <el-input v-model="formData.rectification_requirement" type="textarea" :rows="2" placeholder="请输入整改要求" />
        </el-form-item>
        <el-form-item label="整改结果">
          <el-input v-model="formData.rectification_result" type="textarea" :rows="2" placeholder="请输入整改结果" />
        </el-form-item>
        <el-form-item label="复核备注">
          <el-input v-model="formData.audit_remark" type="textarea" :rows="2" placeholder="请输入复核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
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
const detailVisible = ref(false)
const detailTab = ref('drivers')
const isEdit = ref(false)
const formRef = ref(null)
const tableData = ref([])
const detailData = ref({})

const filters = reactive({
  name: '',
  licenseNo: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: '',
  name: '',
  license_no: '',
  license_expiry_date: '',
  contact_person: '',
  contact_phone: '',
  address: '',
  status: 'active',
  suspension_reason: '',
  rectification_requirement: '',
  rectification_result: '',
  audit_remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  license_no: [{ required: true, message: '请输入许可证号', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getStatusText = (status) => {
  const map = { active: '正常', suspended: '暂停', revoked: '吊销' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { active: 'tag-success', suspended: 'tag-warning', revoked: 'tag-danger' }
  return map[status] || 'tag-info'
}

const getComplaintTypeText = (type) => {
  const map = { price_abnormal: '计价异常', detour: '绕路投诉', unlicensed: '无证运营', service_attitude: '服务态度', refusal: '拒载', other: '其他' }
  return map[type] || type
}

const getCaseTypeText = (type) => {
  const map = { unlicensed_operation: '无证运营', detour: '绕路', overcharge: '乱收费', service_issue: '服务问题', safety_violation: '安全违规', other: '其他' }
  return map[type] || type
}

const getFieldNameText = (field) => {
  const map = {
    name: '平台名称',
    license_no: '许可证号',
    contact_person: '联系人',
    contact_phone: '联系电话',
    address: '企业地址',
    status: '状态',
    license_expiry_date: '许可证有效期',
    suspension_reason: '暂停原因',
    rectification_requirement: '整改要求',
    rectification_result: '整改结果',
    audit_remark: '复核备注'
  }
  return map[field] || field
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/platforms', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        name: filters.name || undefined,
        licenseNo: filters.licenseNo || undefined,
        status: filters.status || undefined
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
  filters.name = ''
  filters.licenseNo = ''
  filters.status = ''
  pagination.page = 1
  fetchList()
}

const handleView = async (row) => {
  try {
    const data = await request.get(`/platforms/${row.id}`)
    detailData.value = data
    detailTab.value = 'drivers'
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取平台详情失败')
  }
}

const goToDriver = (id) => {
  detailVisible.value = false
  router.push(`/drivers/${id}`)
}

const goToVehicle = (id) => {
  detailVisible.value = false
  router.push(`/vehicles/${id}`)
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: '',
    name: '',
    license_no: '',
    license_expiry_date: '',
    contact_person: '',
    contact_phone: '',
    address: '',
    status: 'active',
    suspension_reason: '',
    rectification_requirement: '',
    rectification_result: '',
    audit_remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    license_no: row.license_no,
    license_expiry_date: row.license_expiry_date || '',
    contact_person: row.contact_person,
    contact_phone: row.contact_phone,
    address: row.address || '',
    status: row.status,
    suspension_reason: row.suspension_reason || '',
    rectification_requirement: row.rectification_requirement || '',
    rectification_result: row.rectification_result || '',
    audit_remark: row.audit_remark || ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await request.put(`/platforms/${formData.id}`, formData)
      ElMessage.success('编辑成功，已记录变更痕迹')
    } else {
      await request.post('/platforms', formData)
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

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除平台"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/platforms/${row.id}`)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.empty-hint {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
