<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">授权申请</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        申请授权
      </el-button>
    </div>

    <div class="search-bar">
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 150px;">
        <el-option label="待审批" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>
      <el-button type="primary" @click="loadAuthorizations">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="authorizations" stripe style="width: 100%;">
        <el-table-column prop="employee_name" label="员工姓名" width="100" />
        <el-table-column prop="employee_no" label="工号" width="100" />
        <el-table-column prop="position_name" label="授权岗位" width="120" />
        <el-table-column prop="authorization_type" label="授权类型" width="120" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="approver" label="审批人" width="100" />
        <el-table-column prop="start_date" label="生效日期" width="120" />
        <el-table-column prop="end_date" label="到期日期" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.is_temporary" type="warning">临时</el-tag>
            <span>{{ row.end_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">
              {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已拒绝' : '待审批' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button v-if="row.status === 'pending'" size="small" type="danger" @click="deleteAuth(row)">撤回</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="申请授权" width="600px">
      <el-form :model="authForm" label-width="100px">
        <el-form-item label="员工">
          <el-select v-model="authForm.employee_id" style="width: 100%;">
            <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权岗位">
          <el-select v-model="authForm.position_id" style="width: 100%;">
            <el-option v-for="pos in positions" :key="pos.id" :label="pos.position_name" :value="pos.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权类型">
          <el-select v-model="authForm.authorization_type" style="width: 100%;">
            <el-option label="正式授权" value="正式授权" />
            <el-option label="临时授权" value="临时授权" />
            <el-option label="转岗授权" value="转岗授权" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="authForm.applicant" />
        </el-form-item>
        <el-form-item label="申请原因">
          <el-input v-model="authForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="生效范围">
          <el-input v-model="authForm.effective_scope" />
        </el-form-item>
        <el-form-item label="生效日期">
          <el-date-picker v-model="authForm.start_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="临时授权">
          <el-switch v-model="authForm.is_temporary" />
        </el-form-item>
        <el-form-item v-if="authForm.is_temporary" label="到期日期">
          <el-date-picker v-model="authForm.end_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAuthorization">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authAPI, employeesAPI, positionsAPI } from '@/api'

const authorizations = ref([])
const employees = ref([])
const positions = ref([])
const showAddDialog = ref(false)

const searchForm = ref({
  status: ''
})

const authForm = ref({
  employee_id: null,
  position_id: null,
  authorization_type: '正式授权',
  applicant: '',
  reason: '',
  effective_scope: '',
  start_date: '',
  end_date: '',
  is_temporary: false
})

const loadAuthorizations = async () => {
  try {
    const res = await authAPI.list(searchForm.value)
    authorizations.value = res.data || []
  } catch (err) {
    ElMessage.error('加载授权列表失败')
  }
}

const loadEmployees = async () => {
  try {
    const res = await employeesAPI.list()
    employees.value = res.data || []
  } catch (err) {
    console.error('加载员工列表失败')
  }
}

const loadPositions = async () => {
  try {
    const res = await positionsAPI.list()
    positions.value = res.data || []
  } catch (err) {
    console.error('加载岗位列表失败')
  }
}

const resetSearch = () => {
  searchForm.value = { status: '' }
  loadAuthorizations()
}

const saveAuthorization = async () => {
  try {
    await authAPI.create(authForm.value)
    ElMessage.success('申请提交成功')
    showAddDialog.value = false
    loadAuthorizations()
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const deleteAuth = async (row) => {
  try {
    await ElMessageBox.confirm('确定要撤回该申请吗？', '提示', { type: 'warning' })
    await authAPI.delete(row.id)
    ElMessage.success('撤回成功')
    loadAuthorizations()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('撤回失败')
    }
  }
}

onMounted(() => {
  loadAuthorizations()
  loadEmployees()
  loadPositions()
})
</script>
