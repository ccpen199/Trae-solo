<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">授权审批</h1>
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
        <el-table-column prop="reason" label="申请原因" show-overflow-tooltip />
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button v-if="row.status === 'pending'" size="small" type="success" @click="approveAuth(row)">通过</el-button>
              <el-button v-if="row.status === 'pending'" size="small" type="danger" @click="rejectAuth(row)">拒绝</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showApproveDialog" title="审批授权" width="450px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审批人">
          <el-input v-model="approveForm.approver" />
        </el-form-item>
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.status">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.comment" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button type="primary" @click="doApprove">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authAPI } from '@/api'

const authorizations = ref([])
const showApproveDialog = ref(false)
const currentAuth = ref(null)

const searchForm = ref({
  status: 'pending'
})

const approveForm = ref({
  approver: '',
  status: 'approved',
  comment: ''
})

const loadAuthorizations = async () => {
  try {
    const res = await authAPI.list(searchForm.value)
    authorizations.value = res.data || []
  } catch (err) {
    ElMessage.error('加载授权列表失败')
  }
}

const resetSearch = () => {
  searchForm.value = { status: 'pending' }
  loadAuthorizations()
}

const approveAuth = (row) => {
  currentAuth.value = row
  approveForm.value = { approver: '', status: 'approved', comment: '' }
  showApproveDialog.value = true
}

const rejectAuth = (row) => {
  currentAuth.value = row
  approveForm.value = { approver: '', status: 'rejected', comment: '' }
  showApproveDialog.value = true
}

const doApprove = async () => {
  try {
    await authAPI.update(currentAuth.value.id, approveForm.value)
    ElMessage.success('审批完成')
    showApproveDialog.value = false
    loadAuthorizations()
  } catch (err) {
    ElMessage.error('审批失败')
  }
}

onMounted(() => {
  loadAuthorizations()
})
</script>
