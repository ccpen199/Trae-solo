<template>
  <div class="compensation-list">
    <div class="page-header">
      <h1 class="page-title">赔付管理</h1>
      <p class="page-subtitle">管理行李异常的赔付申请和审批</p>
    </div>

    <div class="card">
      <el-form :inline="true" :model="queryForm" class="mb-4">
        <el-form-item label="查询单号">
          <el-input v-model="queryForm.inquiry_no" placeholder="请输入查询单号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="责任方">
          <el-select v-model="queryForm.responsible_party" placeholder="全部" clearable style="width: 150px;">
            <el-option v-for="p in responsibleParties" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批状态">
          <el-select v-model="queryForm.approval_status" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="s in statuses" :key="s.type" :label="s.name" :value="s.type" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="inquiry_no" label="查询单号" width="160" />
        <el-table-column prop="exception_name" label="异常类型" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.exception_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="baggage_tag" label="行李牌" width="130" />
        <el-table-column prop="passenger_name" label="旅客" width="90" />
        <el-table-column prop="responsible_party" label="责任方" width="110" />
        <el-table-column label="赔付标准">
          <template #default="{ row }">
            {{ row.compensation_standard || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <span class="font-semibold text-yellow-600">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.approval_status)" size="small">
              {{ getStatusText(row.approval_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="90" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link 
              @click="handleApprove(row)" 
              :disabled="row.approval_status !== 'pending'"
            >
              批准
            </el-button>
            <el-button type="danger" size="small" link 
              @click="handleReject(row)" 
              :disabled="row.approval_status !== 'pending'"
            >
              拒绝
            </el-button>
            <el-button type="primary" size="small" link 
              @click="handleClose(row)" 
              :disabled="row.approval_status !== 'approved'"
            >
              结案
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-4 justify-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="showActionDialog" :title="actionTitle" width="400px">
      <el-form :model="actionForm" label-width="80px">
        <el-form-item label="操作人">
          <el-input v-model="actionForm.approver" placeholder="操作人姓名" />
        </el-form-item>
        <el-form-item v-if="actionType !== 'approve'" label="原因" required>
          <el-input v-model="actionForm.close_reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showActionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAction" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { compensationApi } from '../api'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const statuses = ref([])
const responsibleParties = ref([])

const showActionDialog = ref(false)
const actionType = ref('')
const currentRow = ref(null)

const queryForm = reactive({
  inquiry_no: '',
  responsible_party: '',
  approval_status: ''
})

const actionForm = reactive({
  approver: '',
  close_reason: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const actionTitle = computed(() => {
  const map = {
    approve: '批准赔付',
    reject: '拒绝赔付',
    close: '结案'
  }
  return map[actionType.value] || '操作'
})

async function loadData() {
  loading.value = true
  try {
    const data = await compensationApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...queryForm
    })
    tableData.value = data.list
    pagination.total = data.total
  } catch (err) {
    ElMessage.error('加载失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadMeta() {
  try {
    const [statusList, parties] = await Promise.all([
      compensationApi.getStatuses(),
      compensationApi.getResponsibleParties()
    ])
    statuses.value = statusList
    responsibleParties.value = parties
  } catch (err) {
    console.error(err)
  }
}

function handleApprove(row) {
  actionType.value = 'approve'
  currentRow.value = row
  actionForm.close_reason = ''
  showActionDialog.value = true
}

function handleReject(row) {
  actionType.value = 'reject'
  currentRow.value = row
  showActionDialog.value = true
}

function handleClose(row) {
  actionType.value = 'close'
  currentRow.value = row
  showActionDialog.value = true
}

async function submitAction() {
  if (actionType.value !== 'approve' && !actionForm.close_reason) {
    ElMessage.warning('请输入原因')
    return
  }

  submitting.value = true
  try {
    if (actionType.value === 'approve') {
      await compensationApi.approve(currentRow.value.id, {
        approver: actionForm.approver
      })
    } else if (actionType.value === 'reject') {
      await compensationApi.reject(currentRow.value.id, {
        approver: actionForm.approver,
        close_reason: actionForm.close_reason
      })
    } else if (actionType.value === 'close') {
      await compensationApi.close(currentRow.value.id, {
        approver: actionForm.approver,
        close_reason: actionForm.close_reason
      })
    }
    
    ElMessage.success('操作成功')
    showActionDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    submitting.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.inquiry_no = ''
  queryForm.responsible_party = ''
  queryForm.approval_status = ''
  pagination.page = 1
  loadData()
}

function handleSizeChange(val) {
  pagination.pageSize = val
  pagination.page = 1
  loadData()
}

function handleCurrentChange(val) {
  pagination.page = val
  loadData()
}

function getStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    paid: 'success'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    paid: '已支付'
  }
  return map[status] || status
}

import { computed } from 'vue'

onMounted(() => {
  loadData()
  loadMeta()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.justify-end {
  display: flex;
  justify-content: flex-end;
}

.font-semibold {
  font-weight: 600;
}

.text-yellow-600 {
  color: #d48806;
}
</style>
